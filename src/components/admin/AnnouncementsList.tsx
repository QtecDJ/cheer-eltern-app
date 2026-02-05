"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell, Pin, Calendar, Users, BarChart3, Edit, Trash2, Eye, TrendingUp } from "lucide-react";
import AnnouncementResultsModal from "@/components/admin/AnnouncementResultsModal";

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
  AnnouncementTeam: any[];
};

export default function AnnouncementsList({ currentUserId }: { currentUserId: number }) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<number | null>(null);
  const [selectedAnnouncementTitle, setSelectedAnnouncementTitle] = useState<string>("");

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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Bell className="w-7 h-7 text-primary" />
              Ankündigungen
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Verwalte Ankündigungen und Umfragen
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/announcements/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Neue Ankündigung</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'Alle', icon: Bell },
            { value: 'pinned', label: 'Angepinnt', icon: Pin },
            { value: 'news', label: 'News', icon: Bell },
            { value: 'event', label: 'Events', icon: Calendar },
            { value: 'polls', label: 'Mit Umfrage', icon: BarChart3 },
            { value: 'rsvp', label: 'Mit RSVP', icon: Users },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card hover:bg-muted/50 border border-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <Card padding="lg" className="text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Keine Ankündigungen gefunden</p>
          </Card>
        ) : (
          filteredAnnouncements.map(announcement => (
            <Card key={announcement.id} padding="md" className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Title & Badges */}
                  <div className="flex items-start gap-2 mb-2">
                    {announcement.isPinned && <Pin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />}
                    <h3 className="text-lg font-semibold flex-1">{announcement.title}</h3>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={getCategoryColor(announcement.category)}>
                      {announcement.category}
                    </Badge>
                    <Badge className={getPriorityColor(announcement.priority)}>
                      {announcement.priority}
                    </Badge>
                    {announcement.Poll && announcement.Poll.length > 0 && (
                      <Badge className="bg-purple-500/20 border-purple-500/50 text-purple-600">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Umfrage
                      </Badge>
                    )}
                    {announcement.allowRsvp && (
                      <Badge className="bg-green-500/20 border-green-500/50 text-green-600">
                        <Users className="w-3 h-3 mr-1" />
                        RSVP ({announcement.rsvps.length})
                      </Badge>
                    )}
                  </div>

                  {/* Author & Date */}
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      Von: {announcement.Member.firstName 
                        ? `${announcement.Member.firstName} ${announcement.Member.lastName}` 
                        : announcement.Member.name}
                    </span>
                    <span>
                      {new Date(announcement.createdAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {announcement.expiresAt && (
                      <span className="text-orange-600">
                        Läuft ab: {new Date(announcement.expiresAt).toLocaleDateString('de-DE')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {(announcement.Poll?.length > 0 || announcement.allowRsvp) && (
                    <button
                      onClick={() => openResults(announcement.id, announcement.title)}
                      className="p-2 hover:bg-purple-500/10 text-purple-600 rounded-lg transition-colors"
                      title="Ergebnisse anzeigen"
                    >
                      <TrendingUp className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/admin/announcements/${announcement.id}`)}
                    className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                    title="Bearbeiten"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(announcement.id)}
                    className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                    title="Löschen"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Card>
          ))
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
