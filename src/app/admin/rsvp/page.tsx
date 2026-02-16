"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  XCircle, 
  Clock,
  UserCheck,
  UserX,
  User,
  Users,
  Calendar
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type Member = {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  photoUrl?: string | null;
  team?: {
    id: number;
    name: string;
    color: string;
  } | null;
};

type RSVP = {
  id: number;
  status: string;
  respondedAt: string;
  attended: boolean | null;
  Member: Member;
};

type Announcement = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  expiresAt: string | null;
  category: string;
  priority: string;
  rsvps: RSVP[];
};

export default function AdminRSVPPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAnnouncementId, setOpenAnnouncementId] = useState<number | null>(null);
  const [updatingAttendance, setUpdatingAttendance] = useState<number | null>(null);

  useEffect(() => {
    console.log('RSVP Page: Component mounted, starting data fetch');
    fetchRSVPData();
  }, []);

  async function fetchRSVPData() {
    console.log('RSVP Page: fetchRSVPData called');
    try {
      console.log('RSVP Page: Calling /api/admin/rsvp...');
      const res = await fetch("/api/admin/rsvp");
      console.log('RSVP Page: Response received, status:', res.status);
      const data = await res.json();
      console.log('RSVP Page: Response data:', data);
      if (res.ok) {
        console.log('RSVP Page: Setting announcements, count:', data.announcements?.length || 0);
        setAnnouncements(data.announcements);
      } else {
        console.error("RSVP Page: Failed to fetch RSVP data:", data.error);
      }
    } catch (error) {
      console.error("RSVP Page: Error fetching RSVP data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateAttendance(rsvpId: number, attended: boolean | null) {
    setUpdatingAttendance(rsvpId);
    try {
      const res = await fetch(`/api/admin/rsvp/${rsvpId}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attended }),
      });
      
      if (res.ok) {
        // Update local state
        setAnnouncements(prev => 
          prev.map(announcement => ({
            ...announcement,
            rsvps: announcement.rsvps.map(rsvp =>
              rsvp.id === rsvpId ? { ...rsvp, attended } : rsvp
            )
          }))
        );
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
    } finally {
      setUpdatingAttendance(null);
    }
  }

  function toggleAnnouncement(id: number) {
    setOpenAnnouncementId(prev => prev === id ? null : id);
  }

  function getRSVPStats(rsvps: RSVP[]) {
    const accepted = rsvps.filter(r => r.status === 'accepted').length;
    const declined = rsvps.filter(r => r.status === 'declined').length;
    const pending = rsvps.filter(r => r.status === 'pending').length;
    const attended = rsvps.filter(r => r.attended === true).length;
    const notAttended = rsvps.filter(r => r.attended === false).length;
    
    return { accepted, declined, pending, attended, notAttended, total: rsvps.length };
  }

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Lade RSVP Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-6">
        <button 
          onClick={() => router.back()} 
          className="text-primary text-sm mb-2 hover:underline"
        >
          ← Zurück
        </button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UserCheck className="w-8 h-8" />
          RSVP Übersicht
        </h1>
        <p className="text-muted-foreground mt-2">
          Übersicht aller Ankündigungen mit RSVP und Anwesenheitsbestätigung
        </p>
      </header>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Keine RSVPs vorhanden</h3>
          <p className="text-muted-foreground">
            Es gibt aktuell keine Ankündigungen mit RSVP-Funktion.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const isOpen = openAnnouncementId === announcement.id;
            const stats = getRSVPStats(announcement.rsvps);
            
            return (
              <Card key={announcement.id} className="overflow-hidden">
                {/* Announcement Header */}
                <button
                  onClick={() => toggleAnnouncement(announcement.id)}
                  className="w-full p-4 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{announcement.title}</h3>
                        <Badge variant={
                          announcement.priority === 'urgent' ? 'danger' :
                          announcement.priority === 'high' ? 'warning' :
                          'default'
                        }>
                          {announcement.priority}
                        </Badge>
                        <Badge variant="outline">{announcement.category}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(announcement.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {stats.total} Antworten
                        </span>
                      </div>

                      {/* Quick Stats */}
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="flex items-center gap-1 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="font-medium">{stats.accepted}</span>
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="font-medium">{stats.declined}</span>
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <span className="font-medium">{stats.pending}</span>
                        </span>
                        {stats.attended > 0 && (
                          <span className="flex items-center gap-1 text-sm text-blue-500">
                            <UserCheck className="w-4 h-4" />
                            <span className="font-medium">{stats.attended} Anwesend</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {isOpen && (
                  <div className="border-t border-border">
                    <CardContent className="p-4 space-y-4">
                      {/* RSVP List */}
                      {announcement.rsvps.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          Noch keine Antworten vorhanden
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {announcement.rsvps.map((rsvp) => (
                            <div
                              key={rsvp.id}
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Avatar
                                  name={rsvp.Member.name || `${rsvp.Member.firstName} ${rsvp.Member.lastName}`}
                                  size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {rsvp.Member.name || `${rsvp.Member.firstName} ${rsvp.Member.lastName}`}
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge
                                      variant={
                                        rsvp.status === 'accepted' ? 'success' :
                                        rsvp.status === 'declined' ? 'danger' :
                                        'default'
                                      }
                                      className="text-xs"
                                    >
                                      {rsvp.status === 'accepted' ? '✓ Zugesagt' :
                                       rsvp.status === 'declined' ? '✗ Abgesagt' :
                                       '○ Ausstehend'}
                                    </Badge>
                                    {rsvp.Member.team && (
                                      <span
                                        className="text-xs px-2 py-0.5 rounded"
                                        style={{
                                          backgroundColor: `${rsvp.Member.team.color}20`,
                                          color: rsvp.Member.team.color,
                                        }}
                                      >
                                        {rsvp.Member.team.name}
                                      </span>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(rsvp.respondedAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Attendance Buttons */}
                              {rsvp.status === 'accepted' && (
                                <div className="flex items-center gap-2 ml-4">
                                  <button
                                    onClick={() => updateAttendance(rsvp.id, true)}
                                    disabled={updatingAttendance === rsvp.id}
                                    className={`p-2 rounded-lg transition-colors ${
                                      rsvp.attended === true
                                        ? 'bg-green-500/20 text-green-600 border-2 border-green-500'
                                        : 'bg-muted hover:bg-green-500/10 text-muted-foreground'
                                    }`}
                                    title="Anwesend"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => updateAttendance(rsvp.id, false)}
                                    disabled={updatingAttendance === rsvp.id}
                                    className={`p-2 rounded-lg transition-colors ${
                                      rsvp.attended === false
                                        ? 'bg-red-500/20 text-red-600 border-2 border-red-500'
                                        : 'bg-muted hover:bg-red-500/10 text-muted-foreground'
                                    }`}
                                    title="Abwesend"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => updateAttendance(rsvp.id, null)}
                                    disabled={updatingAttendance === rsvp.id}
                                    className={`p-2 rounded-lg transition-colors ${
                                      rsvp.attended === null
                                        ? 'bg-muted/50 text-muted-foreground border-2 border-border'
                                        : 'bg-muted hover:bg-muted/50 text-muted-foreground'
                                    }`}
                                    title="Zurücksetzen"
                                  >
                                    <User className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
