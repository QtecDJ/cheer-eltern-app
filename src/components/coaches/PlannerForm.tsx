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
  const [objectives, setObjectives] = useState("");
  const [drills, setDrills] = useState("");
  const [materials, setMaterials] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = { title, date, startAt: startAt||null, endAt: endAt||null, location: location||null, description: description||null, objectives: objectives? JSON.parse(objectives) : null, drills: drills? JSON.parse(drills) : null, materials: materials? JSON.parse(materials) : null };
      const res = await fetch('/api/coaches/training-plans', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Fehler');
      router.replace('/coaches/training-plans');
    } catch (err:any) {
      alert(err?.message || 'Fehler beim Erstellen');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm">Titel</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm">Datum (ISO)</label>
        <input value={date} onChange={e=>setDate(e.target.value)} placeholder="2026-02-01T18:00:00Z" className="w-full p-2 border rounded" />
      </div>
      <div className="grid grid-cols-2 gap-2">
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
        <label className="block text-sm">Ziele (JSON array)</label>
        <textarea value={objectives} onChange={e=>setObjectives(e.target.value)} placeholder='["Warmup", "Drill 1"]' className="w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm">Drills (JSON array)</label>
        <textarea value={drills} onChange={e=>setDrills(e.target.value)} placeholder='[{"name":"Pass","duration":10}]' className="w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm">Material (JSON)</label>
        <textarea value={materials} onChange={e=>setMaterials(e.target.value)} placeholder='["Cones","Balls"]' className="w-full p-2 border rounded" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="py-2 px-4 bg-primary text-white rounded">{loading? 'Erzeuge...' : 'Erstellen'}</button>
        <a className="py-2 px-4 bg-muted/30 rounded" href="/coaches/training-plans">Abbrechen</a>
      </div>
    </form>
  );
}
