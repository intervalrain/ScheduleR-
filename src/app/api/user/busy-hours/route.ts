import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

// GET /api/user/busy-hours
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const busyHours = await prisma.busyHour.findMany({
      where: { userId: user.id },
    });
    return NextResponse.json(busyHours);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch busy hours' }, { status: 500 });
  }
}

// POST /api/user/busy-hours
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { title, startTime, endTime, categoryId, repeatFrequency, repeatEndDate, selectedRepeatDays } = await request.json();
  if (!title || !startTime || !endTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const newBusyHourStart = new Date(startTime);
    const newBusyHourEnd = new Date(endTime);

    // Get user settings to check work hours and work days
    const userSettings = user.settings as any;
    const workDays = userSettings?.workDays || [1, 2, 3, 4, 5]; // Default: Mon-Fri
    const workHours = userSettings?.workHours || { start: "09:00", end: "17:00" }; // Default work hours

    // Get current sprints to check if dates are within sprint period
    const sprints = await prisma.sprint.findMany({
      orderBy: { startDate: 'asc' }
    });

    const isWithinAnySprint = (date: Date) => {
      return sprints.some(sprint => {
        const sprintStart = new Date(sprint.startDate);
        const sprintEnd = new Date(sprint.endDate);
        return date >= sprintStart && date <= sprintEnd;
      });
    };

    // Check if the busy hour date is within any sprint
    if (!isWithinAnySprint(newBusyHourStart)) {
      return NextResponse.json({ error: 'Cannot create busy hours outside of sprint periods.' }, { status: 400 });
    }

    // Validate work days and hours
    const dayOfWeek = newBusyHourStart.getDay();
    if (!workDays.includes(dayOfWeek)) {
      return NextResponse.json({ error: 'Cannot create busy hours on non-work days.' }, { status: 400 });
    }

    // Check work hours
    const startHour = newBusyHourStart.getHours();
    const startMinute = newBusyHourStart.getMinutes();
    const endHour = newBusyHourEnd.getHours();
    const endMinute = newBusyHourEnd.getMinutes();
    
    const workStartParts = workHours.start.split(':');
    const workEndParts = workHours.end.split(':');
    const workStartMinutes = parseInt(workStartParts[0]) * 60 + parseInt(workStartParts[1]);
    const workEndMinutes = parseInt(workEndParts[0]) * 60 + parseInt(workEndParts[1]);
    
    const busyStartMinutes = startHour * 60 + startMinute;
    const busyEndMinutes = endHour * 60 + endMinute;

    if (busyStartMinutes < workStartMinutes || busyEndMinutes > workEndMinutes) {
      return NextResponse.json({ error: 'Cannot create busy hours outside of work hours.' }, { status: 400 });
    }

    // Check for overlapping busy hours
    const overlappingBusyHours = await prisma.busyHour.findMany({
      where: {
        userId: user.id,
        AND: [
          {
            endTime: { gt: newBusyHourStart },
          },
          {
            startTime: { lt: newBusyHourEnd },
          },
        ],
      },
    });

    if (overlappingBusyHours.length > 0) {
      return NextResponse.json({ error: 'Busy hour overlaps with an existing entry.' }, { status: 409 });
    }

    const busyHoursToCreate = [];
    let currentStartDate = newBusyHourStart;
    let currentEndDate = newBusyHourEnd;
    const repeatUntil = repeatEndDate ? new Date(repeatEndDate) : null;
    const recurringGroupId = repeatFrequency !== "none" ? `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null;

    while (currentStartDate <= (repeatUntil || currentStartDate)) {
      const currentDayOfWeek = currentStartDate.getDay();
      
      // Helper function to check if current occurrence is valid (not in off hours)
      const isValidOccurrence = () => {
        // Check if within any sprint
        if (!isWithinAnySprint(currentStartDate)) return false;
        
        // Check if it's a work day
        if (!workDays.includes(currentDayOfWeek)) return false;
        
        // For weekly repeats, check selected days
        if (repeatFrequency === "weekly" && !selectedRepeatDays.includes(currentDayOfWeek)) {
          return false;
        }
        
        // Check work hours
        const currentStartHour = currentStartDate.getHours();
        const currentStartMinute = currentStartDate.getMinutes();
        const currentEndHour = currentEndDate.getHours();
        const currentEndMinute = currentEndDate.getMinutes();
        
        const currentBusyStartMinutes = currentStartHour * 60 + currentStartMinute;
        const currentBusyEndMinutes = currentEndHour * 60 + currentEndMinute;
        
        if (currentBusyStartMinutes < workStartMinutes || currentBusyEndMinutes > workEndMinutes) {
          return false;
        }
        
        return true;
      };

      // Check if current occurrence is valid
      if (isValidOccurrence()) {
        busyHoursToCreate.push({
          userId: user.id,
          title,
          startTime: new Date(currentStartDate),
          endTime: new Date(currentEndDate),
          categoryId,
          recurringGroupId,
        });
      }

      // Break if this is a single occurrence
      if (repeatFrequency === "none") break;

      // Advance to next occurrence
      if (repeatFrequency === "daily") {
        currentStartDate.setDate(currentStartDate.getDate() + 1);
        currentEndDate.setDate(currentEndDate.getDate() + 1);
      } else if (repeatFrequency === "weekly") {
        currentStartDate.setDate(currentStartDate.getDate() + 7);
        currentEndDate.setDate(currentEndDate.getDate() + 7);
      }
    }

    await prisma.busyHour.createMany({
      data: busyHoursToCreate,
    });

    const message = repeatFrequency === "none" 
      ? "Busy hour created successfully" 
      : `${busyHoursToCreate.length} busy hours created successfully (off-hours automatically skipped)`;

    return NextResponse.json({ 
      message,
      created: busyHoursToCreate.length,
      isRecurring: repeatFrequency !== "none"
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating busy hour:', error);
    return NextResponse.json({ error: 'Failed to create busy hour' }, { status: 500 });
  }
}

