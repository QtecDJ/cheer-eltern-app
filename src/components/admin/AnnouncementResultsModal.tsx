"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Users, BarChart3, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";

type Member = {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string;
};

type PollVote = {
  id: number;
  votedAt: string;
  Member: Member;
};

type PollOption = {
  id: number;
  text: string;
  PollVote: PollVote[];
};

type Poll = {
  id: number;
  question: string;
  allowMultiple: boolean;
  isAnonymous: boolean;
  PollOption: PollOption[];
};

type RSVP = {
  id: number;
  status: string;
  respondedAt: string;
  Member: Member;
};

type ResultsModalProps = {
  announcementId: number;
  announcementTitle: string;
  onClose: () => void;
};

export default function AnnouncementResultsModal({ 
  announcementId, 
  announcementTitle,
  onClose 
}: ResultsModalProps) {
  const [loading, setLoading] = useState(true);
  const [pollResults, setPollResults] = useState<Poll | null>(null);
  const [rsvpResults, setRsvpResults] = useState<RSVP[]>([]);

  useEffect(() => {
    fetchResults();
  }, [announcementId]);

  async function fetchResults() {
    try {
      const res = await fetch(`/api/admin/announcements/${announcementId}/results`);
      console.log('📡 API Response Status:', res.status, res.statusText);
      const data = await res.json();
      console.log('📊 Fetched results:', data);
      if (res.ok) {
        setPollResults(data.pollResults);
        setRsvpResults(data.rsvpResults || []);
        console.log('✅ Set state:', { hasPoll: !!data.pollResults, rsvpCount: data.rsvpResults?.length });
      } else {
        console.error('❌ API error:', { status: res.status, data });
      }
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoading(false);
    }
  }

  const getMemberName = (member: Member) => {
    if (member.firstName) {
      return `${member.firstName} ${member.lastName}`;
    }
    return member.name || 'Unbekannt';
  };

  const getTotalVotes = () => {
    if (!pollResults) return 0;
    const uniqueVoterIds = new Set<number>();
    pollResults.PollOption.forEach(option => {
      option.PollVote.forEach(vote => {
        uniqueVoterIds.add(vote.Member.id);
      });
    });
    return uniqueVoterIds.size;
  };

  const getRsvpStatusColor = (status: string) => {
    switch (status) {
      case 'yes': return 'text-green-600';
      case 'no': return 'text-red-600';
      case 'maybe': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getRsvpStatusIcon = (status: string) => {
    switch (status) {
      case 'yes': return <CheckCircle className="w-4 h-4" />;
      case 'no': return <XCircle className="w-4 h-4" />;
      case 'maybe': return <Clock className="w-4 h-4" />;
      default: return null;
    }
  };

  const getRsvpStatusLabel = (status: string) => {
    switch (status) {
      case 'yes': return 'Nimmt teil';
      case 'no': return 'Nimmt nicht teil';
      case 'maybe': return 'Vielleicht';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded" />
              <div className="h-32 bg-muted rounded" />
              <div className="h-32 bg-muted rounded" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4 animate-in fade-in duration-200">
      <div className="w-full md:max-w-4xl md:max-h-[90vh] flex flex-col bg-background md:rounded-2xl animate-in slide-in-from-bottom md:slide-in-from-bottom-0 duration-300 max-h-[95vh] md:shadow-2xl">
        {/* Header - Sticky */}
        <div className="flex items-start justify-between p-4 md:p-6 border-b border-border sticky top-0 bg-background z-10 md:rounded-t-2xl">
          <div className="flex-1 pr-4">
            <h2 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              Ergebnisse
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-2">{announcementTitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="flex-shrink-0 p-2 hover:bg-muted/70 rounded-xl transition-colors active:scale-95"
            aria-label="Schließen"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Poll Results */}
          {pollResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-500/10 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">Umfrageergebnisse</h3>
              </div>
              
              <Card padding="md" className="border-2">
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-base md:text-lg mb-2">{pollResults.question}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">{getTotalVotes()}</span> {getTotalVotes() === 1 ? 'Teilnehmer' : 'Teilnehmer'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {pollResults.allowMultiple && (
                      <Badge className="bg-blue-500/20 border-blue-500/50 text-blue-600 whitespace-nowrap">
                        Mehrfach
                      </Badge>
                    )}
                    {pollResults.isAnonymous && (
                      <Badge className="bg-gray-500/20 border-gray-500/50 text-gray-600 whitespace-nowrap">
                        Anonym
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  {pollResults.PollOption.map(option => {
                    const voteCount = option.PollVote.length;
                    const totalVotes = pollResults.PollOption.reduce((sum, opt) => sum + opt.PollVote.length, 0);
                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

                    return (
                      <div key={option.id} className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-sm md:text-base flex-1">{option.text}</span>
                          <div className="text-right">
                            <span className="text-base md:text-lg font-bold text-primary">{percentage}%</span>
                            <span className="text-xs text-muted-foreground block">
                              {voteCount} {voteCount === 1 ? 'Stimme' : 'Stimmen'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Enhanced Progress Bar */}
                        <div className="relative w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div 
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                          </div>
                        </div>

                        {/* Voters List */}
                        {!pollResults.isAnonymous && option.PollVote.length > 0 && (
                          <div className="pl-3 md:pl-4 space-y-2 border-l-2 border-muted">
                            {option.PollVote.map(vote => (
                              <div key={vote.id} className="flex items-center justify-between py-1.5 text-sm">
                                <span className="font-medium">{getMemberName(vote.Member)}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                  {new Date(vote.votedAt).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* RSVP Results */}
          {rsvpResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-green-500/10 rounded-xl">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">RSVP Ergebnisse</h3>
              </div>

              {/* Summary Cards - Mobile Optimized */}
              <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4">
                <Card padding="sm" className="text-center border-2 border-green-500/20 bg-green-500/5">
                  <CheckCircle className="w-6 h-6 md:w-7 md:h-7 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">
                    {rsvpResults.filter(r => r.status === 'yes').length}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Nimmt teil</p>
                </Card>
                <Card padding="sm" className="text-center border-2 border-red-500/20 bg-red-500/5">
                  <XCircle className="w-6 h-6 md:w-7 md:h-7 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl md:text-3xl font-bold text-red-600 mb-1">
                    {rsvpResults.filter(r => r.status === 'no').length}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Nimmt nicht teil</p>
                </Card>
                <Card padding="sm" className="text-center border-2 border-orange-500/20 bg-orange-500/5">
                  <Clock className="w-6 h-6 md:w-7 md:h-7 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1">
                    {rsvpResults.filter(r => r.status === 'maybe').length}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Vielleicht</p>
                </Card>
              </div>

              <Card padding="none" className="border-2 overflow-hidden">
                <div className="divide-y divide-border">
                  {rsvpResults.map(rsvp => (
                    <div 
                      key={rsvp.id}
                      className={`p-3 md:p-4 flex items-center justify-between gap-3 transition-colors ${
                        rsvp.status === 'yes' ? 'bg-green-500/5 hover:bg-green-500/10' :
                        rsvp.status === 'no' ? 'bg-red-500/5 hover:bg-red-500/10' :
                        'bg-orange-500/5 hover:bg-orange-500/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                          rsvp.status === 'yes' ? 'bg-green-500/20' :
                          rsvp.status === 'no' ? 'bg-red-500/20' :
                          'bg-orange-500/20'
                        }`}>
                          <div className={getRsvpStatusColor(rsvp.status)}>
                            {getRsvpStatusIcon(rsvp.status)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm md:text-base truncate">
                            {getMemberName(rsvp.Member)}
                          </p>
                          <p className={`text-xs md:text-sm font-medium ${getRsvpStatusColor(rsvp.status)}`}>
                            {getRsvpStatusLabel(rsvp.status)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {rsvp.respondedAt && new Date(rsvp.respondedAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* No Results */}
          {!pollResults && rsvpResults.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-semibold mb-1">Keine Ergebnisse</p>
              <p className="text-sm text-muted-foreground">
                Es wurden noch keine Stimmen oder RSVPs abgegeben
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
