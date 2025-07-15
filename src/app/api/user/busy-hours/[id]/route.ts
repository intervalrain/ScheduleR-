
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

// PUT /api/user/busy-hours/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { id } = await params;
    const { startTime, endTime } = await request.json();

    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'Start time and end time are required' }, { status: 400 });
    }

    // Update the busy hour
    const updatedBusyHour = await prisma.busyHour.updateMany({
      where: { 
        id,
        userId: user.id // Ensure users can only update their own busy hours
      },
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      }
    });

    if (updatedBusyHour.count === 0) {
      return NextResponse.json({ message: "Busy hour not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Busy hour updated successfully" });
  } catch (error) {
    console.error('Error updating busy hour:', error);
    return NextResponse.json({ error: 'Failed to update busy hour' }, { status: 500 });
  }
}

// DELETE /api/user/busy-hours/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deleteRecurring = searchParams.get('deleteRecurring') === 'true';
    const deleteFuture = searchParams.get('deleteFuture') === 'true';
    
    // First, find the busy hour to get its recurringGroupId and startTime
    const busyHour = await prisma.busyHour.findUnique({
      where: { id },
      select: { recurringGroupId: true, userId: true, startTime: true }
    });

    if (!busyHour || busyHour.userId !== user.id) {
      return NextResponse.json({ message: "Busy hour not found" }, { status: 404 });
    }

    if (deleteRecurring && busyHour.recurringGroupId) {
      // Delete all busy hours in the recurring group
      await prisma.busyHour.deleteMany({
        where: { 
          recurringGroupId: busyHour.recurringGroupId,
          userId: user.id
        }, 
      });
    } else if (deleteFuture && busyHour.recurringGroupId) {
      // Delete this and all future occurrences in the recurring group
      await prisma.busyHour.deleteMany({
        where: { 
          recurringGroupId: busyHour.recurringGroupId,
          userId: user.id,
          startTime: { gte: busyHour.startTime }
        }, 
      });
    } else {
      // Delete only this specific busy hour
      await prisma.busyHour.deleteMany({
        where: { 
          id,
          userId: user.id
        }, 
      });
    }

    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete busy hour' }, { status: 500 });
  }
}
