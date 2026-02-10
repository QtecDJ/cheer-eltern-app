import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

// Set VAPID details
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
  console.error('❌ Missing VAPID environment variables');
  process.exit(1);
}

console.log('🔑 VAPID Keys loaded:');
console.log(`   Public: ${vapidPublicKey.slice(0, 20)}...`);
console.log(`   Private: ${vapidPrivateKey.slice(0, 20)}...`);
console.log(`   Subject: ${vapidSubject}`);

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

async function sendTestAssignmentPush() {
  console.log('\n🔍 Finding Kai Püttmann...');
  
  const kai = await prisma.member.findFirst({
    where: {
      OR: [
        { email: { contains: 'kai', mode: 'insensitive' } },
        { firstName: { contains: 'kai', mode: 'insensitive' } }
      ]
    }
  });
  
  if (!kai) {
    console.log('❌ Kai not found');
    return;
  }
  
  console.log(`✅ Found: ${kai.firstName} ${kai.lastName} (ID: ${kai.id})`);
  
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { memberId: kai.id }
  });
  
  console.log(`\n📱 Sending to ${subscriptions.length} devices...\n`);
  
  const payload = JSON.stringify({
    title: 'Test: Nachricht zugewiesen',
    body: 'Dies ist ein Test der Assignment-Push-Benachrichtigung',
    url: '/messages/76',
    icon: '/icons/icon-192x192.png'
  });
  
  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };
    
    console.log(`🚀 Sending to: ${sub.userAgent?.slice(0, 40) || 'Unknown'}`);
    console.log(`   Endpoint: ${sub.endpoint.slice(0, 50)}...`);
    
    try {
      const result = await webpush.sendNotification(pushSubscription, payload);
      console.log(`   ✅ Success! Status: ${result.statusCode}`);
      if (result.body) {
        console.log(`   Response: ${result.body}`);
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      if (error.statusCode) {
        console.log(`   Status Code: ${error.statusCode}`);
      }
      if (error.body) {
        console.log(`   Response: ${error.body}`);
      }
      
      // Remove expired subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`   🗑️  Removing expired subscription...`);
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
    console.log('');
  }
  
  console.log('✨ Test complete!');
}

sendTestAssignmentPush()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
