import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findPichlers() {
  try {
    console.log('Suche nach allen Pichlers in der Datenbank...\n');

    // Suche in Member Tabelle
    const members = await prisma.member.findMany({
      where: {
        OR: [
          { lastName: { contains: 'Pichler', mode: 'insensitive' } },
          { name: { contains: 'Pichler', mode: 'insensitive' } },
          { firstName: { contains: 'Sunny', mode: 'insensitive' } },
          { firstName: { contains: 'Summer', mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        birthDate: true,
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log(`✅ ${members.length} Member(s) gefunden:\n`);
    members.forEach(member => {
      console.log(`ID: ${member.id}`);
      console.log(`  Name: ${member.name}`);
      console.log(`  Vorname: ${member.firstName}`);
      console.log(`  Nachname: ${member.lastName}`);
      console.log(`  Email: ${member.email || 'keine'}`);
      console.log(`  Geburtsdatum: ${member.birthDate || 'nicht angegeben'}`);
      console.log('');
    });

    // Suche in Child Tabelle
    const children = await prisma.child.findMany({
      where: {
        OR: [
          { lastName: { contains: 'Pichler', mode: 'insensitive' } },
          { firstName: { contains: 'Sunny', mode: 'insensitive' } },
          { firstName: { contains: 'Summer', mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        memberId: true,
        birthDate: true,
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log(`\n✅ ${children.length} Child/Children gefunden:\n`);
    children.forEach(child => {
      console.log(`Child ID: ${child.id}`);
      console.log(`  Vorname: ${child.firstName}`);
      console.log(`  Nachname: ${child.lastName}`);
      console.log(`  Member ID: ${child.memberId || 'keine'}`);
      console.log(`  Geburtsdatum: ${child.birthDate || 'nicht angegeben'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findPichlers();
