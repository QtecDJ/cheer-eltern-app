import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Charlotte Richert (Member ID: 32, Team: Princesses)
    const charlotte = await prisma.member.findUnique({
      where: { id: 32 },
      include: {
        team: true,
      },
    });

    console.log('=== Charlotte Info ===');
    console.log('Name:', charlotte?.firstName, charlotte?.lastName);
    console.log('Team:', charlotte?.team?.name, `(ID: ${charlotte?.teamId})`);
    console.log('');

    if (charlotte?.teamId) {
      // Trainings für Charlottes Team
      const today = new Date().toISOString().split('T')[0];
      const trainings = await prisma.trainingSession.findMany({
        where: {
          teamId: charlotte.teamId,
          isArchived: false,
          date: { gte: today },
          type: 'training',
        },
        orderBy: { date: 'asc' },
        take: 10,
        select: {
          id: true,
          title: true,
          date: true,
          time: true,
          location: true,
          trainer: true,
          status: true,
        },
      });

      console.log('=== Kommende Trainings für Team', charlotte.team?.name, '===');
      if (trainings.length === 0) {
        console.log('❌ KEINE TRAININGS GEFUNDEN!');
      } else {
        trainings.forEach(t => {
          console.log(`- ${t.title} | ${t.date} ${t.time} | ${t.location} | Status: ${t.status}`);
        });
      }
      console.log('');

      // Events (alle, nicht team-spezifisch)
      const events = await prisma.event.findMany({
        where: {
          status: { in: ['upcoming', 'completed'] },
        },
        orderBy: { date: 'asc' },
        take: 10,
        select: {
          id: true,
          title: true,
          date: true,
          time: true,
          location: true,
          type: true,
          status: true,
        },
      });

      console.log('=== Events (alle Teams) ===');
      if (events.length === 0) {
        console.log('❌ KEINE EVENTS GEFUNDEN!');
      } else {
        events.forEach(e => {
          console.log(`- ${e.title} | ${e.date} ${e.time} | ${e.location} | Typ: ${e.type}`);
        });
      }
      console.log('');

      // Competitions
      const competitions = await prisma.competition.findMany({
        where: {
          status: { in: ['upcoming', 'completed'] },
        },
        orderBy: { date: 'asc' },
        take: 10,
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
          category: true,
          status: true,
        },
      });

      console.log('=== Competitions ===');
      if (competitions.length === 0) {
        console.log('❌ KEINE COMPETITIONS GEFUNDEN!');
      } else {
        competitions.forEach(c => {
          console.log(`- ${c.title} | ${c.date} | ${c.location} | Kategorie: ${c.category}`);
        });
      }
    }
  } catch (error) {
    console.error('Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
