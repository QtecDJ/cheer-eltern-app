import { PrismaClient } from '@prisma/client';
import { sendPushToUser } from './src/lib/send-push.ts';

const prisma = new PrismaClient();

async function testPushToKai() {
  try {
    console.log('🔔 Sending test push notification to Kai...\n');

    // Find Kai
    const kai = await prisma.member.findFirst({
      where: {
        email: { contains: 'kai.puettmann', mode: 'insensitive' }
      }
    });

    if (!kai) {
      console.log('❌ Kai not found');
      return;
    }

    console.log(`Found: ${kai.firstName} ${kai.lastName} (ID: ${kai.id})\n`);

    // Send push notification
    const result = await sendPushToUser(kai.id, {
      title: 'Test Benachrichtigung',
      body: 'Wenn du das siehst, funktionieren Push-Benachrichtigungen! 🎉',
      url: '/messages',
      icon: '/icons/icon-192x192.png'
    });

    console.log('\n📊 Results:');
    result.forEach((r, index) => {
      if (r.status === 'fulfilled') {
        const value = r.value;
        console.log(`${index + 1}. ✅ Success: ${value.success}`);
        if (value.expired) console.log('   ⚠️  Subscription expired');
        if (value.temporary) console.log('   ⚠️  Temporary network error');
        if (value.error) console.log(`   ❌ Error: ${value.error}`);
      } else {
        console.log(`${index + 1}. ❌ Failed: ${r.reason}`);
      }
    });

    console.log('\n✅ Test completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPushToKai();
