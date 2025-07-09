
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/tasks/{id}
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const { title, description, status, assigneeId } = await request.json();

  try {
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(assigneeId && { assignee: { connect: { id: assigneeId } } }),
        ...(assigneeId === null && { assignee: { disconnect: true } }),
      },
    });
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
