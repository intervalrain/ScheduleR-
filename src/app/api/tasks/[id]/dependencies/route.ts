
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/tasks/{id}/dependencies
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params; // The task that will have a dependency
  const { dependencyId } = await request.json(); // The task that 'id' depends on

  if (!dependencyId) {
    return NextResponse.json({ error: 'dependencyId is required' }, { status: 400 });
  }

  try {
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        dependsOn: { connect: { id: dependencyId } },
      },
      include: {
        dependsOn: true,
      },
    });
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error adding task dependency:', error);
    return NextResponse.json({ error: 'Failed to add dependency' }, { status: 500 });
  }
}
