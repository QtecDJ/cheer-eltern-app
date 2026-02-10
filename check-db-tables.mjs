import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config({ path: '.env.local' });

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('🔍 Überprüfe Datenbank-Tabellen...\n');

    // Query all tables in the database
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%push%'
      ORDER BY table_name;
    `;

    console.log('📋 Tabellen mit "push" im Namen:');
    console.log(tables);
    console.log('');

    // Check if push_subscriptions exists and has data
    const pushSubCount = await prisma.pushSubscription.count();
    console.log(`✓ push_subscriptions: ${pushSubCount} Einträge`);

  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
