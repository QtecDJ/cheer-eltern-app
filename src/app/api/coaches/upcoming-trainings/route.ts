import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUpcomingTrainingsMinimal } from "@/lib/queries";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const roles = (session.roles || []).map((r: any) => (r || "").toString().toLowerCase());
  if (!roles.includes("coach") && !roles.includes("admin")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");
    if (!teamId) return NextResponse.json({ trainings: [] });
    const rows = await getUpcomingTrainingsMinimal(Number(teamId));
    return NextResponse.json({ trainings: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}