import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAttendancesForTraining } from "@/lib/queries";
import { applyRateLimit, RateLimitPresets } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rateLimitResult = await applyRateLimit(request, RateLimitPresets.READ);
    if (rateLimitResult) return rateLimitResult;

    const roles = (session.roles || []).map((r: any) => (r || "").toString().toLowerCase());
    const privileged =
      roles.includes("admin") ||
      roles.includes("trainer") ||
      roles.includes("coach");
    const hasCoachTeam = !!session.coachTeamId;

    if (!privileged && !hasCoachTeam) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const trainingId = Number(url.searchParams.get("trainingId"));
    if (!trainingId || Number.isNaN(trainingId)) {
      return NextResponse.json({ error: "Missing trainingId" }, { status: 400 });
    }

    const attendances = await getAttendancesForTraining(trainingId);

    const serialized = attendances.map((a) => ({
      memberId: a.memberId,
      status: a.status,
      reason: a.reason,
      notes: a.notes,
      updatedAt: a.updatedAt ? a.updatedAt.toISOString() : null,
    }));

    const res = NextResponse.json({ attendances: serialized });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
