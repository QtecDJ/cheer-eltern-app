import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Adding roles column via raw SQL...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "roles" text[] DEFAULT '{}'::text[];`);
    console.log('Done.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
