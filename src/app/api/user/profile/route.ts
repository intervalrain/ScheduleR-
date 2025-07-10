
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import prisma from '@/lib/prisma';

export async function PUT(request: Request) {
  const session = await getServerSession();

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { name, image } = await request.json();

  try {
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        image,
      },
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
  }
}
