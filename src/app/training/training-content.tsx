"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDate, getRelativeDate } from "@/lib/utils";
import {
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  XCircle,
  FileText,
  Dumbbell,
  CalendarPlus,
} from "lucide-react";
import { ResponseButtons } from "@/components/training/ResponseButtons";
import { useRouter } from "next/navigation";
import { useVersionedContent } from "@/lib/use-versioned-content";

// Funktion zum Hinzufügen zum Kalender (iOS und Android)
function addToCalendar(title: string, date: string, time: string, location: string) {
  // Erstelle ICS-Datei für Kalender
  const [hours, minutes] = time.split(':');
  const startDate = new Date(date);
  startDate.setHours(parseInt(hours), parseInt(minutes), 0);
  
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 2); // 2 Stunden Training
  
  const formatICSDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ICA Cheer//Training//DE',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:Training - ${title}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Training beginnt in 30 Minuten',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  
  // Erstelle Blob und Download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `training-${date}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

interface TrainingContentProps {
  member: {
    id: number;
    firstName: string;
    team: {
      name: string;
      color: string | null;
    } | null;
  };
  trainings: Array<{
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    trainer: string | null;
    status: string;
    description: string | null;
    maxParticipants: number;
    type: string;
    team: {
      name: string;
      color: string | null;
    } | null;
  }>;
  attendanceMap: Record<number, string>;
}

function getAttendanceInfo(status: string | undefined) {
  switch (status) {
    case "present":
    case "confirmed":
      return {
        icon: CheckCircle,
        label: "Zugesagt",
        variant: "success" as const,
        color: "text-emerald-500",
      };
    case "absent":
    case "excused":
    case "declined":
      return {
        icon: XCircle,
        label: "Abgesagt",
        variant: "danger" as const,
        color: "text-red-500",
      };
    default:
      return null;
  }
}



// Client-only Komponente für relatives Datum
function RelativeDateBadge({ date }: { date: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Badge variant="info" size="sm">...</Badge>;
  }

  return (
    <Badge variant="info" size="sm">
      {getRelativeDate(date)}
    </Badge>
  );
}

export function TrainingContent({
  member,
  trainings,
  attendanceMap,
}: TrainingContentProps) {
  const today = new Date().toISOString().split("T")[0];

  // Trennung in kommende und vergangene Trainings
  const upcomingTrainings = trainings.filter((t) => t.date >= today);
  const pastTrainings = trainings.filter((t) => t.date < today);
  const router = useRouter();

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4 max-w-lg md:max-w-none mx-auto">
      {/* Header */}
      <header className="mb-6 md:mb-8 animate-fade-in">
        <button onClick={() => router.back()} className="text-primary text-sm mb-2 hover:underline md:hidden">
          ← Zurück
        </button>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Training</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Trainingsplan für {member.firstName}
          {member.team && (
            <span className="ml-1">
              · <span style={{ color: member.team.color || "#ec4899" }}>{member.team.name}</span>
            </span>
          )}
        </p>
      </header>

      {/* Anstehende Trainings */}
      <section className="mb-8">
        <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          Anstehende Trainings
        </h2>

        {upcomingTrainings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Keine anstehenden Trainings"
            description="Aktuell sind keine Trainings geplant."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {upcomingTrainings.map((training, index) => (
              <Card
                key={training.id}
                className={cn(
                  "animate-slide-up",
                  index === 0 && "ring-2 ring-primary/20"
                )}
              >
                <div className="flex gap-3">
                  {/* Datum Badge */}
                  <div
                    className="flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0"
                    style={{
                      backgroundColor: `${training.team?.color || "#ec4899"}20`,
                      color: training.team?.color || "#ec4899",
                    }}
                  >
                    <span className="text-[10px] font-medium uppercase">
                      {new Date(training.date).toLocaleDateString("de-DE", {
                        weekday: "short",
                      })}
                    </span>
                    <span className="text-xl font-bold leading-none">
                      {new Date(training.date).getDate()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold truncate">{training.title}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => addToCalendar(training.title, training.date, training.time, training.location)}
                          className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                          title="Zum Kalender hinzufügen"
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </button>
                        <RelativeDateBadge date={training.date} />
                      </div>
                    </div>

                    {/* Training Typ Badge */}
                    {training.type && (
                      <div className="mt-1.5">
                        <Badge variant="outline" size="sm">
                          <Dumbbell className="w-3 h-3 mr-1" />
                          {training.type}
                        </Badge>
                      </div>
                    )}

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{training.time} Uhr</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{training.location}</span>
                      </div>
                      {training.trainer && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{training.trainer}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span>Max. {training.maxParticipants} Teilnehmer</span>
                      </div>
                    </div>

                    {/* Beschreibung */}
                    {training.description && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-start gap-1.5 text-sm">
                          <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                          <TrainingDescription 
                            trainingId={training.id}
                            description={training.description}
                          />
                        </div>
                      </div>
                    )}

                    {/* Zu-/Absage Buttons */}
                    <ResponseButtons
                      trainingId={training.id}
                      memberId={member.id}
                      currentStatus={attendanceMap[training.id]}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Vergangene Trainings */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          Vergangene Trainings
        </h2>

        {pastTrainings.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Keine vergangenen Trainings"
            description="Noch keine Trainings abgeschlossen."
          />
        ) : (
          <div className="space-y-2">
            {pastTrainings.slice(-3).reverse().map((training) => {
              const attendance = getAttendanceInfo(attendanceMap[training.id]);
              const AttendanceIcon = attendance?.icon;

              return (
                <Card key={training.id} padding="sm" className="opacity-80">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {training.title}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(training.date)} · {training.time} Uhr
                      </p>
                    </div>

                    {attendance && AttendanceIcon && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <AttendanceIcon
                          className={cn("w-4 h-4", attendance.color)}
                        />
                        <Badge variant={attendance.variant} size="sm">
                          {attendance.label}
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// Cached Training Description Component
function TrainingDescription({ trainingId, description }: { trainingId: number; description: string }) {
  const { content } = useVersionedContent({
    key: `training-desc-${trainingId}`,
    version: description.slice(0, 20),
    fetcher: async () => description,
    ttl: 1000 * 60 * 60 * 24,
  });
  const [expanded, setExpanded] = useState(false);
  const text = content || description;
  const maxLength = 180;
  const isLong = text.length > maxLength;
  return (
    <div className="text-muted-foreground">
      <span>
        {isLong && !expanded ? text.slice(0, maxLength) + "..." : text}
      </span>
      {isLong && (
        <button
          className="ml-2 text-primary underline text-xs"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Weniger anzeigen" : "Mehr anzeigen"}
        </button>
      )}
    </div>
  );
}
