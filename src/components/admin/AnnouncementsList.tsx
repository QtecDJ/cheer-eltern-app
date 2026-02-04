"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell, Pin, Calendar, Users, BarChart3, Edit, Trash2, Eye, TrendingUp, ChevronRight, Sparkles, ChevronDown } from "lucide-react";
import AnnouncementResultsModal from "@/components/admin/AnnouncementResultsModal";

type Team = {
  id: number;
  name: string;
  color?: string;
};

type Announcement = {
  id: number;
  title: string;
  content: string;
  category: string;
  priority: string;
  isPinned: boolean;
  createdAt: string;
  expiresAt: string | null;
  allowRsvp: boolean;
  Member: { firstName?: string; lastName?: string; name?: string };
  Poll: any[];
  rsvps: any[];
  AnnouncementTeam: Array<{ teamId: number; Team: Team }>;
};

export default function AnnouncementsList({ currentUserId }: { currentUserId: number }) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<number | null>(null);
  const [selectedAnnouncementTitle, setSelectedAnnouncementTitle] = useState<string>("");
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    try {
      const res = await fetch('/api/admin/announcements');
      const data = await res.json();
      if (res.ok) {
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAnnouncement(id: number) {
    if (!confirm('Möchtest du diese Ankündigung wirklich löschen?')) return;
    
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAnnouncements(announcements.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'news': return 'bg-blue-500/20 border-blue-500/50 text-blue-600';
      case 'event': return 'bg-purple-500/20 border-purple-500/50 text-purple-600';
      case 'urgent': return 'bg-red-500/20 border-red-500/50 text-red-600';
      case 'training': return 'bg-green-500/20 border-green-500/50 text-green-600';
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 border-red-500/50 text-red-600';
      case 'high': return 'bg-orange-500/20 border-orange-500/50 text-orange-600';
      case 'normal': return 'bg-blue-500/20 border-blue-500/50 text-blue-600';
      case 'low': return 'bg-gray-500/20 border-gray-500/50 text-gray-600';
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-600';
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'pinned') return a.isPinned;
    if (filter === 'polls') return a.Poll && a.Poll.length > 0;
    if (filter === 'rsvp') return a.allowRsvp;
    return a.category === filter;
  });

  // Gruppiere Ankündigungen nach Teams
  const groupedByTeam = useMemo(() => {
    const groups: Record<string, { team: Team | null; announcements: Announcement[] }> = {};
    
    filteredAnnouncements.forEach(announcement => {
      if (announcement.AnnouncementTeam && announcement.AnnouncementTeam.length > 0) {
        // Ankündigung für spezifische Teams
        announcement.AnnouncementTeam.forEach(at => {
          const teamId = `team-${at.teamId}`;
          if (!groups[teamId]) {
            groups[teamId] = {
              team: at.Team,
              announcements: []
            };
          }
          groups[teamId].announcements.push(announcement);
        });
      } else {
        // Allgemeine Ankündigung (alle Teams)
        const generalKey = 'general';
        if (!groups[generalKey]) {
          groups[generalKey] = {
            team: null,
            announcements: []
          };
        }
        groups[generalKey].announcements.push(announcement);
      }
    });
    
    return groups;
  }, [filteredAnnouncements]);

  const toggleTeam = (teamKey: string) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      const numKey = parseInt(teamKey.replace('team-', '')) || 0;
      if (newSet.has(numKey)) {
        newSet.delete(numKey);
      } else {
        newSet.add(numKey);
      }
      return newSet;
    });
  };

  function openResults(id: number, title: string) {
    setSelectedAnnouncementId(id);
    setSelectedAnnouncementTitle(title);
  }

  function closeResults() {
    setSelectedAnnouncementId(null);
    setSelectedAnnouncementTitle("");
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto relative">
      {/* Header - Sticky auf Mobile */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 mb-2 -mx-4 px-4 md:mx-0 md:px-0 md:static">
        <div className="flex items-center justify-between mb-4 pt-4 md:pt-0">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Bell className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Ankündigungen
              </span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 ml-11 md:ml-14">
              {filteredAnnouncements.length} {filteredAnnouncements.length === 1 ? 'Ankündigung' : 'Ankündigungen'}
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/announcements/new')}
            className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-200 font-semibold shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Neue Ankündigung</span>
          </button>
        </div>

        {/* Filters - Horizontal Scroll auf Mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          {[
            { value: 'all', label: 'Alle', icon: Bell, color: 'blue' },
            { value: 'pinned', label: 'Angepinnt', icon: Pin, color: 'yellow' },
            { value: 'news', label: 'News', icon: Bell, color: 'blue' },
            { value: 'event', label: 'Events', icon: Calendar, color: 'purple' },
            { value: 'polls', label: 'Umfragen', icon: BarChart3, color: 'pink' },
            { value: 'rsvp', label: 'RSVP', icon: Users, color: 'green' },
          ].map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                filter === value
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105'
                  : 'bg-card hover:bg-muted/70 border border-border/50 hover:border-border active:scale-95'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
              {filter === value && (
                <Sparkles className="w-3 h-3 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Announcements List - Grouped by Team */}
      <div className="space-y-3 md:space-y-4">
        {Object.keys(groupedByTeam).length === 0 ? (
          <Card padding="lg" className="text-center">
            <div className="py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Bell className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-semibold mb-1">Keine Ankündigungen</p>
              <p className="text-sm text-muted-foreground">
                {filter === 'all' ? 'Erstelle deine erste Ankündigung' : 'Keine Ergebnisse für diesen Filter'}
              </p>
            </div>
          </Card>
        ) : (
          Object.entries(groupedByTeam).map(([teamKey, group]) => {
            const isGeneral = teamKey === 'general';
            const teamId = isGeneral ? 0 : parseInt(teamKey.replace('team-', ''));
            const isExpanded = isGeneral || expandedTeams.has(teamId);
            const teamName = isGeneral ? 'Allgemeine Ankündigungen' : group.team?.name || 'Unbekanntes Team';
            const teamColor = group.team?.color || '#64748b';

            return (
              <div key={teamKey} className="space-y-2">
                {/* Team Header - Klickbar */}
                <button
                  onClick={() => !isGeneral && toggleTeam(teamKey)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                    isGeneral 
                      ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20' 
                      : 'bg-card hover:bg-muted/50 border-2 border-border hover:border-primary/30 active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {!isGeneral && (
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                        style={{ backgroundColor: teamColor }}
                      >
                        {teamName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {isGeneral && (
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="text-left">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        {teamName}
                        {!isGeneral && (
                          <ChevronDown 
                            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {group.announcements.length} {group.announcements.length === 1 ? 'Ankündigung' : 'Ankündigungen'}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-primary/20 border-primary/50 text-primary font-bold px-3 py-1">
                    {group.announcements.length}
                  </Badge>
                </button>

                {/* Announcements für dieses Team */}
                {isExpanded && (
                  <div className="space-y-3 pl-0 md:pl-4">
                    {group.announcements.map(announcement => (
            <Card 
              key={announcement.id} 
              padding="none" 
              className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 group border-2 border-transparent hover:border-primary/20"
            >
              {/* Content Area - Tappable */}
              <div 
                onClick={() => router.push(`/admin/announcements/${announcement.id}`)}
                className="p-4 md:p-5 cursor-pointer"
              >
                {/* Title & Pin */}
                <div className="flex items-start gap-3 mb-3">
                  {announcement.isPinned && (
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                      <Pin className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                    </div>
                  )}
                  <h3 className="text-lg md:text-xl font-bold flex-1 group-hover:text-primary transition-colors leading-tight">
                    {announcement.title}
                  </h3>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className={`${getCategoryColor(announcement.category)} font-semibold px-3 py-1`}>
                    {announcement.category}
                  </Badge>
                  <Badge className={`${getPriorityColor(announcement.priority)} font-semibold px-3 py-1`}>
                    {announcement.priority}
                  </Badge>
                  {announcement.Poll && announcement.Poll.length > 0 && (
                    <Badge className="bg-purple-500/20 border-purple-500/50 text-purple-600 font-semibold px-3 py-1">
                      <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                      Umfrage
                    </Badge>
                  )}
                  {announcement.allowRsvp && (
                    <Badge className="bg-green-500/20 border-green-500/50 text-green-600 font-semibold px-3 py-1">
                      <Users className="w-3.5 h-3.5 mr-1.5" />
                      {announcement.rsvps.length} RSVP
                    </Badge>
                  )}
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Von:</span>
                    {announcement.Member.firstName 
                      ? `${announcement.Member.firstName} ${announcement.Member.lastName}` 
                      : announcement.Member.name}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(announcement.createdAt).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                  {announcement.expiresAt && (
                    <>
                      <span>•</span>
                      <span className="text-orange-600 font-medium">
                        Läuft ab: {new Date(announcement.expiresAt).toLocaleDateString('de-DE')}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Bar - Separate Touch Area */}
              {(announcement.Poll?.length > 0 || announcement.allowRsvp) && (
                <div className="border-t border-border/50 bg-muted/30 px-4 py-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openResults(announcement.id, announcement.title);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 rounded-xl font-semibold transition-all active:scale-95"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Ergebnisse</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAnnouncement(announcement.id);
                    }}
                    className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-semibold transition-all active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Results Modal */}
      {selectedAnnouncementId && (
        <AnnouncementResultsModal
          announcementId={selectedAnnouncementId}
          announcementTitle={selectedAnnouncementTitle}
          onClose={closeResults}
        />
      )}
    </div>
  );
}
