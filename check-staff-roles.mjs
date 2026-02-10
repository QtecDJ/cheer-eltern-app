import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config({ path: '.env.local' });

const prisma = new PrismaClient();

async function checkStaffRoles() {
  try {
    console.log('🔍 Überprüfe Staff-Rollen...\n');

    // Check Kai's roles
    const kai = await prisma.member.findFirst({
      where: {
        OR: [
          { firstName: { contains: 'Kai', mode: 'insensitive' } },
          { lastName: { contains: 'Püttmann', mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        roles: true,
      },
    });

    if (!kai) {
      console.log('❌ Kai nicht gefunden');
      return;
    }

    console.log(`👤 Kai Püttmann (ID: ${kai.id})`);
    console.log(`   Roles: ${kai.roles.join(', ') || '(keine)'}`);
    console.log('');

    const hasAdminOrOrga = kai.roles.some(r => 
      r.toLowerCase() === 'admin' || r.toLowerCase() === 'orga'
    );

    if (hasAdminOrOrga) {
      console.log('✅ Kai hat admin/orga Rolle → sollte Push erhalten');
    } else {
      console.log('❌ Kai hat KEINE admin/orga Rolle → wird KEINE Push erhalten!');
      console.log('\n💡 Um Push zu erhalten, muss Kai die Rolle "admin" oder "orga" haben.');
    }

    // Find all staff
    console.log('\n👥 Alle Staff-Member (mit admin/orga Rolle):');
    
    const staffMembers = await prisma.member.findMany({
      where: {
        roles: {
          hasSome: ["admin", "orga"],
        },
      },
      select: {
        id: true,
        name: true,
        roles: true,
        pushSubscriptions: {
          select: {
            id: true,
            endpoint: true,
          },
        },
      },
    });

    if (staffMembers.length === 0) {
      console.log('   ❌ KEINE Staff-Member gefunden!');
      console.log('   Das ist das Problem - niemand hat admin/orga Rolle!');
    } else {
      for (const member of staffMembers) {
        console.log(`   - ${member.name} (ID: ${member.id})`);
        console.log(`     Roles: ${member.roles.join(', ')}`);
        console.log(`     Push-Subs: ${member.pushSubscriptions.length}`);
      }
    }

  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStaffRoles();
