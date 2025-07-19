import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

// GET /api/sprints/[id] (Add this to your existing file)
// ... (imports and other functions)

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        teams: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const teamIds = user.teams.map((teamUser) => teamUser.team.id);
    const { id } = await params;

    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!sprint) {
      return NextResponse.json({ message: "Sprint not found" }, { status: 404 });
    }

    // Ensure user can only view sprints from their teams
    if (!teamIds.includes(sprint.teamId)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(sprint, { status: 200 });
  } catch (error) {
    console.error('Error fetching sprint:', error);
    return NextResponse.json({ error: 'Failed to fetch sprint' }, { status: 500 });
  }
}

// DELETE /api/sprints/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        teams: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const teamIds = user.teams.map((teamUser) => teamUser.team.id);

    // Check if the sprint exists and user has permission to delete it
    const { id } = await params;
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!sprint) {
      return NextResponse.json({ message: "Sprint not found" }, { status: 404 });
    }

    // Ensure user can only delete sprints from their teams
    if (!teamIds.includes(sprint.teamId)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Delete the sprint
    await prisma.sprint.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting sprint:', error);
    return NextResponse.json({ error: 'Failed to delete sprint' }, { status: 500 });
  }
}

// PATCH /api/sprints/[id]
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        teams: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const teamIds = user.teams.map((teamUser) => teamUser.team.id);
    const { id } = await params;
    const updateData = await request.json();

    // Find the sprint to ensure it exists and belongs to the user's team
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!sprint) {
      return NextResponse.json({ message: "Sprint not found" }, { status: 404 });
    }

    if (!teamIds.includes(sprint.teamId)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Validate sprint type if provided
    if (updateData.type && !['PROJECT', 'CASUAL'].includes(updateData.type)) {
      return NextResponse.json({ error: 'Invalid sprint type' }, { status: 400 });
    }

    // Prepare data for update, handling date conversions if necessary
    const dataToUpdate: Record<string, string | Date | number[] | { start: string; end: string }> = {};
    if (updateData.name) dataToUpdate.name = updateData.name;
    if (updateData.startDate) dataToUpdate.startDate = new Date(updateData.startDate);
    if (updateData.endDate) dataToUpdate.endDate = new Date(updateData.endDate);
    if (updateData.type) dataToUpdate.type = updateData.type;
    if (updateData.defaultWorkDays) dataToUpdate.defaultWorkDays = updateData.defaultWorkDays;
    if (updateData.defaultWorkHours) dataToUpdate.defaultWorkHours = updateData.defaultWorkHours;
    // You might also allow updating teamId, but be careful with permissions

    const updatedSprint = await prisma.sprint.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedSprint, { status: 200 });
  } catch (error) {
    console.error('Error updating sprint:', error);
    return NextResponse.json({ error: 'Failed to update sprint' }, { status: 500 });
  }
}