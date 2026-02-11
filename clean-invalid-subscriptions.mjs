import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanInvalidSubscriptions() {
  try {
    console.log('🔍 Checking for invalid push subscriptions...\n');

    // Get all subscriptions
    const allSubscriptions = await prisma.pushSubscription.findMany();
    console.log(`📊 Total subscriptions found: ${allSubscriptions.length}\n`);

    // Find invalid ones (missing or empty auth/p256dh)
    const invalidSubscriptions = allSubscriptions.filter(sub => {
      return !sub.auth || sub.auth.length === 0 || 
             !sub.p256dh || sub.p256dh.length === 0;
    });

    console.log(`❌ Invalid subscriptions found: ${invalidSubscriptions.length}\n`);

    if (invalidSubscriptions.length === 0) {
      console.log('✅ No invalid subscriptions found!');
      return;
    }

    // Show details of invalid subscriptions
    invalidSubscriptions.forEach((sub, index) => {
      console.log(`${index + 1}. Subscription ID: ${sub.id}`);
      console.log(`   Member ID: ${sub.memberId}`);
      console.log(`   Endpoint: ${sub.endpoint.substring(0, 50)}...`);
      console.log(`   Auth: ${sub.auth ? `"${sub.auth}" (length: ${sub.auth.length})` : 'NULL/missing'}`);
      console.log(`   P256dh: ${sub.p256dh ? `"${sub.p256dh}" (length: ${sub.p256dh.length})` : 'NULL/missing'}`);
      console.log(`   Created: ${sub.createdAt}`);
      console.log('');
    });

    // Delete invalid subscriptions
    const idsToDelete = invalidSubscriptions.map(sub => sub.id);
    
    const result = await prisma.pushSubscription.deleteMany({
      where: {
        id: { in: idsToDelete }
      }
    });

    console.log(`🗑️  Deleted ${result.count} invalid subscriptions\n`);
    console.log('✅ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanInvalidSubscriptions();
