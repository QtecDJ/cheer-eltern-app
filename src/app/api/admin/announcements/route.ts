import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptText } from "@/lib/crypto";
import { sendOneSignalPushToMultipleUsers } from "@/lib/onesignal-push";
import { revalidatePath } from "next/cache";
import { validateRequestSafe, AnnouncementCreateSchema } from "@/lib/validation";
import { applyRateLimit, RateLimitPresets } from "@/lib/rate-limit";

// GET all announcements
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  
  const roles = (session.roles || []).map(r => (r || "").toString().toLowerCase());
  if (!roles.includes("admin") && !roles.includes("orga")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        Member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
          }
        },
        Team: {
          select: {
            id: true,
            name: true,
          }
        },
        Poll: {
          include: {
            PollOption: {
              orderBy: { order: 'asc' },
              include: {
                PollVote: true,
              }
            }
          }
        },
        rsvps: true,
        AnnouncementTeam: {
          include: {
            Team: true,
          }
        }
      },
      take: 100,
    });

    return NextResponse.json({ announcements });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// POST create new announcement
export async function POST(req: NextRequest) {
  // Rate Limiting
  const rateLimitResult = await applyRateLimit(req, RateLimitPresets.WRITE);
  if (rateLimitResult) return rateLimitResult;
  
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  
  const roles = (session.roles || []).map(r => (r || "").toString().toLowerCase());
  if (!roles.includes("admin") && !roles.includes("orga")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    
    // Input Validation mit Zod
    const validation = validateRequestSafe(AnnouncementCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: "validation_failed", 
        details: validation.error 
      }, { status: 400 });
    }
    
    const validatedData = validation.data;
    const encryptedContent = encryptText(validatedData.content);

    // Create announcement with optional poll
    const announcement = await prisma.announcement.create({
      data: {
        title: validatedData.title,
        content: encryptedContent,
        category: validatedData.category,
        priority: validatedData.priority,
        authorId: session.id,
        teamId: body.teamId || null,
        isPinned: validatedData.isPinned,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        allowRsvp: validatedData.allowRsvp,
        imageUrl: validatedData.imageUrl || null,
      },
    });

    // Add teams if specified
    if (body.teamIds && Array.isArray(body.teamIds) && body.teamIds.length > 0) {
      await prisma.announcementTeam.createMany({
        data: body.teamIds.map((teamId: number) => ({
          announcementId: announcement.id,
          teamId,
        })),
      });
    }

    // Create poll if provided
    if (body.poll && body.poll.question && body.poll.options && body.poll.options.length > 0) {
      const poll = await prisma.poll.create({
        data: {
          announcementId: announcement.id,
          question: body.poll.question,
          allowMultiple: body.poll.allowMultiple || false,
          isAnonymous: body.poll.isAnonymous || false,
          endsAt: body.poll.endsAt ? new Date(body.poll.endsAt) : null,
        },
      });

      await prisma.pollOption.createMany({
        data: body.poll.options.map((option: string, index: number) => ({
          pollId: poll.id,
          text: option,
          order: index,
        })),
      });
    }

    // Send push notifications to team members via OneSignal
    if (body.teamIds && Array.isArray(body.teamIds) && body.teamIds.length > 0) {
      // Get all members from the specified teams
      const teamMembers = await prisma.member.findMany({
        where: {
          teamId: {
            in: body.teamIds,
          },
        },
        select: { id: true },
      });

      const memberIds = teamMembers.map(m => m.id);

      if (memberIds.length > 0) {
        sendOneSignalPushToMultipleUsers(
          memberIds,
          {
            title: 'Infinity Cheer Allstars',
            body: `${body.title}: ${body.content.slice(0, 80)}${body.content.length > 80 ? '...' : ''}`,
            url: `/events?announcement=${announcement.id}`,
            icon: body.imageUrl || '/icons/icon-192x192.png',
          }
        ).catch(error => {
          console.error('Failed to send OneSignal push notifications:', error);
          // Don't fail the request if push fails
        });
      }
    }

    // Invalidate events and announcements cache for realtime updates
    revalidatePath("/events");
    revalidatePath("/admin/announcements");
    revalidatePath("/");  // Home page also shows announcements

    return NextResponse.json({ success: true, announcement });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
