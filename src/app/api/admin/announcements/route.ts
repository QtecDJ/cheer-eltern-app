import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptText } from "@/lib/crypto";
import { sendPushToTeam } from "@/lib/send-push";

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
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  
  const roles = (session.roles || []).map(r => (r || "").toString().toLowerCase());
  if (!roles.includes("admin") && !roles.includes("orga")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    
    if (!body.title || !body.content) {
      return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
    }

    const encryptedContent = encryptText(body.content);

    // Create announcement with optional poll
    const announcement = await prisma.announcement.create({
      data: {
        title: body.title,
        content: encryptedContent,
        category: body.category || 'news',
        priority: body.priority || 'normal',
        authorId: session.id,
        teamId: body.teamId || null,
        isPinned: body.isPinned || false,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        allowRsvp: body.allowRsvp || false,
        imageUrl: body.imageUrl || null,
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

    // Send push notifications to team members
    if (body.teamIds && Array.isArray(body.teamIds) && body.teamIds.length > 0) {
      sendPushToTeam(
        body.teamIds,
        {
          title: body.title,
          body: body.content.slice(0, 100) + (body.content.length > 100 ? '...' : ''),
          url: `/events?announcement=${announcement.id}`,
          icon: body.imageUrl || '/icons/icon-192x192.png',
        }
      ).catch(error => {
        console.error('Failed to send push notifications:', error);
        // Don't fail the request if push fails
      });
    }

    return NextResponse.json({ success: true, announcement });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
