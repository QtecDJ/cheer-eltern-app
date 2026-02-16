import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = (session.roles || []).map((r: string | null | undefined) => (r || "").toString().toLowerCase());
    if (!roles.includes("admin") && !roles.includes("orga")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);

    // Get poll results
    const pollResults = await prisma.poll.findFirst({
      where: { announcementId: id },
      include: {
        PollOption: {
          include: {
            PollVote: {
              include: {
                Member: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    name: true,
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
                votedAt: 'desc',
              },
            },
          },
        },
      },
    });

    // Get RSVP results
    const rsvpResults = await prisma.announcementRSVP.findMany({
      where: { announcementId: id },
      include: {
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
    });

    return NextResponse.json({
      pollResults,
      rsvpResults,
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
