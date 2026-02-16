import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function connectSunnySummer() {
  try {
    console.log('Verbinde Sunny (ID 51) mit Summer (ID 50)...\n');

    // Sunny als Parent (ID 51 - hat Email katrin.pichler@gmx.de)
    const sunny = await prisma.member.findUnique({
      where: { id: 51 },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    });

    if (!sunny) {
      console.log('❌ Sunny (ID 51) nicht gefunden!');
      return;
    }

    console.log('✅ Sunny (Parent) gefunden:');
    console.log(`   ID: ${sunny.id}`);
    console.log(`   Name: ${sunny.name}`);
    console.log(`   Email: ${sunny.email}\n`);

    // Summer als Kind (ID 50)
    const summer = await prisma.member.findUnique({
      where: { id: 50 },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    });

    if (!summer) {
      console.log('❌ Summer (ID 50) nicht gefunden!');
      return;
    }

    console.log('✅ Summer (Kind) gefunden:');
    console.log(`   ID: ${summer.id}`);
    console.log(`   Name: ${summer.name}`);
    console.log(`   Email: ${summer.email || 'keine'}\n`);

    // Prüfe ob Summer einen Child-Eintrag hat
    let summerChild = await prisma.child.findFirst({
      where: {
        memberId: summer.id
      }
    });

    if (!summerChild) {
      console.log('⚠️  Summer hat noch keinen Child-Eintrag, erstelle einen...');
      
      summerChild = await prisma.child.create({
        data: {
          firstName: summer.firstName,
          lastName: summer.lastName,
          memberId: summer.id,
          status: 'active',
        }
      });
      
      console.log(`✅ Child-Eintrag erstellt (ID: ${summerChild.id})\n`);
    } else {
      console.log(`✅ Child-Eintrag existiert bereits (ID: ${summerChild.id})\n`);
    }

    // Prüfe ob Relation bereits existiert
    const existingRelation = await prisma.parentChildRelation.findFirst({
      where: {
        parentId: sunny.id,
        childId: summerChild.id
      }
    });

    if (existingRelation) {
      console.log('ℹ️  Relation existiert bereits:');
      console.log(`   Relation ID: ${existingRelation.id}`);
      console.log(`   Status: ${existingRelation.isActive ? 'Active' : 'Inactive'}`);
      console.log(`   Relationship Type: ${existingRelation.relationshipType}`);
      
      if (!existingRelation.isActive) {
        await prisma.parentChildRelation.update({
          where: { id: existingRelation.id },
          data: { isActive: true }
        });
        console.log('✅ Relation wurde aktiviert');
      }
    } else {
      // Erstelle neue Relation
      console.log('Erstelle Parent-Child Relation...');
      
      const relation = await prisma.parentChildRelation.create({
        data: {
          parentId: sunny.id,
          childId: summerChild.id,
          relationshipType: 'parent',
          isActive: true,
          canViewAttendance: true,
          canEditProfile: true,
          canReceiveMessages: true,
          canAuthorizePickup: true,
        }
      });

      console.log('\n✅ Relation erfolgreich erstellt!');
      console.log(`   Relation ID: ${relation.id}`);
      console.log(`   Sunny (${sunny.id}) → Summer (${summerChild.id}, Member: ${summer.id})`);
      console.log(`   Permissions: Alle aktiviert`);
    }

    console.log('\n✅ Fertig! Sunny kann jetzt zu Summers Profil wechseln.');

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

connectSunnySummer();
