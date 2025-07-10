
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await request.json();

  if (!teamId) {
    return NextResponse.json({ message: "Team ID is required" }, { status: 400 });
  }

  try {
    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    // Check if user is already in the team
    const existingMembership = await prisma.teamsOnUsers.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id as string,
          teamId: teamId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ message: "User already in this team" }, { status: 409 });
    }

    const newMembership = await prisma.teamsOnUsers.create({
      data: {
        userId: session.user.id as string,
        teamId: teamId,
      },
    });

    return NextResponse.json(newMembership, { status: 201 });
  } catch (error) {
    console.error('Error joining team:', error);
    return NextResponse.json({ message: 'Failed to join team' }, { status: 500 });
  }
}
