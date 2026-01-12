const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ZvmfB4Dur2KO@ep-calm-star-ag0w1zic-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

(async () => {
  try {
    const members = await prisma.member.findMany({
      where: {
        userRole: { in: ['trainer', 'admin'] }
      },
      select: {
        id: true,
        name: true,
        userRole: true,
        teamId: true,
        team: {
          select: { name: true }
        }
      }
    });
    
    console.log('=== TRAINER UND ADMINS ===');
    members.forEach(m => {
      console.log(`${m.name} (${m.userRole}) -> Team ${m.team?.name || 'Kein Team'} (ID: ${m.teamId})`);
    });
    
    const teams = await prisma.team.findMany({
      where: { status: 'active' },
      select: { id: true, name: true }
    });
    
    console.log('\n=== TEAMS ===');
    teams.forEach(t => {
      console.log(`Team ${t.id}: ${t.name}`);
    });
    
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
          select: { name: true }
        }
      },
      orderBy: { date: 'asc' },
      take: 10
    });
    
    console.log('\n=== TRAININGS ===');
    trainings.forEach(t => {
      console.log(`Training ${t.id}: ${t.title} (${t.date}) -> Team ${t.team?.name || 'Kein Team'} (ID: ${t.teamId})`);
    });
    
  } catch (error) {
    console.error('Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
