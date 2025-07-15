import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

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