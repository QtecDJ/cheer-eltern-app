"use client";

import React from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReminderKind } from "./useAlarmReminderLogic";

interface Props {
  reminder: ReminderKind;
  onClose: () => void;
  role?: string | undefined;
  adminData?: any;
}

export default function ReminderInfoCard({ reminder, onClose, role, adminData }: Props) {
  let primaryText =
    reminder.kind === "training"
      ? "Kurzer Hinweis: Für das heutige Training fehlt noch deine Rückmeldung."
      : "Zur Info: Es gibt aktuell eine laufende Abstimmung.";

  const actionLabel = reminder.kind === "training" ? "Zum Training" : "Zur Abstimmung";
  const actionHref = reminder.kind === "training" ? `/training/${reminder.training.id}` : `/events`;

  // If user is a coach/admin and a precomputed missingCount is available, show coach-specific message
  const roleLower = (role || "").toLowerCase();
  const isCoachLike = ["coach", "admin", "orga"].includes(roleLower);
  if (reminder.kind === "training" && isCoachLike) {
    const missing = reminder.training.missingCount;
    if (typeof missing === "number") {
      primaryText = `Kurz zur Info: Bei "${reminder.training.title}" haben noch ${missing} Teilnehmende nicht geantwortet.`;
    } else {
      primaryText = `Kurz zur Info: Es fehlen noch Rückmeldungen für "${reminder.training.title}".`;
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="m-4 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-sm font-semibold">{primaryText}</h3>
              <p className="text-xs text-muted-foreground mt-2">
                {reminder.kind === "training" && (
                  <>
                    {reminder.training.title} — {new Date(reminder.training.date).toLocaleString("de-DE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </>
                )}
                {reminder.kind === "poll" && (
                  <>{reminder.poll.question}</>
                )}
              </p>
            </div>

            <button
              onClick={onClose}
              aria-label="Schließen"
              className="text-muted-foreground hover:text-foreground p-2 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Admin/Coach detailed summary */}
          {((role || "").toLowerCase() === "admin" || (role || "").toLowerCase() === "coach" || (role || "").toLowerCase() === "orga") && (
            <div className="mt-4 text-sm text-muted-foreground">
              {adminDataAvailable(adminData) ? (
                <AdminSummary adminData={adminData} />
              ) : (
                <p>Weitere Details sind verfügbar im Info-Bereich.</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function adminDataAvailable(d?: any) {
  return !!d && (d.attendances || d.membersCount || d.missingCount || d.members);
}

function AdminSummary({ adminData }: { adminData: any }) {
  const attendances: any[] = adminData?.attendances || [];
  const members: any[] = adminData?.members || [];
  const membersCount: number = adminData?.membersCount ?? members.length;
  const present = attendances.filter((a) => a.status === "present").length;
  const excused = attendances.filter((a) => a.status === "excused").length;
  const absent = attendances.filter((a) => a.status === "absent").length;
  const missing = Math.max(0, membersCount - present - excused - absent);

  const missingMembers = members.filter((m) => !attendances.some((a) => a.memberId === m.id));

  return (
    <div>
      <div className="mb-2">
        <div className="flex gap-3">
          <div className="text-xs">Mitglieder insgesamt:</div>
          <div className="font-medium">{membersCount}</div>
        </div>
        <div className="flex gap-3 mt-1 text-xs">
          <div>Zugesagt: <span className="font-medium">{present}</span></div>
          <div>Entschuldigt: <span className="font-medium">{excused}</span></div>
          <div>Abgesagt: <span className="font-medium">{absent}</span></div>
          <div>Keine Rückmeldung: <span className="font-medium">{missing}</span></div>
        </div>
      </div>

      {missingMembers.length > 0 && (
        <div className="mt-2 text-xs">
          <div className="font-medium">Keine Rückmeldung von:</div>
          <ul className="mt-1 list-disc list-inside">
            {missingMembers.slice(0, 8).map((m) => (
              <li key={m.id}>{m.firstName ? `${m.firstName} ${m.lastName}` : m.name}</li>
            ))}
            {missingMembers.length > 8 && <li>…und {missingMembers.length - 8} weitere</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
