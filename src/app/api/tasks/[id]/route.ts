
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

// PUT /api/tasks/{id}
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { title, description, status, assigneeId, priority, estimatedHours } = await request.json();

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user has permission to update this task
    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { createdById: true, assigneeId: true, status: true, closeTime: true }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Allow update if user is creator or assignee
    if (existingTask.createdById !== user.id && existingTask.assigneeId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Handle status change and time tracking
    let timeTrackingUpdates = {};
    if (status && status !== existingTask.status) {
      const now = new Date();
      
      // Status change logic for time tracking
      if (status === 'DONE') {
        // Task moved to DONE - record close_time
        timeTrackingUpdates = { closeTime: now };
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority !== undefined && { priority: typeof priority === 'string' ? parseInt(priority) : priority }),
        ...(estimatedHours !== undefined && { estimatedHours }),
        ...(assigneeId && { assignee: { connect: { id: assigneeId } } }),
        ...(assigneeId === null && { assignee: { disconnect: true } }),
        ...timeTrackingUpdates,
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
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks/{id}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user has permission to delete this task
    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { 
        createdById: true, 
        assigneeId: true,
        title: true
      }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Allow deletion if user is creator or assignee
    if (existingTask.createdById !== user.id && existingTask.assigneeId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Delete related records first due to foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete all subtasks
      await tx.subTask.deleteMany({
        where: { taskId: id }
      });
      
      // Delete all notes
      await tx.note.deleteMany({
        where: { taskId: id }
      });
      
      // Delete dependencies where this task is a dependency
      await tx.dependency.deleteMany({
        where: { dependsOnTaskId: id }
      });
      
      // Delete the task's own dependencies
      await tx.dependency.deleteMany({
        where: { taskId: id }
      });
      
      // Finally delete the task
      await tx.task.delete({
        where: { id }
      });
    });

    return NextResponse.json({ 
      message: "Task deleted successfully",
      deletedTask: { id, title: existingTask.title }
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
