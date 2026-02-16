import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  try {
    // Charlotte Richert (Member ID: 32)
    const charlotte = await prisma.member.findUnique({
      where: { id: 32 },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        role: true,
        email: true,
        photoUrl: true,
        teamId: true,
        emergencyContact: true,
        emergencyPhone: true,
        emergencyContact2: true,
        emergencyPhone2: true,
        allergies: true,
        diseases: true,
        medications: true,
        team: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
          },
        },
      },
    });

    console.log('=== Charlotte Richert - Vollständiges Profil ===\n');
    
    if (!charlotte) {
      console.log('❌ FEHLER: Charlotte nicht gefunden!');
      return;
    }

    console.log('📋 Basis-Informationen:');
    console.log('  ID:', charlotte.id);
    console.log('  Name:', charlotte.name);
    console.log('  Vorname:', charlotte.firstName);
    console.log('  Nachname:', charlotte.lastName);
    console.log('  Geburtstag:', charlotte.birthDate);
    console.log('  Rolle:', charlotte.role);
    console.log('  Email:', charlotte.email || '❌ NICHT GESETZT');
    console.log('  Foto:', charlotte.photoUrl || '❌ KEIN FOTO');
    console.log('');

    console.log('👥 Team:');
    if (charlotte.team) {
      console.log('  Team ID:', charlotte.team.id);
      console.log('  Team Name:', charlotte.team.name);
      console.log('  Team Farbe:', charlotte.team.color);
      console.log('  Beschreibung:', charlotte.team.description || 'Keine');
    } else {
      console.log('  ❌ KEIN TEAM ZUGEWIESEN');
    }
    console.log('');

    console.log('🚨 Notfallkontakte:');
    if (charlotte.emergencyContact || charlotte.emergencyPhone) {
      console.log('  Kontakt 1:', charlotte.emergencyContact || '❌ NICHT GESETZT');
      console.log('  Telefon 1:', charlotte.emergencyPhone || '❌ NICHT GESETZT');
    } else {
      console.log('  ❌ NOTFALLKONTAKT 1 NICHT VORHANDEN');
    }
    
    if (charlotte.emergencyContact2 || charlotte.emergencyPhone2) {
      console.log('  Kontakt 2:', charlotte.emergencyContact2 || '❌ NICHT GESETZT');
      console.log('  Telefon 2:', charlotte.emergencyPhone2 || '❌ NICHT GESETZT');
    } else {
      console.log('  ⚠️  NOTFALLKONTAKT 2 NICHT VORHANDEN');
    }
    console.log('');

    console.log('💊 Gesundheitsinformationen:');
    if (charlotte.allergies) {
      console.log('  Allergien:', charlotte.allergies);
    } else {
      console.log('  Allergien: ❌ NICHT GESETZT');
    }
    
    if (charlotte.diseases) {
      console.log('  Krankheiten:', charlotte.diseases);
    } else {
      console.log('  Krankheiten: ❌ NICHT GESETZT');
    }
    
    if (charlotte.medications) {
      console.log('  Medikamente:', charlotte.medications);
    } else {
      console.log('  Medikamente: ❌ NICHT GESETZT');
    }

    console.log('');
    console.log('=== Zusammenfassung ===');
    const issues = [];
    if (!charlotte.team) issues.push('Kein Team zugewiesen');
    if (!charlotte.emergencyContact && !charlotte.emergencyPhone) issues.push('Notfallkontakt fehlt');
    if (!charlotte.allergies && !charlotte.diseases && !charlotte.medications) issues.push('Gesundheitsdaten fehlen');
    
    if (issues.length > 0) {
      console.log('⚠️  Fehlende Daten:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('✅ Alle Daten vollständig');
    }

  } catch (error) {
    console.error('Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
