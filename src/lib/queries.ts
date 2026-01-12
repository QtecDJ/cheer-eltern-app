/**
 * Zentrale Datenbank-Queries mit optimierten Selects
 * Ziel: Minimierung des Daten-Transfers zu Neon Postgres
 * 
 * Prinzipien:
 * 1. Explizite Selects statt SELECT * (reduziert Payload um 50-80%)
 * 2. take/limit für alle Listen (verhindert große Datenmengen)
 * 3. Separation von Listen- und Detail-Queries
 * 4. Keine sensitiven Daten in Listen-Queries
 * 5. Optimierte Includes nur wo nötig
 */

import { prisma } from "@/lib/db";

// ============================================
// MEMBER QUERIES
// ============================================

/**
 * Minimales Member-Profil für Listen (z.B. Teilnehmerlisten)
 * Nur 4 Felder = ~100 bytes statt ~2KB pro Member
 */
export async function getMemberListItem(memberId: number) {
  return await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
    },
  });
}

/**
 * Home-Page Member Daten - optimiert für Dashboard
 * Nur notwendige Felder, limitierte Relations
 */
export async function getMemberForHome(memberId: number) {
  return await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      role: true,
      teamId: true,
      photoUrl: true,
      // Team-Info minimal
      team: {
        select: {
          id: true,
          name: true,
          color: true,
          description: true,
        },
      },
      // Nur letzte 5 Attendances für Streak-Berechnung
      attendances: {
        orderBy: { date: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          date: true,
        },
      },
      // Nur ungelesene Notifications
      notifications: {
        where: { isRead: false },
        orderBy: { createdAt: "desc" },
        take: 3, // Maximal 3 anzeigen
        select: {
          id: true,
          message: true,
          createdAt: true,
        },
      },
    },
  });
}

/**
 * Vollständiges Member-Profil für Profil-Seite
 * Inkl. sensitiver Daten (nur für eigenes Profil!)
 */
export async function getMemberFullProfile(memberId: number) {
  return await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      role: true,
      joinDate: true,
      email: true,
      photoUrl: true,
      teamId: true,
      // Sensitive Daten nur für Profil-Seite
      emergencyContact: true,
      emergencyPhone: true,
      emergencyContact2: true,
      emergencyPhone2: true,
      allergies: true,
      diseases: true,
      medications: true,
      // Team minimal
      team: {
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
        },
      },
    },
  });
}

/**
 * Team-Mitglieder für Profil-Ansicht
 * Minimal, keine sensitiven Daten
 */
export async function getTeamMembers(teamId: number, limit = 20) {
  return await prisma.member.findMany({
    where: { 
      teamId,
      status: "active",
    },
    orderBy: { firstName: "asc" },
    take: limit,
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      role: true,
      photoUrl: true,
    },
  });
}

// ============================================
// ATTENDANCE QUERIES
// ============================================

/**
 * Attendance-Statistiken (aggregiert, kein Transfer großer Listen)
 */
export async function getAttendanceStats(memberId: number) {
  const counts = await prisma.attendance.groupBy({
    by: ["status"],
    where: { memberId },
    _count: { id: true },
  });

  const stats = {
    total: 0,
    present: 0,
    absent: 0,
    excused: 0,
  };

  counts.forEach((count) => {
    const num = count._count.id;
    stats.total += num;
    if (count.status === "present") stats.present = num;
    if (count.status === "absent") stats.absent = num;
    if (count.status === "excused") stats.excused = num;
  });

  return stats;
}

/**
 * Attendance-Map für Training-Seite
 * Nur IDs und Status, keine kompletten Objekte
 */
export async function getAttendanceMap(memberId: number, limit = 50) {
  const attendances = await prisma.attendance.findMany({
    where: { 
      memberId,
      type: "training",
    },
    orderBy: { date: "desc" },
    take: limit,
    select: {
      trainingId: true,
      status: true,
    },
  });

  return attendances.reduce((map, att) => {
    if (att.trainingId) {
      map[att.trainingId] = att.status;
    }
    return map;
  }, {} as Record<number, string>);
}

// ============================================
// TRAINING QUERIES
// ============================================

/**
 * Trainings-Liste für Training-Seite
 * Minimal, keine Teilnehmer-Details
 */
export async function getTrainingsList(teamId: number, limit = 20) {
  const today = new Date().toISOString().split("T")[0];

  return await prisma.trainingSession.findMany({
    where: {
      teamId,
      isArchived: false,
      date: { gte: today },
    },
    orderBy: { date: "asc" },
    take: limit,
    select: {
      id: true,
      title: true,
      date: true,
      time: true,
      location: true,
      trainer: true,
      status: true,
      description: true,
      maxParticipants: true,
      type: true,
      // Team minimal
      team: {
        select: {
          name: true,
          color: true,
        },
      },
    },
  });
}

