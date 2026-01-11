"use client";

import { useState } from "react";
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

interface ExistingAttendance {
  memberId: number;
  status: string;
  reason: string | null;
  notes: string | null;
}

interface AnwesenheitContentProps {
  training: Training;
  members: Member[];
  existingAttendances: ExistingAttendance[];
  isAdmin: boolean;
}

type AttendanceStatus = "present" | "absent" | null;

export function AnwesenheitContent({ 
  training, 
  members, 
  existingAttendances,
  isAdmin 
}: AnwesenheitContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Initialisiere Anwesenheit mit bestehenden Daten
  const initialAttendance: Record<number, AttendanceStatus> = {};
  (existingAttendances || []).forEach(att => {
    if (att.status === "present") {
      initialAttendance[att.memberId] = "present";
    } else if (att.status === "excused" || att.status === "absent") {
      initialAttendance[att.memberId] = "absent";
    }
  });
  
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>(initialAttendance);
  
  // Erstelle Map für Abwesenheitsgründe
  const attendanceInfo = new Map<number, ExistingAttendance>();
  (existingAttendances || []).forEach(att => {
    attendanceInfo.set(att.memberId, att);
  });

  // Formatiere Datum
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  };

  // Filter Mitglieder
  const filteredMembers = members.filter((member) => {
    const matchesSearch = searchQuery === "" || 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Toggle Anwesenheit
  const toggleAttendance = (memberId: number, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [memberId]: prev[memberId] === status ? null : status
    }));
  };

  // Statistiken berechnen
  const presentCount = Object.values(attendance).filter(s => s === "present").length;
  const absentCount = Object.values(attendance).filter(s => s === "absent").length;
  const notMarkedCount = filteredMembers.length - presentCount - absentCount;
  
  // Zähle bereits abgesagte
  const declinedCount = (existingAttendances || []).filter(a => a.status === "excused").length;

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
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
                {training.team && (
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
              <p className="text-xl font-bold">{declinedCount}</p>
              <p className="text-[10px] text-muted-foreground">Abgesagt</p>
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
    </div>
  );
}

// Einzelne Anwesenheits-Karte
function AttendanceCard({ 
  member, 
  status,
  onToggle,
  hasDeclined,
  declineReason,
}: { 
  member: Member; 
  status: AttendanceStatus;
  onToggle: (status: AttendanceStatus) => void;
  hasDeclined: boolean;
  declineReason: string | null;
}) {
  return (
    <Card className={`transition-all ${
      status === "present" ? "bg-green-500/10 border-green-500/30" :
      status === "absent" ? "bg-red-500/10 border-red-500/30" : 
      hasDeclined ? "bg-amber-500/10 border-amber-500/30" : ""
    }`}>
      <CardContent className="py-3">
        <div className="flex items-center gap-3">
          <Avatar name={member.name} src={member.photoUrl} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{member.name}</p>
            {hasDeclined && (
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                  <AlertCircle className="w-2.5 h-2.5 mr-1" />
                  Abgesagt
                </Badge>
                {declineReason && (
                  <span className="text-xs text-muted-foreground truncate">
                    {declineReason}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Anwesenheits-Buttons */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onToggle("present")}
              className={`p-2 rounded-lg transition-colors ${
                status === "present"
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-green-500/20"
              }`}
              title="Anwesend"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={() => onToggle("absent")}
              className={`p-2 rounded-lg transition-colors ${
                status === "absent"
                  ? "bg-red-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-red-500/20"
              }`}
              title="Abwesend"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
