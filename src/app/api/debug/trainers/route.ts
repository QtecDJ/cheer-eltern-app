import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// Cache für 5 Minuten - Debug-Daten ändern sich selten
export const revalidate = 300;

export async function GET() {
  try {
    // Alle Coaches und Admins
    const members = await prisma.member.findMany({
      where: {
        userRole: { in: ['coach', 'admin'] }
      },
      select: {
        id: true,
        name: true,
        userRole: true,
        teamId: true,
        team: {
          select: { 
            name: true,
            color: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // Alle Teams
    const teams = await prisma.team.findMany({
      where: { status: 'active' },
      select: { 
        id: true, 
        name: true,
        color: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // Aktive Trainings
    const trainings = await prisma.trainingSession.findMany({
      where: {
        status: { not: 'cancelled' },
        isArchived: false
      },
      select: {
        id: true,
        title: true,
        date: true,
        teamId: true,
        team: {
          select: { 
            name: true,
            color: true
          }
        }
      },
      orderBy: { date: 'asc' },
      take: 10
    });
    
    return NextResponse.json({
      members,
      teams,
      trainings
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Daten:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Daten' },
      { status: 500 }
    );
  }
}
