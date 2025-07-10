
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request) {
  const { tasks } = await request.json(); // Expects an array of task IDs in the new order

  try {
    // This is a simplified reordering. In a real application, you might update
    // a 'order' field on each task or handle more complex reordering logic.
    // For now, we'll just return a success message.
    console.log("Reordering tasks:", tasks);

    // Example: Update an 'order' field for each task
    // const transaction = tasks.map((taskId: string, index: number) =>
    //   prisma.task.update({
    //     where: { id: taskId },
    //     data: { order: index },
    //   })
    // );
    // await prisma.$transaction(transaction);

    return NextResponse.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    console.error('Error reordering tasks:', error);
    return NextResponse.json({ error: 'Failed to reorder tasks' }, { status: 500 });
  }
}
