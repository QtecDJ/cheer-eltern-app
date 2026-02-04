"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, Flag, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

function getPriorityIcon(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'high': return <Flag className="w-3.5 h-3.5 text-red-500" />;
    case 'medium': return <Flag className="w-3.5 h-3.5 text-amber-500" />;
    case 'low': return <Flag className="w-3.5 h-3.5 text-blue-500" />;
    default: return <Flag className="w-3.5 h-3.5 text-muted-foreground" />;
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

export default function TodoList({ todos, currentUserId, roles }: { todos: any[]; currentUserId: number; roles?: string[] }) {
  const [items, setItems] = useState<any[]>(todos || []);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date');
  const isAdmin = (roles || []).map(r => (r||'').toString().toLowerCase()).includes('admin') || (roles || []).map(r => (r||'').toString().toLowerCase()).includes('orga');

  async function toggleDone(id: number, status: string) {
    try {
      const res = await fetch(`/api/admin/todos/${id}`, { method: 'PATCH', body: JSON.stringify({ status }), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (res.ok && json.todo) setItems((s) => s.map(it => it.id === id ? json.todo : it));
    } catch (e) { console.error(e); }
  }

  const filteredAndSorted = useMemo(() => {
    let result = items;
    
    // Filter
    if (filter !== 'all') {
      result = result.filter(t => t.status === filter);
    }
    
    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
        const aPriority = a.priority?.toLowerCase() || '';
        const bPriority = b.priority?.toLowerCase() || '';
        return (priorityOrder[bPriority] || 0) - (priorityOrder[aPriority] || 0);
      } else if (sortBy === 'status') {
        return a.status?.localeCompare(b.status || '');
      } else {
        // Sort by date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    return result;
  }, [items, filter, sortBy]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter(t => t.status === 'pending').length,
      inProgress: items.filter(t => t.status === 'in_progress').length,
      done: items.filter(t => t.status === 'done').length,
    };
  }, [items]);

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Gesamt</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
          <div className="text-xs text-muted-foreground">Ausstehend</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
          <div className="text-xs text-muted-foreground">In Arbeit</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-emerald-500">{stats.done}</div>
          <div className="text-xs text-muted-foreground">Erledigt</div>
        </Card>
      </div>

      {/* Filters & Sort */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === 'all' ? "bg-primary text-primary-foreground" : "bg-muted/30 hover:bg-muted/50"
              )}
            >
              Alle ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === 'pending' ? "bg-primary text-primary-foreground" : "bg-muted/30 hover:bg-muted/50"
              )}
            >
              Ausstehend ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === 'in_progress' ? "bg-primary text-primary-foreground" : "bg-muted/30 hover:bg-muted/50"
              )}
            >
              In Arbeit ({stats.inProgress})
            </button>
            <button
              onClick={() => setFilter('done')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === 'done' ? "bg-primary text-primary-foreground" : "bg-muted/30 hover:bg-muted/50"
              )}
            >
              Erledigt ({stats.done})
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sortieren:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 text-sm rounded-lg bg-muted/30 border-0 focus:ring-2 focus:ring-primary"
            >
              <option value="date">Datum</option>
              <option value="priority">Priorität</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Todo List */}
      <div className="space-y-3">
        {filteredAndSorted.map(t => {
          const id = t?.id ?? null;
          const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done';
          
          return (
            <Card 
              key={id ?? `todo-${Math.random()}`} 
              padding="md"
              className={cn(
                "transition-all hover:shadow-md",
                isOverdue && "border-red-500/30 bg-red-500/5"
              )}
            >
              <div className="flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getPriorityIcon(t.priority)}
                      <h3 className="font-semibold text-base truncate">{t.title}</h3>
                    </div>
                    {t.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(t.status)}
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>{t.creator?.firstName ? `${t.creator.firstName} ${t.creator.lastName}` : t.creator?.name}</span>
                  </div>
                  {t.assignee && (
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>→ {t.assignee.firstName || t.assignee.name}</span>
                    </div>
                  )}
                  {t.dueDate && (
                    <div className={cn(
                      "flex items-center gap-1",
                      isOverdue && "text-red-500 font-medium"
                    )}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(t.dueDate).toLocaleDateString('de-DE')}</span>
                      {isOverdue && <span className="ml-1">(Überfällig)</span>}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                  {((t.creator?.id === currentUserId) || isAdmin) && t.status !== 'done' && (
                    <button 
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm text-white font-medium transition-colors flex items-center gap-1.5"
                      onClick={() => id && toggleDone(id, 'done')}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Erledigt
                    </button>
                  )}
                  {id ? (
                    <Link 
                      href={`/admin/todos/${id}`} 
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-sm text-primary font-medium transition-colors"
                    >
                      Details ansehen
                    </Link>
                  ) : (
                    <button disabled className="px-3 py-1.5 bg-muted/10 rounded-lg text-sm text-muted-foreground">ID fehlt</button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {filteredAndSorted.length === 0 && (
          <Card padding="lg" className="text-center">
            <p className="text-muted-foreground">Keine Aufgaben gefunden.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

