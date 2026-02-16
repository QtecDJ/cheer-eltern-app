import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findParents() {
  try {
    console.log('Suche nach möglichen Eltern-Accounts...\n');

    // Suche nach Katrin oder Corinna
    const possibleParents = await prisma.member.findMany({
      where: {
        OR: [
          { firstName: { contains: 'Katrin', mode: 'insensitive' } },
          { firstName: { contains: 'Corinna', mode: 'insensitive' } },
          { name: { contains: 'Katrin', mode: 'insensitive' } },
          { name: { contains: 'Corinna', mode: 'insensitive' } },
          { email: { contains: 'katrin.pichler', mode: 'insensitive' } },
          { email: { contains: 'corinna.pichler', mode: 'insensitive' } },
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
      }
    });

    console.log(`✅ ${possibleParents.length} mögliche(r) Eltern-Account(s) gefunden:\n`);
    possibleParents.forEach(parent => {
      console.log(`ID: ${parent.id}`);
      console.log(`  Name: ${parent.name}`);
      console.log(`  Vorname: ${parent.firstName}`);
      console.log(`  Nachname: ${parent.lastName}`);
      console.log(`  Email: ${parent.email || 'keine'}`);
      console.log(`  Geburtsdatum: ${parent.birthDate || 'nicht angegeben'}`);
      console.log(`  Role: ${parent.userRole || 'member'}`);
      console.log('');
    });

    // Zeige alle Pichler Members mit ihren Details
    console.log('\n=== Alle Pichler Members ===\n');
    const allPichlers = await prisma.member.findMany({
      where: {
        lastName: { contains: 'Pichler', mode: 'insensitive' }
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
        birthDate: 'asc'
      }
    });

    allPichlers.forEach(member => {
      const age = member.birthDate 
        ? Math.floor((new Date() - new Date(member.birthDate)) / (365.25 * 24 * 60 * 60 * 1000))
        : 'unbekannt';
      
      console.log(`ID ${member.id}: ${member.name}`);
      console.log(`  Email: ${member.email || 'keine'}`);
      console.log(`  Alter: ${age} Jahre`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findParents();
