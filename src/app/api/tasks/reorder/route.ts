
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request) {
  const { taskIds } = await request.json(); // Expects an array of task IDs in the new order

  if (!taskIds || !Array.isArray(taskIds)) {
    return NextResponse.json({ error: 'taskIds array is required' }, { status: 400 });
  }

  try {
    // Update the order field for each task
    const updatePromises = taskIds.map((taskId: string, index: number) =>
      prisma.task.update({
        where: { id: taskId },
        data: { order: index },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true, message: 'Tasks reordered successfully' });
  } catch (error) {
    console.error('Error reordering tasks:', error);
    return NextResponse.json({ error: 'Failed to reorder tasks' }, { status: 500 });
  }
}
