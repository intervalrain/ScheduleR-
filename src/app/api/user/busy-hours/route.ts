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

    while (currentStartDate <= (repeatUntil || currentStartDate)) {
      if (repeatFrequency === "weekly") {
        const dayOfWeek = currentStartDate.getDay();
        if (!selectedRepeatDays.includes(dayOfWeek)) {
          currentStartDate = new Date(currentStartDate.setDate(currentStartDate.getDate() + 1));
          currentEndDate = new Date(currentEndDate.setDate(currentEndDate.getDate() + 1));
          continue;
        }
      }

      busyHoursToCreate.push({
        userId: user.id,
        title,
        startTime: new Date(currentStartDate),
        endTime: new Date(currentEndDate),
        categoryId,
      });

      if (repeatFrequency === "none") break;

      if (repeatFrequency === "daily") {
        currentStartDate = new Date(currentStartDate.setDate(currentStartDate.getDate() + 1));
        currentEndDate = new Date(currentEndDate.setDate(currentEndDate.getDate() + 1));
      } else if (repeatFrequency === "weekly") {
        currentStartDate = new Date(currentStartDate.setDate(currentStartDate.getDate() + 7));
        currentEndDate = new Date(currentEndDate.setDate(currentEndDate.getDate() + 7));
      }
    }

    await prisma.busyHour.createMany({
      data: busyHoursToCreate,
    });

    return NextResponse.json({ message: "Busy hours created successfully" }, { status: 201 });
  } catch (error) {
    console.error('Error creating busy hour:', error);
    return NextResponse.json({ error: 'Failed to create busy hour' }, { status: 500 });
  }
}

