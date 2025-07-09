
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/sprints
export async function GET() {
  try {
    const sprints = await prisma.sprint.findMany();
    return NextResponse.json(sprints);
  } catch (error) {
    console.error('Error fetching sprints:', error);
    return NextResponse.json({ error: 'Failed to fetch sprints' }, { status: 500 });
  }
}

// POST /api/sprints
export async function POST(request: Request) {
  const { name, startDate, endDate, teamId } = await request.json();

  if (!name || !startDate || !endDate || !teamId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const newSprint = await prisma.sprint.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        team: { connect: { id: teamId } },
      },
    });
    return NextResponse.json(newSprint, { status: 201 });
  } catch (error) {
    console.error('Error creating sprint:', error);
    return NextResponse.json({ error: 'Failed to create sprint' }, { status: 500 });
  }
}
