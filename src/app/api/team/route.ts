
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();

  if (!name) {
    return NextResponse.json({ message: "Team name is required" }, { status: 400 });
  }

  try {
    const newTeam = await prisma.team.create({
      data: {
        name,
        users: {
          create: {
            userId: session.user.id as string,
          },
        },
      },
    });
    return NextResponse.json(newTeam, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ message: 'Failed to create team' }, { status: 500 });
  }
}
