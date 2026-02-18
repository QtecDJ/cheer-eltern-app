import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyRateLimit, RateLimitPresets } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limiting (READ preset for admin views)
    const rateLimitResult = await applyRateLimit(req, RateLimitPresets.READ);
    if (rateLimitResult) return rateLimitResult;

    const roles = (session.roles || []).map(r => (r || "").toString().toLowerCase());
    const isAdmin = roles.includes("admin") || roles.includes("orga") || roles.includes("trainer");
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("Fetching RSVP announcements...");

    // Fetch all announcements with RSVP (check if allowRsvp is true OR if there are rsvps)
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { allowRsvp: true },
          { rsvps: { some: {} } }
        ]
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        expiresAt: true,
        category: true,
        priority: true,
        allowRsvp: true,
        rsvps: {
          select: {
            id: true,
            status: true,
            respondedAt: true,
            attended: true,
            Member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                photoUrl: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
              },
            },
          },
          orderBy: {
            respondedAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${announcements.length} announcements with RSVP`);
    console.log("First announcement:", announcements[0] ? {
      id: announcements[0].id,
      title: announcements[0].title,
      allowRsvp: announcements[0].allowRsvp,
      rsvpCount: announcements[0].rsvps.length
    } : "none");

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Error fetching RSVP overview:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
