
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log('GET /api/workspace/task/[id] called with id:', id);
  
  const session = await getServerSession(authOptions);
  console.log('Session:', session?.user?.email);

  if (!session || !session.user || !session.user.email) {
    console.log('Unauthorized - no session');
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  console.log('Task ID type:', typeof id, 'Value:', id, 'Length:', id?.length);

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.log('User not found for email:', session.user.email);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log('User found:', user.id);
    console.log('Looking for task with id:', id);
    
    // First, let's check if the task exists at all
    const taskExists = await prisma.task.findFirst({
      where: { id },
      select: { id: true, title: true, createdById: true, assigneeId: true }
    });
    
    console.log('Task exists check:', taskExists);
    
    // Try a simpler query first to isolate the issue
    console.log('Attempting basic task fetch...');
    const basicTask = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      },
    });
    
    console.log('Basic task fetch result:', basicTask ? 'Success' : 'Not found');
    
    if (!basicTask) {
      console.log('Task not found with id:', id);
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }
    
    // Now try to add sub-tasks and notes
    console.log('Fetching full task data...');
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        subTasks: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        notes: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
    });

    if (!task) {
      console.log('Task not found with id:', id);
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    console.log('Task found:', { 
      id: task.id, 
      title: task.title, 
      createdById: task.createdById, 
      assigneeId: task.assigneeId 
    });

    // Check if user has permission to view this task
    if (task.createdById !== user.id && task.assigneeId !== user.id) {
      console.log('Permission denied for user:', user.id, 'on task:', task.id);
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    console.log('Permission granted, returning task data');

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task - Full error:', error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown');
    return NextResponse.json({ 
      message: 'Failed to fetch task',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { title, description, status, priority, estimatedHours, tags, assigneeId, closeTime } = await request.json();

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user has permission to edit this task
    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { createdById: true, assigneeId: true }
    });

    if (!existingTask) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    if (existingTask.createdById !== user.id && existingTask.assigneeId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority: typeof priority === 'string' ? parseInt(priority) : priority }),
        ...(estimatedHours !== undefined && { estimatedHours }),
        ...(tags !== undefined && { tags }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(closeTime !== undefined && { closeTime: closeTime ? new Date(closeTime) : null }),
        updatedAt: new Date(),
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ message: 'Failed to update task' }, { status: 500 });
  }
}
