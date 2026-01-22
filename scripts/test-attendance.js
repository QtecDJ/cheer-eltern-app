// Testskript: erstellt mehrere Attendance-Einträge und führt ein UpdateMany aus, prüft das Ergebnis
// Lauf: node scripts/test-attendance.js

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  // Erstelle Test-Member
  const member = await prisma.member.create({
    data: {
      name: 'test-member-temp',
      firstName: 'Test',
      lastName: 'Member',
      birthDate: '2000-01-01',
      role: 'member',
      joinDate: now.toISOString().split('T')[0],
    },
  });

  // Erstelle Test-Training
  const training = await prisma.trainingSession.create({
    data: {
      title: 'Test Training',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '18:00',
      location: 'Test Halle',
      maxParticipants: 10,
      type: 'training',
    },
  });

  // Erstelle einen pending Attendance-Eintrag
  await prisma.attendance.create({
    data: { memberId: member.id, trainingId: training.id, type: 'training', status: 'pending', date: now, teamId: null },
  });

  // Zeige aktuelle Stände
  const before = await prisma.attendance.findMany({ where: { memberId: member.id, trainingId: training.id } });
  console.log('Before:', before.map(a => ({ id: a.id, status: a.status })));

  // Simuliere das Verhalten der Server-Action: UpdateMany
  await prisma.attendance.updateMany({
    where: { memberId: member.id, trainingId: training.id, type: 'training' },
    data: { status: 'present', updatedAt: new Date() },
  });

  const after = await prisma.attendance.findMany({ where: { memberId: member.id, trainingId: training.id } });
  console.log('After:', after.map(a => ({ id: a.id, status: a.status })));

  // Cleanup
  await prisma.attendance.deleteMany({ where: { memberId: member.id, trainingId: training.id } });
  await prisma.trainingSession.delete({ where: { id: training.id } });
  await prisma.member.delete({ where: { id: member.id } });

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Test error:', e);
  try { await prisma.$disconnect(); } catch (er) {}
  process.exit(1);
});
