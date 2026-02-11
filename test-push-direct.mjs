import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';
import 'dotenv/config';

const prisma = new PrismaClient();

// VAPID setup
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('❌ VAPID keys not configured!');
  process.exit(1);
}

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

async function testPushDirect() {
  try {
    console.log('🔍 Finding Kai iPhone subscriptions...\n');
    
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        memberId: 1, // Kai
        endpoint: { contains: 'apple.com' } // Only iPhone
      }
    });

    console.log(`Found ${subscriptions.length} iPhone subscriptions\n`);

    if (subscriptions.length === 0) {
      console.log('❌ No iPhone subscriptions found');
      return;
    }

    const payload = JSON.stringify({
      title: '🔔 Direct Test',
      body: 'Dies ist ein direkter Push-Test! Wenn du das siehst, funktioniert es!',
      url: '/messages',
      icon: '/icons/icon-192x192.png'
    });

    console.log('📤 Sending push notifications...\n');

    for (const sub of subscriptions) {
      console.log(`Sending to: ${sub.endpoint.substring(0, 60)}...`);
      
      try {
        const result = await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          payload
        );
        
        console.log(`✅ Success! Status: ${result.statusCode}`);
        console.log(`   Body: ${result.body || '(empty)'}`);
      } catch (error) {
        console.error(`❌ Failed:`, error.message);
        console.error(`   Status: ${error.statusCode}`);
        console.error(`   Body: ${error.body}`);
      }
      console.log('');
    }

    console.log('\n✅ Test completed!');
    console.log('📱 Check your iPhone for notifications!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPushDirect();
