"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, Clock, AlertTriangle, Flag, User, Calendar, 
  ArrowLeft, Trash2, Send, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

function getPriorityBadge(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'high':
      return <Badge variant="danger" className="flex items-center gap-1"><Flag className="w-3 h-3" />Hoch</Badge>;
    case 'medium':
      return <Badge variant="warning" className="flex items-center gap-1"><Flag className="w-3 h-3" />Mittel</Badge>;
    case 'low':
      return <Badge variant="info" className="flex items-center gap-1"><Flag className="w-3 h-3" />Niedrig</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
}

function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case 'done':
      return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Erledigt</Badge>;
    case 'in_progress':
      return <Badge variant="info" className="flex items-center gap-1"><Clock className="w-3 h-3" />In Arbeit</Badge>;
    case 'pending':
      return <Badge variant="warning" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Ausstehend</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function TodoDetail({ todo, currentUserId, roles }: { todo: any; currentUserId: number; roles?: string[] }) {
  const router = useRouter();
  const [item, setItem] = useState<any>(todo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const descriptionRef = React.useRef<HTMLDivElement>(null);

  async function saveChanges(changes: any) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/todos/${item.id}`, { method: 'PATCH', body: JSON.stringify(changes), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Fehler');
      setItem(json.todo);
    } catch (e: any) {
      setError(e?.message || 'Fehler');
    } finally { setSaving(false); }
  }

  async function markDone() { await saveChanges({ status: 'done' }); }

  async function handleDelete() {
    if (!confirm('Aufgabe wirklich löschen?')) return;
    try {
      const res = await fetch(`/api/admin/todos/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      router.push('/admin/todos');
    } catch (e) { console.error(e); alert('Löschen fehlgeschlagen'); }
  }
  const [comments, setComments] = useState<any[]>(item.comments || []);
  const isAdmin = (roles || []).map((r:any)=>(r||'').toString().toLowerCase()).includes('admin') || (roles || []).map((r:any)=>(r||'').toString().toLowerCase()).includes('orga');
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);

  async function postReply() {
    if (!reply.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/admin/todos/${item.id}/reply`, { method: 'POST', body: JSON.stringify({ body: reply.trim() }), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Fehler');
      setComments((s) => [...s, { ...json.comment, author: { id: json.comment.authorId, firstName: (json.comment.author?.firstName || null), lastName: (json.comment.author?.lastName || null) } }]);
      setReply("");
    } catch (e) { console.error(e); alert('Fehler beim Posten'); }
    finally { setPosting(false); }
  }

  // Handle checkbox changes in the description
  useEffect(() => {
    if (!descriptionRef.current) return;
    
    const checkboxes = descriptionRef.current.querySelectorAll('input[type="checkbox"]');
    const handleCheckboxChange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      // Update the HTML content
      if (descriptionRef.current) {
        await saveChanges({ description: descriptionRef.current.innerHTML });
      }
    };
    
    checkboxes.forEach(cb => {
      cb.addEventListener('change', handleCheckboxChange);
    });
    
    return () => {
      checkboxes.forEach(cb => {
        cb.removeEventListener('change', handleCheckboxChange);
      });
    };
  }, [item.description]);

  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'done';

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 md:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <button 
          onClick={() => router.push('/admin/todos')} 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Übersicht
        </button>
        <h1 className="text-2xl md:text-3xl font-bold">Aufgaben-Details</h1>
      </header>

      {/* Main Card */}
      <Card padding="lg" className={cn(
        "mb-4",
        isOverdue && "border-red-500/30 bg-red-500/5"
      )}>
        <div className="space-y-4">
          {/* Title & Status */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <h2 className="text-2xl font-bold flex-1">{item.title}</h2>
            <div className="flex gap-2">
              {getStatusBadge(item.status)}
              {getPriorityBadge(item.priority)}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div 
              ref={descriptionRef}
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.description) }}
            />
          )}

          {/* Meta Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Erstellt von:</span>
              <span className="font-medium">{item.creator?.firstName ? `${item.creator.firstName} ${item.creator.lastName}` : item.creator?.name}</span>
            </div>
            
            {item.assignee && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Zugewiesen an:</span>
                <span className="font-medium">{item.assignee.firstName || item.assignee.name}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Erstellt am:</span>
              <span className="font-medium">{new Date(item.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            
            {item.dueDate && (
              <div className={cn(
                "flex items-center gap-2 text-sm",
                isOverdue && "text-red-500 font-semibold"
              )}>
                <Calendar className="w-4 h-4" />
                <span className={isOverdue ? "" : "text-muted-foreground"}>Fällig am:</span>
                <span className="font-medium">{new Date(item.dueDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                {isOverdue && <Badge variant="danger" size="sm">Überfällig</Badge>}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card padding="sm" className="mb-4 bg-red-500/10 border-red-500/30">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {/* Action Buttons */}
      <Card padding="sm" className="mb-6">
        <div className="flex flex-wrap gap-2">
          {((item.creator?.id === currentUserId) || isAdmin) && item.status !== 'done' && (
            <button 
              onClick={markDone} 
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Als erledigt markieren
            </button>
          )}
          {((item.creator?.id === currentUserId) || isAdmin) && (
            <button 
              onClick={handleDelete} 
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Löschen
            </button>
          )}
        </div>
      </Card>

      {/* Comments Section */}
      <Card padding="lg">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Diskussion ({comments.length})
          </h3>
          
          {/* Comments List */}
          <div className="space-y-3">
            {comments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Noch keine Kommentare vorhanden.</p>
            )}
            {comments.map((c, i) => (
              <Card key={c.id ?? i} padding="sm" variant="outline">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {c.author?.firstName ? `${c.author.firstName} ${c.author.lastName || ''}` : c.author?.name || 'Mitglied'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Reply Form */}
          <div className="pt-4 border-t border-border/50">
            <textarea 
              value={reply} 
              onChange={(e) => setReply(e.target.value)} 
              placeholder="Schreibe einen Kommentar..." 
              className="w-full p-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all" 
              rows={3} 
            />
            <div className="flex gap-2 mt-3">
              <button 
                onClick={postReply} 
                disabled={posting || !reply.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {posting ? 'Wird gesendet...' : 'Kommentar senden'}
              </button>
              {reply && (
                <button 
                  onClick={() => setReply('')}
                  className="px-4 py-2 bg-muted/30 hover:bg-muted/50 rounded-lg font-medium transition-colors"
                >
                  Abbrechen
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
