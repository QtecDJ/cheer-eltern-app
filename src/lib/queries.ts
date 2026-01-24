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
import { encryptText, decryptText } from "@/lib/crypto";

// ============================================
// MEMBER QUERIES
// ============================================

/**
 * Minimales Member-Profil für Listen (z.B. Teilnehmerlisten)
 * Nur 4 Felder = ~100 bytes statt ~2KB pro Member
 */
/**
 * @deprecated Candidate for removal/relocation. Kept for compatibility.
 */
// `getMemberListItem` moved to `src/deprecated/lib/queries.deprecated.ts` and
// removed to clean up unused exports.

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
  // Hole die neuesten Attendance-Einträge für Trainings und wähle pro trainingId den aktuellsten Eintrag
  const attendances = await prisma.attendance.findMany({
    where: { memberId, type: "training" },
    orderBy: { updatedAt: "desc" },
    take: 1000,
    select: { trainingId: true, status: true },
  });

  const latestByTraining = new Map<number, string>();
  for (const att of attendances) {
    if (att.trainingId && !latestByTraining.has(att.trainingId)) {
      latestByTraining.set(att.trainingId, att.status);
    }
  }

  const stats = {
    total: latestByTraining.size,
    present: 0,
    absent: 0,
    excused: 0,
  };

  for (const status of latestByTraining.values()) {
    if (status === "present") stats.present++;
    if (status === "absent") stats.absent++;
    if (status === "excused") stats.excused++;
  }

  return stats;
}

/**
 * Attendance-Map für Training-Seite
 * Nur IDs und Status, keine kompletten Objekte
 */
export async function getAttendanceMap(memberId: number, limit = 50) {
  // Lade neueste Attendances (updatedAt) zuerst und nimm für jede trainingId den aktuellsten Eintrag
  const attendances = await prisma.attendance.findMany({
    where: { memberId, type: "training" },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { trainingId: true, status: true },
  });

  const map: Record<number, string> = {};
  for (const att of attendances) {
    if (att.trainingId && map[att.trainingId] === undefined) {
      map[att.trainingId] = att.status;
    }
  }

  return map;
}

// ============================================
// TRAINING QUERIES
// ============================================

/**
 * Trainings-Liste für Training-Seite
 * Minimal, keine Teilnehmer-Details
 */