/**
 * Kommende Trainings für Home-Dashboard
 * Nur nächste 3, minimal
 */
export async function getUpcomingTrainingsMinimal(teamId: number) {
  const today = new Date().toISOString().split("T")[0];

  return await prisma.trainingSession.findMany({
    where: {
      teamId,
      isArchived: false,
      date: { gte: today },
    },
    orderBy: { date: "asc" },
    take: 3, // Nur nächste 3
    select: {
      id: true,
      title: true,
      date: true,
      time: true,
      location: true,
      trainer: true,
      team: {
        select: {
          name: true,
          color: true,
        },
      },
    },
  });
}

// ============================================
// EVENT QUERIES
// ============================================

/**
 * Events-Liste minimal
 * Keine Teilnehmer-Details, nur Anzahl
 */
export async function getEventsListMinimal(limit = 15) {
  return await prisma.event.findMany({
    where: {
      status: { in: ["upcoming", "completed"] },
    },
    orderBy: { date: "asc" },
    take: limit,
    select: {
      id: true,
      title: true,
      date: true,
      time: true,
      location: true,
      type: true,
      status: true,
      description: true,
      // Zähle Teilnehmer statt alle zu laden
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });
}

/**
 * Events mit Teilnehmer-Details (für Events-Seite)
 * Optimiert: Nur minimal nötige Felder
 */
export async function getEventsWithParticipants(limit = 20) {
  return await prisma.event.findMany({
    where: {
      status: { in: ["upcoming", "completed"] },
    },
    orderBy: { date: "asc" },
    take: limit,
    select: {
      id: true,
      title: true,
      date: true,
      time: true,
      location: true,
      type: true,
      status: true,
      description: true,
      // Nur notwendige Teilnehmer-Daten
      participants: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      },
    },
  });
}

/**
 * Competitions-Liste minimal
 */
export async function getCompetitionsWithParticipants(limit = 20) {
  return await prisma.competition.findMany({
    where: {
      status: { in: ["upcoming", "completed"] },
    },
    orderBy: { date: "asc" },
    take: limit,
    select: {
      id: true,
      title: true,
      date: true,
      location: true,
      category: true,
      status: true,
      rank: true,
      score: true,
      participants: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      },
    },
  });
}

// ============================================
// ANNOUNCEMENT QUERIES
// ============================================

/**
 * Ankündigungen für Home-Seite
 * Minimal, ohne Poll-Details
 */
export async function getAnnouncementsMinimal(teamId?: number, limit = 5) {
  const now = new Date();
  
  const whereClause: any = {
    OR: [
      { expiresAt: null },
      { expiresAt: { gte: now } },
    ],
  };

  if (teamId) {
    whereClause.AND = {
      OR: [
        { AnnouncementTeam: { none: {} } },
        { AnnouncementTeam: { some: { teamId } } },
      ],
    };
  } else {
    whereClause.AnnouncementTeam = { none: {} };
  }
  
  return await prisma.announcement.findMany({
    where: whereClause,
    orderBy: [
      { isPinned: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
    select: {
      id: true,
      title: true,
      content: true,
      priority: true,
      isPinned: true,
      createdAt: true,
      expiresAt: true,
      category: true,
      // Teams minimal
      AnnouncementTeam: {
        select: {
          Team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Ankündigungen mit Poll-Daten für Events-Seite
 * Komplex, aber optimiert
 */
export async function getEventAnnouncementsWithPolls(teamId?: number, memberId?: number, limit = 15) {
  const now = new Date();
  
  const whereClause: any = {
    category: "event",
    OR: [
      { expiresAt: null },
      { expiresAt: { gte: now } },
    ],
  };

  if (teamId) {
    whereClause.AND = {
      OR: [
        { AnnouncementTeam: { none: {} } },
        { AnnouncementTeam: { some: { teamId } } },
      ],
    };
  } else {
    whereClause.AnnouncementTeam = { none: {} };
  }
  
  return await prisma.announcement.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      content: true,
      priority: true,
      isPinned: true,
      allowRsvp: true,
      createdAt: true,
      expiresAt: true,
      category: true,
      AnnouncementTeam: {
        select: {
          Team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      Poll: {
        select: {
          id: true,
          question: true,
          allowMultiple: true,
          isAnonymous: true,
          endsAt: true,
          PollOption: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              text: true,
              order: true,
              // Nur Vote-Count, keine Details
              _count: {
                select: {
                  PollVote: true,
                },
              },
              // Votes nur mit minimalen Daten
              PollVote: {
                select: {
                  id: true,
                  memberId: true,
                  Member: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      photoUrl: true,
                    },
                  },
                },
              },
            },
          },
          // Nur für Voting-Status-Check
          PollVote: {
            where: memberId ? { memberId } : undefined,
            select: {
              id: true,
              memberId: true,
            },
          },
        },
      },
      rsvps: {
        select: {
          id: true,
          memberId: true,
          status: true,
        },
      },
    },
  });
}

// ============================================
// ASSESSMENT QUERIES
// ============================================

/**
 * Letztes Assessment für Home-Dashboard
 * Nur Score und Level, keine Details
 */
export async function getLatestAssessmentMinimal(memberId: number) {
  return await prisma.trainingAssessment.findFirst({
    where: { memberId },
    orderBy: { date: "desc" },
    select: {
      id: true,
      overallScore: true,
      performanceLevel: true,
      date: true,
    },
  });
}

// ============================================
// SETTINGS / EINSTELLUNGEN QUERIES
// ============================================

/**
 * Member Settings - nur sensitive Felder für Einstellungen-Seite
 * Minimales Select: nur was für Settings benötigt wird
 */
export async function getMemberSettings(memberId: number) {
  return await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      email: true,
      emergencyContact: true,
      emergencyPhone: true,
      emergencyContact2: true,
      emergencyPhone2: true,
      allergies: true,
      diseases: true,
      medications: true,
    },
  });
}

