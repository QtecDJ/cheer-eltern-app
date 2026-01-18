"use client";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Poll, PollData } from "@/components/ui/poll";
import { cn, getRelativeDate } from "@/lib/utils";
import { votePoll, removePollVote } from "./poll-actions";
import {
  acceptEvent,
  declineEvent,
  acceptCompetition,
  declineCompetition,
} from "./rsvp-actions";
import {
  acceptAnnouncement,
  declineAnnouncement,
  removeAnnouncementRSVP,
} from "./announcement-rsvp-actions";
import {
  CalendarDays,
  Clock,
  MapPin,
  Trophy,
  PartyPopper,
  Sparkles,
  Bell,
  Star,
  Check,
  X,
  Users,
  CalendarPlus,
} from "lucide-react";
import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useVersionedContent } from "@/lib/use-versioned-content";

// Funktion zum Hinzufügen zum Kalender (iOS und Android)
function addToCalendar(title: string, date: string, time: string, location: string) {
  // Erstelle ICS-Datei für Kalender
  const [hours, minutes] = time.replace(' Uhr', '').split(':');
  const startDate = new Date(date);
  startDate.setHours(parseInt(hours), parseInt(minutes), 0);
  
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 2); // 2 Stunden Event
  
  const formatICSDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ICA Cheer//Event//DE',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:Event - ${title}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Event beginnt in 30 Minuten',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  
  // Erstelle Blob und Download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `event-${date}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Funktion zum Hinzufügen zum Kalender für Ankündigungen (ganztägig)
function addToCalendarAllDay(title: string, description: string) {
  // Erstelle ICS-Datei für Kalender (ganztägiges Event)
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ICA Cheer//Announcement//DE',
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${dateStr}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    'STATUS:TENTATIVE',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  
  // Erstelle Blob und Download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ankuendigung-${dateStr}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Funktion um URLs im Text klickbar zu machen
function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

interface Participant {
  id: number;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
}

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  status: string;
  description: string | null;
  participants: Participant[];
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
  participants: Participant[];
}

interface EventAnnouncement {
  id: number;
  title: string;
  content: string;
  category: string;
  priority: string;
  isPinned: boolean;
  allowRsvp: boolean | null;
  createdAt: Date;
  expiresAt: Date | null;
  poll: PollData | null;
  rsvp: {
    acceptedCount: number;
    declinedCount: number;
    myStatus: string | null;
  };
}

interface EventsContentProps {
  events: Event[];
  competitions: Competition[];
  eventAnnouncements?: EventAnnouncement[];
  memberId: number;
}

