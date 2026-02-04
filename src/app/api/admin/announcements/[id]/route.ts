import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptText, decryptText } from "@/lib/crypto";

// GET single announcement
export async function GET(req: Request, context: any) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  
  const roles = (session.roles || []).map(r => (r || "").toString().toLowerCase());
  if (!roles.includes("admin") && !roles.includes("orga")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const id = Number((await context.params).id);
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        Member: { select: { id: true, firstName: true, lastName: true, name: true } },
        Team: { select: { id: true, name: true } },
        Poll: {
          include: {
            PollOption: {
              orderBy: { order: 'asc' },
              include: { PollVote: true }
            }
          }
        },
        AnnouncementTeam: { include: { Team: true } },
        rsvps: true,
      },
    });

    if (!announcement) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Decrypt content
    const decryptedAnnouncement = {
      ...announcement,
      content: announcement.content ? decryptText(announcement.content) : announcement.content,
    };

    return NextResponse.json({ announcement: decryptedAnnouncement });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// PATCH update announcement
export async function PATCH(req: Request, context: any) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  
  const roles = (session.roles || []).map(r => (r || "").toString().toLowerCase());
  if (!roles.includes("admin") && !roles.includes("orga")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const id = Number((await context.params).id);
    const body = await req.json();

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = encryptText(body.content);
    if (body.category !== undefined) updateData.category = body.category;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.isPinned !== undefined) updateData.isPinned = body.isPinned;
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (body.allowRsvp !== undefined) updateData.allowRsvp = body.allowRsvp;
    if (body.teamId !== undefined) updateData.teamId = body.teamId;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: updateData,
    });

    // Update teams if specified
    if (body.teamIds !== undefined) {
      // Delete existing teams
      await prisma.announcementTeam.deleteMany({ where: { announcementId: id } });
      
      // Add new teams
      if (Array.isArray(body.teamIds) && body.teamIds.length > 0) {
        await prisma.announcementTeam.createMany({
          data: body.teamIds.map((teamId: number) => ({
            announcementId: id,
            teamId,
          })),
        });
      }
    }

    // Update poll if specified
    if (body.poll !== undefined) {
      // Delete existing poll
      await prisma.poll.deleteMany({ where: { announcementId: id } });
      
      // Create new poll if provided
      if (body.poll && body.poll.question && body.poll.options && body.poll.options.length > 0) {
        const poll = await prisma.poll.create({
          data: {
            announcementId: id,
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
    }

    return NextResponse.json({ success: true, announcement });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// DELETE announcement
export async function DELETE(req: Request, context: any) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  
  const roles = (session.roles || []).map(r => (r || "").toString().toLowerCase());
  if (!roles.includes("admin") && !roles.includes("orga")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const id = Number((await context.params).id);
    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
