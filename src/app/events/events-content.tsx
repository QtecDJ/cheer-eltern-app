"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, getRelativeDate } from "@/lib/utils";
import {
  CalendarDays,
  Clock,
  MapPin,
  Trophy,
  PartyPopper,
  Sparkles,
  Bell,
  Star,
} from "lucide-react";

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  status: string;
  description: string | null;
}

interface Competition {
  id: number;
  title: string;
  date: string;
  location: string;
  category: string;
  status: string;
  rank: number | null;
  score: number | null;
}

interface EventAnnouncement {
  id: number;
  title: string;
  content: string;
  category: string;
  priority: string;
  isPinned: boolean;
  createdAt: Date;
  expiresAt: Date | null;
}

interface EventsContentProps {
  events: Event[];
  competitions: Competition[];
  eventAnnouncements?: EventAnnouncement[];
}

export function EventsContent({ events, competitions, eventAnnouncements = [] }: EventsContentProps) {
  const today = new Date().toISOString().split("T")[0];

  // Kombiniere und sortiere alle Termine
  const allItems = [
    ...events.map((e) => ({ ...e, itemType: "event" as const })),
    ...competitions.map((c) => ({
      ...c,
      itemType: "competition" as const,
      time: "TBA",
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const upcomingItems = allItems.filter((item) => item.date >= today);
  const pastItems = allItems.filter((item) => item.date < today).reverse();

  const hasNoItems = allItems.length === 0 && eventAnnouncements.length === 0;

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Events & Wettkämpfe</h1>
        <p className="text-muted-foreground mt-1">
          Alle wichtigen Termine im Überblick
        </p>
      </header>

      {hasNoItems ? (
        <EmptyState
          icon={CalendarDays}
          title="Keine Termine"
          description="Aktuell sind keine Events oder Wettkämpfe geplant."
        />
      ) : (
        <>
          {/* Event-Ankündigungen */}
          {eventAnnouncements.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                <Bell className="w-5 h-5 text-pink-500" />
                Ankündigungen
              </h2>

              <div className="space-y-5">
                {eventAnnouncements.map((announcement) => (
                  <article
                    key={`announcement-${announcement.id}`}
                    className={cn(
                      "relative bg-card rounded-2xl border border-border overflow-hidden transition-all",
                      announcement.priority === "high" && "border-pink-500/40 shadow-lg shadow-pink-500/5"
                    )}
                  >
                    {/* Prioritäts-Indikator */}
                    {announcement.priority === "high" && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500" />
                    )}

                    <div className="p-5">
                      {/* Header mit Badges */}
                      <div className="flex flex-wrap items-start gap-2 mb-4">
                        {announcement.priority === "high" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-600 text-xs font-medium">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            Wichtig
                          </span>
                        )}
                        {announcement.isPinned && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium">
                            📌 Angepinnt
                          </span>
                        )}
                      </div>

                      {/* Titel */}
                      <h3 className="text-xl font-bold text-foreground mb-3 leading-tight">
                        {announcement.title}
                      </h3>

                      {/* Inhalt */}
                      <div className="prose prose-sm max-w-none">
                        <p className="text-[15px] text-foreground/85 leading-[1.7] whitespace-pre-wrap m-0">
                          {announcement.content}
                        </p>
                      </div>

                      {/* Meta-Info Footer */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-5 pt-4 border-t border-border/60 text-xs text-muted-foreground">
                        <span>
                          Erstellt am {new Date(announcement.createdAt).toLocaleDateString("de-DE", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        {announcement.expiresAt && (
                          <span>
                            · Gültig bis {new Date(announcement.expiresAt).toLocaleDateString("de-DE", {
                              day: "numeric",
                              month: "long",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Anstehende Events */}
          {upcomingItems.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Anstehende Termine
              </h2>

              <div className="space-y-4">
                {upcomingItems.map((item, index) => (
                  <article
                    key={`${item.itemType}-${item.id}`}
                    className={cn(
                      "relative bg-card rounded-2xl border border-border overflow-hidden transition-all",
                      index === 0 && "ring-2 ring-primary/20 shadow-lg shadow-primary/5"
                    )}
                  >
                    <div className="flex gap-4 p-4">
                      {/* Datum Badge - größer und prominenter */}
                      <div
                        className={cn(
                          "flex flex-col items-center justify-center w-16 h-16 rounded-xl shrink-0 font-bold",
                          item.itemType === "competition"
                            ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400"
                            : "bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400"
                        )}
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-wide">
                          {new Date(item.date).toLocaleDateString("de-DE", {
                            weekday: "short",
                          })}
                        </span>
                        <span className="text-2xl font-bold leading-none">
                          {new Date(item.date).getDate()}
                        </span>
                        <span className="text-[10px] font-medium uppercase mt-0.5">
                          {new Date(item.date).toLocaleDateString("de-DE", {
                            month: "short",
                          })}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 py-1">
                        {/* Titel und Badge */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {item.itemType === "competition" ? (
                              <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                            ) : (
                              <PartyPopper className="w-5 h-5 text-purple-500 shrink-0" />
                            )}
                            <h3 className="text-base font-bold truncate">
                              {item.title}
                            </h3>
                          </div>
                          <Badge
                            variant={item.itemType === "competition" ? "warning" : "default"}
                            size="sm"
                            className="shrink-0"
                          >
                            {getRelativeDate(item.date)}
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5">
                          {item.time && item.time !== "TBA" && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4 shrink-0" />
                              <span>{item.time} Uhr</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        </div>

                        {/* Beschreibung */}
                        {item.itemType === "event" && item.description && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        {/* Kategorie Badge */}
                        {item.itemType === "competition" && (
                          <Badge variant="outline" size="sm" className="mt-3">
                            {(item as Competition).category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Vergangene Events */}
          {pastItems.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5" />
                Vergangene Termine
              </h2>

              <div className="space-y-3">
                {pastItems.slice(0, 5).map((item) => (
                  <article
                    key={`${item.itemType}-${item.id}`}
                    className="bg-card/50 rounded-xl border border-border/50 p-4 hover:bg-card transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.itemType === "competition" ? (
                          <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                        ) : (
                          <PartyPopper className="w-5 h-5 text-purple-500 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(item.date).toLocaleDateString("de-DE", {
                              weekday: "short",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      {item.itemType === "competition" &&
                        (item as Competition).rank && (
                          <Badge variant="success" size="sm">
                            🏆 Platz {(item as Competition).rank}
                          </Badge>
                        )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
