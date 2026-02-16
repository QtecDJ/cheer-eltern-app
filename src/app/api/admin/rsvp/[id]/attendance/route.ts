import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const rsvpId = Number(resolvedParams.id);
    
    const body = await request.json();
    const { attended } = body;

    // Validate: attended must be boolean or null
    if (attended !== null && typeof attended !== 'boolean') {
      return NextResponse.json({ error: "Invalid attended value" }, { status: 400 });
    }

    // Update the RSVP attendance
    const updatedRsvp = await prisma.announcementRSVP.update({
      where: { id: rsvpId },
      data: { attended },
    });

    return NextResponse.json({ 
      success: true,
      rsvp: updatedRsvp 
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: "Failed to update attendance" },
      { status: 500 }
    );
  }
}
