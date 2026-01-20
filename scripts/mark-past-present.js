const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

(async function(){
  const prisma = new PrismaClient();
  try {
    const memberId = 1;
    const today = new Date().toISOString().split('T')[0];

    // Fetch attendance rows for trainings
    const rows = await prisma.attendance.findMany({
      where: { memberId, type: 'training' },
      orderBy: { date: 'desc' }
    });

    // Collect trainingIds to fetch titles/dates
    const trainingIds = rows.map(r => r.trainingId).filter(Boolean);
    const trainings = await prisma.trainingSession.findMany({
      where: { id: { in: trainingIds } },
      select: { id: true, title: true, date: true }
    });
    const trainingMap = trainings.reduce((m, t) => { m[t.id] = t; return m; }, {});

    console.log(`Found ${rows.length} attendance rows for member ${memberId}.`);

    let updated = 0;
    for (const r of rows) {
      const t = r.trainingId ? trainingMap[r.trainingId] : null;
      if (!t) continue;
      const trainingDateStr = new Date(t.date).toISOString().split('T')[0];
      if (trainingDateStr >= today) continue; // skip future

      const title = (t.title || '').toLowerCase();
      if (/open\s*-?\s*gym/i.test(title)) {
        console.log(`Skipping Open Gym: trainingId=${t.id} title="${t.title}" status=${r.status}`);
        continue;
      }

      if (r.status !== 'present') {
        await prisma.attendance.update({
          where: { id: r.id },
          data: {
            status: 'present',
            notes: null,
            reason: null,
            updatedAt: new Date(),
          }
        });
        console.log(`Updated attendance id=${r.id} trainingId=${t.id} -> present`);
        updated++;
      } else {
        console.log(`Already present: trainingId=${t.id} title="${t.title}"`);
      }
    }

    console.log(`Done. Updated ${updated} rows.`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
