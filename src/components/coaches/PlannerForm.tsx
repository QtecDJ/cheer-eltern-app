"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlannerForm({ currentUserId }: { currentUserId?: number }) {
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
  const [loading, setLoading] = useState(false);

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
        <label className="block text-sm">Datum (ISO)</label>
        <input value={date} onChange={e=>setDate(e.target.value)} placeholder="2026-02-01T18:00:00Z" className="w-full p-2 border rounded" />
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
