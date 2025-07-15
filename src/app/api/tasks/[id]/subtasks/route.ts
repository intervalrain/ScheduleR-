import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: taskId } = await params;
  const { title } = await request.json();

  if (!title || !title.trim()) {
    return NextResponse.json({ message: "Title is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user has permission to add subtasks to this task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { createdById: true, assigneeId: true }
    });

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    if (task.createdById !== user.id && task.assigneeId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const subTask = await prisma.subTask.create({
      data: {
        title: title.trim(),
        isCompleted: false,
        taskId: taskId,
        createdById: user.id,
      },
      include: {
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

    return NextResponse.json(subTask, { status: 201 });
  } catch (error) {
    console.error('Error creating subtask:', error);
    return NextResponse.json({ message: 'Failed to create subtask' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: taskId } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user has permission to view subtasks for this task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { createdById: true, assigneeId: true }
    });

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    if (task.createdById !== user.id && task.assigneeId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const subTasks = await prisma.subTask.findMany({
      where: { taskId },
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
    });

    return NextResponse.json(subTasks);
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    return NextResponse.json({ message: 'Failed to fetch subtasks' }, { status: 500 });
  }
}