export function EventsContent({ events, competitions, eventAnnouncements = [], memberId }: EventsContentProps) {
  const today = new Date().toISOString().split("T")[0];
  const [isPending, startTransition] = useTransition();
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<number>>(new Set());
  const searchParams = useSearchParams();

  // Auto-expand announcement from URL parameter
  useEffect(() => {
    const announcementId = searchParams.get('announcement');
    if (announcementId) {
      const id = parseInt(announcementId);
      if (!isNaN(id)) {
        setExpandedAnnouncements(new Set([id]));
        // Scroll to announcement after a short delay
        setTimeout(() => {
          const element = document.getElementById(`announcement-${id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, [searchParams]);

  // Toggle Announcement Expand/Collapse
  const toggleAnnouncement = (id: number) => {
    setExpandedAnnouncements((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Handler für Poll-Abstimmung
  const handleVote = async (pollId: number, optionIds: number[]) => {
    await votePoll(pollId, optionIds, memberId);
  };

  // Handler für Stimme zurückziehen
  const handleRemoveVote = async (pollId: number) => {
    await removePollVote(pollId, memberId);
  };

  // Handler für Event-Zusage
  const handleAcceptEvent = (eventId: number) => {
    setLoadingItem(`event-${eventId}`);
    startTransition(async () => {
      const result = await acceptEvent(eventId, memberId);
      if (!result.success) {
        alert(result.error);
      }
      setLoadingItem(null);
    });
  };

  // Handler für Event-Absage
  const handleDeclineEvent = (eventId: number) => {
    setLoadingItem(`event-${eventId}`);
    startTransition(async () => {
      const result = await declineEvent(eventId, memberId);
      if (!result.success) {
        alert(result.error);
      }
      setLoadingItem(null);
    });
  };

  // Handler für Competition-Zusage
  const handleAcceptCompetition = (competitionId: number) => {
    setLoadingItem(`competition-${competitionId}`);
    startTransition(async () => {
      const result = await acceptCompetition(competitionId, memberId);
      if (!result.success) {
        alert(result.error);
      }
      setLoadingItem(null);
    });
  };

  // Handler für Competition-Absage
  const handleDeclineCompetition = (competitionId: number) => {
    setLoadingItem(`competition-${competitionId}`);
    startTransition(async () => {
      const result = await declineCompetition(competitionId, memberId);
      if (!result.success) {
        alert(result.error);
      }
      setLoadingItem(null);
    });
  };

  // Handler für Announcement-Zusage
  const handleAcceptAnnouncement = (announcementId: number) => {
    setLoadingItem(`announcement-${announcementId}`);
    startTransition(async () => {
      const result = await acceptAnnouncement(announcementId, memberId);
      if (!result.success) {
        alert(result.error);
      }
      setLoadingItem(null);
    });
  };

  // Handler für Announcement-Absage
  const handleDeclineAnnouncement = (announcementId: number) => {
    setLoadingItem(`announcement-${announcementId}`);
    startTransition(async () => {
      const result = await declineAnnouncement(announcementId, memberId);
      if (!result.success) {
        alert(result.error);
      }
      setLoadingItem(null);
    });
  };

  // Handler für Announcement-RSVP zurückziehen
  const handleRemoveAnnouncementRSVP = (announcementId: number) => {
    setLoadingItem(`announcement-${announcementId}`);
    startTransition(async () => {
      const result = await removeAnnouncementRSVP(announcementId, memberId);
      if (!result.success) {
        alert(result.error);
      }
      setLoadingItem(null);
    });
  };

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

  // Sortiere Announcements: Angepinnte UND wichtige zuerst, dann angepinnte, dann wichtige, dann nach Datum
  const sortedAnnouncements = [...eventAnnouncements].sort((a, b) => {
    const aIsPinnedAndImportant = a.isPinned && a.priority === "high";
    const bIsPinnedAndImportant = b.isPinned && b.priority === "high";
    
    // Beide angepinnt UND wichtig -> nach Datum
    if (aIsPinnedAndImportant && bIsPinnedAndImportant) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    
    // Nur a ist angepinnt UND wichtig -> a zuerst
    if (aIsPinnedAndImportant && !bIsPinnedAndImportant) return -1;
    
    // Nur b ist angepinnt UND wichtig -> b zuerst
    if (!aIsPinnedAndImportant && bIsPinnedAndImportant) return 1;
    
    // Keiner ist beides -> sortiere nach isPinned, dann nach priority, dann nach Datum
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    if (a.priority === "high" && b.priority !== "high") return -1;
    if (a.priority !== "high" && b.priority === "high") return 1;
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const hasNoItems = allItems.length === 0 && eventAnnouncements.length === 0;
  const router = useRouter();

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4 max-w-lg md:max-w-none mx-auto">
      {/* Header */}
      <header className="mb-6 md:mb-8 animate-fade-in">
        <button onClick={() => router.back()} className="text-primary text-sm mb-2 hover:underline md:hidden">
          ← Zurück
        </button>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Events & Wettkämpfe</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
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
                {sortedAnnouncements.map((announcement) => {
                  const isLoading = loadingItem === `announcement-${announcement.id}`;
                  const hasExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date();
                  const isExpanded = expandedAnnouncements.has(announcement.id);

                  return (
                  <article
                    id={`announcement-${announcement.id}`}
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
                      {/* Klickbarer Header */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleAnnouncement(announcement.id)}
                        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") toggleAnnouncement(announcement.id); }}
                        className="w-full text-left hover:opacity-80 transition-opacity cursor-pointer outline-none"
                      >
                        {/* Header mit Badges */}
                        <div className="flex flex-wrap items-start gap-2 mb-3">
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
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-xl font-bold text-foreground leading-tight flex-1">
                            {announcement.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            {announcement.category?.toLowerCase() !== "news" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCalendarAllDay(announcement.title, announcement.content);
                                }}
                                className="p-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors shrink-0"
                                title="Zum Kalender hinzufügen"
                              >
                                <CalendarPlus className="w-4 h-4" />
                              </button>
                            )}
                            <svg
                              className={cn(
                                "w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200",
                                isExpanded && "rotate-180"
                              )}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Ausklappbarer Content */}
                      {isExpanded && (
                        <div className="mt-4">
                          {/* Vollständiger Inhalt */}
                          <div className="prose prose-sm max-w-none mb-4">
                            <p className="text-[15px] text-foreground/85 leading-[1.7] whitespace-pre-wrap m-0">
                              {linkifyText(announcement.content)}
                            </p>
                          </div>

                          {/* Poll (Umfrage) */}
                          {announcement.poll && (
                            <Poll
                              poll={announcement.poll}
                              memberId={memberId}
                              onVote={handleVote}
                            onRemoveVote={handleRemoveVote}
                          />
                        )}

                        {/* RSVP-Sektion (Zu-/Absagen) */}
                        {announcement.allowRsvp && (
                          <div className="mt-5 pt-4 border-t border-border/60">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              {/* RSVP-Statistik */}
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5">
                                  <Check className="w-4 h-4 text-emerald-500" />
                                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                    {announcement.rsvp.acceptedCount} Zusagen
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <X className="w-4 h-4 text-red-500" />
                                  <span className="font-medium text-red-600 dark:text-red-400">
                                    {announcement.rsvp.declinedCount} Absagen
                                  </span>
                                </div>
                              </div>

                              {/* RSVP-Buttons */}
                              {!hasExpired && (
                                <div className="flex items-center gap-2">
                                  {announcement.rsvp.myStatus === "accepted" ? (
                                    <>
                                      <Badge variant="success" size="sm" className="gap-1">
                                        <Check className="w-3 h-3" />
                                        Zugesagt
                                      </Badge>
                                      <button
                                        onClick={() => handleRemoveAnnouncementRSVP(announcement.id)}
                                        disabled={isLoading || isPending}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {isLoading ? "..." : "Zurückziehen"}
                                      </button>
                                    </>
                                  ) : announcement.rsvp.myStatus === "declined" ? (
                                    <>
                                      <Badge variant="danger" size="sm" className="gap-1">
                                        <X className="w-3 h-3" />
                                        Abgesagt
                                      </Badge>
                                      <button
                                        onClick={() => handleRemoveAnnouncementRSVP(announcement.id)}
                                        disabled={isLoading || isPending}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {isLoading ? "..." : "Zurückziehen"}
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleAcceptAnnouncement(announcement.id)}
                                        disabled={isLoading || isPending}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        {isLoading ? "..." : "Zusagen"}
                                      </button>
                                      <button
                                        onClick={() => handleDeclineAnnouncement(announcement.id)}
                                        disabled={isLoading || isPending}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                        {isLoading ? "..." : "Absagen"}
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

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
                      )}
                    </div>
                  </article>
                  );
                })}
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
                {upcomingItems.map((item, index) => {
                  const isParticipant = item.participants?.some((p) => p.id === memberId);
                  const participantCount = item.participants?.length || 0;
                  const isLoading = loadingItem === `${item.itemType}-${item.id}`;
                  const isPastEvent = item.date < today;

                  return (
                  <article
                    key={`${item.itemType}-${item.id}`}
                    className={cn(
                      "relative bg-card rounded-2xl border border-border overflow-hidden transition-all",
                      index === 0 && "ring-2 ring-primary/20 shadow-lg shadow-primary/5"
                    )}
                  >
                    <div className="p-4">
                      <div className="flex gap-4">
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
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => addToCalendar(item.title, item.date, item.time || '00:00', item.location)}
                                className="p-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors shrink-0"
                                title="Zum Kalender hinzufügen"
                              >
                                <CalendarPlus className="w-4 h-4" />
                              </button>
                              <Badge
                                variant={item.itemType === "competition" ? "warning" : "default"}
                                size="sm"
                                className="shrink-0"
                              >
                                {getRelativeDate(item.date)}
                              </Badge>
                            </div>
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
                            <EventDescription 
                              eventId={item.id} 
                              description={item.description}
                            />
                          )}

                          {/* Kategorie Badge */}
                          {item.itemType === "competition" && (
                            <Badge variant="outline" size="sm" className="mt-3">
                              {(item as Competition).category}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Teilnehmer und Zu-/Absage Section */}
                      <div className="mt-4 pt-4 border-t border-border/60">
                        <div className="flex items-center justify-between gap-3">
                          {/* Teilnehmer-Anzeige */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4 shrink-0" />
                            <span className="font-medium">
                              {participantCount} {participantCount === 1 ? "Teilnehmer" : "Teilnehmer"}
                            </span>
                          </div>

                          {/* Zu-/Absage Buttons - nur für anstehende Events */}
                          {!isPastEvent && (
                            <div className="flex items-center gap-2">
                              {isParticipant ? (
                                <>
                                  <Badge variant="success" size="sm" className="gap-1">
                                    <Check className="w-3 h-3" />
                                    Zugesagt
                                  </Badge>
                                  <button
                                    onClick={() =>
                                      item.itemType === "event"
                                        ? handleDeclineEvent(item.id)
                                        : handleDeclineCompetition(item.id)
                                    }
                                    disabled={isLoading || isPending}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    {isLoading ? "..." : "Absagen"}
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() =>
                                    item.itemType === "event"
                                      ? handleAcceptEvent(item.id)
                                      : handleAcceptCompetition(item.id)
                                  }
                                  disabled={isLoading || isPending}
                                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  {isLoading ? "..." : "Zusagen"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                  );
                })}
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

// Cached Event Description Component
function EventDescription({ eventId, description }: { eventId: number; description: string }) {
  const { content } = useVersionedContent({
    key: `event-desc-${eventId}`,
    version: description.slice(0, 20), // Ersten 20 Zeichen als Version-Hint
    fetcher: async () => description,
    ttl: 1000 * 60 * 60 * 24, // 24h Cache
  });

  return (
    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
      {content || description}
    </p>
  );
}
