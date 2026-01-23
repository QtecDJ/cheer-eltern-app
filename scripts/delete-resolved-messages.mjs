import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const hours = process.env.HOURS ? Number(process.env.HOURS) : 48;
    const cutoff = new Date(Date.now() - hours * 3600 * 1000);
    const result = await prisma.message.deleteMany({ where: { status: 'resolved', resolvedAt: { lt: cutoff } } });
    console.log(`Deleted ${result.count} resolved messages older than ${hours} hours.`);
  } catch (e) {
    console.error('Error deleting resolved messages:', e);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

run();
