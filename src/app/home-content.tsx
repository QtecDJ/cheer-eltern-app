"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { calculateAge, calculateAttendanceRate, getRelativeDate } from "@/lib/utils";
import {
  Bell,
  BellOff,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Megaphone,
  Pin,
  Sparkles,
  Star,
  Users,
  AlertTriangle,
  Info,
  PartyPopper,
  ChevronDown,
  Check,
  UserCircle,
} from "lucide-react";
import { useVersionedContent } from "@/lib/use-versioned-content";
import { useOneSignalPush } from "@/hooks/use-onesignal-push";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { useProfileSwitcher } from "@/modules/profile-switcher";
import { createPortal } from "react-dom";

interface HomeContentProps {
  child: {
    id: number;
    name: string;
    firstName: string;
    birthDate: string;
    role: string;
    photoUrl: string | null;
    team: {
      id: number;
      name: string;
      color: string | null;
      description: string | null;
    } | null;
  };
  upcomingTrainings: Array<{
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    trainer: string | null;
    team: {
      name: string;
      color: string | null;
    } | null;
  }>;
  attendanceStats: {
    total: number;
    present: number;
    absent: number;
    excused: number;
  };
  latestAssessment?: {
    overallScore: number;
    performanceLevel: string;
    date: Date;
  } | null;
  announcements: Array<{
    id: number;
    title: string;
    content: string;
    category: string;
    priority: string;
    isPinned: boolean;
    createdAt: Date;
  }>;
  showUpcoming?: boolean;
  showVoterNames?: boolean;
  polls?: any[];
  openMessages?: any[];
  resolvedMessageCount?: number;
  isOrga?: boolean;
  // entfernt: profileSwitchInfo
}

