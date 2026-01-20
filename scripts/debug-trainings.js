const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

(async function(){
  const prisma = new PrismaClient();
  try {
    const trainingIds = [13,14,15];
    const trainings = await prisma.trainingSession.findMany({
      where: { id: { in: trainingIds } },
      select: { id: true, title: true, date: true, time: true }
    });
    console.log('Trainings:');
    trainings.forEach(t => {
      const dateStr = t.date ? new Date(t.date).toISOString().split('T')[0] : '—';
      console.log(`- id:${t.id} | ${t.title} | ${dateStr} ${t.time || ''}`);
    });
  } catch(e){
    console.error(e);
  } finally{
    await prisma.$disconnect();
  }
})();
