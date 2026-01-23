"use client";

import { useMemo } from "react";

export interface TrainingItem {
  id: number;
  title: string;
  date: string; // ISO
  team?: { name?: string } | null;
  // optional precomputed missing responses count (frontend will use if available)
  missingCount?: number | null;
}

export interface PollItem {
  id: number;
  question: string;
  hasVoted: boolean;
  endsAt: string | Date | null;
}

interface UseAlarmParams {
  upcomingTrainings?: TrainingItem[];
  attendanceMap?: Record<number, string | null> | undefined;
  polls?: PollItem[];
  memberId: number;
  role?: string;
  teamName?: string | null;
}

export type ReminderKind =
  | { kind: "training"; training: TrainingItem }
  | { kind: "poll"; poll: PollItem };

export function useAlarmReminderLogic({
  upcomingTrainings = [],
  attendanceMap,
  polls = [],
  role,
  teamName,
}: UseAlarmParams) {
  const now = Date.now();

  const trainingReminder = useMemo(() => {
    if (!upcomingTrainings || upcomingTrainings.length === 0) return null;

    // Find trainings within next 48h where attendance is missing and respect team/role
    const maxMs = 48 * 60 * 60 * 1000;

    return (
      upcomingTrainings.find((t) => {
        // Parse training date/time. If time available, combine; otherwise use local date.
        try {
          // Parse date robustly: accept full ISO or YYYY-MM-DD, and optionally apply provided time
          const baseDate = new Date(t.date);
          if (isNaN(baseDate.getTime())) return false;

          let dateObj = new Date(baseDate.getTime());
          if ((t as any).time) {
            const timeStr = (t as any).time as string;
            const [hh = "0", mm = "0"] = timeStr.split(":");
            const hhNum = Number(hh || 0);
            const mmNum = Number(mm || 0);
            if (!Number.isFinite(hhNum) || !Number.isFinite(mmNum)) return false;
            dateObj.setHours(hhNum, mmNum, 0, 0);
          }

          const dt = dateObj.getTime();
          const delta = dt - now;
          if (delta < 0 || delta > maxMs) return false;

          // Respect team ownership: members see only their team unless role allows global view
          // Normalize names (case-insensitive, collapse whitespace, handle HTML entities) to avoid mismatches
          const normalize = (s?: string | null) =>
            (s || "")
              .replace(/&amp;/g, "&")
              .toLowerCase()
              .replace(/\s+/g, " ")
              .trim();
          const teamMatches =
            !t.team || !t.team.name || !teamName || normalize(t.team.name) === normalize(teamName);
          const roleLower = (role || "").toLowerCase();
          const roleAllowsAll = ["admin", "coach", "orga"].includes(roleLower);
          if (!teamMatches && !roleAllowsAll) return false;

          // Attendance missing
          const att = attendanceMap ? attendanceMap[t.id] : undefined;
          return att === undefined || att === null || att === "";
        } catch (e) {
          return false;
        }
      }) || null
    );
  }, [upcomingTrainings, attendanceMap, now, role, teamName]);

  const pollReminder = useMemo(() => {
    if (!polls || polls.length === 0) return null;

    return (
      polls.find((p) => {
        if (p.hasVoted) return false;
        if (!p.endsAt) return true;
        const ends = new Date(p.endsAt).getTime();
        if (isNaN(ends)) return true;
        return ends > now;
      }) || null
    );
  }, [polls, now]);

  const reminder = useMemo<ReminderKind | null>(() => {
    // Prefer training reminders over polls
    if (trainingReminder) return { kind: "training", training: trainingReminder };
    if (pollReminder) return { kind: "poll", poll: pollReminder };
    return null;
  }, [trainingReminder, pollReminder]);

  // Debug logging in development to help troubleshooting when reminder doesn't appear
  try {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("useAlarmReminderLogic inputs:", {
        upcomingTrainings: upcomingTrainings?.slice(0, 5),
        attendanceMap: attendanceMap || null,
        polls: polls?.slice(0, 5),
        role,
        teamName,
      });
      // eslint-disable-next-line no-console
      console.debug("useAlarmReminderLogic result:", { reminder, shouldShow: reminder !== null });
    }
  } catch (e) {
    // ignore
  }

  return {
    reminder,
    shouldShow: reminder !== null,
  } as const;
}

export default useAlarmReminderLogic;