// ============================================
// ADMIN/TRAINER INFO QUERIES
// ============================================

/**
 * Members mit Notfall-Infos für Trainer/Admin
 * Optimiert für Info-Seite: nur Mitglieder mit mindestens einer Info
 */
export async function getMembersWithEmergencyInfo(
  isAdmin: boolean,
  trainerTeamId: number | null
) {
  return await prisma.member.findMany({
    where: {
      status: "active",
      // Nur Mitglieder die mindestens eine Info haben
      OR: [
        { emergencyContact: { not: null } },
        { emergencyContact2: { not: null } },
        { allergies: { not: null } },
        { diseases: { not: null } },
        { medications: { not: null } },
      ],
      // Team-Filter für Trainer
      ...(isAdmin ? {} : { teamId: trainerTeamId }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      name: true,
      photoUrl: true,
      birthDate: true,
      emergencyContact: true,
      emergencyPhone: true,
      emergencyContact2: true,
      emergencyPhone2: true,
      allergies: true,
      diseases: true,
      medications: true,
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: [
      { team: { name: "asc" } },
      { firstName: "asc" },
    ],
    take: 100, // Limit für Performance
  });
}

/**
 * Teams für Filter (nur für Admins)
 */
export async function getActiveTeamsForFilter() {
  return await prisma.team.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
    select: { 
      id: true, 
      name: true, 
      color: true 
    },
  });
}

// ============================================
// ATTENDANCE / ANWESENHEIT QUERIES
// ============================================

/**
 * Nächstes/aktuelles Training für Anwesenheit-Seite
 * Optimiert für Trainer/Coach: kann auf Team eingeschränkt werden
 */
export async function getNextTrainingForAttendance(
  coachTeamId: number | null
) {
  const today = new Date().toISOString().split('T')[0];
  
  return await prisma.trainingSession.findFirst({
    where: {
      status: { not: "cancelled" },
      date: { gte: today },
      isArchived: false,
      ...(coachTeamId ? { teamId: coachTeamId } : {}),
    },
    orderBy: [
      { date: "asc" },
      { time: "asc" },
    ],
    select: {
      id: true,
      title: true,
      date: true,
      time: true,
      location: true,
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });
}

/**
 * Mitglieder eines Teams für Anwesenheit
 * Minimal: nur was für die Anwesenheitsliste gebraucht wird
 */
export async function getTeamMembersForAttendance(teamId: number) {
  return await prisma.member.findMany({
    where: {
      status: "active",
      teamId: teamId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      name: true,
      photoUrl: true,
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: [
      { firstName: "asc" },
    ],
    take: 50, // Limit für Performance
  });
}

/**
 * Existierende Attendance-Einträge für ein Training
 * Minimal: nur Status und Infos, keine Relations
 */
export async function getAttendancesForTraining(trainingId: number) {
  return await prisma.attendance.findMany({
    where: {
      trainingId: trainingId,
      type: "training",
    },
    select: {
      memberId: true,
      status: true,
      reason: true,
      notes: true,
    },
  });
}

/**
 * Coach Team Info - nur für Fehlermeldung
 */
export async function getCoachTeamName(coachTeamId: number) {
  return await prisma.team.findUnique({
    where: { id: coachTeamId },
    select: { name: true },
  });
}
