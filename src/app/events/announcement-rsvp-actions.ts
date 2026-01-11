"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Zusage für eine Ankündigung
 */
export async function acceptAnnouncement(announcementId: number, memberId: number) {
  try {
    // Prüfe ob Announcement existiert und allowRsvp erlaubt
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      return { success: false, error: "Ankündigung nicht gefunden" };
    }

    if (!announcement.allowRsvp) {
      return { success: false, error: "Zu-/Absagen sind für diese Ankündigung nicht aktiviert" };
    }

    // Prüfe ob abgelaufen
    if (announcement.expiresAt && new Date(announcement.expiresAt) < new Date()) {
      return { success: false, error: "Diese Ankündigung ist abgelaufen" };
    }

    // Erstelle oder aktualisiere RSVP
    await prisma.announcementRSVP.upsert({
      where: {
        announcementId_memberId: {
          announcementId,
          memberId,
        },
      },
      create: {
        announcementId,
        memberId,
        status: "accepted",
      },
      update: {
        status: "accepted",
        respondedAt: new Date(),
      },
    });

    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    console.error("Accept announcement error:", error);
    return { success: false, error: "Ein Fehler ist aufgetreten" };
  }
}

/**
 * Absage für eine Ankündigung
 */
export async function declineAnnouncement(announcementId: number, memberId: number) {
  try {
    // Prüfe ob Announcement existiert und allowRsvp erlaubt
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      return { success: false, error: "Ankündigung nicht gefunden" };
    }

    if (!announcement.allowRsvp) {
      return { success: false, error: "Zu-/Absagen sind für diese Ankündigung nicht aktiviert" };
    }

    // Prüfe ob abgelaufen
    if (announcement.expiresAt && new Date(announcement.expiresAt) < new Date()) {
      return { success: false, error: "Diese Ankündigung ist abgelaufen" };
    }

    // Erstelle oder aktualisiere RSVP
    await prisma.announcementRSVP.upsert({
      where: {
        announcementId_memberId: {
          announcementId,
          memberId,
        },
      },
      create: {
        announcementId,
        memberId,
        status: "declined",
      },
      update: {
        status: "declined",
        respondedAt: new Date(),
      },
    });

    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    console.error("Decline announcement error:", error);
    return { success: false, error: "Ein Fehler ist aufgetreten" };
  }
}

/**
 * RSVP zurückziehen
 */
export async function removeAnnouncementRSVP(announcementId: number, memberId: number) {
  try {
    await prisma.announcementRSVP.deleteMany({
      where: {
        announcementId,
        memberId,
      },
    });

    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    console.error("Remove announcement RSVP error:", error);
    return { success: false, error: "Ein Fehler ist aufgetreten" };
  }
}
