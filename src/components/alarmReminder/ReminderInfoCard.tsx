"use client";

import React from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReminderKind } from "./useAlarmReminderLogic";

interface Props {
  reminder: ReminderKind;
  onClose: () => void;
  role?: string | undefined;
}

export default function ReminderInfoCard({ reminder, onClose, role }: Props) {
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

          <div className="mt-4 flex items-center gap-3">
            <a
              href={actionHref}
              className="flex-1 text-center py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              onClick={onClose}
            >
              {actionLabel}
            </a>
            <button
              onClick={onClose}
              className="py-2 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Schließen
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
