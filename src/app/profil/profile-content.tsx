"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateAge, formatDate } from "@/lib/utils";
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Edit2,
  Key,
  Loader2,
  LogOut,
  Mail,
  Phone,
  Save,
  Shield,
  Star,
  User,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { updateEmail, updatePassword, updateEmergencyContact } from "./actions";

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
  const age = calculateAge(member.birthDate);
  
  // Edit States
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [editingEmergency, setEditingEmergency] = useState(false);
  
  // Loading States
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingEmergency, setSavingEmergency] = useState(false);
  
  // Message States
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emergencyMessage, setEmergencyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingEmail(true);
    setEmailMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await updateEmail(formData);
    
    if (result.success) {
      setEmailMessage({ type: "success", text: "E-Mail gespeichert!" });
      setEditingEmail(false);
    } else {
      setEmailMessage({ type: "error", text: result.error || "Fehler" });
    }
    setSavingEmail(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await updatePassword(formData);
    
    if (result.success) {
      setPasswordMessage({ type: "success", text: "Passwort geändert!" });
      setEditingPassword(false);
      (e.target as HTMLFormElement).reset();
    } else {
      setPasswordMessage({ type: "error", text: result.error || "Fehler" });
    }
    setSavingPassword(false);
  }

  async function handleEmergencySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingEmergency(true);
    setEmergencyMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await updateEmergencyContact(formData);
    
    if (result.success) {
      setEmergencyMessage({ type: "success", text: "Notfallkontakt gespeichert!" });
      setEditingEmergency(false);
    } else {
      setEmergencyMessage({ type: "error", text: result.error || "Fehler" });
    }
    setSavingEmergency(false);
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Profil</h1>
      </header>

      {/* Profil Card */}
      <Card variant="gradient" className="mb-6 animate-slide-up">
        <div className="flex flex-col items-center text-center">
          <Avatar name={member.name} src={member.photoUrl} size="xl" />
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

      {/* E-Mail Sektion */}
      <section className="mb-6 animate-slide-up stagger-5">
        <CardHeader className="px-0">
          <CardTitle size="lg" className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            E-Mail
          </CardTitle>
        </CardHeader>

        <Card>
          <CardContent>
            {emailMessage && (
              <div className={`mb-3 p-2 rounded-lg text-sm ${
                emailMessage.type === "success" 
                  ? "bg-emerald-500/10 text-emerald-600" 
                  : "bg-red-500/10 text-red-600"
              }`}>
                {emailMessage.text}
              </div>
            )}
            
            {member.email ? (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{member.email}</span>
                <Badge variant="outline" className="ml-auto text-xs">Gespeichert</Badge>
              </div>
            ) : editingEmail ? (
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <input
                  type="email"
                  name="email"
                  placeholder="deine@email.de"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingEmail}
                    className="flex-1 py-2 px-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Speichern
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingEmail(false)}
                    className="py-2 px-3 bg-muted text-muted-foreground text-sm font-medium rounded-lg hover:bg-muted/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚠️ Die E-Mail kann nur einmal festgelegt werden
                </p>
              </form>
            ) : (
              <button
                onClick={() => setEditingEmail(true)}
                className="w-full py-2 px-3 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/50 flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                E-Mail hinterlegen
              </button>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Passwort Sektion */}
      <section className="mb-6 animate-slide-up stagger-5">
        <CardHeader className="px-0">
          <CardTitle size="lg" className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-500" />
            Passwort ändern
          </CardTitle>
        </CardHeader>

        <Card>
          <CardContent>
            {passwordMessage && (
              <div className={`mb-3 p-2 rounded-lg text-sm ${
                passwordMessage.type === "success" 
                  ? "bg-emerald-500/10 text-emerald-600" 
                  : "bg-red-500/10 text-red-600"
              }`}>
                {passwordMessage.text}
              </div>
            )}
            
            {editingPassword ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <input
                  type="password"
                  name="currentPassword"
                  placeholder="Aktuelles Passwort"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Neues Passwort"
                  required
                  minLength={4}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Neues Passwort bestätigen"
                  required
                  minLength={4}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="flex-1 py-2 px-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Speichern
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPassword(false)}
                    className="py-2 px-3 bg-muted text-muted-foreground text-sm font-medium rounded-lg hover:bg-muted/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setEditingPassword(true)}
                className="w-full py-2 px-3 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/50 flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Passwort ändern
              </button>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Notfallkontakt */}
      <section className="animate-slide-up stagger-5">
        <CardHeader className="px-0">
          <CardTitle size="lg" className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            Notfallkontakt
          </CardTitle>
        </CardHeader>

        <Card className="border-l-4 border-l-red-500">
          <CardContent>
            {emergencyMessage && (
              <div className={`mb-3 p-2 rounded-lg text-sm ${
                emergencyMessage.type === "success" 
                  ? "bg-emerald-500/10 text-emerald-600" 
                  : "bg-red-500/10 text-red-600"
              }`}>
                {emergencyMessage.text}
              </div>
            )}
            
            {editingEmergency ? (
              <form onSubmit={handleEmergencySubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <input
                    type="text"
                    name="emergencyContact"
                    placeholder="Name des Notfallkontakts"
                    defaultValue={member.emergencyContact || ""}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Telefon</label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    placeholder="Telefonnummer"
                    defaultValue={member.emergencyPhone || ""}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingEmergency}
                    className="flex-1 py-2 px-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingEmergency ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Speichern
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingEmergency(false)}
                    className="py-2 px-3 bg-muted text-muted-foreground text-sm font-medium rounded-lg hover:bg-muted/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                {member.emergencyContact && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{member.emergencyContact}</span>
                  </div>
                )}
                {member.emergencyPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{member.emergencyPhone}</span>
                  </div>
                )}
                <button
                  onClick={() => setEditingEmergency(true)}
                  className="w-full mt-2 py-2 px-3 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/50 flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  {member.emergencyContact ? "Bearbeiten" : "Hinzufügen"}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

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
        <p className="text-xs text-muted-foreground">
          Member App · Version 1.1
        </p>
      </footer>
    </div>
  );
}
