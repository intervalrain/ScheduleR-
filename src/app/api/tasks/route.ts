
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

// GET /api/tasks
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sprintId = searchParams.get('sprintId');
  const status = searchParams.get('status');

  try {
    // Build where clause dynamically
    const whereClause: any = {};
    
    if (sprintId) {
      whereClause.sprintId = String(sprintId);
    }
    
    if (status) {
      whereClause.status = status;
    }

    // If no filters provided, return error for now to avoid fetching all tasks
    if (!sprintId && !status) {
      return NextResponse.json({ error: 'At least one filter (sprintId or status) is required' }, { status: 400 });
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: true,
        dependsOn: true,
        dependencyOf: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(request: Request) {
  const { title, description, status, sprintId, assigneeId } = await request.json();

  if (!title || !sprintId) {
    return NextResponse.json({ error: 'Title and sprintId are required' }, { status: 400 });
  }

  try {
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        sprint: { connect: { id: sprintId } },
        ...(assigneeId && { assignee: { connect: { id: assigneeId } } }),
      },
    });
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
