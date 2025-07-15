
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/tasks/{id}/dependencies
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // The task that will have a dependency
  const { dependencyId } = await request.json(); // The task that 'id' depends on

  if (!dependencyId) {
    return NextResponse.json({ error: 'dependencyId is required' }, { status: 400 });
  }

  try {
    // Create a dependency record instead of updating task directly
    const newDependency = await prisma.dependency.create({
      data: {
        taskId: id,
        dependsOnTaskId: dependencyId,
      },
    });
    
    // Return the updated task with dependencies
    const updatedTask = await prisma.task.findUnique({
      where: { id },
      include: {
        dependencies: {
          include: {
            dependsOn: true,
          }
        },
      },
    });
    
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error adding task dependency:', error);
    return NextResponse.json({ error: 'Failed to add dependency' }, { status: 500 });
  }
}
