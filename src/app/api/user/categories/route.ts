
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from '@/lib/prisma';

// GET /api/user/categories
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const categories = await prisma.busyHourCategory.findMany({
      where: { userId: user.id },
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/user/categories
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { name, color } = await request.json();
  if (!name || !color) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const newCategory = await prisma.busyHourCategory.create({
      data: {
        userId: user.id,
        name,
        color,
      },
    });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
