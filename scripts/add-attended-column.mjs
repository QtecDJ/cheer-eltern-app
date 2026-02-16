import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function addAttendedColumn() {
  try {
    console.log('🔄 Adding attended column to AnnouncementRSVP table...');

    const sql = fs.readFileSync(
      path.join(__dirname, 'add-attended-column.sql'),
      'utf8'
    );

    await prisma.$executeRawUnsafe(sql);

    console.log('✅ Successfully added attended column!');
    console.log('');
    console.log('The attended column has been added with the following behavior:');
    console.log('  - null: Attendance not yet confirmed');
    console.log('  - true: Member attended');
    console.log('  - false: Member did not attend');
  } catch (error) {
    console.error('❌ Error adding attended column:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addAttendedColumn();
