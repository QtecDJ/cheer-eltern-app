import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const members = await prisma.member.findMany({ select: { id: true, userRole: true, roles: true } });
    let updated = 0;
    for (const m of members) {
      const existing = m.roles || [];
      if (existing.length > 0) continue; // already migrated
      const from = (m.userRole || '').toString().split(',').map(s => s.trim()).filter(Boolean);
      if (from.length === 0) continue;
      await prisma.member.update({ where: { id: m.id }, data: { roles: from } });
      updated++;
      console.log(`Migrated member ${m.id}: ${from.join(',')}`);
    }
    console.log(`Migration complete. Updated ${updated} members.`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
