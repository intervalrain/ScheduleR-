import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';
import { eachDayOfInterval, format, startOfDay, endOfDay } from 'date-fns';

// GET /api/dashboard/burndown
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sprintId = searchParams.get('sprintId');
  const mode = searchParams.get('mode') || 'includeTodo'; // Default to includeTodo

  if (!sprintId) {
    return NextResponse.json({ message: "Sprint ID is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Get sprint information
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        tasks: {
          select: {
            id: true,
            estimatedHours: true,
            status: true,
            createdAt: true,
            closeTime: true,
          }
        }
      }
    });

    if (!sprint) {
      return NextResponse.json({ message: "Sprint not found" }, { status: 404 });
    }

    // Generate burn-down chart data
    const sprintStart = startOfDay(new Date(sprint.startDate));
    const sprintEnd = endOfDay(new Date(sprint.endDate));
    const sprintDays = eachDayOfInterval({ start: sprintStart, end: sprintEnd });

    // Calculate total estimated hours based on mode
    const totalHours = sprint.tasks.reduce((sum, task) => {
      // If excluding TODO, only count tasks that have started (not in TODO status)
      if (mode === 'excludeTodo' && task.status === 'TODO') {
        return sum;
      }
      return sum + (task.estimatedHours || 0);
    }, 0);

    // Generate daily data points
    const burndownData = sprintDays.map((day, index) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      // Calculate ideal burn-down (linear decrease)
      const idealRemaining = totalHours * (1 - (index / (sprintDays.length - 1)));

      // Calculate remaining hours based on mode
      let remainingHours = 0;
      
      sprint.tasks.forEach(task => {
        // If excluding TODO mode, skip TODO tasks entirely
        if (mode === 'excludeTodo' && task.status === 'TODO') {
          return;
        }
        
        if (task.status === 'DONE') {
          // Check if task was completed by this day
          if (task.closeTime && new Date(task.closeTime) > dayEnd) {
            remainingHours += task.estimatedHours || 0;
          }
        } else {
          // Task is not done, so it's still remaining
          remainingHours += task.estimatedHours || 0;
        }
      });

      return {
        date: format(day, 'yyyy-MM-dd'),
        idealLine: Math.max(0, idealRemaining),
        remainLine: remainingHours,
      };
    });

    return NextResponse.json({
      sprintId,
      sprintName: sprint.name,
      sprintStart: format(sprintStart, 'yyyy-MM-dd'),
      sprintEnd: format(sprintEnd, 'yyyy-MM-dd'),
      totalHours,
      data: burndownData
    });

  } catch (error) {
    console.error('Error generating burn-down chart data:', error);
    return NextResponse.json({ error: 'Failed to generate burn-down chart data' }, { status: 500 });
  }
}