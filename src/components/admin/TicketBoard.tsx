"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminMessageModal from "@/components/admin/AdminMessageModal";
import {
  Search,
  Filter,
  Send,
  Check,
  UserPlus,
  Clock,
  AlertCircle,
  MessageSquare,
  X,
  ChevronDown,
  Trash2,
  RotateCw,
  Plus,
} from "lucide-react";

interface TicketBoardProps {
  initialMessages: any[];
  teams: any[];
  currentUserId: number;
  isAdmin: boolean;
}

type StatusFilter = "all" | "open" | "assigned" | "resolved";

// Separate TicketDetailView component to prevent re-renders
const TicketDetailView = React.memo(({ 
  ticket,
  replyText,
  setReplyText,
  handleReply,
  handleResolve,
  handleReopen,
  handleAssign,
  handleDelete,
  staff,
  showAssignMenu,
  setShowAssignMenu,
  onClose
}: { 
  ticket: any;
  replyText: string;
  setReplyText: (text: string) => void;
  handleReply: () => void;
  handleResolve: (id: number) => void;
  handleReopen: (id: number) => void;
  handleAssign: (id: number, assigneeId: number) => void;
  handleDelete: (id: number) => void;
  staff: any[];
  showAssignMenu: boolean;
  setShowAssignMenu: (show: boolean) => void;
  onClose: () => void;
}) => {
  if (!ticket) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="font-semibold text-lg">{ticket.subject}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {ticket.sender?.firstName
              ? `${ticket.sender.firstName} ${ticket.sender.lastName}`
              : ticket.sender?.name}
          </span>
          <span>•</span>
          <span>
            {new Date(ticket.createdAt).toLocaleString("de-DE")}
          </span>
        </div>
        {ticket.sender?.team && (
          <span
            className="inline-block mt-2 text-xs px-2 py-1 rounded border"
            style={{
              borderColor: ticket.sender.team.color || "#64748b",
              color: ticket.sender.team.color || "#64748b",
            }}
          >
            {ticket.sender.team.name}
          </span>
        )}
      </div>

      {/* Body & Replies */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Original Message */}
        <div className="prose prose-sm max-w-none">
          <p className="text-sm whitespace-pre-wrap">{ticket.body}</p>
        </div>

        {/* Replies */}
        {ticket.replies && ticket.replies.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Antworten ({ticket.replies.length})
            </p>
            {ticket.replies.map((reply: any) => (
              <div
                key={reply.id}
                className="p-3 bg-muted/50 rounded-lg text-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">
                    {reply.author
                      ? `${reply.author.firstName || reply.author.name}`
                      : "Admin"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(reply.createdAt).toLocaleString("de-DE")}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{reply.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="p-4 border-t border-border space-y-3">
        {/* Quick Reply */}
        <div className="flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Antwort schreiben..."
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleReply();
              }
            }}
          />
          <button
            onClick={handleReply}
            disabled={!replyText.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Senden
          </button>
        </div>

        {/* Status Actions */}
        <div className="grid grid-cols-3 gap-2">
          {/* Erledigt Button */}
          <button
            onClick={() => handleResolve(ticket.id)}
            disabled={ticket.status === "resolved"}
            className="px-3 py-2 bg-green-500/10 text-green-600 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Check className="w-3 h-3" />
            <span className="truncate">Erledigt</span>
          </button>

          {/* Wieder öffnen Button */}
          <button
            onClick={() => handleReopen(ticket.id)}
            disabled={ticket.status !== "resolved"}
            className="px-3 py-2 bg-blue-500/10 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RotateCw className="w-3 h-3" />
            <span className="truncate">Öffnen</span>
          </button>

          {/* Assign Button */}
          <div className="relative">
            <button
              onClick={() => setShowAssignMenu(!showAssignMenu)}
              className="w-full px-3 py-2 bg-purple-500/10 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-1"
            >
              <UserPlus className="w-3 h-3" />
              <span className="truncate">
                {ticket.assignee
                  ? ticket.assignee.firstName ||
                    ticket.assignee.name
                  : "Zuweisen"}
              </span>
              <ChevronDown className="w-3 h-3 shrink-0" />
            </button>

            {showAssignMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowAssignMenu(false)}
                />
                <div className="absolute bottom-full mb-2 left-0 right-0 bg-card border border-border rounded-lg shadow-xl py-1 max-h-48 overflow-y-auto z-20">
                  {staff.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleAssign(ticket.id, s.id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
                    >
                      {s.firstName || s.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={() => handleDelete(ticket.id)}
            className="col-span-3 px-3 py-2 bg-red-500/10 text-red-600 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span className="truncate">Löschen</span>
          </button>
        </div>
      </div>
    </div>
  );
});

TicketDetailView.displayName = "TicketDetailView";


export default function TicketBoard({
  initialMessages,
  teams,
  currentUserId,
  isAdmin,
}: TicketBoardProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [staff, setStaff] = useState<any[]>([]);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Verhindere Body-Scrollen wenn Modal offen
  useEffect(() => {
    if (showTicketModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      };
    }
  }, [showTicketModal]);

  // Lade Staff-Liste für Zuweisung
  useEffect(() => {
    fetch("/api/admin/staff")
      .then((r) => r.json())
      .then((j) => setStaff(j.users || []))
      .catch(() => setStaff([]));
  }, []);

  // Filter Messages - useMemo to prevent unnecessary recalculations
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const matchesSearch =
        searchQuery === "" ||
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.sender?.firstName &&
          `${m.sender.firstName} ${m.sender.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "open" && m.status === "open") ||
        (statusFilter === "assigned" && m.status === "assigned") ||
        (statusFilter === "resolved" && m.status === "resolved");

      const matchesTeam =
        !teamFilter || m.sender?.team?.name === teamFilter;

      return matchesSearch && matchesStatus && matchesTeam;
    });
  }, [messages, searchQuery, statusFilter, teamFilter]);

  // Gruppiere nach Status
  const openTickets = useMemo(() => filteredMessages.filter((m) => m.status === "open"), [filteredMessages]);
  const assignedTickets = useMemo(() => filteredMessages.filter((m) => m.status === "assigned"), [filteredMessages]);
  const resolvedTickets = useMemo(() => filteredMessages.filter((m) => m.status === "resolved"), [filteredMessages]);

  // Actions - wrapped in useCallback to prevent re-renders
  const handleReply = useCallback(async () => {
    if (!selectedTicket || !replyText.trim()) return;

    const ticketId = selectedTicket.id;
    const text = replyText.trim();

    try {
      const res = await fetch(
        `/api/admin/messages/${ticketId}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        }
      );
      const json = await res.json();

      if (res.ok && json?.reply) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === ticketId
              ? { ...m, replies: [...(m.replies || []), json.reply] }
              : m
          )
        );
        setReplyText("");
        setSelectedTicket((prev: any) => {
          if (!prev || prev.id !== ticketId) return prev;
          return {
            ...prev,
            replies: [...(prev.replies || []), json.reply],
          };
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [selectedTicket, replyText]);

  const handleResolve = useCallback(async (messageId: number) => {
    try {
      const res = await fetch(`/api/admin/messages/${messageId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, status: "resolved" } : m
          )
        );
        setSelectedTicket((prev: any) => {
          if (!prev || prev.id !== messageId) return prev;
          return { ...prev, status: "resolved" };
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleAssign = useCallback(async (messageId: number, assigneeId: number) => {
    try {
      const res = await fetch(`/api/admin/messages/${messageId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId }),
      });

      if (res.ok) {
        const assignee = staff.find((s) => s.id === assigneeId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, status: "assigned", assignedTo: assigneeId, assignee }
              : m
          )
        );
        setSelectedTicket((prev: any) => {
          if (!prev || prev.id !== messageId) return prev;
          return {
            ...prev,
            status: "assigned",
            assignedTo: assigneeId,
            assignee,
          };
        });
        setShowAssignMenu(false);
      }
    } catch (e) {
      console.error(e);
    }
  }, [staff]);

  const handleDelete = useCallback(async (messageId: number) => {
    if (!confirm("Ticket wirklich löschen?")) return;

    try {
      const res = await fetch(`/api/admin/messages/${messageId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        setSelectedTicket((prev: any) => {
          if (!prev || prev.id !== messageId) return prev;
          return null;
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleReopen = useCallback(async (messageId: number) => {
    try {
      const res = await fetch(`/api/admin/messages/${messageId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: null }),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, status: "open", assignedTo: null, assignee: null }
              : m
          )
        );
        setSelectedTicket((prev: any) => {
          if (!prev || prev.id !== messageId) return prev;
          return {
            ...prev,
            status: "open",
            assignedTo: null,
            assignee: null,
          };
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const TicketCard = ({ ticket, onClick }: { ticket: any; onClick: () => void }) => {
    const isViewed = ticket.viewedAt != null;
    const hasReplies = ticket.replies && ticket.replies.length > 0;

    return (
      <Card
        onClick={onClick}
        className={`p-3 cursor-pointer hover:shadow-md transition-all ${
          isViewed ? "bg-green-500/5 border-green-500/20" : ""
        } ${selectedTicket?.id === ticket.id ? "ring-2 ring-primary" : ""}`}
      >
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm line-clamp-1">{ticket.subject}</h3>
            {isViewed && (
              <Badge variant="outline" className="shrink-0 text-[10px] bg-green-500/10 text-green-600 border-green-500/20">
                Gelesen
              </Badge>
            )}
          </div>

          {/* Body Preview */}
          <p className="text-xs text-muted-foreground line-clamp-1">
            {ticket.body}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="truncate max-w-[120px]">
                {ticket.sender?.firstName
                  ? `${ticket.sender.firstName} ${ticket.sender.lastName}`
                  : ticket.sender?.name}
              </span>
              {hasReplies && (
                <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                  <MessageSquare className="w-2.5 h-2.5" />
                  {ticket.replies.length}
                </Badge>
              )}
            </div>
            <span>{new Date(ticket.createdAt).toLocaleDateString("de-DE")}</span>
          </div>

          {/* Assignee */}
          {ticket.assignee && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <UserPlus className="w-3 h-3" />
              {ticket.assignee.firstName || ticket.assignee.name}
            </div>
          )}

          {/* Team Badge */}
          {ticket.sender?.team && (
            <span
              className="inline-block text-[10px] px-2 py-0.5 rounded border"
              style={{
                borderColor: ticket.sender.team.color || "#64748b",
                color: ticket.sender.team.color || "#64748b",
              }}
            >
              {ticket.sender.team.name}
            </span>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header & Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Ticket System</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{filteredMessages.length} Tickets</Badge>
            <AdminMessageModal teams={teams} />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suche nach Ticket-Inhalt, Absender..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* Status Filter */}
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setStatusFilter("open")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              statusFilter === "open"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            Offen ({openTickets.length})
          </button>
          <button
            onClick={() => setStatusFilter("assigned")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              statusFilter === "assigned"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Clock className="w-3 h-3" />
            In Bearbeitung ({assignedTickets.length})
          </button>
          <button
            onClick={() => setStatusFilter("resolved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              statusFilter === "resolved"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Check className="w-3 h-3" />
            Erledigt ({resolvedTickets.length})
          </button>

          {/* Team Filter */}
          {teams.length > 1 && (
            <>
              <div className="w-px bg-border" />
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() =>
                    setTeamFilter(teamFilter === team.name ? null : team.name)
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    teamFilter === team.name
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: team.color || "#ec4899" }}
                  />
                  {team.name}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {/* Ticket List */}
        <div className="space-y-3">
          {filteredMessages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Keine Tickets gefunden</p>
            </div>
          )}

          {filteredMessages.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => {
                setSelectedTicket(ticket);
                setShowTicketModal(true);
              }}
            />
          ))}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {showTicketModal && selectedTicket && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg max-h-[85vh] bg-background rounded-2xl overflow-hidden shadow-2xl border border-border">
            <TicketDetailView 
              ticket={selectedTicket}
              replyText={replyText}
              setReplyText={setReplyText}
              handleReply={handleReply}
              handleResolve={handleResolve}
              handleReopen={handleReopen}
              handleAssign={handleAssign}
              handleDelete={handleDelete}
              staff={staff}
              showAssignMenu={showAssignMenu}
              setShowAssignMenu={setShowAssignMenu}
              onClose={() => {
                setSelectedTicket(null);
                setShowTicketModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
