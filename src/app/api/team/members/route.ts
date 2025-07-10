import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession();

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // For now, return all users as potential team members
    // In a real app, this would be filtered by actual team membership
    const members = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ message: 'Failed to fetch team members' }, { status: 500 });
  }
}