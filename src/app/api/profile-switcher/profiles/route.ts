import { NextResponse } from 'next/server';
import { getSession, updateSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * GET /api/profile-switcher/profiles
 * Returns all profiles the current user has access to
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.id;

    // Get self profile
    const selfProfile = await prisma.member.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        teamId: true,
        photoUrl: true,
        team: {
          select: {
            name: true,
          },
        },
      },
    });

    const profiles = [];

    // Add self profile
    if (selfProfile) {
      profiles.push({
        id: selfProfile.id,
        name: selfProfile.name,
        firstName: selfProfile.firstName,
        lastName: selfProfile.lastName,
        teamId: selfProfile.teamId,
        teamName: selfProfile.team?.name || null,
        photoUrl: selfProfile.photoUrl,
        relation: 'self',
        isSelf: true,
      });
    }

    // Find children via ParentChildRelation
    const parentRelations = await prisma.parentChildRelation.findMany({
      where: {
        parentId: userId,
        isActive: true,
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            teamId: true,
            memberId: true,
            team: {
              select: {
                name: true,
              },
            },
            member: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                teamId: true,
                photoUrl: true,
                team: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Add children profiles (using their Member account if they have one)
    parentRelations.forEach((relation) => {
      const child = relation.child;
      
      // If child has a Member account, use it
      if (child.member) {
        profiles.push({
          id: child.member.id,
          name: child.member.name,
          firstName: child.member.firstName,
          lastName: child.member.lastName,
          teamId: child.member.teamId,
          teamName: child.member.team?.name || null,
          photoUrl: child.member.photoUrl,
          relation: 'child',
          isSelf: false,
        });
      } else {
        // If no Member account, we can't switch to this child
        // (They don't have login credentials)
        console.log(`Child ${child.firstName} ${child.lastName} has no Member account - skipping from profile switcher`);
      }
    });

    return NextResponse.json({
      profiles,
      activeProfileId: session.activeProfileId || userId,
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile-switcher/profiles
 * Switch to a different profile
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { profileId } = await request.json();

    if (!profileId || typeof profileId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid profileId' },
        { status: 400 }
      );
    }

    const userId = session.id;

    // Check if user has access to this profile
    let hasAccess = profileId === userId; // Can always switch to self

    if (!hasAccess) {
      // Check if it's a child's Member account
      const childRelation = await prisma.parentChildRelation.findFirst({
        where: {
          parentId: userId,
          isActive: true,
          child: {
            memberId: profileId,
          },
        },
      });
      
      hasAccess = childRelation !== null;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this profile' },
        { status: 403 }
      );
    }

    // Get the target profile details
    const targetProfile = await prisma.member.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        teamId: true,
        team: {
          select: {
            name: true,
          },
        },
        userRole: true,
        roles: true,
        coachTeamId: true,
      },
    });

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Update session with new active profile
    await updateSession({
      activeProfileId: profileId,
      // Also update context info for convenience (but keep original id)
      name: targetProfile.name,
      firstName: targetProfile.firstName,
      lastName: targetProfile.lastName,
      teamId: targetProfile.teamId,
      teamName: targetProfile.team?.name || null,
      // Keep roles from target profile
      userRole: targetProfile.userRole,
      roles: targetProfile.roles ? targetProfile.roles : targetProfile.userRole?.split(',').map(r => r.trim()) || [],
      coachTeamId: targetProfile.coachTeamId,
    });

    // Force Next.js to re-render all pages with fresh session data
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      activeProfile: {
        id: targetProfile.id,
        name: targetProfile.name,
        firstName: targetProfile.firstName,
        lastName: targetProfile.lastName,
        teamId: targetProfile.teamId,
        teamName: targetProfile.team?.name || null,
      },
    });
  } catch (error) {
    console.error('Error switching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
