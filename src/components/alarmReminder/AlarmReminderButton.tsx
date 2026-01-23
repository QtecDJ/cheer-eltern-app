"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Clock, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useAlarmReminderLogic, { TrainingItem, PollItem } from "./useAlarmReminderLogic";
import type { ReminderKind } from "./useAlarmReminderLogic";
import ReminderInfoCard from "./ReminderInfoCard";

interface Props {
  upcomingTrainings?: TrainingItem[];
  attendanceMap?: Record<number, string | null>;
  polls?: PollItem[];
  memberId: number;
  role?: string;
  teamName?: string | null;
}

export default function AlarmReminderButton(props: Props) {
  const { reminder, shouldShow } = useAlarmReminderLogic(props);

  const isAdmin = (props.role || "").toLowerCase() === "admin";

  const roleLower = (props.role || "").toLowerCase();
  const isCoachLike = ["admin", "coach", "orga"].includes(roleLower);

  // Render rules: coaches/admins always see the button; members see it only when reminder present
  const shouldRenderButton = isCoachLike ? true : shouldShow;
  if (!shouldRenderButton) return null;

  // Provide a fallback reminder for testing so clicking always shows a card
  const reminderToShow: ReminderKind =
    (reminder as ReminderKind) ?? {
      kind: "training",
      training: {
        id: -999,
        title: "Test-Reminder",
        date: new Date().toISOString(),
        team: props.teamName ? { name: props.teamName } : null,
      } as TrainingItem,
    };

  const [isOpen, setIsOpen] = useState(false);
  const [hasClosedOnce, setHasClosedOnce] = useState(false); // once-per-session for info card
  const [animate, setAnimate] = useState(true);
  const [pos, setPos] = useState<{ right: number; topPct: number }>(() => {
    try {
      const raw = sessionStorage.getItem("alarm-reminder-pos");
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore
    }
    return { right: 12, topPct: 50 };
  });
  const draggingRef = React.useRef(false);
  const startRef = React.useRef<{ x: number; y: number } | null>(null);
  const [reminderData, setReminderData] = useState<any | null>(null);
  useEffect(() => {
    // Run initial wiggle then repeat a few times with a short interval
    let mounted = true;
    const ANIM_DURATION = 900; // ms
    const INTERVAL = 12000; // ms between wiggles
    const MAX_REPEATS = 3; // total additional wiggles after the initial one
    let repeats = 0;

    const runOnce = () => {
      if (!mounted) return;
      setAnimate(true);
      setTimeout(() => {
        if (!mounted) return;
        setAnimate(false);
      }, ANIM_DURATION);
    };

    // initial
    runOnce();

    const iv = setInterval(() => {
      if (!mounted) return;
      if (repeats >= MAX_REPEATS) {
        clearInterval(iv);
        return;
      }
      repeats += 1;
      runOnce();
    }, INTERVAL);

    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, []);

  const handleOpen = () => {
    if (hasClosedOnce && !isCoachLike) return; // respect once-per-session: coaches/admins can re-open
    setIsOpen(true);
    // fetch live reminder data when opening
    (async () => {
      try {
        const res = await fetch(`/api/alarm-reminder`);
        if (res.ok) {
          const json = await res.json();
          setReminderData(json);
        }
      } catch (e) {
        console.error("Failed to fetch alarm reminder:", e);
      }
    })();
  };

  const handleClose = () => {
    setIsOpen(false);
    setHasClosedOnce(true);
  };

  const label = useMemo(() => {
    if (!reminder) return "Hinweis";
    if (reminder.kind === "training") return "Kurzer Hinweis";
    return "Zur Info";
  }, [reminder]);

  // Drag handlers
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    draggingRef.current = true;
    startRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !startRef.current) return;
    const dx = startRef.current.x - e.clientX; // movement to left increases right
    const dy = e.clientY; // absolute Y
    const newRight = Math.max(6, pos.right + dx);
    const viewportHeight = window.innerHeight || 800;
    const topPct = Math.max(5, Math.min(95, (dy / viewportHeight) * 100));
    setPos({ right: newRight, topPct });
    startRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    draggingRef.current = false;
    startRef.current = null;
    try {
      sessionStorage.setItem("alarm-reminder-pos", JSON.stringify(pos));
    } catch {
      // ignore
    }
  };

  return (
    <>
      <button
        aria-label="Erinnerung"
        title={label}
        onClick={handleOpen}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={`bg-primary text-primary-foreground p-2 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-foreground touch-feedback`}
        style={{
          position: "fixed",
          right: pos.right,
          top: `${pos.topPct}%`,
          transform: "translateY(-50%)",
          width: 40,
          height: 40,
          zIndex: 9999,
          pointerEvents: "auto",
          backgroundColor: "#ef4444",
          color: "#fff",
          cursor: "grab",
        }}
      >
        <div className={`${animate ? "animate-alarm-wiggle" : ""} flex items-center justify-center`}> 
          <Clock className="w-5 h-5" />
        </div>
      </button>

      {isOpen && (
        <ReminderInfoCard
          reminder={
            // prefer live data when available, otherwise fall back to computed reminder
            reminderData && reminderData.training
              ? { kind: "training", training: { ...reminderData.training, missingCount: reminderData.missingCount } }
              : reminderToShow
          }
          adminData={reminderData ?? undefined}
          onClose={handleClose}
          role={props.role}
        />
      )}
    </>
  );
}
