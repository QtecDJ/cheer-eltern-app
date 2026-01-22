"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Loader2, Check, X, MessageSquare } from "lucide-react";
import { respondToTraining, ResponseStatus } from "@/app/training/actions";

export function ResponseButtons({
  trainingId,
  memberId,
  currentStatus,
  onStatusChange,
}: {
  trainingId: number;
  memberId: number;
  currentStatus: string | null | undefined;
  onStatusChange?: (newStatus: string | null) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<string | null | undefined>(currentStatus);
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

  // Keep optimisticStatus in sync when parent updates currentStatus
  useEffect(() => {
    setOptimisticStatus(currentStatus);
  }, [currentStatus]);

  const router = useRouter();

  const handleResponse = (status: ResponseStatus, reasonText?: string) => {
    const previousStatus = optimisticStatus;
    setOptimisticStatus(status === "confirmed" ? "present" : "excused");

    startTransition(async () => {
      const res = await respondToTraining(memberId, trainingId, status, reasonText);
      if (!res || !res.success) {
        // Revert optimistic state silently on error
        setOptimisticStatus(previousStatus);
      } else {
        // Update parent/local map immediately (no logging)
        const newStatus = status === "confirmed" ? "present" : status === "declined" ? "excused" : "pending";
        onStatusChange?.(newStatus);

        // Refresh server components to pick up revalidated data
        router.refresh();
      }
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

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Grund eingeben..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-4 resize-none"
            autoFocus
          />

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
