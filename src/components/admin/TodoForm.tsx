"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Staff = { id: number; firstName?: string | null; lastName?: string | null; name?: string | null };

function renderPreview(md: string) {
  let out = md
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");
  return out;
}

export default function TodoForm({ currentUserId }: { currentUserId?: number }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const charCount = useMemo(() => description.length, [description]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/staff');
        if (!res.ok) return;
        const json = await res.json();
        if (mounted) setStaff(json.staff || []);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  function addTag() {
    // tags removed per requirements
  }

  // tags removed per requirements

  function addSubtask() {
    const s = subtaskInput.trim();
    if (!s) return;
    setSubtasks((p) => [...p, s]);
    setSubtaskInput("");
  }

  function removeSubtask(idx: number) { setSubtasks((p) => p.filter((_, i) => i !== idx)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Titel benötigt");
    setLoading(true);
    try {
      const body = { title: title.trim(), description: description.trim() || null, priority, dueDate: dueDate || null, subtasks, creatorId: currentUserId, assigneeId: null };
      const res = await fetch('/api/admin/todos', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Fehler');
      // brief success UI then redirect
      router.replace('/admin/todos');
    } catch (err: any) {
      setError(err?.message || 'Fehler beim Erstellen');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto px-4">
      <div>
        <label className="block text-sm font-medium">Titel</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kurze aussagekräftige Überschrift" className="w-full p-3 border rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Beschreibung (Markdown)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border rounded h-40 resize-vertical" rows={6} />
          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
            <div>Zeichen: {charCount}</div>
            <div>
              <button type="button" onClick={() => setShowPreview(s => !s)} className="text-sm text-primary underline">{showPreview ? 'Bearbeiten' : 'Vorschau'}</button>
            </div>
          </div>
          {showPreview && <div className="mt-2 p-3 border rounded bg-gray-50 text-sm" dangerouslySetInnerHTML={{ __html: renderPreview(description) }} />}
        </div>

        <div>
          <label className="block text-sm font-medium">Meta</label>
          <div className="mt-2 space-y-3">
            <div>
              <div className="text-xs mb-1">Priorität</div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setPriority('low')} className={`py-1 px-3 rounded ${priority==='low' ? 'bg-green-200' : 'bg-muted/10'}`}>Niedrig</button>
                <button type="button" onClick={() => setPriority('normal')} className={`py-1 px-3 rounded ${priority==='normal' ? 'bg-blue-200' : 'bg-muted/10'}`}>Normal</button>
                <button type="button" onClick={() => setPriority('high')} className={`py-1 px-3 rounded ${priority==='high' ? 'bg-orange-200' : 'bg-muted/10'}`}>Hoch</button>
                <button type="button" onClick={() => setPriority('urgent')} className={`py-1 px-3 rounded ${priority==='urgent' ? 'bg-red-400 text-white' : 'bg-muted/10'}`}>Dringend</button>
              </div>
            </div>

            <div>
              <label className="text-xs">Fällig</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full p-2 border rounded mt-1" />
            </div>

            {/* assignment and tags removed per requirements */}

            <div>
              <label className="text-xs">Subtasks</label>
              <div className="flex gap-2 mt-1">
                <input value={subtaskInput} onChange={(e) => setSubtaskInput(e.target.value)} placeholder="Unteraufgabe" className="p-2 border rounded flex-1" />
                <button type="button" onClick={addSubtask} className="py-1 px-3 bg-primary text-white rounded">Hinzufügen</button>
              </div>
              <div className="mt-2 space-y-2">
                {subtasks.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-card p-2 rounded">
                    <div className="text-sm">{s}</div>
                    <button type="button" onClick={() => removeSubtask(i)} className="text-xs text-red-600">Entfernen</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex flex-col sm:flex-row gap-2">
        <button type="submit" disabled={loading} className="w-full sm:w-auto py-2 px-4 bg-primary text-white rounded">{loading ? "Erzeuge..." : "Erstellen"}</button>
        <button type="button" className="w-full sm:w-auto py-2 px-4 bg-muted/30 rounded" onClick={() => router.push('/admin/todos')}>Abbrechen</button>
      </div>
    </form>
  );
}
