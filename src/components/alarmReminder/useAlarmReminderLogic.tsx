"use client";

import { useMemo } from "react";

export interface TrainingItem {
  id: number;
  title: string;
  date: string; // ISO
  team?: { name?: string } | null;
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
        const date = new Date(t.date).getTime();
        if (isNaN(date)) return false;
        const delta = date - now;
        if (delta < 0 || delta > maxMs) return false;

        // Respect team ownership: members see only their team unless role allows global view
        const teamMatches = !t.team || !t.team.name || !teamName || t.team.name === teamName;
        const roleAllowsAll = role === "Admin" || role === "Coach" || role === "Orga";
        if (!teamMatches && !roleAllowsAll) return false;

        // Attendance missing
        const att = attendanceMap ? attendanceMap[t.id] : undefined;
        return att === undefined || att === null || att === "";
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

  return {
    reminder,
    shouldShow: reminder !== null,
  } as const;
}

export default useAlarmReminderLogic;
