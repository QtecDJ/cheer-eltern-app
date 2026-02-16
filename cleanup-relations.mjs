import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupRelations() {
  try {
    console.log('Lösche fehlerhafte Relation (ID 3)...\n');

    const relation = await prisma.parentChildRelation.findUnique({
      where: { id: 3 }
    });

    if (!relation) {
      console.log('❌ Relation ID 3 nicht gefunden.');
      return;
    }

    console.log('Gefundene Relation:');
    console.log(`  Parent ID: ${relation.parentId}`);
    console.log(`  Child ID: ${relation.childId}`);
    console.log('');

    await prisma.parentChildRelation.delete({
      where: { id: 3 }
    });

    console.log('✅ Relation ID 3 gelöscht!');

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupRelations();