export function HomeContent({
  child,
  upcomingTrainings,
  attendanceStats,
  latestAssessment,
  announcements,
  showUpcoming = true,
  showVoterNames = false,
  polls = [],
  openMessages = [],
  resolvedMessageCount = 0,
  isOrga = false,
}: HomeContentProps) {
  const age = calculateAge(child.birthDate);
  const attendanceRate = calculateAttendanceRate(
    attendanceStats.present,
    attendanceStats.total
  );

  const { enabled: pushEnabled, loading: pushLoading, supported: pushSupported, toggle: togglePush } = useOneSignalPush();
  const router = useRouter();
  
  // Profile Switcher State
  const { availableProfiles, activeProfileId, isLoading: profileSwitchLoading, switchProfile } = useProfileSwitcher();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Update dropdown position when opening
  useEffect(() => {
    if (isProfileMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isProfileMenuOpen]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Check if click is outside button and dropdown
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    
    if (isProfileMenuOpen) {
      // Small delay to prevent immediate close on button click
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 10);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProfileMenuOpen]);

  const handleTrainingClick = (trainingId: number) => {
    router.push(`/training#training-${trainingId}`);
  };
  
  const handleProfileSwitch = async (profileId: number) => {
    if (profileId === activeProfileId) {
      setIsProfileMenuOpen(false);
      return;
    }
    
    setIsAnimating(true);
    setIsProfileMenuOpen(false);
    
    // Trigger animation before switch
    setTimeout(async () => {
      await switchProfile(profileId);
      // Animation will continue through page reload
    }, 150);
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4 max-w-lg md:max-w-none mx-auto">
      {/* Header mit Begrüßung */}
      <header className="mb-6 md:mb-8 animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm md:text-base text-muted-foreground">Willkommen zurück 👋</p>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-0.5">
              {child.firstName}&apos;s Übersicht
            </h1>
          </div>
          {pushSupported && (
            <button
              onClick={togglePush}
              disabled={pushLoading}
              className="p-2 rounded-full hover:bg-accent transition-colors disabled:opacity-50"
              title={pushEnabled ? "Push-Benachrichtigungen deaktivieren" : "Push-Benachrichtigungen aktivieren"}
            >
              {pushLoading ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : pushEnabled ? (
                <Bell className="w-6 h-6 text-primary" />
              ) : (
                <BellOff className="w-6 h-6 text-muted-foreground" />
              )}
            </button>
          )}
        </div>
      </header>


      {/* Kind Profil Card mit Profile Switcher */}
      <Card variant="gradient" className="mb-6 animate-slide-up relative overflow-visible">
        <div className="flex items-center gap-4">
          {/* Clickable Avatar with Profile Switcher */}
          <div className="relative z-[100]">
            <button
              ref={buttonRef}
              onClick={() => availableProfiles.length > 1 && setIsProfileMenuOpen(!isProfileMenuOpen)}
              disabled={profileSwitchLoading || availableProfiles.length <= 1}
              className={`relative group ${availableProfiles.length > 1 ? 'cursor-pointer' : 'cursor-default'}`}
              title={availableProfiles.length > 1 ? "Profil wechseln" : undefined}
            >
              <div className={`transition-all duration-500 ease-out ${
                isAnimating 
                  ? 'animate-profile-switch-out' 
                  : 'scale-100 opacity-100'
              }`}>
                <Avatar 
                  name={child.name} 
                  src={child.photoUrl} 
                  size="lg"
                  className={`${
                    availableProfiles.length > 1 
                      ? 'ring-2 ring-primary/20 group-hover:ring-primary/50 group-hover:animate-profile-glow transition-all duration-300' 
                      : ''
                  }`}
                />
              </div>
              
              {/* Dropdown Indicator */}
              {availableProfiles.length > 1 && (
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 shadow-lg group-hover:scale-110 transition-transform">
                  <ChevronDown className="w-3 h-3" />
                </div>
              )}
              
              {/* Loading Spinner */}
              {profileSwitchLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg truncate">{child.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default">{child.role}</Badge>
              <span className="text-sm text-muted-foreground">{age} Jahre</span>
            </div>
            {child.team && (
              <div className="flex items-center gap-1.5 mt-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: child.team.color || "#ec4899" }}
                />
                <span className="text-sm font-medium">{child.team.name}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="animate-slide-up stagger-1">
          <StatCard
            icon={CheckCircle2}
            label="Anwesenheit"
            value={`${attendanceRate}%`}
            subtext={`${attendanceStats.present}/${attendanceStats.total} Trainings`}
            variant="success"
          />
        </div>
        <div className="animate-slide-up stagger-2">
          <StatCard
            icon={Star}
            label="Level"
            value={latestAssessment?.performanceLevel || "—"}
            subtext={
              latestAssessment
                ? `Score: ${latestAssessment.overallScore.toFixed(1)}`
                : "Noch keine Bewertung"
            }
            variant="primary"
          />
        </div>
      </div>

      {/* Ankündigungen */}
      {announcements.length > 0 && (
        <section className="mb-6 animate-slide-up stagger-3">
          <CardHeader className="px-0">
            <CardTitle size="lg" className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              Neuigkeiten
            </CardTitle>
          </CardHeader>

          <div className="space-y-3">
            {announcements.map((announcement, index) => {
              // Kategorie-basierte Styles
              const categoryStyles = {
                urgent: {
                  icon: AlertTriangle,
                  bgColor: "bg-destructive/10",
                  iconColor: "text-destructive",
                  borderColor: "border-l-destructive",
                },
                event: {
                  icon: PartyPopper,
                  bgColor: "bg-green-500/10",
                  iconColor: "text-green-600",
                  borderColor: "border-l-green-500",
                },
                info: {
                  icon: Info,
                  bgColor: "bg-muted",
                  iconColor: "text-muted-foreground",
                  borderColor: "border-l-muted-foreground",
                },
                news: {
                  icon: Megaphone,
                  bgColor: "bg-primary/10",
                  iconColor: "text-primary",
                  borderColor: "border-l-primary",
                },
              };

              const style = categoryStyles[announcement.category as keyof typeof categoryStyles] || categoryStyles.news;
              const IconComponent = style.icon;

              return (
                <a
                  key={announcement.id}
                  href={`/events?announcement=${announcement.id}`}
                  className={`block animate-slide-up stagger-${index + 1}`}
                >
                  <Card
                    className={`hover:bg-muted/50 transition-colors cursor-pointer border-l-4 ${style.borderColor}`}
                  >
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-lg ${style.bgColor} shrink-0`}>
                        <IconComponent className={`w-4 h-4 ${style.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm leading-tight">
                            {announcement.isPinned && (
                              <Pin className="w-3 h-3 inline mr-1 text-primary" />
                            )}
                            {announcement.title}
                          </h3>
                          {announcement.priority === "high" && (
                            <Badge variant="danger" size="sm">Wichtig</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          <AnnouncementContent 
                            announcementId={announcement.id}
                            content={announcement.content}
                          />
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(announcement.createdAt).toLocaleDateString("de-DE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </Card>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Nächstes Training */}
      <section className="mb-6 md:mb-8 animate-slide-up stagger-3">
        <CardHeader className="px-0">
          <CardTitle size="lg" className="flex items-center gap-2">
            <Calendar className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            Nächste Trainings
          </CardTitle>
        </CardHeader>

        {upcomingTrainings.length === 0 ? (
          <Card className="text-center py-8">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Keine anstehenden Trainings</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {upcomingTrainings.slice(0, 3).map((training, index) => (
              <div
                key={training.id}
                className={`block animate-slide-up stagger-${index + 1}`}
              >
              <Card
                className="hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleTrainingClick(training.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Datum Badge */}
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary shrink-0">
                    <span className="text-[10px] font-medium uppercase">
                      {new Date(training.date).toLocaleDateString("de-DE", {
                        weekday: "short",
                      })}
                    </span>
                    <span className="text-xl font-bold leading-none">
                      {new Date(training.date).getDate()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">{training.title}</h3>
                      <Badge variant="info" size="sm">
                        {getRelativeDate(training.date)}
                      </Badge>
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{training.time} Uhr</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{training.location}</span>
                      </div>
                      {training.trainer && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          <span className="truncate">{training.trainer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
              </div>
            ))}
          </div>
        )}
      </section>
      
      {/* Profile Dropdown Menu - Rendered as Portal */}
      {isProfileMenuOpen && availableProfiles.length > 1 && typeof window !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed w-64 bg-card border border-border rounded-lg shadow-2xl z-[99999] animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground px-3 py-2">
              Profil wechseln
            </div>
            {availableProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleProfileSwitch(profile.id)}
                disabled={profileSwitchLoading}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  profile.id === activeProfileId
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="relative">
                  <Avatar 
                    name={profile.name} 
                    src={profile.photoUrl} 
                    size="sm"
                  />
                  {profile.id === activeProfileId && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{profile.firstName}</div>
                  {profile.teamName && (
                    <div className="text-xs text-muted-foreground">{profile.teamName}</div>
                  )}
                </div>
                
                <div className="flex gap-1">
                  {profile.isSelf && (
                    <Badge variant="default" size="sm">Du</Badge>
                  )}
                  {!profile.isSelf && (
                    <Badge variant="info" size="sm">Kind</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Cached Announcement Content Component  
function AnnouncementContent({ announcementId, content }: { announcementId: number; content: string }) {
  const { content: cachedContent } = useVersionedContent({
    key: `announcement-${announcementId}`,
    version: content.slice(0, 20), // Ersten 20 Zeichen als Version-Hint
    fetcher: async () => content,
    ttl: 1000 * 60 * 60 * 12, // 12h Cache (Announcements ändern sich öfter)
  });

  return <span dangerouslySetInnerHTML={{ __html: cachedContent || content }} />;
}
