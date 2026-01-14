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
  Check,
  X,
  Loader2,
  FileText,
  Dumbbell,
  MessageSquare,
} from "lucide-react";
import { respondToTraining, ResponseStatus } from "./actions";
import { useRouter } from "next/navigation";
import { useVersionedContent } from "@/lib/use-versioned-content";

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

// Response Button Komponente mit Dialog für Absage-Begründung
function ResponseButtons({
  trainingId,
  memberId,
  currentStatus,
}: {
  trainingId: number;
  memberId: number;
  currentStatus: string | undefined;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<string | undefined>(currentStatus);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [reason, setReason] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (showReasonDialog) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [showReasonDialog]);

  const handleResponse = (status: ResponseStatus, reasonText?: string) => {
    setOptimisticStatus(status === "confirmed" ? "present" : "excused");
    startTransition(async () => {
      await respondToTraining(memberId, trainingId, status, reasonText);
    });
  };

  const handleDeclineClick = () => {
    setShowReasonDialog(true);
  };

  const handleReasonSubmit = () => {
    if (reason.trim()) {
      setShowReasonDialog(false);
      handleResponse("declined", reason.trim());
      setReason("");
    }
  };

  const handleDialogClose = () => {
    setShowReasonDialog(false);
    setReason("");
  };

  const isConfirmed = optimisticStatus === "present" || optimisticStatus === "confirmed";
  const isDeclined = optimisticStatus === "excused" || optimisticStatus === "declined" || optimisticStatus === "absent";

  return (
    <>
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">Teilnahme:</span>
        
        <div className="flex-1 flex items-center justify-center gap-2">
          <button
            onClick={() => handleResponse("confirmed")}
            disabled={isPending}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
              isConfirmed
                ? "bg-emerald-500 text-white"
                : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
              isPending && "opacity-50 cursor-not-allowed"
            )}
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Zusagen
          </button>

          <button
            onClick={handleDeclineClick}
            disabled={isPending}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
              isDeclined
                ? "bg-red-500 text-white"
                : "bg-red-500/10 text-red-600 hover:bg-red-500/20",
              isPending && "opacity-50 cursor-not-allowed"
            )}
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
            Absagen
          </button>
        </div>
      </div>

      {/* Dialog für Absage-Begründung */}
      <dialog
        ref={dialogRef}
        className="backdrop:bg-black/50 rounded-xl p-0 max-w-sm w-full mx-auto shadow-xl"
        onClose={handleDialogClose}
      >
        <div className="p-4 bg-card text-card-foreground rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold">Absage-Begründung</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Bitte gib einen Grund für die Absage an:
          </p>

          {/* Textfeld */}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Grund eingeben..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-4 resize-none"
            autoFocus
          />

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleDialogClose}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleReasonSubmit}
              disabled={!reason.trim()}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                reason.trim()
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-red-500/50 text-white/70 cursor-not-allowed"
              )}
            >
              Absagen
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
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
                      <RelativeDateBadge date={training.date} />
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
            {pastTrainings.map((training) => {
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
    version: description.slice(0, 20), // Ersten 20 Zeichen als Version-Hint
    fetcher: async () => description,
    ttl: 1000 * 60 * 60 * 24, // 24h Cache
  });

  return (
    <p className="text-muted-foreground">
      {content || description}
    </p>
  );
}
