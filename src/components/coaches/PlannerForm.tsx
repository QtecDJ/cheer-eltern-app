"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlannerForm({ currentUserId, teams = [] }: { currentUserId?: number; teams?: { id: number; name: string }[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState<string[]>([]);
  const [drills, setDrills] = useState<Array<{ name: string; duration?: number }>>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [upcomingTrainings, setUpcomingTrainings] = useState<Array<{ id:number; title:string; date:string; location?: string; team?: any }>>([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState<number | null>(null);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          const text = await res.text().catch(()=> '');
          if (!cancelled) {
            setUpcomingTrainings([]);
            setUpcomingError(text || 'Fehler beim Laden');
          }
          return;
        }
        const j = await res.json();
        if (!cancelled) {
          setUpcomingTrainings(j.trainings || []);
          setSelectedTrainingId(null);
        }
      } catch (e:any) {
        if (!cancelled) setUpcomingTrainings([]);
        if (!cancelled) setUpcomingError(String(e.message || e));
        console.error(e);
      }
    })();
    return () => { cancelled = true; };
  }, [teamId]);

  useEffect(() => {
    if (selectedTrainingId == null) return;
    const t = upcomingTrainings.find((x:any) => x.id === selectedTrainingId);
    if (t) {
      setDate(t.date);
      if (t.location) setLocation(t.location);
    }
  }, [selectedTrainingId, upcomingTrainings]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        title,
        date,
        startAt: startAt || null,
        endAt: endAt || null,
        location: location || null,
        description: description || null,
        objectives: objectives.length ? objectives : null,
        drills: drills.length ? drills : null,
        materials: materials.length ? materials : null,
        teamId: teamId === '' ? null : Number(teamId),
      };
      const res = await fetch('/api/coaches/training-plans', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Fehler');
      router.replace('/coaches/training-plans');
    } catch (err:any) {
      alert(err?.message || 'Fehler beim Erstellen');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto px-2">
      <div>
        <label className="block text-sm">Titel</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm">Training wählen (optional)</label>
        <select value={selectedTrainingId ?? ''} onChange={e => setSelectedTrainingId(e.target.value ? Number(e.target.value) : null)} className="w-full p-2 border rounded">
          <option value="">— Eigenes Datum angeben —</option>
          {upcomingTrainings.map((t:any) => (
            <option key={t.id} value={String(t.id)}>{`${t.title} — ${new Date(t.date).toLocaleString()}${t.team?.name ? ' — Team: ' + t.team.name : ''}${t.location ? ' — ' + t.location : ''}`}</option>
          ))}
        </select>
        {upcomingError ? (
          <div className="mt-2 text-sm text-red-600">{upcomingError}</div>
        ) : upcomingTrainings.length === 0 ? (
          <div className="mt-2 text-sm text-muted-foreground">Keine kommenden Trainings für dieses Team gefunden.</div>
        ) : null}
        {selectedTrainingId == null ? (
          <div className="mt-2">
            <label className="block text-sm">Datum (ISO)</label>
            <input value={date} onChange={e=>setDate(e.target.value)} placeholder="2026-02-01T18:00:00Z" className="w-full p-2 border rounded" />
          </div>
        ) : (
          <div className="mt-2 text-sm text-muted-foreground">Datum & Ort werden vom ausgewählten Training übernommen.</div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label className="block text-sm">Start</label>
          <input value={startAt} onChange={e=>setStartAt(e.target.value)} placeholder="2026-02-01T18:00:00Z" className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm">Ende</label>
          <input value={endAt} onChange={e=>setEndAt(e.target.value)} placeholder="2026-02-01T19:30:00Z" className="w-full p-2 border rounded" />
        </div>
      </div>
      <div>
        <label className="block text-sm">Ort</label>
        <input value={location} onChange={e=>setLocation(e.target.value)} className="w-full p-2 border rounded" />
      </div>

      <div>
        <label className="block text-sm">Team (optional)</label>
        <select value={teamId} onChange={e=>setTeamId(e.target.value)} className="w-full p-2 border rounded">
          <option value="">— Kein Team —</option>
          {teams.map((t:any) => (
            <option key={t.id} value={String(t.id)}>{t.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm">Beschreibung</label>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm">Ziele</label>
        <div className="space-y-2">
          {objectives.map((o, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input value={o} onChange={e=>{
                const copy = [...objectives]; copy[idx] = e.target.value; setObjectives(copy);
              }} className="flex-1 p-2 border rounded" />
              <button type="button" onClick={()=>{ setObjectives(Object.values(objectives).filter((_,i)=>i!==idx)); }} className="px-2 py-1 text-sm text-red-600">Entfernen</button>
            </div>
          ))}
          <div>
            <button type="button" onClick={()=>setObjectives([...objectives, ''])} className="px-3 py-1 bg-muted/20 rounded">+ Ziel hinzufügen</button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm">Drills</label>
        <div className="space-y-2">
          {drills.map((d, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
              <input value={d.name} onChange={e=>{
                const copy = [...drills]; copy[idx] = { ...copy[idx], name: e.target.value }; setDrills(copy);
              }} placeholder="Name" className="col-span-2 p-2 border rounded" />
              <input value={d.duration ?? ''} onChange={e=>{
                const val = e.target.value === '' ? undefined : Number(e.target.value);
                const copy = [...drills]; copy[idx] = { ...copy[idx], duration: val }; setDrills(copy);
              }} placeholder="Min" className="p-2 border rounded" />
              <div className="col-span-3 flex justify-end">
                <button type="button" onClick={()=>setDrills(drills.filter((_,i)=>i!==idx))} className="px-2 py-1 text-red-600">Entfernen</button>
              </div>
            </div>
          ))}
          <div>
            <button type="button" onClick={()=>setDrills([...drills, { name: '', duration: undefined }])} className="px-3 py-1 bg-muted/20 rounded">+ Drill hinzufügen</button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm">Material</label>
        <div className="space-y-2">
          {materials.map((m, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input value={m} onChange={e=>{
                const copy = [...materials]; copy[idx] = e.target.value; setMaterials(copy);
              }} className="flex-1 p-2 border rounded" />
              <button type="button" onClick={()=>setMaterials(materials.filter((_,i)=>i!==idx))} className="px-2 py-1 text-red-600">Entfernen</button>
            </div>
          ))}
          <div>
            <button type="button" onClick={()=>setMaterials([...materials, ''])} className="px-3 py-1 bg-muted/20 rounded">+ Material hinzufügen</button>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="py-2 px-4 bg-primary text-white rounded">{loading? 'Erzeuge...' : 'Erstellen'}</button>
        <a className="py-2 px-4 bg-muted/30 rounded" href="/coaches/training-plans">Abbrechen</a>
      </div>
    </form>
  );
}
