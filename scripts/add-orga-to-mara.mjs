import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const firstName = 'Mara';
  const lastName = 'Wolff';

  const member = await prisma.member.findFirst({
    where: { firstName, lastName },
  });

  if (!member) {
    console.error(`Member not found: ${firstName} ${lastName}`);
    process.exit(1);
  }

  const roles = member.roles || [];
  if (roles.includes('orga')) {
    console.log(`Member already has 'orga' role: ${firstName} ${lastName}`);
    console.log('No changes made.');
    process.exit(0);
  }

  const updated = await prisma.member.update({
    where: { id: member.id },
    data: { roles: { push: 'orga' } },
  });

  console.log(`Added 'orga' role to member ${firstName} ${lastName} (id=${member.id}).`);
  console.log('Current roles:', updated.roles);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
