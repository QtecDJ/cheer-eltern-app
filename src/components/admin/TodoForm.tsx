"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X, Eye, Edit, Flag, Calendar, CheckSquare, User, Bold, Italic, List, Type, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Staff = { id: number; firstName?: string | null; lastName?: string | null; name?: string | null };
type CheckboxItem = { id: number; text: string };

export default function TodoForm({ currentUserId }: { currentUserId?: number }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const charCount = useMemo(() => description.replace(/<[^>]*>/g, '').length, [description]);
  const editorRef = React.useRef<HTMLDivElement>(null);
  
  // Checkbox Modal State
  const [showCheckboxModal, setShowCheckboxModal] = useState(false);
  const [checkboxItems, setCheckboxItems] = useState<CheckboxItem[]>([{ id: 1, text: '' }]);
  const [nextCheckboxId, setNextCheckboxId] = useState(2);

  useEffect(() => {
    if (editorRef.current && !description) {
      editorRef.current.innerHTML = '';
    }
  }, [description]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/staff');
        if (!res.ok) return;
        const json = await res.json();
        if (mounted) setStaff(json.users || json.staff || []);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  function addCheckbox() {
    setShowCheckboxModal(true);
  }
  
  function addCheckboxItem() {
    setCheckboxItems([...checkboxItems, { id: nextCheckboxId, text: '' }]);
    setNextCheckboxId(nextCheckboxId + 1);
  }
  
  function removeCheckboxItem(id: number) {
    if (checkboxItems.length > 1) {
      setCheckboxItems(checkboxItems.filter(item => item.id !== id));
    }
  }
  
  function updateCheckboxItemText(id: number, text: string) {
    setCheckboxItems(checkboxItems.map(item => 
      item.id === id ? { ...item, text } : item
    ));
  }
  
  function insertCheckboxes() {
    if (!editorRef.current) return;
    
    // Filter out empty items
    const validItems = checkboxItems.filter(item => item.text.trim());
    if (validItems.length === 0) {
      setShowCheckboxModal(false);
      return;
    }
    
    // Create container for all checkboxes
    const container = document.createElement('div');
    
    validItems.forEach((item, index) => {
      const checkboxLine = document.createElement('div');
      checkboxLine.className = 'flex items-start gap-2 my-2';
      checkboxLine.contentEditable = 'false';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'mt-1 w-4 h-4 rounded border-border flex-shrink-0';
      
      const textSpan = document.createElement('span');
      textSpan.contentEditable = 'true';
      textSpan.className = 'flex-1 outline-none';
      textSpan.textContent = item.text;
      
      checkboxLine.appendChild(checkbox);
      checkboxLine.appendChild(textSpan);
      container.appendChild(checkboxLine);
    });
    
    // Insert at cursor or at end
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    
    if (range) {
      const br = document.createElement('br');
      range.insertNode(br);
      range.setStartAfter(br);
      range.insertNode(container);
      
      const brAfter = document.createElement('br');
      range.setStartAfter(container);
      range.insertNode(brAfter);
      range.setStartAfter(brAfter);
      range.collapse(true);
    } else {
      editorRef.current.appendChild(container);
      editorRef.current.appendChild(document.createElement('br'));
    }
    
    updateDescription();
    
    // Reset modal
    setCheckboxItems([{ id: 1, text: '' }]);
    setNextCheckboxId(2);
    setShowCheckboxModal(false);
  }
  
  function cancelCheckboxModal() {
    setCheckboxItems([{ id: 1, text: '' }]);
    setNextCheckboxId(2);
    setShowCheckboxModal(false);
  }

  function formatText(command: string) {
    document.execCommand(command, false);
    editorRef.current?.focus();
    updateDescription();
  }

  function updateDescription() {
    if (editorRef.current) {
      setDescription(editorRef.current.innerHTML);
    }
  }

  function handleEditorInput() {
    updateDescription();
  }
  
  function handleEditorKeyDown(e: React.KeyboardEvent) {
    // Allow normal text editing
    if (e.key === 'Enter') {
      // Let the default behavior work for line breaks
      setTimeout(updateDescription, 0);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Titel wird benötigt");
    setLoading(true);
    try {
      const body = { title: title.trim(), description: description.trim() || null, priority, dueDate: dueDate || null, creatorId: currentUserId, assigneeId };
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

  const priorityOptions = [
    { value: 'low', label: 'Niedrig', color: 'bg-blue-500/20 border-blue-500/50 text-blue-600', icon: <Flag className="w-3.5 h-3.5" /> },
    { value: 'medium', label: 'Mittel', color: 'bg-amber-500/20 border-amber-500/50 text-amber-600', icon: <Flag className="w-3.5 h-3.5" /> },
    { value: 'high', label: 'Hoch', color: 'bg-red-500/20 border-red-500/50 text-red-600', icon: <Flag className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 md:pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <button 
          onClick={() => router.push('/admin/todos')} 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Übersicht
        </button>
        <h1 className="text-2xl md:text-3xl font-bold">Neue Aufgabe erstellen</h1>
        <p className="text-sm text-muted-foreground mt-1">Erstelle eine neue Aufgabe für dein Team</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title - Full Width */}
        <Card padding="md" className="shadow-sm">
          <label className="block text-sm font-semibold mb-2.5 flex items-center gap-2">
            <span className="text-primary">*</span>
            Titel
          </label>
          <input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="z.B. Trainingsplan für nächste Woche erstellen" 
            className="w-full p-3 text-base border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/50"
            required
          />
        </Card>

        {/* Description - Full Width */}
        <Card padding="md" className="shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-sm font-semibold">Beschreibung</label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">{charCount} Zeichen</span>
            </div>
          </div>
          
          {/* Editor Toolbar */}
          <div className="flex flex-wrap gap-1 mb-2 p-2 bg-muted/10 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => formatText('bold')}
              className="p-2 hover:bg-muted/50 rounded transition-colors"
              title="Fett"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => formatText('italic')}
              className="p-2 hover:bg-muted/50 rounded transition-colors"
              title="Kursiv"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => formatText('insertUnorderedList')}
              className="p-2 hover:bg-muted/50 rounded transition-colors"
              title="Liste"
            >
              <List className="w-4 h-4" />
            </button>
            <div className="w-px bg-border mx-1" />
            <button
              type="button"
              onClick={addCheckbox}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
              title="Checkbox hinzufügen"
            >
              <CheckSquare className="w-4 h-4" />
              <span className="text-xs font-medium">Checkbox</span>
            </button>
          </div>

          {/* ContentEditable Editor */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            onKeyDown={handleEditorKeyDown}
            className="min-h-[200px] p-4 text-base border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
            data-placeholder="Detaillierte Beschreibung der Aufgabe..."
            suppressContentEditableWarning
          />
          
          <p className="text-xs text-muted-foreground mt-2">
            💡 Nutze die Toolbar für Formatierung und Checkboxen
          </p>
        </Card>

        {/* Priority & Due Date - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card padding="md" className="shadow-sm">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Flag className="w-4 h-4 text-primary" />
              Priorität
            </label>
            <div className="space-y-2">
              {priorityOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm",
                    priority === opt.value 
                      ? opt.color + " shadow-sm scale-[1.02]" 
                      : "bg-card border-border/50 hover:bg-muted/20 hover:border-border"
                  )}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </Card>

          <Card padding="md" className="shadow-sm">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              Fälligkeitsdatum
            </label>
            <input 
              type="date" 
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)} 
              className="w-full p-3 text-base border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {dueDate && (
              <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted/20 rounded-lg">
                📅 Fällig: {new Date(dueDate).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            )}
          </Card>
        </div>

        {/* Assignee & Checkbox Helper - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card padding="md" className="shadow-sm">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <User className="w-4 h-4 text-primary" />
              Zuweisen an
            </label>
            <select
              value={assigneeId ?? ""}
              onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : null)}
              className="w-full p-3 text-base border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="">Niemand (nicht zugewiesen)</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.name || `User ${s.id}`}
                </option>
              ))}
            </select>
            {assigneeId && (
              <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted/20 rounded-lg">
                💼 Die zugewiesene Person erhält eine Nachricht
              </p>
            )}
          </Card>

          <Card padding="md" className="shadow-sm">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <CheckSquare className="w-4 h-4 text-primary" />
              Checkliste erstellen
            </label>
            <p className="text-sm text-muted-foreground mb-3">
              Nutze den Checkbox-Button in der Toolbar, um interaktive Checkboxen zur Beschreibung hinzuzufügen.
            </p>
            <div className="p-3 bg-muted/10 rounded-lg border border-dashed border-border text-center">
              <CheckSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Klicke auf "Checkbox" in der Toolbar oben
              </p>
            </div>
          </Card>
        </div>

        {/* Error */}
        {error && (
          <Card padding="sm" className="bg-red-500/10 border-red-500/30">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button 
            type="submit" 
            disabled={loading || !title.trim()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 rounded-xl text-primary-foreground font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            {loading ? "Wird erstellt..." : "Aufgabe erstellen"}
          </button>
          <button 
            type="button" 
            onClick={() => router.push('/admin/todos')}
            className="px-6 py-3 bg-card hover:bg-muted/50 rounded-xl font-semibold border border-border transition-all hover:border-border/80"
          >
            Abbrechen
          </button>
        </div>
      </form>
      
      {/* Checkbox Modal */}
      {showCheckboxModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={cancelCheckboxModal}>
          <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Checkliste erstellen</h2>
                  <p className="text-sm text-muted-foreground">Füge mehrere Aufgaben hinzu</p>
                </div>
              </div>
              <button
                onClick={cancelCheckboxModal}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {checkboxItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 p-3 bg-muted/30 rounded-lg border border-border">
                    <CheckSquare className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => updateCheckboxItemText(item.id, e.target.value)}
                      placeholder={`Aufgabe ${index + 1}`}
                      className="flex-1 bg-transparent outline-none"
                      autoFocus={index === checkboxItems.length - 1}
                    />
                  </div>
                  {checkboxItems.length > 1 && (
                    <button
                      onClick={() => removeCheckboxItem(item.id)}
                      className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                      title="Entfernen"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                onClick={addCheckboxItem}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-lg transition-colors text-muted-foreground hover:text-primary"
              >
                <Plus className="w-5 h-5" />
                Weitere Aufgabe hinzufügen
              </button>
            </div>
            
            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-border">
              <button
                onClick={cancelCheckboxModal}
                className="flex-1 px-4 py-3 bg-card hover:bg-muted/50 rounded-xl font-semibold border border-border transition-all"
              >
                Abbrechen
              </button>
              <button
                onClick={insertCheckboxes}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-sm transition-all hover:shadow-md"
              >
                Einfügen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
