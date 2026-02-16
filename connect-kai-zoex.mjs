import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function connectKaiWithZoex() {
  try {
    console.log('=== Verbinde Kai mit Zoex ===\n');

    // 1. Find Kai Püttmann (Parent)
    const kai = await prisma.member.findFirst({
      where: {
        OR: [
          { firstName: { contains: 'Kai', mode: 'insensitive' } },
          { lastName: { contains: 'Püttmann', mode: 'insensitive' } },
          { name: { contains: 'Kai', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
      }
    });

    if (!kai) {
      console.error('❌ Kai Püttmann nicht gefunden in Member-Tabelle');
      return;
    }

    console.log('✓ Kai gefunden:');
    console.log(`  ID: ${kai.id}, Name: ${kai.name}`);

    // 2. Find Zoex in Child or Member table
    const zoexMember = await prisma.member.findFirst({
      where: {
        OR: [
          { firstName: { contains: 'Zoex', mode: 'insensitive' } },
          { name: { contains: 'Zoex', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
      }
    });

    const zoexChild = await prisma.child.findFirst({
      where: {
        OR: [
          { firstName: { contains: 'Zoex', mode: 'insensitive' } },
          { lastName: { contains: 'Püttmann', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        memberId: true,
      }
    });

    console.log('\n✓ Zoex Status:');
    if (zoexMember) {
      console.log(`  Member gefunden: ID ${zoexMember.id}, Name: ${zoexMember.name}`);
    }
    if (zoexChild) {
      console.log(`  Child gefunden: ID ${zoexChild.id}, Name: ${zoexChild.firstName} ${zoexChild.lastName}, memberId: ${zoexChild.memberId}`);
    }

    if (!zoexChild) {
      console.error('\n❌ Zoex nicht als Child gefunden');
      console.log('   Zoex muss zuerst in der Child-Tabelle existieren.');
      
      if (zoexMember) {
        console.log('\n💡 Erstelle Child-Eintrag für Zoex...');
        
        const newChild = await prisma.child.create({
          data: {
            firstName: zoexMember.firstName,
            lastName: zoexMember.lastName,
            birthDate: new Date('2015-01-01'), // Placeholder - bitte anpassen!
            memberId: zoexMember.id,
            status: 'active',
            email: zoexMember.email,
            allergies: 'Keine',
            diseases: 'Keine',
            medications: 'Keine',
            emergencyContact: 'Kai Püttmann',
            emergencyPhone: '', // Bitte ergänzen
          }
        });
        
        console.log(`✓ Child erstellt mit ID: ${newChild.id}`);
        
        // Update zoexChild reference
        const updatedZoexChild = await prisma.child.findUnique({
          where: { id: newChild.id }
        });
        
        if (!updatedZoexChild) {
          console.error('❌ Child konnte nicht gefunden werden nach Erstellung');
          return;
        }
        
        console.log('\n✓ Erstelle ParentChildRelation...');
        const relation = await prisma.parentChildRelation.create({
          data: {
            parentId: kai.id,
            childId: updatedZoexChild.id,
            relationshipType: 'parent',
            isActive: true,
            inviteStatus: 'accepted',
            acceptedAt: new Date(),
          }
        });
        
        console.log(`✓ Relation erstellt mit ID: ${relation.id}`);
        console.log(`  Parent: ${kai.name} (ID: ${kai.id})`);
        console.log(`  Child: ${updatedZoexChild.firstName} ${updatedZoexChild.lastName} (ID: ${updatedZoexChild.id})`);
        console.log(`  Child Member: ${updatedZoexChild.memberId}`);
      } else {
        console.log('\n❌ Zoex existiert weder als Member noch als Child');
      }
      return;
    }

    // 3. Check if relation already exists
    const existingRelation = await prisma.parentChildRelation.findFirst({
      where: {
        parentId: kai.id,
        childId: zoexChild.id,
      }
    });

    if (existingRelation) {
      console.log('\n⚠️  Relation existiert bereits!');
      console.log(`   Relation ID: ${existingRelation.id}`);
      console.log(`   Status: ${existingRelation.isActive ? 'Aktiv' : 'Inaktiv'}`);
      
      if (!existingRelation.isActive) {
        console.log('\n💡 Aktiviere Relation...');
        await prisma.parentChildRelation.update({
          where: { id: existingRelation.id },
          data: { isActive: true }
        });
        console.log('✓ Relation aktiviert');
      }
      return;
    }

    // 4. Create new relation
    console.log('\n✓ Erstelle ParentChildRelation...');
    const relation = await prisma.parentChildRelation.create({
      data: {
        parentId: kai.id,
        childId: zoexChild.id,
        relationshipType: 'parent',
        isActive: true,
        inviteStatus: 'accepted',
        acceptedAt: new Date(),
      }
    });

    console.log(`\n✅ Erfolg! Relation erstellt mit ID: ${relation.id}`);
    console.log(`   Parent: ${kai.name} (ID: ${kai.id})`);
    console.log(`   Child: ${zoexChild.firstName} ${zoexChild.lastName} (ID: ${zoexChild.id})`);
    if (zoexChild.memberId) {
      console.log(`   Child Member ID: ${zoexChild.memberId}`);
    }
    console.log('\n🎉 Kai kann jetzt zu Zoex\'s Profil wechseln!');

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

connectKaiWithZoex();
