"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Heart,
  Key,
  Loader2,
  Mail,
  Phone,
  Pill,
  Save,
  Shield,
  User,
  X,
} from "lucide-react";
import { updateEmail, updatePassword, updateEmergencyContact, updateHealthInfo } from "@/app/profil/actions";

interface EinstellungenContentProps {
  member: {
    id: number;
    email: string | null;
    emergencyContact: string | null;
    emergencyPhone: string | null;
    emergencyContact2: string | null;
    emergencyPhone2: string | null;
    allergies: string | null;
    diseases: string | null;
    medications: string | null;
  };
}

export function EinstellungenContent({ member }: EinstellungenContentProps) {
  const router = useRouter();
  
  // Collapsible State
  const [emergencyExpanded, setEmergencyExpanded] = useState(false);
  
  // Edit States
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [editingEmergency, setEditingEmergency] = useState(false);
  const [editingHealth, setEditingHealth] = useState(false);
  
  // Loading States
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingEmergency, setSavingEmergency] = useState(false);
  const [savingHealth, setSavingHealth] = useState(false);
  
  // Message States
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emergencyMessage, setEmergencyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [healthMessage, setHealthMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingEmail(true);
    setEmailMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await updateEmail(formData);
    
    if (result.success) {
      setEmailMessage({ type: "success", text: "E-Mail gespeichert!" });
      setEditingEmail(false);
      router.refresh();
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
      setEmergencyMessage({ type: "success", text: "Notfallkontakte gespeichert!" });
      setEditingEmergency(false);
      router.refresh();
    } else {
      setEmergencyMessage({ type: "error", text: result.error || "Fehler" });
    }
    setSavingEmergency(false);
  }

  async function handleHealthSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingHealth(true);
    setHealthMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await updateHealthInfo(formData);
    
    if (result.success) {
      setHealthMessage({ type: "success", text: "Gesundheitsinfos gespeichert!" });
      setEditingHealth(false);
      router.refresh();
    } else {
      setHealthMessage({ type: "error", text: result.error || "Fehler" });
    }
    setSavingHealth(false);
  }

  // Check if any emergency/health info exists
  const hasEmergencyInfo = member.emergencyContact || member.emergencyPhone || 
    member.emergencyContact2 || member.emergencyPhone2;
  const hasHealthInfo = member.allergies || member.diseases || member.medications;

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 md:pb-8 max-w-lg md:max-w-3xl mx-auto">
      <header className="mb-6 animate-fade-in">
        <button onClick={() => router.back()} className="text-primary text-sm mb-2 hover:underline">
          ← Zurück
        </button>
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground mt-1">Konto & Gesundheit</p>
      </header>

      {/* E-Mail & Passwort - Konto-Einstellungen */}
      <section className="mb-6 animate-slide-up stagger-1">
        <CardHeader className="px-0">
          <CardTitle size="lg" className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Konto-Einstellungen
          </CardTitle>
        </CardHeader>

        <div className="space-y-3">
          {/* E-Mail */}
          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-blue-500" />
                <h3 className="font-semibold text-sm">E-Mail-Adresse</h3>
              </div>
              
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
                  <span className="text-sm">{member.email}</span>
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

          {/* Passwort */}
          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Passwort</h3>
              </div>
              
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
        </div>
      </section>

      {/* Wichtige Informationen (Notfall & Gesundheit) */}
      <section className="mb-6 animate-slide-up stagger-3">
        <CardHeader className="px-0">
          <CardTitle size="lg" className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Notfall & Gesundheit
          </CardTitle>
        </CardHeader>
        
        <button
          onClick={() => setEmergencyExpanded(!emergencyExpanded)}
          className="w-full"
        >
          <Card className={`border-l-4 ${hasEmergencyInfo || hasHealthInfo ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-semibold text-sm">
                    {hasEmergencyInfo || hasHealthInfo 
                      ? "Informationen hinterlegt" 
                      : "Bitte ausfüllen"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Notfallkontakte & Gesundheitsinfos
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(!hasEmergencyInfo || !hasHealthInfo) && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                  {emergencyExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </button>

        {/* Aufklappbarer Inhalt */}
        {emergencyExpanded && (
          <div className="mt-3 space-y-4 animate-fade-in">
            {/* Notfallkontakt 1 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-500" />
                  Notfallkontakt 1
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
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
                  <form onSubmit={handleEmergencySubmit} className="space-y-4">
                    {/* Kontakt 1 */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">1. Notfallkontakt</p>
                      <input
                        type="text"
                        name="emergencyContact"
                        placeholder="Name (z.B. Mama)"
                        defaultValue={member.emergencyContact || ""}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                      <input
                        type="tel"
                        name="emergencyPhone"
                        placeholder="Telefonnummer"
                        defaultValue={member.emergencyPhone || ""}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    
                    {/* Kontakt 2 */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground">2. Notfallkontakt</p>
                      <input
                        type="text"
                        name="emergencyContact2"
                        placeholder="Name (z.B. Papa)"
                        defaultValue={member.emergencyContact2 || ""}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                      <input
                        type="tel"
                        name="emergencyPhone2"
                        placeholder="Telefonnummer"
                        defaultValue={member.emergencyPhone2 || ""}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
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
                  <div className="space-y-3">
                    {/* Anzeige Kontakt 1 */}
                    {member.emergencyContact && (
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-medium">{member.emergencyContact}</span>
                        </div>
                        {member.emergencyPhone && (
                          <a href={`tel:${member.emergencyPhone}`} className="flex items-center gap-2 text-primary">
                            <Phone className="w-3 h-3" />
                            <span className="text-sm">{member.emergencyPhone}</span>
                          </a>
                        )}
                      </div>
                    )}
                    
                    {/* Anzeige Kontakt 2 */}
                    {member.emergencyContact2 && (
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-medium">{member.emergencyContact2}</span>
                        </div>
                        {member.emergencyPhone2 && (
                          <a href={`tel:${member.emergencyPhone2}`} className="flex items-center gap-2 text-primary">
                            <Phone className="w-3 h-3" />
                            <span className="text-sm">{member.emergencyPhone2}</span>
                          </a>
                        )}
                      </div>
                    )}
                    
                    {!member.emergencyContact && !member.emergencyContact2 && (
                      <p className="text-sm text-muted-foreground">Keine Notfallkontakte hinterlegt</p>
                    )}
                    
                    <button
                      onClick={() => setEditingEmergency(true)}
                      className="w-full py-2 px-3 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/50 flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      {member.emergencyContact ? "Bearbeiten" : "Hinzufügen"}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gesundheitsinformationen */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  Gesundheitsinformationen
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {healthMessage && (
                  <div className={`mb-3 p-2 rounded-lg text-sm ${
                    healthMessage.type === "success" 
                      ? "bg-emerald-500/10 text-emerald-600" 
                      : "bg-red-500/10 text-red-600"
                  }`}>
                    {healthMessage.text}
                  </div>
                )}
                
                {editingHealth ? (
                  <form onSubmit={handleHealthSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                        <AlertTriangle className="w-3 h-3" />
                        Allergien
                      </label>
                      <textarea
                        name="allergies"
                        placeholder="z.B. Nüsse, Pollen, Hausstaub..."
                        defaultValue={member.allergies || ""}
                        rows={2}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                        <Heart className="w-3 h-3" />
                        Krankheiten / Besonderheiten
                      </label>
                      <textarea
                        name="diseases"
                        placeholder="z.B. Asthma, Diabetes, ADHS..."
                        defaultValue={member.diseases || ""}
                        rows={2}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                        <Pill className="w-3 h-3" />
                        Medikamente
                      </label>
                      <textarea
                        name="medications"
                        placeholder="z.B. Notfallspray, Tabletten..."
                        defaultValue={member.medications || ""}
                        rows={2}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={savingHealth}
                        className="flex-1 py-2 px-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {savingHealth ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Speichern
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingHealth(false)}
                        className="py-2 px-3 bg-muted text-muted-foreground text-sm font-medium rounded-lg hover:bg-muted/80"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
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
                    
                    {!member.allergies && !member.diseases && !member.medications && (
                      <p className="text-sm text-muted-foreground">Keine Gesundheitsinformationen hinterlegt</p>
                    )}
                    
                    <button
                      onClick={() => setEditingHealth(true)}
                      className="w-full py-2 px-3 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/50 flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      {hasHealthInfo ? "Bearbeiten" : "Hinzufügen"}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
