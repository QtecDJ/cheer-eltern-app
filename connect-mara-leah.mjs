import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function connectMaraLeah() {
  try {
    console.log('Verbinde Mara (ID 56) mit Leah (ID 46)...\n');

    // Mara als Parent (ID 56 - 8 Jahre, Email: wolff.mara@web.de)
    const mara = await prisma.member.findUnique({
      where: { id: 56 },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    });

    if (!mara) {
      console.log('❌ Mara (ID 56) nicht gefunden!');
      return;
    }

    console.log('✅ Mara (Parent) gefunden:');
    console.log(`   ID: ${mara.id}`);
    console.log(`   Name: ${mara.name}`);
    console.log(`   Email: ${mara.email}\n`);

    // Leah als Kind (ID 46 - 5 Jahre, Email: wolff.leah@web.de)
    const leah = await prisma.member.findUnique({
      where: { id: 46 },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    });

    if (!leah) {
      console.log('❌ Leah (ID 46) nicht gefunden!');
      return;
    }

    console.log('✅ Leah (Kind) gefunden:');
    console.log(`   ID: ${leah.id}`);
    console.log(`   Name: ${leah.name}`);
    console.log(`   Email: ${leah.email || 'keine'}\n`);

    // Prüfe ob Leah einen Child-Eintrag hat
    let leahChild = await prisma.child.findFirst({
      where: {
        memberId: leah.id
      }
    });

    if (!leahChild) {
      console.log('⚠️  Leah hat noch keinen Child-Eintrag, erstelle einen...');
      
      leahChild = await prisma.child.create({
        data: {
          firstName: leah.firstName,
          lastName: leah.lastName,
          memberId: leah.id,
          status: 'active',
        }
      });
      
      console.log(`✅ Child-Eintrag erstellt (ID: ${leahChild.id})\n`);
    } else {
      console.log(`✅ Child-Eintrag existiert bereits (ID: ${leahChild.id})\n`);
    }

    // Prüfe ob Relation bereits existiert
    const existingRelation = await prisma.parentChildRelation.findFirst({
      where: {
        parentId: mara.id,
        childId: leahChild.id
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
          parentId: mara.id,
          childId: leahChild.id,
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
      console.log(`   Mara (${mara.id}) → Leah (${leahChild.id}, Member: ${leah.id})`);
      console.log(`   Permissions: Alle aktiviert`);
    }

    console.log('\n✅ Fertig! Mara kann jetzt zu Leahs Profil wechseln.');

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

connectMaraLeah();
