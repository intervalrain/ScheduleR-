import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: sprintId } = await params;

    // Verify sprint exists and user has access
    const sprint = await prisma.sprint.findFirst({
      where: {
        id: sprintId,
        team: {
          users: {
            some: {
              userId: session.user.id
            }
          }
        }
      },
      include: {
        team: {
          include: {
            users: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!sprint) {
      return NextResponse.json({ error: 'Sprint not found or access denied' }, { status: 404 });
    }

    const members = sprint.team.users.map(teamUser => teamUser.user);

    return NextResponse.json({
      success: true,
      members
    });

  } catch (error) {
    console.error('Get sprint members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}