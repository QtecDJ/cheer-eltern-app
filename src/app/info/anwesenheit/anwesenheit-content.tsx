"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Check,
  X,
  Search,
  Users,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Team {
  id: number;
  name: string;
  color: string | null;
}

interface Training {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  team: Team | null;
}

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  photoUrl: string | null;
  team: Team | null;
}

// Module-level date helpers so child components can use them
const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

interface ExistingAttendance {
  memberId: number;
  status: string;
  reason: string | null;
  notes: string | null;
  updatedAt?: string | null;
}

interface AnwesenheitContentProps {
  training: Training;
  members: Member[];
  existingAttendances: ExistingAttendance[];
  initialExcusedCount: number;
  isAdmin: boolean;
}

type AttendanceStatus = "present" | "absent" | null;

export function AnwesenheitContent({ 
  training, 
  members, 
  existingAttendances,
  initialExcusedCount,
  isAdmin 
}: AnwesenheitContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const previousAttendanceRef = useRef<Record<number, AttendanceStatus> | null>(null);
  const toggleCacheRef = useRef<Map<number, (status: AttendanceStatus) => void>>(new Map());
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialisiere Anwesenheit nur einmal (Performance)
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>(() => {
    const initialAttendance: Record<number, AttendanceStatus> = {};
    (existingAttendances || []).forEach(att => {
      if (att.status === "present") {
        initialAttendance[att.memberId] = "present";
      } else if (att.status === "excused" || att.status === "absent") {
        initialAttendance[att.memberId] = "absent";
      }
    });
    return initialAttendance;
  });
  
  // Erstelle Map für Abwesenheitsgründe (memoized)
  const attendanceInfo = useMemo(() => {
    const map = new Map<number, ExistingAttendance>();
    (existingAttendances || []).forEach(att => {
      map.set(att.memberId, att);
    });
    return map;
  }, [existingAttendances]);

  // Modal state for decline details
  const [selectedDecline, setSelectedDecline] = useState<ExistingAttendance | null>(null);
 

  // Filter Mitglieder (memoized)
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(q) ||
        member.firstName.toLowerCase().includes(q) ||
        member.lastName.toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [members, searchQuery]);

  // Toggle Anwesenheit (stable callback, uses ref for rollback)
  const toggleAttendance = useCallback(async (memberId: number, status: AttendanceStatus) => {
    // Optimistisches Update (store previous state in a ref for rollback)
    setAttendance(prev => {
      previousAttendanceRef.current = prev;
      const newStatus = prev[memberId] === status ? null : status;
      return { ...prev, [memberId]: newStatus };
    });

    // Zeige Speicher-Status
    setSaving(memberId);

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trainingId: training.id,
          memberId,
          status: (attendance[memberId] === status ? null : status),
        }),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Speichern");
      }
    } catch (error) {
      console.error("Fehler beim Speichern der Anwesenheit:", error);
      // Rollback bei Fehler
      setAttendance(previousAttendanceRef.current || {});
      alert("Fehler beim Speichern. Bitte versuche es erneut.");
    } finally {
      setSaving(null);
    }
  }, [training.id]);

  // Provide cached per-member handler to avoid creating new functions on each render
  const getToggle = useCallback((memberId: number) => {
    let fn = toggleCacheRef.current.get(memberId);
    if (!fn) {
      fn = (status: AttendanceStatus) => toggleAttendance(memberId, status);
      toggleCacheRef.current.set(memberId, fn);
    }
    return fn;
  }, [toggleAttendance]);

  // Statistiken berechnen (memoized)
  const presentCount = useMemo(() => Object.values(attendance).filter(s => s === "present").length, [attendance]);
  const absentCount = useMemo(() => Object.values(attendance).filter(s => s === "absent").length, [attendance]);
  
  // Verwende den vom Server berechneten excusedCount für Hydration-Konsistenz
  const excusedCount = initialExcusedCount;
  
  // Nicht markiert = alle außer anwesend, abwesend und entschuldigt
  const notMarkedCount = filteredMembers.length - presentCount - absentCount - excusedCount; 

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 md:pb-8 max-w-lg md:max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Anwesenheit</h1>
        </div>
        
        {/* Training Info Card */}
        <Card className="bg-primary/5 border-primary/20 mb-4">
          <CardContent className="py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">{training.title}</h2>
                {mounted && training.team && (
                  <span 
                    className="inline-flex items-center font-medium rounded-full px-2.5 py-1 text-xs text-white"
                    style={{ 
                      backgroundColor: training.team.color || "#ec4899"
                    }}
                  >
                    {training.team.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(training.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{training.time}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{training.location}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </header>

      {/* Statistik-Karten */}
      <div className="grid grid-cols-4 gap-2 mb-6 animate-slide-up">
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="py-3">
            <div className="text-center">
              <Check className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{presentCount}</p>
              <p className="text-[10px] text-muted-foreground">Anwesend</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="py-3">
            <div className="text-center">
              <X className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{absentCount}</p>
              <p className="text-[10px] text-muted-foreground">Abwesend</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="py-3">
            <div className="text-center">
              <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{excusedCount}</p>
              <p className="text-[10px] text-muted-foreground">Entschuldigt</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-500/10 border-gray-500/20">
          <CardContent className="py-3">
            <div className="text-center">
              <Users className="w-5 h-5 text-gray-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{notMarkedCount}</p>
              <p className="text-[10px] text-muted-foreground">Offen</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suchleiste */}
      <div className="mb-4 animate-slide-up stagger-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Mitglied suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Mitglieder-Liste */}
      <div className="space-y-2">
        {filteredMembers.map((member) => {
          const info = attendanceInfo.get(member.id);
          const hasDeclined = info?.status === "excused";
          
          return (
            <AttendanceCard
              key={member.id}
              member={member}
              status={attendance[member.id]}
              onToggle={(status) => toggleAttendance(member.id, status)}
              hasDeclined={hasDeclined}
              declineReason={info?.reason || null}
              updatedAt={info?.updatedAt ?? null}
              onOpenDecline={() => info && setSelectedDecline(info)}
              isSaving={saving === member.id}
            />
          );
        })}

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? "Keine Mitglieder gefunden" : "Keine Mitglieder vorhanden"}
            </p>
          </div>
        )}
      </div>
      {selectedDecline && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setSelectedDecline(null)}
        >
          <div className="max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">Abwesenheitsgrund</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedDecline.reason || "Keine Angabe"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                      {selectedDecline.updatedAt ? `Gemeldet: ${formatDateTime(selectedDecline.updatedAt)}` : "Zeitpunkt unbekannt"}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDecline(null)}
                    className="text-muted-foreground hover:text-foreground p-2 rounded-md"
                  >
                    ✕
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// Einzelne Anwesenheits-Karte
const AttendanceCard = React.memo(function AttendanceCard({
  member,
  status,
  onToggle,
  hasDeclined,
  declineReason,
  updatedAt,
  isSaving,
  onOpenDecline,
}: {
  member: Member;
  status: AttendanceStatus;
  onToggle: (status: AttendanceStatus) => void;
  hasDeclined: boolean;
  declineReason: string | null;
  updatedAt?: string | null;
  isSaving?: boolean;
  onOpenDecline?: () => void;
}) {
  return (
    <Card
      onClick={hasDeclined && onOpenDecline ? onOpenDecline : undefined}
      className={`transition-all ${
        status === "present" ? "bg-green-500/10 border-green-500/30" :
        status === "absent" ? "bg-red-500/10 border-red-500/30" : 
        hasDeclined ? "bg-amber-500/10 border-amber-500/30" : ""
      } ${isSaving ? "opacity-50" : ""} ${hasDeclined ? 'cursor-pointer' : ''}`}
      role={hasDeclined ? 'button' : undefined}
    >
      <CardContent className="py-3">
        <div className="flex items-center gap-3">
          <Avatar name={member.name} src={member.photoUrl} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{member.name}</p>
            {hasDeclined && (
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                  <AlertCircle className="w-2.5 h-2.5 mr-1" />
                  Entschuldigt
                </Badge>
                {declineReason && (
                  <button onClick={onOpenDecline} className="text-xs text-muted-foreground truncate hover:underline">
                    {declineReason}
                  </button>
                )}
              </div>
            )}
            {status === "present" && updatedAt && (
              <p className="text-xs text-muted-foreground mt-1">Zugesagt: {formatDateTime(updatedAt)}</p>
            )}
          </div>
          
          {/* Anwesenheits-Buttons */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onToggle("present"); }}
              disabled={isSaving}
              className={`p-2 rounded-lg transition-colors ${
                status === "present"
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-green-500/20"
              } ${isSaving ? "cursor-not-allowed" : ""}`}
              title="Anwesend"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggle("absent"); }}
              disabled={isSaving}
              className={`p-2 rounded-lg transition-colors ${
                status === "absent"
                  ? "bg-red-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-red-500/20"
              } ${isSaving ? "cursor-not-allowed" : ""}`}
              title="Abwesend"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
