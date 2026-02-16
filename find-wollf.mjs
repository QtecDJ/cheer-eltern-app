import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findWollfs() {
  try {
    console.log('Suche nach Mara und Leah Wollf...\n');

    // Suche in Member Tabelle
    const members = await prisma.member.findMany({
      where: {
        OR: [
          { lastName: { contains: 'Wollf', mode: 'insensitive' } },
          { lastName: { contains: 'Wolf', mode: 'insensitive' } },
          { name: { contains: 'Wollf', mode: 'insensitive' } },
          { name: { contains: 'Wolf', mode: 'insensitive' } },
          { firstName: { contains: 'Mara', mode: 'insensitive' } },
          { firstName: { contains: 'Leah', mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        birthDate: true,
        userRole: true,
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log(`✅ ${members.length} Member(s) gefunden:\n`);
    members.forEach(member => {
      const age = member.birthDate 
        ? Math.floor((new Date() - new Date(member.birthDate)) / (365.25 * 24 * 60 * 60 * 1000))
        : 'unbekannt';
      
      console.log(`ID: ${member.id}`);
      console.log(`  Name: ${member.name}`);
      console.log(`  Vorname: ${member.firstName}`);
      console.log(`  Nachname: ${member.lastName}`);
      console.log(`  Email: ${member.email || 'keine'}`);
      console.log(`  Alter: ${age} Jahre`);
      console.log(`  Role: ${member.userRole || 'member'}`);
      console.log('');
    });

    // Suche in Child Tabelle
    const children = await prisma.child.findMany({
      where: {
        OR: [
          { lastName: { contains: 'Wollf', mode: 'insensitive' } },
          { lastName: { contains: 'Wolf', mode: 'insensitive' } },
          { firstName: { contains: 'Mara', mode: 'insensitive' } },
          { firstName: { contains: 'Leah', mode: 'insensitive' } },
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

findWollfs();
