import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const { title, isCompleted } = await request.json();

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user has permission to edit this subtask
    const subTask = await prisma.subTask.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            createdById: true,
            assigneeId: true,
          }
        }
      }
    });

    if (!subTask) {
      return NextResponse.json({ message: "Subtask not found" }, { status: 404 });
    }

    if (subTask.task.createdById !== user.id && subTask.task.assigneeId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updatedSubTask = await prisma.subTask.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(isCompleted !== undefined && { isCompleted }),
        updatedAt: new Date(),
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

    return NextResponse.json(updatedSubTask);
  } catch (error) {
    console.error('Error updating subtask:', error);
    return NextResponse.json({ message: 'Failed to update subtask' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user has permission to delete this subtask
    const subTask = await prisma.subTask.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            createdById: true,
            assigneeId: true,
          }
        }
      }
    });

    if (!subTask) {
      return NextResponse.json({ message: "Subtask not found" }, { status: 404 });
    }

    if (subTask.task.createdById !== user.id && subTask.task.assigneeId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.subTask.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Subtask deleted successfully" });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    return NextResponse.json({ message: 'Failed to delete subtask' }, { status: 500 });
  }
}