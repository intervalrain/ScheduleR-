
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

// GET /api/sprints
export async function GET() {
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

    const sprints = await prisma.sprint.findMany({
      where: {
        teamId: {
          in: teamIds,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(sprints);
  } catch (error) {
    console.error('Error fetching sprints:', error);
    return NextResponse.json({ error: 'Failed to fetch sprints' }, { status: 500 });
  }
}

// POST /api/sprints
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { name, startDate, endDate, type, defaultWorkDays, defaultWorkHours } = await request.json();

  if (!name || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate sprint type
  if (type && !['PROJECT', 'CASUAL'].includes(type)) {
    return NextResponse.json({ error: 'Invalid sprint type' }, { status: 400 });
  }

  // Set default work configuration based on type
  const sprintType = type || 'PROJECT';
  const workDays = defaultWorkDays || (sprintType === 'PROJECT' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7]);
  const workHours = defaultWorkHours || (sprintType === 'PROJECT' 
    ? { start: '08:30', end: '17:30' } 
    : { start: '00:00', end: '23:59' });

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Create a default team if none exists
    let team = await prisma.team.findFirst({
      where: {
        users: {
          some: {
            userId: user.id,
          },
        },
      },
    });

    if (!team) {
      team = await prisma.team.create({
        data: {
          name: 'Default Team',
          users: {
            create: {
              userId: user.id,
            },
          },
        },
      });
    }

    const newSprint = await prisma.sprint.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: sprintType,
        defaultWorkDays: workDays,
        defaultWorkHours: workHours,
        teamId: team.id,
      },
    });
    return NextResponse.json(newSprint, { status: 201 });
  } catch (error) {
    console.error('Error creating sprint:', error);
    return NextResponse.json({ error: 'Failed to create sprint' }, { status: 500 });
  }
}
