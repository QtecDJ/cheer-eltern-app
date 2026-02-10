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
  AlertCircle,
  Megaphone,
  Info,
} from "lucide-react";
import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useVersionedContent } from "@/lib/use-versioned-content";

// Convert Markdown links to HTML links
function convertMarkdownLinks(html: string): string {
  // Don't process if there are already HTML links
  if (html.includes('<a href=')) {
    return html;
  }
  
  let result = html;
  
  // Match markdown links: [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  result = result.replace(markdownLinkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline; cursor: pointer;">$1</a>');
  
  // Also convert plain URLs to clickable links (but not inside already created <a> tags)
  // Match http:// or https:// followed by non-whitespace characters
  const urlRegex = /(?<!href=["'])(https?:\/\/[^\s<]+)/g;
  result = result.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline; cursor: pointer;">$1</a>');
  
  return result;
}

// Process HTML content to make links clickable and safe
function processAnnouncementHTML(html: string): string {
  if (typeof window === 'undefined') return html;
  
  // First convert any markdown links
  let processedHtml = convertMarkdownLinks(html);
  
  const div = document.createElement('div');
  div.innerHTML = processedHtml;
  
  // Find all links and add target="_blank" and rel attributes
  const links = div.querySelectorAll('a');
  links.forEach(link => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    link.style.pointerEvents = 'auto'; // Ensure links are clickable
  });
  
  return div.innerHTML;
}

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

// Simple address detection helpers: look for street keywords or a house number
function looksLikeAddress(s?: string | null) {
  if (!s) return false;
  const str = s.toString();
  const streetKeywords = /strasse|straße|str\.|weg|platz|allee|ring|gasse|straße|allee|ring/i;
  return /\d/.test(str) || streetKeywords.test(str);
}

function extractAddressFromText(s?: string | null) {
  if (!s) return null;
  const str = s.toString();
  // Try to capture common patterns like 'Musterstraße 12' or 'Muster Str. 12'
  const m = str.match(/[A-Za-zÄÖÜäöüß\.\-\s]{3,60}\s\d{1,4}[a-zA-Z]?/);
  return m ? m[0].trim() : null;
}

function mapsDirectionLink(address: string) {
  const encoded = encodeURIComponent(address);
  if (typeof navigator !== "undefined") {
    const ua = (navigator.userAgent || "").toLowerCase();
    const platform = (navigator.platform || "").toLowerCase();
    const isAndroid = /android/.test(ua);
    const isIOS = /iphone|ipad|ipod/.test(ua) || (/mac/.test(platform) && 'ontouchend' in window);

    // iOS: open Apple Maps
    if (isIOS) {
      return `maps://?daddr=${encoded}`;
    }

    // Android: use geo: URI to open preferred maps/navigation app
    if (isAndroid) {
      return `geo:0,0?q=${encoded}`;
    }
  }

  // Fallback: Google Maps web directions
  return `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
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
  imageUrl?: string | null;
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
  showUpcoming?: boolean;
  showVoterNames?: boolean;
}

// Helper: group announcements by category
function groupAnnouncementsByCategory(announcements: EventAnnouncement[]) {
  const map = new Map<string, EventAnnouncement[]>();
  for (const a of announcements) {
    const key = (a.category || 'Allgemein').toString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return map;
}

export function EventsContent({ events, competitions, eventAnnouncements = [], memberId, showUpcoming = true, showVoterNames = false }: EventsContentProps) {
  const today = new Date().toISOString().split("T")[0];
  const [isPending, startTransition] = useTransition();
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'wichtig' | 'events' | 'news' | 'info'>('wichtig');
  const searchParams = useSearchParams();

  // Auto-expand announcement from URL parameter and select correct tab
  useEffect(() => {
    const announcementId = searchParams.get('announcement');
    if (announcementId) {
      const id = parseInt(announcementId);
      if (!isNaN(id)) {
        setExpandedAnnouncements(new Set([id]));
        
        // Find announcement and set correct tab
        const announcement = eventAnnouncements.find(a => a.id === id);
        if (announcement) {
          if (announcement.priority === 'urgent' || announcement.priority === 'high' || announcement.isPinned) {
            setActiveTab('wichtig');
          } else if (announcement.category === 'event' || announcement.category === 'training') {
            setActiveTab('events');
          } else if (announcement.category === 'news') {
            setActiveTab('news');
          } else {
            setActiveTab('info');
          }
        }
        
        // Scroll to announcement after a short delay
        setTimeout(() => {
          const element = document.getElementById(`announcement-${id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, [searchParams, eventAnnouncements]);

  // Convert Markdown links and make all links clickable
  useEffect(() => {
    const announcementContents = document.querySelectorAll('[data-announcement-content]');
    announcementContents.forEach((content) => {
      // First, convert any markdown links in the text content
      const htmlContent = content.innerHTML;
      const convertedHtml = convertMarkdownLinks(htmlContent);
      if (htmlContent !== convertedHtml) {
        content.innerHTML = convertedHtml;
      }
      
      // Then process all links
      const links = content.querySelectorAll('a');
      links.forEach((link) => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        link.style.cursor = 'pointer';
        // Prevent parent click handler from being triggered
        link.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      });
    });
  }, [eventAnnouncements, expandedAnnouncements]);

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
  ];

  // Robust date parsing: prefer numeric timestamps but gracefully fall back
  // to string comparison when parsing fails. Include items with missing
  // or unparsable dates so they don't disappear from the list.
  const parseTs = (d: any) => {
    if (!d && d !== 0) return NaN;
    if (typeof d === "number") return d;
    const s = String(d).trim();

    // Try native parse first (ISO etc.)
    const native = Date.parse(s);
    if (!Number.isNaN(native)) return native;

    // DD.MM.YYYY
    const dmY = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dmY) {
      const dd = Number(dmY[1]);
      const mm = Number(dmY[2]);
      const yyyy = Number(dmY[3]);
      return new Date(yyyy, mm - 1, dd).getTime();
    }

    // DD.MM (assume current year)
    const dm = s.match(/^(\d{1,2})\.(\d{1,2})$/);
    if (dm) {
      const dd = Number(dm[1]);
      const mm = Number(dm[2]);
      const yyyy = new Date().getFullYear();
      return new Date(yyyy, mm - 1, dd).getTime();
    }

    return NaN;
  };

  allItems.sort((a, b) => {
    const ta = parseTs(a.date);
    const tb = parseTs(b.date);

    if (!Number.isNaN(ta) && !Number.isNaN(tb)) return ta - tb;
    if (Number.isNaN(ta) && Number.isNaN(tb)) return String(a.date).localeCompare(String(b.date));
    // Put valid dates before invalid/unparsable ones
    return Number.isNaN(ta) ? 1 : -1;
  });

  const todayTs = new Date(today).setHours(0, 0, 0, 0);

  let upcomingItems = allItems.filter((item) => {
    const ts = parseTs(item.date);
    return Number.isNaN(ts) ? true : ts >= todayTs;
  });

  let pastItems = allItems.filter((item) => {
    const ts = parseTs(item.date);
    return Number.isNaN(ts) ? false : ts < todayTs;
  });

  // Ensure upcoming items are sorted ascending (nearest first).
  upcomingItems.sort((a, b) => {
    const ta = parseTs(a.date);
    const tb = parseTs(b.date);
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return ta - tb;
  });

  // Ensure past items are sorted descending (most recent past first)
  // so that when displayed they read from newest past to oldest.
  pastItems.sort((a, b) => {
    const ta = parseTs(a.date);
    const tb = parseTs(b.date);
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return tb - ta;
  });

  // Filter Announcements nach aktivem Tab
  const filteredAnnouncements = eventAnnouncements.filter(a => {
    switch (activeTab) {
      case 'wichtig':
        return a.priority === 'urgent' || a.priority === 'high' || a.isPinned;
      case 'events':
        return a.category === 'event' || a.category === 'training';
      case 'news':
        return a.category === 'news';
      case 'info':
        return !['urgent', 'high'].includes(a.priority) &&
               !a.isPinned &&
               !['event', 'training', 'news'].includes(a.category);
      default:
        return true;
    }
  });

  // Sortiere Announcements: Angepinnte UND wichtige zuerst, dann angepinnte, dann wichtige, dann nach Datum
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
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
      <header className="mb-6 animate-fade-in">
        <button onClick={() => router.back()} className="text-primary text-sm mb-2 hover:underline md:hidden">
          ← Zurück
        </button>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Ankündigungen</h1>
      </header>

      {hasNoItems ? (
        <EmptyState
          icon={CalendarDays}
          title="Keine Termine"
          description="Aktuell sind keine Events oder Wettkämpfe geplant."
        />
      ) : (
        <>
          {/* Event-Ankündigungen mit Tabs */}
          {eventAnnouncements.length > 0 && (
            <section className="mb-10">
              {/* Tab Navigation */}
              <div className="grid grid-cols-4 gap-1.5 pb-2 mb-6">
                  {[
                    { 
                      id: 'wichtig' as const, 
                      label: 'Wichtig', 
                      icon: AlertCircle, 
                      color: 'red',
                      count: eventAnnouncements.filter(a => 
                        a.priority === 'urgent' || a.priority === 'high' || a.isPinned
                      ).length
                    },
                    { 
                      id: 'events' as const, 
                      label: 'Events', 
                      icon: PartyPopper, 
                      color: 'purple',
                      count: eventAnnouncements.filter(a => 
                        a.category === 'event' || a.category === 'training'
                      ).length
                    },
                    { 
                      id: 'news' as const, 
                      label: 'News', 
                      icon: Megaphone, 
                      color: 'blue',
                      count: eventAnnouncements.filter(a => a.category === 'news').length
                    },
                    { 
                      id: 'info' as const, 
                      label: 'Info', 
                      icon: Info, 
                      color: 'gray',
                      count: eventAnnouncements.filter(a => 
                        !['urgent', 'high'].includes(a.priority) &&
                        !a.isPinned &&
                        !['event', 'training', 'news'].includes(a.category)
                      ).length
                    },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    const colorClasses = {
                      red: isActive 
                        ? 'bg-red-100 text-red-700 border-red-200' 
                        : 'bg-card text-muted-foreground hover:bg-red-50 hover:text-red-600 border-border',
                      purple: isActive 
                        ? 'bg-purple-100 text-purple-700 border-purple-200' 
                        : 'bg-card text-muted-foreground hover:bg-purple-50 hover:text-purple-600 border-border',
                      blue: isActive 
                        ? 'bg-blue-100 text-blue-700 border-blue-200' 
                        : 'bg-card text-muted-foreground hover:bg-blue-50 hover:text-blue-600 border-border',
                      gray: isActive 
                        ? 'bg-muted text-foreground border-border' 
                        : 'bg-card text-muted-foreground hover:bg-muted/50 border-border',
                    };
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded text-[11px] font-medium transition-colors border ${
                          colorClasses[tab.color as keyof typeof colorClasses]
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="leading-tight">{tab.label}</span>
                        {tab.count > 0 && (
                          <span className="opacity-60 text-[10px]">
                            ({tab.count})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

              {filteredAnnouncements.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg border border-border">
                  <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-lg flex items-center justify-center">
                    {activeTab === 'wichtig' && <AlertCircle className="w-6 h-6 text-muted-foreground/50" />}
                    {activeTab === 'events' && <PartyPopper className="w-6 h-6 text-muted-foreground/50" />}
                    {activeTab === 'news' && <Megaphone className="w-6 h-6 text-muted-foreground/50" />}
                    {activeTab === 'info' && <Info className="w-6 h-6 text-muted-foreground/50" />}
                  </div>
                  <p className="text-sm font-semibold mb-1">Keine Ankündigungen</p>
                  <p className="text-xs text-muted-foreground">
                    In dieser Kategorie gibt es derzeit keine Ankündigungen
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                {Array.from(groupAnnouncementsByCategory(sortedAnnouncements)).map(([category, items]) => (
                  <div key={`cat-${category || 'uncategorized'}`} className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold">{category || "Allgemein"}</h3>
                    </div>
                    <div className="space-y-5">
                      {items.map((announcement) => {
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
                            {announcement.priority === "high" && (
                              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500" />
                            )}

                            <div className="p-5">
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => toggleAnnouncement(announcement.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") toggleAnnouncement(announcement.id);
                                }}
                                className="w-full text-left hover:opacity-80 transition-opacity cursor-pointer outline-none"
                              >
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

                              {isExpanded && (
                                <div className="mt-4">
                                  {announcement.imageUrl && (
                                    <div className="mb-4 rounded-lg overflow-hidden border-2 border-border">
                                      <img 
                                        src={announcement.imageUrl}
                                        alt={announcement.title}
                                        className="w-full h-auto object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  )}

                                  <div 
                                    className="prose prose-sm max-w-none mb-4 announcement-content"
                                    onClick={(e) => {
                                      // Allow links to be clicked without toggling the announcement
                                      if ((e.target as HTMLElement).tagName === 'A') {
                                        e.stopPropagation();
                                      }
                                    }}
                                  >
                                    <div 
                                      data-announcement-content
                                      className="text-[15px] text-foreground/85 leading-[1.7]"
                                      dangerouslySetInnerHTML={{ __html: announcement.content }}
                                    />
                                  </div>

                                  {announcement.poll && (
                                    <Poll
                                      poll={announcement.poll}
                                      memberId={memberId}
                                      onVote={handleVote}
                                      onRemoveVote={handleRemoveVote}
                                      showVoterNames={showVoterNames}
                                    />
                                  )}

                                  {announcement.allowRsvp && (
                                    <div className="mt-5 pt-4 border-t border-border/60">
                                      <div className="flex items-center justify-between gap-3 flex-wrap">
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
                  </div>
                ))}
                </div>
              )}
            </section>
          )}

          {/* Anstehende Events */}
          {showUpcoming && upcomingItems.length > 0 && (
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
                              {
                                (() => {
                                  const loc = (item.location && looksLikeAddress(item.location)) ? item.location : null;
                                  const descAddr = !loc && (item.itemType === "event" && item.description ? extractAddressFromText(item.description) : null);
                                  const address = (loc || descAddr) ? (loc || descAddr) : null;
                                  if (!address) return null;
                                  return (
                                    <a
                                      href={mapsDirectionLink(address)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 shrink-0"
                                      title={`Anfahrt planen: ${address}`}
                                    >
                                      <MapPin className="w-3.5 h-3.5" />
                                      Anfahrt
                                    </a>
                                  );
                                })()
                              }
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
