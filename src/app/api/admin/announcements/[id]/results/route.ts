import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    console.log('🔍 Results API called');
    const session = await getSession();
    if (!session) {
      console.log('❌ No session');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = (session.roles || []).map((r: any) => (r || "").toString().toLowerCase());
    if (!roles.includes("admin") && !roles.includes("orga")) {
      console.log('❌ Forbidden - roles:', roles);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    console.log('📋 Fetching results for announcement:', id);

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
          },
        },
      },
      orderBy: {
        respondedAt: 'desc',
      },
    });

    console.log('📊 Results for announcement', id, ':', {
      hasPoll: !!pollResults,
      pollVotes: pollResults?.PollOption?.reduce((sum, opt) => sum + (opt.PollVote?.length || 0), 0) || 0,
      rsvpCount: rsvpResults.length
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
