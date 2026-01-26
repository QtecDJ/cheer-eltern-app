// Create or update a test user with bcrypt-hashed password
// Usage: node scripts/create-test-user.js

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const firstName = 'test';
  const lastName = 'Orga';
  const password = '123456';

  try {
    const hashed = await bcrypt.hash(password, 10);

    const existing = await prisma.member.findFirst({
      where: {
        firstName: { contains: firstName, mode: 'insensitive' },
        lastName: { contains: lastName, mode: 'insensitive' },
      },
    });

    if (existing) {
      console.log(`Member exists (id=${existing.id}). Updating password and roles.`);
      const updated = await prisma.member.update({
        where: { id: existing.id },
        data: {
          passwordHash: hashed,
          userRole: 'orga',
          roles: ['orga'],
          status: 'active',
        },
      });
      console.log('Updated member:', { id: updated.id, name: `${updated.firstName} ${updated.lastName}`, userRole: updated.userRole });
      process.exit(0);
    }

    // create minimal required fields based on schema
    const nowDate = new Date().toISOString().split('T')[0];
    const created = await prisma.member.create({
      data: {
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        birthDate: '1990-01-01',
        role: 'member',
        joinDate: nowDate,
        passwordHash: hashed,
        userRole: 'orga',
        roles: ['orga'],
        status: 'active',
      },
    });

    console.log('Created test member:', { id: created.id, name: created.name, userRole: created.userRole });
    console.log('Credentials: firstName=test lastName=Orga password=123456');
    process.exit(0);
  } catch (e) {
    console.error('Error creating test user:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
