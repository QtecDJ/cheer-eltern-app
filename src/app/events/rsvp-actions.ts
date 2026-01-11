"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Zusage für ein Event
 */
export async function acceptEvent(eventId: number, memberId: number) {
  try {
    // Prüfe ob Event existiert
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { participants: true },
    });

    if (!event) {
      return { success: false, error: "Event nicht gefunden" };
    }

    // Prüfe ob bereits zugesagt
    const isParticipant = event.participants.some((p) => p.id === memberId);
    
    if (isParticipant) {
      return { success: false, error: "Du hast bereits zugesagt" };
    }

    // Füge Teilnehmer hinzu
    await prisma.event.update({
      where: { id: eventId },
      data: {
        participants: {
          connect: { id: memberId },
        },
      },
    });

    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    console.error("Accept event error:", error);
    return { success: false, error: "Ein Fehler ist aufgetreten" };
  }
}

/**
 * Absage für ein Event
 */
export async function declineEvent(eventId: number, memberId: number) {
  try {
    // Prüfe ob Event existiert
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { participants: true },
    });

    if (!event) {
      return { success: false, error: "Event nicht gefunden" };
    }

    // Prüfe ob zugesagt hat
    const isParticipant = event.participants.some((p) => p.id === memberId);
    
    if (!isParticipant) {
      return { success: false, error: "Du hast nicht zugesagt" };
    }

    // Entferne Teilnehmer
    await prisma.event.update({
      where: { id: eventId },
      data: {
        participants: {
          disconnect: { id: memberId },
        },
      },
    });

    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    console.error("Decline event error:", error);
    return { success: false, error: "Ein Fehler ist aufgetreten" };
  }
}

/**
 * Zusage für einen Wettkampf
 */
export async function acceptCompetition(competitionId: number, memberId: number) {
  try {
    // Prüfe ob Competition existiert
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: { participants: true },
    });

    if (!competition) {
      return { success: false, error: "Wettkampf nicht gefunden" };
    }

    // Prüfe ob bereits zugesagt
    const isParticipant = competition.participants.some((p) => p.id === memberId);
    
    if (isParticipant) {
      return { success: false, error: "Du hast bereits zugesagt" };
    }

    // Füge Teilnehmer hinzu
    await prisma.competition.update({
      where: { id: competitionId },
      data: {
        participants: {
          connect: { id: memberId },
        },
      },
    });

    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    console.error("Accept competition error:", error);
    return { success: false, error: "Ein Fehler ist aufgetreten" };
  }
}

/**
 * Absage für einen Wettkampf
 */
export async function declineCompetition(competitionId: number, memberId: number) {
  try {
    // Prüfe ob Competition existiert
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: { participants: true },
    });

    if (!competition) {
      return { success: false, error: "Wettkampf nicht gefunden" };
    }

    // Prüfe ob zugesagt hat
    const isParticipant = competition.participants.some((p) => p.id === memberId);
    
    if (!isParticipant) {
      return { success: false, error: "Du hast nicht zugesagt" };
    }

    // Entferne Teilnehmer
    await prisma.competition.update({
      where: { id: competitionId },
      data: {
        participants: {
          disconnect: { id: memberId },
        },
      },
    });

    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    console.error("Decline competition error:", error);
    return { success: false, error: "Ein Fehler ist aufgetreten" };
  }
}
