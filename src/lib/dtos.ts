/**
 * Data Transfer Objects (DTOs)
 * 
 * Streng typisierte, minimale Response-Objekte für API/Page-Responses.
 * Verhindert versehentliches Zurückgeben von zu vielen Daten.
 * 
 * Prinzipien:
 * - Nie raw Prisma models returnen
 * - Explizite Felder, keine Spreads
 * - Listen-DTOs minimal, Detail-DTOs komplett
 * - Sensitive Daten in separaten DTOs
 */

// ============================================
// MEMBER DTOs
// ============================================

/**
 * Minimal für Listen (Teilnehmerlisten, Team-Übersichten)
 */
export interface MemberListDTO {
  id: number;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
}

/**
 * Basic für Cards/Avatare mit Name
 */
export interface MemberBasicDTO extends MemberListDTO {
  name: string;
  role: string;
}

/**
 * Für Dashboard/Home-Seite
 */
export interface MemberHomeDTO {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  role: string;
  photoUrl: string | null;
  teamId: number | null;
  team: TeamMinimalDTO | null;
}

/**
 * Vollständiges Profil (NUR für eigenes Profil!)
 */
export interface MemberProfileDTO {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  role: string;
  joinDate: string;
  email: string | null;
  photoUrl: string | null;
  teamId: number | null;
  team: TeamBasicDTO | null;
  // Sensitive Daten
  emergencyContact: string | null;
  emergencyPhone: string | null;
  emergencyContact2: string | null;
  emergencyPhone2: string | null;
  allergies: string | null;
  diseases: string | null;
  medications: string | null;
}

// ============================================
// TEAM DTOs
// ============================================

export interface TeamMinimalDTO {
  id: number;
  name: string;
  color: string | null;
}

export interface TeamBasicDTO extends TeamMinimalDTO {
  description: string | null;
}

// ============================================
// TRAINING DTOs
// ============================================

/**
 * Minimal für Listen (Training-Seite)
 */
export interface TrainingListDTO {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  trainer: string | null;
  status: string;
  type: string;
  description: string | null;
  maxParticipants: number;
  team: TeamMinimalDTO | null;
}

/**
 * Minimal für Dashboard (nur nächste 3)
 */
export interface TrainingUpcomingDTO {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  trainer: string | null;
  team: TeamMinimalDTO | null;
}

// ============================================
// ATTENDANCE DTOs
// ============================================

/**
 * Aggregierte Stats (von groupBy)
 */
export interface AttendanceStatsDTO {
  total: number;
  present: number;
  absent: number;
  excused: number;
}

/**
 * Map für schnelle Lookups
 */
export type AttendanceMapDTO = Record<number, string>;

// ============================================
// EVENT DTOs
// ============================================

/**
 * Event-Liste mit minimalen Teilnehmer-Infos
 */
export interface EventListDTO {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  status: string;
  description: string | null;
  participants: MemberListDTO[];
}

// ============================================
// COMPETITION DTOs
// ============================================

export interface CompetitionListDTO {
  id: number;
  title: string;
  date: string;
  location: string;
  category: string;
  status: string;
  rank: number | null;
  score: number | null;
  participants: MemberListDTO[];
}

// ============================================
// ANNOUNCEMENT DTOs
// ============================================

/**
 * Minimal für Home-Seite (ohne Polls)
 */
export interface AnnouncementMinimalDTO {
  id: number;
  title: string;
  content: string;
  category: string;
  priority: string;
  isPinned: boolean;
  createdAt: Date;
  expiresAt: Date | null;
  teams: TeamMinimalDTO[];
}

/**
 * Mit Poll-Daten für Events-Seite
 */
export interface AnnouncementWithPollDTO extends AnnouncementMinimalDTO {
  allowRsvp: boolean | null;
  poll: PollDataDTO | null;
  rsvp: RSVPDataDTO;
}

// ============================================
// POLL DTOs
// ============================================

export interface PollVoterDTO {
  id: number;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
}

export interface PollOptionDTO {
  id: number;
  text: string;
  voteCount: number;
  percentage: number;
  isSelected: boolean;
  voters: PollVoterDTO[];
}

export interface PollDataDTO {
  id: number;
  question: string;
  allowMultiple: boolean;
  isAnonymous: boolean;
  endsAt: Date | null;
  totalVotes: number;
  hasVoted: boolean;
  options: PollOptionDTO[];
}

// ============================================
// RSVP DTOs
// ============================================

export interface RSVPDataDTO {
  acceptedCount: number;
  declinedCount: number;
  myStatus: string | null;
}

// ============================================
// ASSESSMENT DTOs
// ============================================

/**
 * Minimal für Dashboard
 */
export interface AssessmentMinimalDTO {
  id: number;
  overallScore: number;
  performanceLevel: string;
  date: Date;
}

// ============================================
// RESPONSE DTOs (für Server Actions)
// ============================================

/**
 * Standardisierte Success Response
 */
export interface ActionSuccessDTO {
  success: true;
  id?: number;
  message?: string;
}

/**
 * Standardisierte Error Response
 */
export interface ActionErrorDTO {
  success: false;
  error: string;
  field?: string;
}

export type ActionResultDTO = ActionSuccessDTO | ActionErrorDTO;

// ============================================
// MAPPER FUNCTIONS
// ============================================

/**
 * Hilfsfunktionen zum Konvertieren von Prisma Models zu DTOs
 */

export function toMemberListDTO(member: any): MemberListDTO {
  return {
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    photoUrl: member.photoUrl,
  };
}

export function toTeamMinimalDTO(team: any): TeamMinimalDTO | null {
  if (!team) return null;
  return {
    id: team.id,
    name: team.name,
    color: team.color,
  };
}

export function toAttendanceStatsDTO(stats: {
  total: number;
  present: number;
  absent: number;
  excused: number;
}): AttendanceStatsDTO {
  return {
    total: stats.total,
    present: stats.present,
    absent: stats.absent,
    excused: stats.excused,
  };
}

/**
 * Type Guards
 */
export function isActionSuccess(result: ActionResultDTO): result is ActionSuccessDTO {
  return result.success === true;
}

export function isActionError(result: ActionResultDTO): result is ActionErrorDTO {
  return result.success === false;
}
