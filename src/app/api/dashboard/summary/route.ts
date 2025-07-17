import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateSprintHealth } from '@/lib/utils';

export async function GET() {
  try {
    // Get task statistics
    const [
      totalTasks,
      completedTasks,
      ongoingTasks,
      pendingTasks,
      allTasks,
    ] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { status: 'Done' } }),
      prisma.task.count({ where: { status: 'Ongoing' } }),
      prisma.task.count({ where: { status: 'Pending' } }),
      prisma.task.findMany({
        select: {
          estimatedHours: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Calculate total hours
    const totalHours = allTasks.reduce((sum, task) => {
      return sum + (task.estimatedHours || 0);
    }, 0);

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Generate mock burndown data (in a real app, this would be calculated from historical data)
    const burndownData = [
      totalTasks,
      Math.floor(totalTasks * 0.85),
      Math.floor(totalTasks * 0.70),
      Math.floor(totalTasks * 0.60),
      Math.floor(totalTasks * 0.45),
      Math.floor(totalTasks * 0.30),
      totalTasks - completedTasks,
    ];

    // Mock data for additional widgets
    const sprintHealth = {
      totalHours: 80,
      completedHours: 32,
      consumedHours: 36,
      healthPercentage: calculateSprintHealth(32, 36)
    };

    const teamWorkload = {
      members: [
        { name: "Alice", workload: 32, capacity: 40 },
        { name: "Bob", workload: 38, capacity: 40 },
        { name: "Charlie", workload: 28, capacity: 40 }
      ]
    };

    const velocity = {
      currentSprint: 24,
      previousSprint: 20,
      average: 22
    };

    const riskAssessment = {
      level: 'medium' as const,
      factors: ['Resource constraints', 'Technical debt']
    };

    const summary = {
      totalTasks,
      completedTasks,
      ongoingTasks,
      pendingTasks,
      totalHours,
      completionRate,
      burndownData,
      sprintHealth,
      teamWorkload,
      velocity,
      riskAssessment,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard summary' }, { status: 500 });
  }
}