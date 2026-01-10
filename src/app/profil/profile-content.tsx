"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateAge, formatDate } from "@/lib/utils";
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  LogOut,
  Phone,
  Shield,
  Star,
  User,
  Users,
} from "lucide-react";
import { logoutAction } from "@/app/login/actions";

interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  photoUrl: string | null;
}

interface ProfileContentProps {
  child: {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    role: string;
    joinDate: string;
    emergencyContact: string | null;
    emergencyPhone: string | null;
    photoUrl: string | null;
    team: {
      id: number;
      name: string;
      description: string | null;
      color: string | null;
    } | null;
  };
  attendanceRate: number;
  totalTrainings: number;
  latestAssessment?: {
    overallScore: number;
    performanceLevel: string;
  };
  teamMembers: TeamMember[];
}

export function ProfileContent({
  child,
  attendanceRate,
  totalTrainings,
  latestAssessment,
  teamMembers,
}: ProfileContentProps) {
  const age = calculateAge(child.birthDate);

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Profil</h1>
      </header>

      {/* Profil Card */}
      <Card variant="gradient" className="mb-6 animate-slide-up">
        <div className="flex flex-col items-center text-center">
          <Avatar name={child.name} src={child.photoUrl} size="xl" />
          <h2 className="text-xl font-bold mt-4">{child.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="default">{child.role}</Badge>
            <Badge variant="outline">{age} Jahre</Badge>
          </div>

          {child.team && (
            <div className="mt-4 flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: child.team.color || "#ec4899" }}
              />
              <span className="font-medium">{child.team.name}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="animate-slide-up stagger-1">
          <div className="text-center py-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{attendanceRate}%</p>
            <p className="text-[10px] text-muted-foreground">Anwesenheit</p>
          </div>
        </Card>
        <Card className="animate-slide-up stagger-2">
          <div className="text-center py-1">
            <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{totalTrainings}</p>
            <p className="text-[10px] text-muted-foreground">Trainings</p>
          </div>
        </Card>
        <Card className="animate-slide-up stagger-3">
          <div className="text-center py-1">
            <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold">
              {latestAssessment?.overallScore.toFixed(1) || "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">Score</p>
          </div>
        </Card>
      </div>

      {/* Info */}
      <Card className="mb-6 animate-slide-up stagger-4">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Geburtsdatum</p>
              <p className="font-medium">{formatDate(child.birthDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mitglied seit</p>
              <p className="font-medium">{formatDate(child.joinDate)}</p>
            </div>
          </div>

          {child.team && (
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${child.team.color}20` }}
              >
                <Users
                  className="w-4 h-4"
                  style={{ color: child.team.color || "#ec4899" }}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Team</p>
                <p className="font-medium">{child.team.name}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notfallkontakt */}
      {(child.emergencyContact || child.emergencyPhone) && (
        <section className="animate-slide-up stagger-5">
          <CardHeader className="px-0">
            <CardTitle size="lg" className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              Notfallkontakt
            </CardTitle>
          </CardHeader>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="space-y-2">
              {child.emergencyContact && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{child.emergencyContact}</span>
                </div>
              )}
              {child.emergencyPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{child.emergencyPhone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Team Mitglieder */}
      {teamMembers.length > 0 && child.team && (
        <section className="mt-6 animate-slide-up stagger-5">
          <CardHeader className="px-0">
            <CardTitle size="lg" className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: child.team.color || "#ec4899" }} />
              Team ({teamMembers.length + 1})
            </CardTitle>
          </CardHeader>

          <Card>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex flex-col items-center text-center">
                    <Avatar name={member.name} src={member.photoUrl} size="md" />
                    <p className="text-xs font-medium mt-1.5 truncate w-full">
                      {member.firstName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate w-full">
                      {member.role}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* App Info */}
      <footer className="mt-8 text-center space-y-4">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-red-500/10 text-red-600 font-medium rounded-xl hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Abmelden
          </button>
        </form>
        <p className="text-xs text-muted-foreground">
          Cheer Eltern · Nur-Lesen
        </p>
      </footer>
    </div>
  );
}
