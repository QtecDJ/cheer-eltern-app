require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const member = await prisma.member.findFirst({ where: { firstName: 'kai' } });
  if (!member) {
    console.log('Member mit Vorname kai nicht gefunden');
    await prisma.$disconnect();
    return;
  }

  console.log('Member:', { id: member.id, name: member.name });

  const upcoming = await prisma.trainingSession.findMany({
    where: { date: { gte: new Date().toISOString().split('T')[0] } },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
    take: 20,
  });

  const attendances = await prisma.attendance.findMany({ where: { memberId: member.id, type: 'training' } });

  const map = {};
  attendances.forEach(a => {
    if (a.trainingId) map[a.trainingId] = map[a.trainingId] || [];
    if (a.trainingId) map[a.trainingId].push({ id: a.id, status: a.status, date: a.date, updatedAt: a.updatedAt });
  });

  console.log('\nUpcoming Trainings:');
  upcoming.forEach(t => {
    const entries = map[t.id] || [];
    console.log(`${t.id} - ${t.title} - ${t.date} ${t.time} - Attendance: ${entries.length > 0 ? JSON.stringify(entries) : 'none'}`);
  });

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); try { await prisma.$disconnect(); } catch {} process.exit(1); });
