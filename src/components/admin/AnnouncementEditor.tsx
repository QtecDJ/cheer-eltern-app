"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Save, Bold, Italic, List, Link as LinkIcon, 
  Image as ImageIcon, BarChart3, Plus, X, Trash2, Calendar,
  Pin, Users, Bell, CheckSquare, Maximize2
} from "lucide-react";

type PollOption = { id: number; text: string };

export default function AnnouncementEditor({ 
  currentUserId, 
  announcementId 
}: { 
  currentUserId: number; 
  announcementId?: number;
}) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Basic fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("news");
  const [priority, setPriority] = useState("normal");
  const [isPinned, setIsPinned] = useState(false);
  const [allowRsvp, setAllowRsvp] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [teamIds, setTeamIds] = useState<number[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  
  // Poll fields
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: 1, text: "" },
    { id: 2, text: "" }
  ]);
  const [nextPollOptionId, setNextPollOptionId] = useState(3);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [pollEndsAt, setPollEndsAt] = useState("");
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!announcementId);
  const [teams, setTeams] = useState<any[]>([]);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);

  // Load existing announcement
  useEffect(() => {
    if (announcementId) {
      loadAnnouncement();
    }
    loadTeams();
  }, [announcementId]);

  async function loadAnnouncement() {
    try {
      const res = await fetch(`/api/admin/announcements/${announcementId}`);
      const data = await res.json();
      if (res.ok && data.announcement) {
        const a = data.announcement;
        setTitle(a.title);
        setContent(a.content);
        setCategory(a.category);
        setPriority(a.priority);
        setIsPinned(a.isPinned);
        setAllowRsvp(a.allowRsvp);
        setExpiresAt(a.expiresAt ? a.expiresAt.split('T')[0] : '');
        setTeamIds(a.AnnouncementTeam?.map((at: any) => at.teamId) || []);
        setImageUrl(a.imageUrl || '');
        
        // Load poll if exists
        if (a.Poll && a.Poll.length > 0) {
          const poll = a.Poll[0];
          setHasPoll(true);
          setPollQuestion(poll.question);
          setAllowMultiple(poll.allowMultiple);
          setIsAnonymous(poll.isAnonymous);
          setPollEndsAt(poll.endsAt ? poll.endsAt.split('T')[0] : '');
          setPollOptions(poll.PollOption.map((opt: any, idx: number) => ({
            id: idx + 1,
            text: opt.text
          })));
          setNextPollOptionId(poll.PollOption.length + 1);
        }
      }
    } catch (err) {
      console.error('Failed to load announcement:', err);
    } finally {
      setLoadingData(false);
    }
  }

  async function loadTeams() {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      if (res.ok) {
        setTeams(data.teams || []);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    }
  }

  function formatText(command: string, value?: string) {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  }

  function updateContent() {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  }

  function addPollOption() {
    setPollOptions([...pollOptions, { id: nextPollOptionId, text: "" }]);
    setNextPollOptionId(nextPollOptionId + 1);
  }

  function removePollOption(id: number) {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter(opt => opt.id !== id));
    }
  }

  function updatePollOption(id: number, text: string) {
    setPollOptions(pollOptions.map(opt => opt.id === id ? { ...opt, text } : opt));
  }

  function insertPoll() {
    const validOptions = pollOptions.filter(opt => opt.text.trim());
    if (!pollQuestion.trim() || validOptions.length < 2) {
      alert('Bitte gib eine Frage und mindestens 2 Optionen ein');
      return;
    }
    setHasPoll(true);
    setShowPollModal(false);
  }

  function removePoll() {
    setHasPoll(false);
    setPollQuestion("");
    setPollOptions([{ id: 1, text: "" }, { id: 2, text: "" }]);
    setNextPollOptionId(3);
    setAllowMultiple(false);
    setIsAnonymous(false);
    setPollEndsAt("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Titel und Inhalt sind erforderlich');
      return;
    }

    setLoading(true);
    try {
      const body: any = {
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        isPinned,
        allowRsvp,
        expiresAt: expiresAt || null,
        teamIds,
        imageUrl: imageUrl.trim() || null,
      };

      if (hasPoll && pollQuestion.trim()) {
        const validOptions = pollOptions.filter(opt => opt.text.trim());
        if (validOptions.length >= 2) {
          body.poll = {
            question: pollQuestion.trim(),
            options: validOptions.map(opt => opt.text.trim()),
            allowMultiple,
            isAnonymous,
            endsAt: pollEndsAt || null,
          };
        }
      }

      const url = announcementId 
        ? `/api/admin/announcements/${announcementId}`
        : '/api/admin/announcements';
      const method = announcementId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push('/admin/announcements');
      } else {
        const data = await res.json();
        alert(data.error || 'Fehler beim Speichern');
      }
    } catch (err) {
      console.error('Failed to save announcement:', err);
      alert('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <header className="mb-6">
        <button 
          onClick={() => router.push('/admin/announcements')} 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Übersicht
        </button>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Bell className="w-7 h-7 text-primary" />
          {announcementId ? 'Ankündigung bearbeiten' : 'Neue Ankündigung'}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <Card padding="md">
          <label className="block text-sm font-semibold mb-2.5">
            <span className="text-primary">*</span> Titel
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Wichtige Ankündigung"
            className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </Card>

        {/* Editor */}
        <Card padding="md">
          <label className="block text-sm font-semibold mb-2.5">
            <span className="text-primary">*</span> Inhalt
          </label>
          
          {/* Toolbar */}
          <div className="flex flex-wrap gap-1 mb-2 p-2 bg-muted/10 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => formatText('bold')}
              className="p-2 hover:bg-muted/50 rounded"
              title="Fett"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => formatText('italic')}
              className="p-2 hover:bg-muted/50 rounded"
              title="Kursiv"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => formatText('insertUnorderedList')}
              className="p-2 hover:bg-muted/50 rounded"
              title="Liste"
            >
              <List className="w-4 h-4" />
            </button>
            <div className="w-px bg-border mx-1" />
            <button
              type="button"
              onClick={() => setShowPollModal(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded transition-colors ${
                hasPoll 
                  ? 'bg-green-500/20 text-green-600' 
                  : 'bg-primary/10 hover:bg-primary/20 text-primary'
              }`}
              title="Umfrage"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs font-medium">
                {hasPoll ? 'Umfrage bearbeiten ✓' : 'Umfrage'}
              </span>
            </button>
          </div>

          <div
            ref={editorRef}
            contentEditable
            onInput={updateContent}
            className="min-h-[300px] p-4 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
            data-placeholder="Schreibe hier den Inhalt der Ankündigung..."
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </Card>

        {/* Category & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card padding="md">
            <label className="block text-sm font-semibold mb-2.5">Kategorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-border rounded-xl bg-background"
            >
              <option value="news">News</option>
              <option value="event">Event</option>
              <option value="training">Training</option>
              <option value="urgent">Dringend</option>
              <option value="info">Info</option>
            </select>
          </Card>

          <Card padding="md">
            <label className="block text-sm font-semibold mb-2.5">Priorität</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-3 border border-border rounded-xl bg-background"
            >
              <option value="low">Niedrig</option>
              <option value="normal">Normal</option>
              <option value="high">Hoch</option>
              <option value="urgent">Dringend</option>
            </select>
          </Card>
        </div>

        {/* Image URL */}
        <Card padding="md">
          <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Bild hinzufügen (optional)
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Füge einen Google Drive Link oder andere Bild-URL ein. Das Bild wird in der Ankündigung angezeigt.
          </p>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://drive.google.com/... oder andere Bild-URL"
            className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent mb-3"
          />
          {imageUrl && (
            <div className="relative rounded-xl overflow-hidden border-2 border-border bg-muted/20 group/preview cursor-pointer"
                 onClick={() => setShowImageLightbox(true)}>
              <div className="aspect-video w-full flex items-center justify-center bg-muted/40">
                <img 
                  src={imageUrl} 
                  alt="Vorschau" 
                  className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover/preview:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="text-center p-8"><ImageIcon class="w-12 h-12 mx-auto mb-2 text-muted-foreground" /><p class="text-sm text-muted-foreground">Bild konnte nicht geladen werden</p></div>';
                    }
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-full p-3">
                  <Maximize2 className="w-6 h-6 text-gray-900" />
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageUrl('');
                }}
                className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-lg transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </Card>

        {/* Teams */}
        <Card padding="md">
          <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            An Teams senden (optional)
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Wähle Teams aus, die diese Ankündigung sehen sollen. Ohne Auswahl ist sie für alle sichtbar.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {teams.map(team => (
              <label
                key={team.id}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  teamIds.includes(team.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted/20'
                }`}
              >
                <input
                  type="checkbox"
                  checked={teamIds.includes(team.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setTeamIds([...teamIds, team.id]);
                    } else {
                      setTeamIds(teamIds.filter(id => id !== team.id));
                    }
                  }}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium">{team.name}</span>
              </label>
            ))}
          </div>
          {teamIds.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted/20 rounded-lg">
              ✓ Wird an {teamIds.length} Team{teamIds.length !== 1 ? 's' : ''} gesendet
            </p>
          )}
        </Card>

        {/* Options */}
        <Card padding="md">
          <label className="block text-sm font-semibold mb-3">Optionen</label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <div className="flex items-center gap-2">
                <Pin className="w-5 h-5" />
                <span>Oben anpinnen</span>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
              <input
                type="checkbox"
                checked={allowRsvp}
                onChange={(e) => setAllowRsvp(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>RSVP aktivieren (Zu-/Absagen erlauben)</span>
              </div>
            </label>
          </div>
        </Card>

        {/* Expiration */}
        <Card padding="md">
          <label className="block text-sm font-semibold mb-2.5 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Ablaufdatum (optional)
          </label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full p-3 border border-border rounded-xl bg-background"
          />
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 shadow-sm"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Wird gespeichert...' : 'Speichern'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/announcements')}
            className="px-6 py-3 bg-card border border-border rounded-xl font-semibold hover:bg-muted/50"
          >
            Abbrechen
          </button>
        </div>
      </form>

      {/* Poll Modal */}
      {showPollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPollModal(false)}>
          <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {hasPoll ? 'Umfrage bearbeiten' : 'Umfrage erstellen'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {hasPoll 
                      ? 'Passe die Umfrage an oder entferne sie' 
                      : 'Füge eine Umfrage zur Ankündigung hinzu'
                    }
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPollModal(false)} className="p-2 hover:bg-muted/50 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Frage *</label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="z.B. Wann passt es dir am besten?"
                  className="w-full p-3 border border-border rounded-lg bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Optionen (min. 2) *</label>
                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updatePollOption(opt.id, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 p-3 border border-border rounded-lg bg-background"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removePollOption(opt.id)}
                          className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addPollOption}
                  className="w-full mt-2 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-lg text-muted-foreground hover:text-primary"
                >
                  <Plus className="w-5 h-5" />
                  Weitere Option
                </button>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowMultiple}
                    onChange={(e) => setAllowMultiple(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span>Mehrfachauswahl erlauben</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span>Anonyme Abstimmung</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Enddatum (optional)</label>
                <input
                  type="date"
                  value={pollEndsAt}
                  onChange={(e) => setPollEndsAt(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-background"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-border">
              {hasPoll && (
                <button
                  type="button"
                  onClick={removePoll}
                  className="px-4 py-3 bg-red-500/10 text-red-500 rounded-xl font-semibold hover:bg-red-500/20"
                >
                  Umfrage entfernen
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPollModal(false)}
                className="flex-1 px-4 py-3 bg-card border border-border rounded-xl font-semibold hover:bg-muted/50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={insertPoll}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90"
              >
                {hasPoll ? 'Aktualisieren' : 'Hinzufügen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {showImageLightbox && imageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowImageLightbox(false)}
        >
          <button
            onClick={() => setShowImageLightbox(false)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="relative max-w-7xl max-h-[90vh] w-full">
            <img 
              src={imageUrl}
              alt="Vorschau"
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
              <h3 className="text-white font-bold text-xl">Vorschau: {title || 'Bild'}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
