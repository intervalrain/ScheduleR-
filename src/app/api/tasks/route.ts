
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

// GET /api/tasks
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sprintId = searchParams.get('sprintId');
  const status = searchParams.get('status');

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Build where clause dynamically
    const whereClause: Record<string, unknown> = {
      OR: [
        { createdById: user.id },
        { assigneeId: user.id },
      ]
    };
    
    if (sprintId) {
      whereClause.sprintId = String(sprintId);
    }
    
    if (status) {
      whereClause.status = status;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
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
        sprint: {
          select: {
            id: true,
            name: true,
          }
        },
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
  console.log('POST /api/tasks called');
  
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session || !session.user || !session.user.email) {
      console.log('Unauthorized - no session or user');
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const requestBody = await request.json();
    console.log('Raw request body:', requestBody);
    
    const { name, title, description, status, estimate, estimatedHours, priority, tags, labels } = requestBody;
    let { sprintId, assigneeId } = requestBody;
    
    console.log('Parsed task data:', { name, title, description, status, sprintId, assigneeId, estimate, estimatedHours, priority, tags, labels });

    const taskTitle = name || title;
    if (!taskTitle) {
      console.log('Task name/title is missing');
      return NextResponse.json({ error: 'Task name/title is required' }, { status: 400 });
    }

    console.log('Finding user with email:', session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.log('User not found for email:', session.user.email);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log('User found:', user.id, user.email);
    console.log('User ID type:', typeof user.id, 'Length:', user.id?.length);
    
    // Validate assigneeId if provided
    if (assigneeId) {
      console.log('Validating assigneeId:', assigneeId, 'Type:', typeof assigneeId);
      const assigneeExists = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { id: true, email: true }
      });
      console.log('Assignee exists:', assigneeExists);
      if (!assigneeExists) {
        console.log('Assignee not found, setting to null');
        assigneeId = null;
      }
    }
    
    // Validate sprintId if provided
    if (sprintId) {
      console.log('Validating sprintId:', sprintId, 'Type:', typeof sprintId);
      const sprintExists = await prisma.sprint.findUnique({
        where: { id: sprintId },
        select: { id: true, name: true }
      });
      console.log('Sprint exists:', sprintExists);
      if (!sprintExists) {
        console.log('Sprint not found, setting to null');
        sprintId = null;
      }
    }
    console.log('Creating task with data:', {
      title: taskTitle,
      description: description || null,
      status: status || 'TODO',
      priority: priority || 1000000,
      estimatedHours: estimatedHours || null,
      tags: tags || [],
      labels: labels || [],
      createdById: user.id,
      sprintId,
      assigneeId
    });

    // Prepare the data object step by step for better debugging
    const taskData = {
      title: taskTitle,
      description: description || null,
      status: status || 'TODO',
      priority: priority ? priority.toString() : "1000000",
      estimatedHours: estimatedHours || null,
      tags: tags || [],
      labels: labels || [],
      createdById: user.id,
      sprintId: sprintId || null,
      assigneeId: assigneeId || null,
    };

    console.log('Final task data for creation:', taskData);

    const newTask = await prisma.task.create({
      data: taskData,
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
    
    console.log('Task created successfully:', newTask);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ 
      error: 'Failed to create task', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
