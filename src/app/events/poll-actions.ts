"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Abstimmen für eine oder mehrere Poll-Optionen
 */
export async function votePoll(pollId: number, optionIds: number[], memberId: number) {
  try {
    // Hole die Poll, um Einstellungen zu prüfen
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: {
        allowMultiple: true,
        endsAt: true,
      },
    });

    if (!poll) {
      return { success: false, error: "Umfrage nicht gefunden" };
    }

    // Prüfe ob die Umfrage abgelaufen ist
    if (poll.endsAt && new Date(poll.endsAt) < new Date()) {
      return { success: false, error: "Die Umfrage ist bereits beendet" };
    }

    // Prüfe Mehrfachauswahl
    if (!poll.allowMultiple && optionIds.length > 1) {
      return { success: false, error: "Mehrfachauswahl ist bei dieser Umfrage nicht erlaubt" };
    }

    // Entferne alle bisherigen Stimmen dieses Mitglieds für diese Umfrage
    await prisma.pollVote.deleteMany({
      where: {
        pollId,
        memberId,
      },
    });

    // Füge neue Stimmen hinzu
    if (optionIds.length > 0) {
      await prisma.pollVote.createMany({
        data: optionIds.map((optionId) => ({
          pollId,
          optionId,
          memberId,
        })),
      });
    }

    // Revalidiere die Events-Seite
    revalidatePath("/events");

    return { success: true };
  } catch (error) {
    console.error("Vote poll error:", error);
    return { success: false, error: "Ein Fehler ist aufgetreten" };
  }
}

/**
 * Stimme von einer Umfrage zurückziehen
 */
export async function removePollVote(pollId: number, memberId: number) {
  try {
    // Prüfe ob die Umfrage noch aktiv ist
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: { endsAt: true },
    });

    if (!poll) {
      return { success: false, error: "Umfrage nicht gefunden" };
    }

    if (poll.endsAt && new Date(poll.endsAt) < new Date()) {
      return { success: false, error: "Die Umfrage ist bereits beendet" };
    }

    // Entferne alle Stimmen
    await prisma.pollVote.deleteMany({
      where: {
        pollId,
        memberId,
      },
    });

    // Revalidiere die Events-Seite
    revalidatePath("/events");

    return { success: true };
  } catch (error) {
    console.error("Remove poll vote error:", error);
    return { success: false, error: "Ein Fehler ist aufgetreten" };
  }
}
