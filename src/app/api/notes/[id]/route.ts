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
  const { content } = await request.json();

  if (!content || !content.trim()) {
    return NextResponse.json({ message: "Content is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user has permission to edit this note
    const note = await prisma.note.findUnique({
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

    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    // Only the note creator or task owner/assignee can edit
    if (note.createdById !== user.id && 
        note.task.createdById !== user.id && 
        note.task.assigneeId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        content: content.trim(),
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

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ message: 'Failed to update note' }, { status: 500 });
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

    // Check if user has permission to delete this note
    const note = await prisma.note.findUnique({
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

    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    // Only the note creator or task owner can delete
    if (note.createdById !== user.id && note.task.createdById !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.note.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ message: 'Failed to delete note' }, { status: 500 });
  }
}