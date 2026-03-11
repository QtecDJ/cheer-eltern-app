"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Users, CalendarDays, Target, Dumbbell, Package, Plus, Trash2 } from "lucide-react";
import RichTextEditor from "./RichTextEditor";

export default function PlannerForm({ currentUserId, teams = [] }: { currentUserId?: number; teams?: { id: number; name: string }[] }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState<string[]>([]);
  const [drills, setDrills] = useState<Array<{ name: string; duration?: number }>>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [upcomingTrainings, setUpcomingTrainings] = useState<Array<{ id: number; title: string; date: string; location?: string; team?: any }>>([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState<number | null>(null);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUpcomingError(null);
    if (!teamId) {
      setUpcomingTrainings([]);
      setSelectedTrainingId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/coaches/upcoming-trainings?teamId=${teamId}`);
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          if (!cancelled) { setUpcomingTrainings([]); setUpcomingError(text || 'Fehler beim Laden'); }
          return;
        }
        const j = await res.json();
        if (!cancelled) { setUpcomingTrainings(j.trainings || []); setSelectedTrainingId(null); }
      } catch (e: any) {
        if (!cancelled) { setUpcomingTrainings([]); setUpcomingError(String(e.message || e)); }
      }
    })();
    return () => { cancelled = true; };
  }, [teamId]);

  useEffect(() => {
    if (selectedTrainingId == null) return;
    const t = upcomingTrainings.find((x: any) => x.id === selectedTrainingId);
    if (t) setDate(t.date);
  }, [selectedTrainingId, upcomingTrainings]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = {
        date: date || new Date().toISOString(),
        description: description || null,
        objectives: objectives.filter(Boolean).length ? objectives.filter(Boolean) : null,
        drills: drills.filter(d => d.name).length ? drills.filter(d => d.name) : null,
        materials: materials.filter(Boolean).length ? materials.filter(Boolean) : null,
        teamId: teamId === '' ? null : Number(teamId),
      };
      const res = await fetch('/api/coaches/training-plans', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Fehler beim Erstellen');
      router.replace('/coaches/training-plans');
    } catch (err: any) {
      setError(err?.message || 'Fehler beim Erstellen');
      setLoading(false);
    }
  }

  return (
    <div className="px-4 md:px-6 pt-6 pb-24 md:pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <header className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/coaches/training-plans')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Übersicht
        </button>
        <h1 className="text-2xl font-bold">Neuer Trainingsplan</h1>
        <p className="text-sm text-muted-foreground mt-1">Erstelle einen Plan für ein bevorstehendes Training</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Team */}
        <Card padding="md" className="shadow-sm">
          <label className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Users className="w-4 h-4 text-primary" />
            Team
          </label>
          <select
            value={teamId}
            onChange={e => { setTeamId(e.target.value); setSelectedTrainingId(null); }}
            className="w-full p-3 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="">— Kein Team —</option>
            {teams.map((t: any) => (
              <option key={t.id} value={String(t.id)}>{t.name}</option>
            ))}
          </select>
        </Card>

        {/* Training verknüpfen */}
        <Card padding="md" className="shadow-sm">
          <label className="flex items-center gap-2 text-sm font-semibold mb-3">
            <CalendarDays className="w-4 h-4 text-primary" />
            Training verknüpfen
            <span className="ml-auto text-xs font-normal text-muted-foreground">optional</span>
          </label>
          {!teamId ? (
            <p className="text-sm text-muted-foreground">Wähle zuerst ein Team, um kommende Trainings zu sehen.</p>
          ) : (
            <>
              <select
                value={selectedTrainingId ?? ''}
                onChange={e => setSelectedTrainingId(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-3 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">— Kein Training verknüpfen —</option>
                {upcomingTrainings.map((t: any) => (
                  <option key={t.id} value={String(t.id)}>
                    {`${t.title} — ${new Date(t.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })} ${new Date(t.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`}
                  </option>
                ))}
              </select>
              {upcomingError && (
                <p className="mt-2 text-sm text-red-600">{upcomingError}</p>
              )}
              {!upcomingError && upcomingTrainings.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">Keine kommenden Trainings gefunden.</p>
              )}
              {selectedTrainingId != null && (
                <p className="mt-2 text-xs text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg">
                  📅 Datum wird vom gewählten Training übernommen.
                </p>
              )}
            </>
          )}
        </Card>

        {/* Beschreibung */}
        <Card padding="md" className="shadow-sm">
          <label className="block text-sm font-semibold mb-3">Beschreibung</label>
          <RichTextEditor value={description} onChange={setDescription} />
        </Card>

        {/* Ziele */}
        <Card padding="md" className="shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Ziele</span>
            <span className="ml-auto text-xs text-muted-foreground">optional</span>
          </div>
          <div className="space-y-2">
            {objectives.map((o, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  value={o}
                  onChange={e => { const c = [...objectives]; c[idx] = e.target.value; setObjectives(c); }}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                  placeholder={`Ziel ${idx + 1}`}
                  className="flex-1 p-3 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setObjectives(objectives.filter((_, i) => i !== idx))}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setObjectives([...objectives, ''])}
              className="flex items-center gap-2 text-sm text-primary hover:bg-primary/10 px-3 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Ziel hinzufügen
            </button>
          </div>
        </Card>

        {/* Drills */}
        <Card padding="md" className="shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Drills</span>
            <span className="ml-auto text-xs text-muted-foreground">optional</span>
          </div>
          <div className="space-y-2">
            {drills.map((d, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  value={d.name}
                  onChange={e => { const c = [...drills]; c[idx] = { ...c[idx], name: e.target.value }; setDrills(c); }}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                  placeholder="Name"
                  className="flex-1 p-3 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <input
                  value={d.duration ?? ''}
                  onChange={e => { const v = e.target.value === '' ? undefined : Number(e.target.value); const c = [...drills]; c[idx] = { ...c[idx], duration: v }; setDrills(c); }}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                  placeholder="Min"
                  type="number"
                  min={1}
                  className="w-20 p-3 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setDrills(drills.filter((_, i) => i !== idx))}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setDrills([...drills, { name: '', duration: undefined }])}
              className="flex items-center gap-2 text-sm text-primary hover:bg-primary/10 px-3 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Drill hinzufügen
            </button>
          </div>
        </Card>

        {/* Material */}
        <Card padding="md" className="shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Material</span>
            <span className="ml-auto text-xs text-muted-foreground">optional</span>
          </div>
          <div className="space-y-2">
            {materials.map((m, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  value={m}
                  onChange={e => { const c = [...materials]; c[idx] = e.target.value; setMaterials(c); }}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                  placeholder={`Material ${idx + 1}`}
                  className="flex-1 p-3 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMaterials(materials.filter((_, i) => i !== idx))}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setMaterials([...materials, ''])}
              className="flex items-center gap-2 text-sm text-primary hover:bg-primary/10 px-3 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Material hinzufügen
            </button>
          </div>
        </Card>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Erstelle...' : 'Plan erstellen'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/coaches/training-plans')}
            className="py-3 px-4 border border-border rounded-xl hover:bg-muted/20 transition-colors text-sm"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}
