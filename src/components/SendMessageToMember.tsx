"use client";

import { useState } from "react";
import { Mail, Send, X } from "lucide-react";

interface SendMessageToMemberProps {
  memberId: number;
  memberName: string;
}

export function SendMessageToMember({ memberId, memberName }: SendMessageToMemberProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !body.trim()) {
      setError("Bitte Betreff und Nachricht eingeben.");
      return;
    }

    setError(null);
    setStatus("sending");

    try {
      const res = await fetch("/api/admin/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          assignees: [memberId],
        }),
      });

      if (!res.ok) {
        throw new Error("Serverfehler");
      }

      setStatus("sent");
      setSubject("");
      setBody("");
      
      // Dialog nach 2 Sekunden schließen
      setTimeout(() => {
        setIsOpen(false);
        setStatus("idle");
      }, 2000);
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Fehler beim Senden");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSubject("");
    setBody("");
    setError(null);
    setStatus("idle");
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex-1 py-2 px-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
      >
        <Mail className="w-4 h-4" />
        Nachricht
      </button>

      {/* Modal/Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-card border border-border rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-auto animate-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Nachricht senden</h2>
                <p className="text-sm text-muted-foreground">an {memberName}</p>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {status === "sent" ? (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Send className="w-6 h-6" />
                  </div>
                  <p className="font-medium text-green-600">Nachricht gesendet!</p>
                </div>
              ) : (
                <form onSubmit={handleSend} className="space-y-4">
                  {/* Betreff */}
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-1.5">
                      Betreff
                    </label>
                    <input
                      id="subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="z.B. Training verschoben"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      disabled={status === "sending"}
                    />
                  </div>

                  {/* Nachricht */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1.5">
                      Nachricht
                    </label>
                    <textarea
                      id="message"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Deine Nachricht..."
                      rows={5}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                      disabled={status === "sending"}
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      {status === "sending" ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sende...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Senden
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={status === "sending"}
                      className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
