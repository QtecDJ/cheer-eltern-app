"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
  Heart,
  Phone,
  Pill,
  Search,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";

interface Team {
  id: number;
  name: string;
  color: string | null;
}

interface MemberInfo {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  photoUrl: string | null;
  birthDate: string;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  emergencyContact2: string | null;
  emergencyPhone2: string | null;
  allergies: string | null;
  diseases: string | null;
  medications: string | null;
  team: Team | null;
}

interface InfoContentProps {
  members: MemberInfo[];
  teams: Team[];
  isAdmin: boolean;
  currentUserTeamId: number | null;
}

export function InfoContent({ members, teams, isAdmin, currentUserTeamId }: InfoContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // Filter Mitglieder
  const filteredMembers = members.filter((member) => {
    // Suchfilter
    const matchesSearch = searchQuery === "" || 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Team-Filter
    const matchesTeam = selectedTeamId === null || member.team?.id === selectedTeamId;
    
    return matchesSearch && matchesTeam;
  });

  // Gruppiere nach Teams
  const groupedByTeam = filteredMembers.reduce((acc, member) => {
    const teamName = member.team?.name || "Ohne Team";
    if (!acc[teamName]) {
      acc[teamName] = {
        team: member.team,
        members: [],
      };
    }
    acc[teamName].members.push(member);
    return acc;
  }, {} as Record<string, { team: Team | null; members: MemberInfo[] }>);

  // Prüfe ob Mitglied Gesundheitsinfos hat
  const hasHealthInfo = (member: MemberInfo) => 
    member.allergies || member.diseases || member.medications;

  // Prüfe ob Mitglied Notfallkontakte hat
  const hasEmergencyInfo = (member: MemberInfo) => 
    member.emergencyContact || member.emergencyContact2;

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4 max-w-lg md:max-w-none mx-auto">
      {/* Header */}
      <header className="mb-6 md:mb-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Mitglieder Info</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Notfall- & Gesundheitsdaten
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {filteredMembers.length} {filteredMembers.length === 1 ? "Mitglied" : "Mitglieder"}
            </Badge>
          </div>
        </div>
      </header>

      {/* Suchleiste */}
      <div className="mb-4 animate-slide-up">
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

      {/* Team-Filter (nur für Admins mit mehreren Teams) */}
      {isAdmin && teams.length > 1 && (
        <div className="mb-4 animate-slide-up stagger-1">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedTeamId(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedTeamId === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Alle Teams
            </button>
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedTeamId === team.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: team.color || "#ec4899" }}
                />
                {team.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Statistik-Karten */}
      <div className="grid grid-cols-2 gap-3 mb-6 animate-slide-up stagger-2">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-xl font-bold">
                  {members.filter(hasEmergencyInfo).length}
                </p>
                <p className="text-xs text-muted-foreground">mit Notfallkontakt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-pink-500/10 border-pink-500/20">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-pink-500" />
              <div>
                <p className="text-xl font-bold">
                  {members.filter(hasHealthInfo).length}
                </p>
                <p className="text-xs text-muted-foreground">mit Gesundheitsinfo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mitglieder-Liste gruppiert nach Teams */}
      <div className="space-y-6">
        {Object.entries(groupedByTeam).map(([teamName, { team, members: teamMembers }]) => (
          <section key={teamName} className="animate-slide-up stagger-3">
            {/* Team Header */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: team?.color || "#64748b" }}
              />
              <h2 className="font-semibold">{teamName}</h2>
              <Badge variant="outline" className="text-xs ml-auto">
                {teamMembers.length}
              </Badge>
            </div>

            {/* Mitglieder Cards */}
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  expanded={expandedMemberId === member.id}
                  onToggle={() => setExpandedMemberId(
                    expandedMemberId === member.id ? null : member.id
                  )}
                />
              ))}
            </div>
          </section>
        ))}

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? "Keine Mitglieder gefunden" : "Keine Daten vorhanden"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Einzelne Mitglied-Karte
function MemberCard({ 
  member, 
  expanded, 
  onToggle 
}: { 
  member: MemberInfo; 
  expanded: boolean; 
  onToggle: () => void;
}) {
  const hasAllergies = !!member.allergies;
  const hasDiseases = !!member.diseases;
  const hasMedications = !!member.medications;
  const hasHealthInfo = hasAllergies || hasDiseases || hasMedications;

  return (
    <Card className="overflow-hidden">
      {/* Header - immer sichtbar */}
      <button
        onClick={onToggle}
        className="w-full text-left"
      >
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <Avatar name={member.name} src={member.photoUrl} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{member.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {member.emergencyContact && (
                  <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20">
                    <Shield className="w-2.5 h-2.5 mr-1" />
                    Notfall
                  </Badge>
                )}
                {hasHealthInfo && (
                  <Badge variant="outline" className="text-[10px] bg-pink-500/10 text-pink-600 border-pink-500/20">
                    <Heart className="w-2.5 h-2.5 mr-1" />
                    Gesundheit
                  </Badge>
                )}
              </div>
            </div>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
          </div>
        </CardContent>
      </button>

      {/* Expandierter Inhalt */}
      {expanded && (
        <div className="border-t border-border animate-fade-in">
          <CardContent className="pt-3 space-y-4">
            {/* Notfallkontakte */}
            {(member.emergencyContact || member.emergencyContact2) && (
              <div>
                <p className="text-xs font-medium text-red-500 flex items-center gap-1 mb-2">
                  <Shield className="w-3 h-3" />
                  Notfallkontakte
                </p>
                <div className="space-y-2">
                  {/* Kontakt 1 */}
                  {member.emergencyContact && (
                    <div className="p-2 bg-red-500/5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{member.emergencyContact}</span>
                      </div>
                      {member.emergencyPhone && (
                        <a 
                          href={`tel:${member.emergencyPhone}`}
                          className="flex items-center gap-2 mt-1 text-primary"
                        >
                          <Phone className="w-3 h-3" />
                          <span className="text-sm">{member.emergencyPhone}</span>
                        </a>
                      )}
                    </div>
                  )}
                  {/* Kontakt 2 */}
                  {member.emergencyContact2 && (
                    <div className="p-2 bg-red-500/5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{member.emergencyContact2}</span>
                      </div>
                      {member.emergencyPhone2 && (
                        <a 
                          href={`tel:${member.emergencyPhone2}`}
                          className="flex items-center gap-2 mt-1 text-primary"
                        >
                          <Phone className="w-3 h-3" />
                          <span className="text-sm">{member.emergencyPhone2}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gesundheitsinformationen */}
            {hasHealthInfo && (
              <div>
                <p className="text-xs font-medium text-pink-500 flex items-center gap-1 mb-2">
                  <Heart className="w-3 h-3" />
                  Gesundheitsinformationen
                </p>
                <div className="space-y-2">
                  {/* Allergien */}
                  {member.allergies && (
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span className="text-xs font-medium text-amber-600">Allergien</span>
                      </div>
                      <p className="text-sm">{member.allergies}</p>
                    </div>
                  )}
                  
                  {/* Krankheiten */}
                  {member.diseases && (
                    <div className="p-2 bg-pink-500/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Heart className="w-3 h-3 text-pink-500" />
                        <span className="text-xs font-medium text-pink-600">Krankheiten</span>
                      </div>
                      <p className="text-sm">{member.diseases}</p>
                    </div>
                  )}
                  
                  {/* Medikamente */}
                  {member.medications && (
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="w-3 h-3 text-blue-500" />
                        <span className="text-xs font-medium text-blue-600">Medikamente</span>
                      </div>
                      <p className="text-sm">{member.medications}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Schnell-Anruf Buttons */}
            {(member.emergencyPhone || member.emergencyPhone2) && (
              <div className="flex gap-2 pt-2 border-t border-border">
                {member.emergencyPhone && (
                  <a
                    href={`tel:${member.emergencyPhone}`}
                    className="flex-1 py-2 px-3 bg-red-500 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    {member.emergencyContact?.split(" ")[0] || "Anrufen"}
                  </a>
                )}
                {member.emergencyPhone2 && (
                  <a
                    href={`tel:${member.emergencyPhone2}`}
                    className="flex-1 py-2 px-3 bg-red-500/80 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    {member.emergencyContact2?.split(" ")[0] || "Anrufen"}
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </div>
      )}
    </Card>
  );
}
