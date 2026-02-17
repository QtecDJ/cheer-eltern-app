import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getNextTrainingForAttendance,
  getAttendancesForTraining,
  getTeamMembersForAttendance,
  getMemberForHome,
} from "@/lib/queries";
import { getActiveProfileWithParentMapping } from "@/lib/get-active-profile-server";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const teamIdParam = url.searchParams.get("teamId");

  const userRole = session.userRole || null;
  const coachTeamId = session.coachTeamId ?? null;
  
  // For parent accounts, get the child's teamId instead of parent's teamId
  const activeProfileId = await getActiveProfileWithParentMapping(session);
  const member = await getMemberForHome(activeProfileId);
  const athleteTeamId = member?.teamId ?? session.teamId ?? null;

  const isCoachLike = ["admin", "coach", "orga"].includes((userRole || "").toLowerCase());

  // Prefer athlete team if user is also an athlete; allow coaches/admins to override via teamIdParam
  const selectedTeamId = isCoachLike && teamIdParam ? Number(teamIdParam) : (athleteTeamId ?? coachTeamId);

  // fetch next training for the relevant team (or null)
  const training = await getNextTrainingForAttendance(selectedTeamId ?? null);
  if (!training) {
    return NextResponse.json({ training: null });
  }

  // fetch attendances and members to compute missing count
  const attendances = await getAttendancesForTraining(training.id);
  const members = await getTeamMembersForAttendance(training.teamId as number);

  const presentCount = attendances.filter((a: any) => a.status === "present").length;
  const excusedCount = attendances.filter((a: any) => a.status === "excused").length;
  const absentCount = attendances.filter((a: any) => a.status === "absent").length;
  const missingCount = Math.max(0, members.length - presentCount - excusedCount - absentCount);

  // serialize dates
  const serializedAttendances = attendances.map((a: any) => ({
    ...a,
    updatedAt: a.updatedAt ? a.updatedAt.toISOString() : null,
  }));

  return NextResponse.json({
    training,
    attendances: serializedAttendances,
    membersCount: members.length,
    missingCount,
  });
}
