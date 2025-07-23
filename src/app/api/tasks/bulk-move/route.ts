import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('Bulk move API called');
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('No session or email found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskIds, targetSprintId } = await request.json();
    console.log('Request data:', { taskIds, targetSprintId, userEmail: session.user.email });

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: 'Task IDs are required' }, { status: 400 });
    }

    if (!targetSprintId) {
      return NextResponse.json({ error: 'Target sprint ID is required' }, { status: 400 });
    }

    // Verify user owns the tasks and target sprint
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        teams: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!user) {
      console.log('User not found for email:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User found:', { id: user.id, email: user.email, teamsCount: user.teams.length });

    // Get user's team IDs
    const userTeamIds = user.teams.map(teamUser => teamUser.team.id);
    console.log('User team IDs:', userTeamIds);

    // Check if target sprint exists and belongs to user's team
    const targetSprint = await prisma.sprint.findFirst({
      where: {
        id: targetSprintId,
        teamId: {
          in: userTeamIds,
        },
      },
    });

    if (!targetSprint) {
      console.log('Target sprint not found or not accessible:', { targetSprintId, userTeamIds });
      return NextResponse.json({ error: 'Target sprint not found or not accessible' }, { status: 404 });
    }

    console.log('Target sprint found:', { id: targetSprint.id, name: targetSprint.name, teamId: targetSprint.teamId });

    // Get tasks to move and verify ownership
    const tasksToMove = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        OR: [
          { createdById: user.id },
          { assigneeId: user.id },
        ],
      },
    });

    if (tasksToMove.length !== taskIds.length) {
      return NextResponse.json({ error: 'Some tasks not found or not owned by user' }, { status: 403 });
    }

    // Update all tasks to new sprint
    await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        OR: [
          { createdById: user.id },
          { assigneeId: user.id },
        ],
      },
      data: {
        sprintId: targetSprintId,
      },
    });

    // Get updated tasks for response
    const updatedTasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
      },
      include: {
        assignee: true,
        createdBy: true,
        subTasks: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully moved ${updatedTasks.length} tasks to sprint`,
      tasks: updatedTasks,
    });

  } catch (error) {
    console.error('Error bulk moving tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}