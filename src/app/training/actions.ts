"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type ResponseStatus = "confirmed" | "declined" | "pending";

export async function respondToTraining(
  memberId: number,
  trainingId: number,
  status: ResponseStatus,
  reason?: string
) {
  try {
    // Prüfe ob bereits eine Antwort existiert
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        memberId,
        trainingId,
        type: "training",
      },
    });

    if (existingAttendance) {
      // Update bestehende Antwort(en) — aktualisiere alle Einträge für dieses Training und Mitglied
      await prisma.attendance.updateMany({
        where: { memberId, trainingId, type: "training" },
        data: {
          status: status === "confirmed" ? "present" : status === "declined" ? "excused" : "pending",
          notes: status === "declined" ? "Vom Elternteil abgesagt" : null,
          reason: status === "declined" ? reason : null,
          updatedAt: new Date(),
        },
      });
    } else {
      // Erstelle neue Antwort
      const training = await prisma.trainingSession.findUnique({
        where: { id: trainingId },
        select: { date: true, teamId: true },
      });

      if (!training) {
        return { success: false, error: "Training nicht gefunden" };
      }

      await prisma.attendance.create({
        data: {
          memberId,
          trainingId,
          type: "training",
          status: status === "confirmed" ? "present" : status === "declined" ? "excused" : "pending",
          date: new Date(training.date),
          notes: status === "declined" ? "Vom Elternteil abgesagt" : null,
          reason: status === "declined" ? reason : null,
          teamId: training.teamId,
        },
      });
    }

    // Revalidiere beide Seiten um die neuen Daten anzuzeigen
    revalidatePath("/training", "page");
    revalidatePath("/", "page");
    
    // Zusätzlich: Revalidiere auch alle dynamischen Segmente
    revalidatePath("/training");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Fehler beim Speichern der Trainingsantwort:", error);
    return { success: false, error: "Fehler beim Speichern" };
  }
}
