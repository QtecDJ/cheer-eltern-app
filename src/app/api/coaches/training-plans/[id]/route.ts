import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTrainingPlanById, updateTrainingPlan, deleteTrainingPlan } from "@/lib/queries";

export async function GET(req: Request, context: any) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const id = Number((context?.params && (await context.params).id) ?? context?.params?.id ?? context?.params);
    const plan = await getTrainingPlanById(id);
    if (!plan) return NextResponse.json({ error: "not_found" }, { status: 404 });
    // only coaches/admins should access — additional checks can be added
    return NextResponse.json({ trainingPlan: plan });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: any) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const id = Number((context?.params && (await context.params).id) ?? context?.params?.id ?? context?.params);
    const plan = await getTrainingPlanById(id);
    if (!plan) return NextResponse.json({ error: "not_found" }, { status: 404 });
    // allow only creator or admin to update
    const roles = (session.roles || []).map((r: any) => (r || "").toString().toLowerCase());
    if (!(roles.includes("admin") || roles.includes("coach") || (session.id && Number(session.id) === Number(plan.creatorId)))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const body = await req.json();
    const updated = await updateTrainingPlan(id, body);
    return NextResponse.json({ success: true, trainingPlan: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const id = Number((context?.params && (await context.params).id) ?? context?.params?.id ?? context?.params);
    const plan = await getTrainingPlanById(id);
    if (!plan) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const roles = (session.roles || []).map((r: any) => (r || "").toString().toLowerCase());
    if (!(roles.includes("admin") || roles.includes("coach") || (session.id && Number(session.id) === Number(plan.creatorId)))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    await deleteTrainingPlan(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
