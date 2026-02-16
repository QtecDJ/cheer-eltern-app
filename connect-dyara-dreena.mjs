import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function connectDyaraDreena() {
  try {
    console.log('Verbinde Dyara (ID 52) mit Dreena (ID 58)...\n');

    // Dyara als Parent (ID 52 - 8 Jahre)
    const dyara = await prisma.member.findUnique({
      where: { id: 52 },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    });

    if (!dyara) {
      console.log('❌ Dyara (ID 52) nicht gefunden!');
      return;
    }

    console.log('✅ Dyara (Parent) gefunden:');
    console.log(`   ID: ${dyara.id}`);
    console.log(`   Name: ${dyara.name}`);
    console.log(`   Email: ${dyara.email || 'keine'}\n`);

    // Dreena als Kind (ID 58 - 6 Jahre)
    const dreena = await prisma.member.findUnique({
      where: { id: 58 },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    });

    if (!dreena) {
      console.log('❌ Dreena (ID 58) nicht gefunden!');
      return;
    }

    console.log('✅ Dreena (Kind) gefunden:');
    console.log(`   ID: ${dreena.id}`);
    console.log(`   Name: ${dreena.name}`);
    console.log(`   Email: ${dreena.email || 'keine'}\n`);

    // Prüfe ob Dreena einen Child-Eintrag hat
    let dreenaChild = await prisma.child.findFirst({
      where: {
        memberId: dreena.id
      }
    });

    if (!dreenaChild) {
      console.log('⚠️  Dreena hat noch keinen Child-Eintrag, erstelle einen...');
      
      dreenaChild = await prisma.child.create({
        data: {
          firstName: dreena.firstName,
          lastName: dreena.lastName,
          memberId: dreena.id,
          status: 'active',
        }
      });
      
      console.log(`✅ Child-Eintrag erstellt (ID: ${dreenaChild.id})\n`);
    } else {
      console.log(`✅ Child-Eintrag existiert bereits (ID: ${dreenaChild.id})\n`);
    }

    // Prüfe ob Relation bereits existiert
    const existingRelation = await prisma.parentChildRelation.findFirst({
      where: {
        parentId: dyara.id,
        childId: dreenaChild.id
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
          parentId: dyara.id,
          childId: dreenaChild.id,
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
      console.log(`   Dyara (${dyara.id}) → Dreena (${dreenaChild.id}, Member: ${dreena.id})`);
      console.log(`   Permissions: Alle aktiviert`);
    }

    console.log('\n✅ Fertig! Dyara kann jetzt zu Dreenas Profil wechseln.');

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

connectDyaraDreena();
