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

console.log('🔑 VAPID Keys loaded');
webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

async function sendTestPushToSandra() {
  console.log('\n🔍 Finding Sandra Pohl...');
  
  const sandra = await prisma.member.findFirst({
    where: {
      id: 29 // Sandra Pohl
    }
  });
  
  if (!sandra) {
    console.log('❌ Sandra Pohl not found');
    return;
  }
  
  console.log(`✅ Found: ${sandra.firstName} ${sandra.lastName} (ID: ${sandra.id})`);
  console.log(`   Email: ${sandra.email || 'N/A'}`);
  console.log(`   Roles: ${Array.isArray(sandra.roles) ? sandra.roles.join(', ') : sandra.userRole || 'N/A'}`);
  
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { memberId: sandra.id }
  });
  
  console.log(`\n📱 Found ${subscriptions.length} active subscription(s)`);
  
  if (subscriptions.length === 0) {
    console.log('⚠️  Sandra has no push subscriptions. She needs to:');
    console.log('   1. Open the PWA on her device');
    console.log('   2. Click the bell icon to enable push notifications');
    return;
  }
  
  console.log('\n🚀 Sending test push notification...\n');
  
  const payload = JSON.stringify({
    title: 'Test Nachricht',
    body: 'Dies ist eine Test-Push-Benachrichtigung für Sandra Pohl',
    url: '/messages',
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
    
    console.log(`📤 Device: ${sub.userAgent?.slice(0, 50) || 'Unknown'}`);
    console.log(`   Endpoint: ${sub.endpoint.slice(0, 60)}...`);
    
    try {
      const result = await webpush.sendNotification(pushSubscription, payload);
      console.log(`   ✅ Success! Status: ${result.statusCode}`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      if (error.statusCode) {
        console.log(`   Status Code: ${error.statusCode}`);
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

sendTestPushToSandra()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