export async function getTrainingsList(teamId: number, limit = 20) {
  return await prisma.trainingSession.findMany({
    where: {
      teamId,
      isArchived: false,
      type: "training",
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
      type: "training",
    },
    orderBy: { date: "asc" },
    take: 3, // Nur nächste 3
    select: {
      id: true,
      title: true,
      updatedAt: true,
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
/**
 * @deprecated Candidate for removal/relocation. Kept for compatibility.
 */
// `getEventsListMinimal` moved to `src/deprecated/lib/queries.deprecated.ts` and removed.

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
export async function getAnnouncementsMinimal(teamId?: number, limit = 20) {
  const now = new Date();
  // Kombiniere alle Bedingungen in einer AND-Liste, damit keine überschrieben wird
  const andConditions: any[] = [
    {
      OR: [
        { category: { equals: "news", mode: "insensitive" } },
        { category: { equals: "info", mode: "insensitive" } },
      ],
    },
    {
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: now } },
      ],
    },
  ];
  if (teamId) {
    andConditions.push({
      OR: [
        { AnnouncementTeam: { none: {} } },
        { AnnouncementTeam: { some: { teamId } } },
      ],
    });
  } else {
    andConditions.push({ AnnouncementTeam: { none: {} } });
  }
  return await prisma.announcement.findMany({
    where: { AND: andConditions },
    orderBy: [
      { isPinned: "desc" },
      { createdAt: "desc" },
    ],
    take: 20,
    select: {
      id: true,
      title: true,
      content: true,
      updatedAt: true,
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
export async function getEventAnnouncementsWithPolls(teamId?: number | number[] , memberId?: number, limit = 15) {
  const now = new Date();
  // Kombiniere alle Bedingungen in einer AND-Liste, damit keine überschrieben wird
  const andConditions: any[] = [
    {
      OR: [
        { category: { equals: "event", mode: "insensitive" } },
        { category: { equals: "info", mode: "insensitive" } },
        { category: { equals: "news", mode: "insensitive" } },
      ],
    },
    {
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: now } },
      ],
    },
  ];
  if (teamId) {
    if (Array.isArray(teamId)) {
      const ids = teamId.filter(Boolean) as number[];
      if (ids.length > 0) {
        andConditions.push({
          OR: [
            { AnnouncementTeam: { none: {} } },
            { AnnouncementTeam: { some: { teamId: { in: ids } } } },
          ],
        });
      } else {
        andConditions.push({ AnnouncementTeam: { none: {} } });
      }
    } else {
      andConditions.push({
        OR: [
          { AnnouncementTeam: { none: {} } },
          { AnnouncementTeam: { some: { teamId } } },
        ],
      });
    }
  } else {
    andConditions.push({ AnnouncementTeam: { none: {} } });
  }
  return await prisma.announcement.findMany({
    where: { AND: andConditions },
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
      updatedAt: true,
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

/**
 
 */

// ======================
// Message / Ticket APIs
// ======================

export async function createMessage(data: { subject: string; body: string; senderId: number; target?: string }) {
  const body = encryptText(data.body || "");
  return await prisma.message.create({
    data: {
      subject: data.subject,
      body,
      senderId: data.senderId,
      audience: data.target || "admins",
    },
  });
}

export async function getMessagesForStaff(limit = 50) {
  // Return recent open/assigned messages
  const rows = await prisma.message.findMany({
    where: { status: { in: ["open", "assigned"] } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      subject: true,
      audience: true,
      senderId: true,
      status: true,
      assignedTo: true,
      createdAt: true,
      body: true,
      sender: { select: { id: true, firstName: true, lastName: true, name: true, teamId: true, team: { select: { id: true, name: true } } } },
    },
  });
  // Decrypt bodies before returning
  return rows.map((r) => ({ ...r, body: r.body ? decryptText(r.body) : r.body }));
}

export async function getMessagesForMember(memberId: number, limit = 50) {
  const rows = await prisma.message.findMany({
    where: { senderId: memberId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      replies: {
        include: { author: { select: { id: true, firstName: true, lastName: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      assignee: { select: { id: true, firstName: true, lastName: true, name: true } },
    },
  });

  return rows.map((r) => ({
    ...r,
    body: r.body ? decryptText(r.body as string) : r.body,
    replies: r.replies?.map((rep: any) => ({ ...rep, body: rep.body ? decryptText(rep.body) : rep.body })),
  }));
}

export async function getMessageById(id: number | string) {
  const parsedId = typeof id === "string" ? parseInt(id, 10) : id;
  if (!parsedId || Number.isNaN(parsedId)) return null;

  const row = await prisma.message.findUnique({
    where: { id: parsedId },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, email: true, name: true } },
      assignee: { select: { id: true, firstName: true, lastName: true, name: true } },
      replies: { include: { author: { select: { id: true, firstName: true, lastName: true, name: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!row) return null;
  // decrypt the message body and replies
  const decryptedBody = row.body ? decryptText(row.body) : row.body;
  const replies = row.replies?.map((r: any) => ({ ...r, body: r.body ? decryptText(r.body) : r.body }));
  return { ...row, body: decryptedBody, replies };
}

export async function createMessageReply(messageId: number, authorId: number, body: string) {
  const enc = encryptText(body || "");
  return await prisma.messageReply.create({
    data: {
      messageId,
      authorId,
      body: enc,
    },
  });
}

export async function assignMessageTo(messageId: number, assigneeId: number | null) {
  return await prisma.message.update({
    where: { id: messageId },
    data: {
      assignedTo: assigneeId,
      status: assigneeId ? "assigned" : "open",
    },
  });
}

export async function markMessageResolved(messageId: number) {
  return await prisma.message.update({
    where: { id: messageId },
    data: { status: "resolved", resolvedAt: new Date() },
  });
}

export async function deleteResolvedMessagesOlderThan(hours = 48) {
  const cutoff = new Date(Date.now() - hours * 3600 * 1000);
  const deleted = await prisma.message.deleteMany({ where: { status: "resolved", resolvedAt: { lt: cutoff } } });
  return deleted;
}
