
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const dependencies = await prisma.dependency.findMany();
    return NextResponse.json(dependencies);
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    return NextResponse.json({ message: 'Failed to fetch dependencies' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { taskId, dependsOnTaskId } = await request.json();

  if (!taskId || !dependsOnTaskId) {
    return NextResponse.json({ message: 'Missing required fields: taskId, dependsOnTaskId' }, { status: 400 });
  }

  try {
    const newDependency = await prisma.dependency.create({
      data: {
        taskId,
        dependsOnTaskId,
      },
    });
    return NextResponse.json(newDependency, { status: 201 });
  } catch (error) {
    console.error('Error creating dependency:', error);
    return NextResponse.json({ message: 'Failed to create dependency' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { taskId, dependsOnTaskId } = await request.json();

  if (!taskId || !dependsOnTaskId) {
    return NextResponse.json({ message: 'Missing required fields: taskId, dependsOnTaskId' }, { status: 400 });
  }

  try {
    await prisma.dependency.delete({
      where: {
        taskId: taskId,
      },
    });
    return NextResponse.json({ message: 'Dependency deleted successfully' });
  } catch (error) {
    console.error('Error deleting dependency:', error);
    return NextResponse.json({ message: 'Failed to delete dependency' }, { status: 500 });
  }
}
