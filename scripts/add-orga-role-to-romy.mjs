import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    // Try to find Romy by name parts
    const candidates = await prisma.member.findMany({
      where: {
        OR: [
          { firstName: { contains: 'Romy', mode: 'insensitive' } },
          { lastName: { contains: 'Vollstedt', mode: 'insensitive' } },
          { name: { contains: 'Romy Vollstedt', mode: 'insensitive' } },
          { name: { contains: 'Vollstedt', mode: 'insensitive' } },
        ],
      },
      take: 20,
    });

    if (candidates.length === 0) {
      console.log('No member matching Romy found.');
      process.exit(1);
    }

    console.log('Found candidates:');
    for (const c of candidates) {
      console.log(`- id=${c.id} name=${c.firstName} ${c.lastName} userRole=${c.userRole}`);
    }

    // Prefer exact match on lastName Vollstedt and firstName Romy
    let romy = candidates.find(c => (c.firstName || '').toLowerCase() === 'romy' && (c.lastName || '').toLowerCase() === 'vollstedt');
    if (!romy) romy = candidates[0];

    const current = romy.userRole || 'member';
    const roles = current.split(',').map(r => r.trim()).filter(Boolean);
    if (!roles.includes('orga')) {
      roles.push('orga');
      const newRole = roles.join(',');
      const updated = await prisma.member.update({ where: { id: romy.id }, data: { userRole: newRole } });
      console.log(`Updated member id=${romy.id} userRole: ${current} -> ${updated.userRole}`);
    } else {
      console.log(`Member id=${romy.id} already has 'orga' role.`);
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
