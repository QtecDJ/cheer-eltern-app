"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Clock, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useAlarmReminderLogic, { TrainingItem, PollItem } from "./useAlarmReminderLogic";
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

  // do not render at all if no reminder required
  if (!shouldShow) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [hasClosedOnce, setHasClosedOnce] = useState(false); // once-per-session for info card
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    // remove animation flag after it finishes (<1s)
    const t = setTimeout(() => setAnimate(false), 900);
    return () => clearTimeout(t);
  }, []);

  const handleOpen = () => {
    if (hasClosedOnce) return; // respect once-per-session: do not re-open after close
    setIsOpen(true);
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

  return (
    <>
      <button
        aria-label="Erinnerung"
        title={label}
        onClick={handleOpen}
        className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-50 bg-primary text-primary-foreground p-2 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-foreground touch-feedback`}
        style={{ width: 40, height: 40 }}
      >
        <div className={`${animate ? "animate-alarm-wiggle" : ""} flex items-center justify-center`}> 
          <Clock className="w-5 h-5" />
        </div>
      </button>

      {isOpen && reminder && (
        <ReminderInfoCard
          reminder={reminder}
          onClose={handleClose}
        />
      )}
    </>
  );
}
