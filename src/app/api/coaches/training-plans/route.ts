import { NextResponse } from "next/server";
import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { createTrainingPlan, getTrainingPlansForCoach } from "@/lib/queries";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const roles = (session.roles || []).map((r: any) => (r || "").toString().toLowerCase());
  if (!roles.includes("coach") && !roles.includes("admin")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const filters: any = {};
    if (teamId) filters.teamId = Number(teamId);
    if (from) filters.dateFrom = new Date(from);
    if (to) filters.dateTo = new Date(to);
    const rows = await getTrainingPlansForCoach(session.id, filters, 500, session.coachTeamId || null);
    return NextResponse.json({ trainingPlans: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const roles = (session.roles || []).map((r: any) => (r || "").toString().toLowerCase());
  if (!roles.includes("coach") && !roles.includes("admin")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    if (!body?.title || !body?.date) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    const created = await createTrainingPlan({
      title: body.title,
      description: body.description,
      date: new Date(body.date),
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
      location: body.location || null,
      objectives: body.objectives || null,
      drills: body.drills || null,
      materials: body.materials || null,
      teamId: typeof body.teamId !== 'undefined' ? body.teamId : null,
      creatorId: session.id,
    });
    return NextResponse.json({ success: true, trainingPlan: created });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
