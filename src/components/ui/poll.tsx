"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Check, Clock, Users } from "lucide-react";

// Interface für Poll-Option
export interface PollOptionData {
  id: number;
  text: string;
  voteCount: number;
  percentage: number;
  isSelected: boolean;
  voters: {
    id: number;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  }[];
}

// Interface für Poll
export interface PollData {
  id: number;
  question: string;
  allowMultiple: boolean;
  isAnonymous: boolean;
  endsAt: Date | null;
  totalVotes: number;
  hasVoted: boolean;
  options: PollOptionData[];
}

interface PollProps {
  poll: PollData;
  memberId: number;
  onVote: (pollId: number, optionIds: number[]) => Promise<void>;
  onRemoveVote?: (pollId: number) => Promise<void>;
}

// memberId wird für zukünftige Erweiterungen und externe Abfragen benötigt
export function Poll({ poll, memberId: _memberId, onVote, onRemoveVote }: PollProps) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>(
    poll.options.filter((o) => o.isSelected).map((o) => o.id)
  );
  const [isPending, startTransition] = useTransition();
  const [hasVoted, setHasVoted] = useState(poll.hasVoted);

  const isExpired = poll.endsAt && new Date(poll.endsAt) < new Date();
  const canVote = !isExpired;

  // Handle Option-Klick
  const handleOptionClick = (optionId: number) => {
    if (!canVote || isPending) return;

    // Falls bereits abgestimmt, zeige nur Ergebnisse
    if (hasVoted) return;

    if (poll.allowMultiple) {
      // Mehrfachauswahl: Toggle Option
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      // Einzelauswahl: Direkt abstimmen
      startTransition(async () => {
        await onVote(poll.id, [optionId]);
        setSelectedOptions([optionId]);
        setHasVoted(true);
      });
    }
  };

  // Handle Mehrfach-Abstimmung bestätigen
  const handleConfirmVote = () => {
    if (selectedOptions.length === 0 || isPending) return;

    startTransition(async () => {
      await onVote(poll.id, selectedOptions);
      setHasVoted(true);
    });
  };

  // Handle Stimme zurückziehen
  const handleRemoveVote = () => {
    if (!onRemoveVote || isPending) return;

    startTransition(async () => {
      await onRemoveVote(poll.id);
      setSelectedOptions([]);
      setHasVoted(false);
    });
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/30 overflow-hidden">
      {/* Frage */}
      <div className="p-4 border-b border-border/50">
        <h4 className="font-semibold text-[15px]">{poll.question}</h4>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {poll.allowMultiple && (
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Mehrfachauswahl
            </span>
          )}
          {poll.isAnonymous && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Anonym
            </span>
          )}
          {poll.endsAt && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {isExpired
                ? "Beendet"
                : `Endet ${new Date(poll.endsAt).toLocaleDateString("de-DE")}`}
            </span>
          )}
        </div>
      </div>

      {/* Optionen */}
      <div className="p-4 space-y-3">
        {poll.options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);
          const showResults = hasVoted || isExpired;

          return (
            <div key={option.id}>
              <button
                onClick={() => handleOptionClick(option.id)}
                disabled={isPending || (hasVoted && !poll.allowMultiple)}
                className={cn(
                  "w-full relative rounded-lg transition-all text-left",
                  !showResults && "p-3 border border-border bg-background hover:border-primary/50",
                  showResults && "overflow-hidden",
                  isSelected && !showResults && "border-primary bg-primary/5",
                  isPending && "opacity-50 cursor-wait"
                )}
              >
                {showResults ? (
                  // Ergebnis-Ansicht mit Fortschrittsbalken
                  <div className="relative">
                    {/* Hintergrund-Balken */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-lg transition-all duration-500",
                        option.isSelected
                          ? "bg-emerald-500/20"
                          : "bg-primary/10"
                      )}
                      style={{ width: `${option.percentage}%` }}
                    />
                    {/* Inhalt */}
                    <div className="relative p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {option.isSelected && (
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                        <span className={cn(
                          "text-sm",
                          option.isSelected && "font-medium"
                        )}>
                          {option.text}
                        </span>
                      </div>
                      <span className="text-sm font-medium shrink-0">
                        {option.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  // Abstimmungs-Ansicht
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 transition-all",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </span>
                    <span className="text-sm">{option.text}</span>
                  </div>
                )}
              </button>

              {/* Voters (nur bei nicht-anonymen Umfragen) */}
              {showResults && !poll.isAnonymous && option.voters.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5 ml-3">
                  <div className="flex -space-x-2">
                    {option.voters.slice(0, 5).map((voter) => (
                      <div
                        key={voter.id}
                        className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium"
                        title={`${voter.firstName} ${voter.lastName}`}
                      >
                        {voter.firstName[0]}
                        {voter.lastName[0]}
                      </div>
                    ))}
                    {option.voters.length > 5 && (
                      <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium">
                        +{option.voters.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer mit Aktionen */}
      <div className="px-4 pb-4 space-y-2">
        {/* Mehrfach-Abstimmung bestätigen */}
        {poll.allowMultiple && !hasVoted && !isExpired && selectedOptions.length > 0 && (
          <button
            onClick={handleConfirmVote}
            disabled={isPending}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? "Wird gesendet..." : "Abstimmen"}
          </button>
        )}

        {/* Stimme zurückziehen */}
        {hasVoted && canVote && onRemoveVote && (
          <button
            onClick={handleRemoveVote}
            disabled={isPending}
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isPending ? "Wird entfernt..." : "Stimme zurückziehen"}
          </button>
        )}

        {/* Gesamt-Stimmen */}
        <p className="text-center text-xs text-muted-foreground">
          {poll.totalVotes} {poll.totalVotes === 1 ? "Stimme" : "Stimmen"}
        </p>
      </div>
    </div>
  );
}
