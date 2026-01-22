// Read-only diagnostics: find duplicate attendance entries (memberId + trainingId + type) where count > 1
// Usage: node scripts/check-duplicate-attendances.js

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking for duplicate attendance entries (memberId + trainingId + type) ...');

  // Fallback: benutze $queryRaw für Aggregation, kompatibel mit allen Prisma-Versionen
  const duplicates = await prisma.$queryRaw`
    SELECT "memberId", "trainingId", "type", COUNT(*) as cnt
    FROM "Attendance"
    WHERE "type" = 'training'
    GROUP BY "memberId", "trainingId", "type"
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
    LIMIT 200
  `;

  if (!duplicates || duplicates.length === 0) {
    console.log('No duplicates found.');
  } else {
    console.log(`Found ${duplicates.length} duplicate groups. Showing top results:`);
    console.log(JSON.stringify(duplicates, null, 2));

    // Optionally, show detailed entries for the first few groups
    const sample = duplicates.slice(0, 10);
    for (const group of sample) {
      const memberId = group.memberId;
      const trainingId = group.trainingId;
      const rows = await prisma.attendance.findMany({
        where: {
          memberId: memberId,
          trainingId: trainingId,
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      });
      console.log(`\nEntries for memberId=${memberId} trainingId=${trainingId}:`);
      console.log(rows.map(r => ({ id: r.id, status: r.status, updatedAt: r.updatedAt })));
    }
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error running duplicate check:', e);
  try { await prisma.$disconnect(); } catch (er) {}
  process.exit(1);
});