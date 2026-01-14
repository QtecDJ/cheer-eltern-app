"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateAge, formatDate } from "@/lib/utils";
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Settings,
  Star,
  Users,
} from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { updateProfilePhoto, deleteProfilePhoto } from "./actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  photoUrl: string | null;
}

interface ProfileContentProps {
  member: {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    role: string;
    joinDate: string;
    email: string | null;
    emergencyContact: string | null;
    emergencyPhone: string | null;
    emergencyContact2: string | null;
    emergencyPhone2: string | null;
    allergies: string | null;
    diseases: string | null;
    medications: string | null;
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
  } | null;
  teamMembers: TeamMember[];
}

export function ProfileContent({
  member,
  attendanceRate,
  totalTrainings,
  latestAssessment,
  teamMembers,
}: ProfileContentProps) {
  const router = useRouter();
  const age = calculateAge(member.birthDate);
  
  // Photo State
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(member.photoUrl);
  


  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4 max-w-lg md:max-w-none mx-auto">
      {/* Header */}
      <header className="mb-6 md:mb-8 animate-fade-in">
        <button onClick={() => router.back()} className="text-primary text-sm mb-2 hover:underline md:hidden">
          ← Zurück
        </button>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Profil</h1>
      </header>

      {/* Profil Card */}
      <Card variant="gradient" className="mb-6 animate-slide-up">
        <div className="flex flex-col items-center text-center">
          <AvatarUpload
            name={member.name}
            currentPhotoUrl={currentPhotoUrl}
            onUploadComplete={async (url) => {
              const result = await updateProfilePhoto(url);
              if (result.success) {
                setCurrentPhotoUrl(url);
                router.refresh();
              } else {
                throw new Error(result.error);
              }
            }}
            onDelete={async () => {
              const result = await deleteProfilePhoto();
              if (result.success) {
                setCurrentPhotoUrl(null);
                router.refresh();
              } else {
                throw new Error(result.error);
              }
            }}
            size="xl"
          />
          <h2 className="text-xl font-bold mt-4">{member.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="default">{member.role}</Badge>
            <Badge variant="outline">{age} Jahre</Badge>
          </div>

          {member.team && (
            <div className="mt-4 flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: member.team.color || "#ec4899" }}
              />
              <span className="font-medium">{member.team.name}</span>
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

      {/* Einstellungen Button */}
      <Link href="/einstellungen">
        <Card className="mb-6 animate-slide-up stagger-5 hover:bg-muted/30 transition-colors cursor-pointer">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Einstellungen</p>
                  <p className="text-xs text-muted-foreground">Konto, Notfall & Gesundheit</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Info */}
      <Card className="mb-6 animate-slide-up stagger-4">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Geburtsdatum</p>
              <p className="font-medium">{formatDate(member.birthDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mitglied seit</p>
              <p className="font-medium">{formatDate(member.joinDate)}</p>
            </div>
          </div>

          {member.team && (
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${member.team.color}20` }}
              >
                <Users
                  className="w-4 h-4"
                  style={{ color: member.team.color || "#ec4899" }}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Team</p>
                <p className="font-medium">{member.team.name}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Mitglieder */}
      {teamMembers.length > 0 && member.team && (
        <section className="mt-6 animate-slide-up stagger-5">
          <CardHeader className="px-0">
            <CardTitle size="lg" className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: member.team.color || "#ec4899" }} />
              Team ({teamMembers.length + 1})
            </CardTitle>
          </CardHeader>

          <Card>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {teamMembers.map((m) => (
                  <div key={m.id} className="flex flex-col items-center text-center">
                    <Avatar name={m.name} src={m.photoUrl} size="md" />
                    <p className="text-xs font-medium mt-1.5 truncate w-full">
                      {m.firstName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate w-full">
                      {m.role}
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

        {/* Support-Bereich */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Die ICA Members App wird allen Mitgliedern
              kostenlos zur Verfügung gestellt.
            </p>
            <p>
              Wenn dir die App im Alltag hilft und du die Weiterentwicklung
              freiwillig unterstützen möchtest, freue ich mich sehr darüber.
            </p>
            <p>
              Ein großes Dankeschön an alle, die dieses Projekt möglich machen.
              Im Cheerleading sagt man: Ein starkes Team braucht starken Support –
              danke, dass ihr Teil davon seid!
            </p>
            <p className="text-xs italic">
              — Coach Kai
            </p>
          </div>
          <a
            href="https://buymeacoffee.com/ica_dev"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 w-full py-3 px-4 bg-muted/50 text-muted-foreground font-medium rounded-xl hover:bg-muted transition-colors"
          >
            ☕ Entwicklung unterstützen
          </a>
        </div>

        <p className="text-xs text-muted-foreground">
          Member App · Version 1.8.3
        </p>
        <p className="text-[10px] text-muted-foreground/50">
          Entwickelt von ICA-Dev Kai Püttmann
        </p>
      </footer>
    </div>
  );
}
