import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { z } from "zod";
import { validateRequestSafe } from "@/lib/validation";

// Validation Schema
const AttendanceUpdateSchema = z.object({
  attended: z.boolean().nullable(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limiting
    const rateLimitResult = await applyRateLimit(request, RateLimitPresets.WRITE);
    if (rateLimitResult) return rateLimitResult;

    const roles = (session.roles || []).map((r: string | null | undefined) => (r || "").toString().toLowerCase());
    if (!roles.includes("admin") && !roles.includes("orga")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const rsvpId = Number(resolvedParams.id);
    
    // Validate ID
    if (isNaN(rsvpId) || rsvpId <= 0) {
      return NextResponse.json({ error: "Invalid RSVP ID" }, { status: 400 });
    }
    
    const body = await request.json();

    // Input Validation mit Zod
    const validation = validateRequestSafe(AttendanceUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: validation.error },
        { status: 400 }
      );
    }

    const { attended } = validation.data;

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
