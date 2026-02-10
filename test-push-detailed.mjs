import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const prisma = new PrismaClient();

// Configure VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:qtec_production@icloud.com';

console.log('VAPID Public Key:', vapidPublicKey ? '✓ Geladen' : '❌ Fehlt');
console.log('VAPID Private Key:', vapidPrivateKey ? '✓ Geladen' : '❌ Fehlt');

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

async function sendDetailedTestPush() {
  try {
    // Find Kai Püttmann with latest subscriptions
    const kai = await prisma.member.findFirst({
      where: {
        OR: [
          { firstName: { contains: 'Kai', mode: 'insensitive' } },
          { lastName: { contains: 'Püttmann', mode: 'insensitive' } },
        ],
      },
      include: {
        pushSubscriptions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!kai) {
      console.log('❌ Kai Püttmann nicht gefunden');
      return;
    }

    console.log(`\n✓ Kai gefunden: ${kai.name} (ID: ${kai.id})`);
    console.log(`✓ ${kai.pushSubscriptions.length} Subscription(s) gefunden\n`);

    if (kai.pushSubscriptions.length === 0) {
      console.log('⚠️  Keine Subscriptions vorhanden');
      return;
    }

    // Only send to iOS subscriptions (Apple)
    const iosSubscriptions = kai.pushSubscriptions.filter(sub => 
      sub.endpoint.includes('web.push.apple.com')
    );

    console.log(`📱 ${iosSubscriptions.length} iOS Subscription(s) gefunden\n`);

    if (iosSubscriptions.length === 0) {
      console.log('⚠️  Keine iOS-Subscriptions gefunden');
      return;
    }

    // Send with more detailed payload
    const payload = JSON.stringify({
      title: '🔔 Test-Push #2',
      body: `Test um ${new Date().toLocaleTimeString('de-DE')} Uhr - Wenn du dies siehst, funktioniert Push!`,
      url: '/',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      timestamp: Date.now(),
    });

    console.log('📤 Sende Payload:');
    console.log(JSON.parse(payload));
    console.log('');

    for (const sub of iosSubscriptions) {
      try {
        console.log(`📱 Sende an iOS-Device...`);
        console.log(`   Endpoint: ${sub.endpoint.substring(0, 70)}...`);
        console.log(`   Erstellt: ${sub.createdAt.toLocaleString('de-DE')}`);
        
        const result = await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );

        console.log(`   ✅ Status Code: ${result.statusCode}`);
        console.log(`   Headers:`, result.headers);
        console.log('');
      } catch (error) {
        console.error(`   ❌ Fehler:`, error.body || error.message);
        console.error(`   Status Code:`, error.statusCode);
        
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log('   🗑️  Lösche abgelaufene Subscription...');
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
        console.log('');
      }
    }

    console.log('\n✅ Test abgeschlossen');
    console.log('\n💡 Wenn keine Benachrichtigung ankommt:');
    console.log('   1. Prüfe iOS Einstellungen → Benachrichtigungen → Safari');
    console.log('   2. Öffne die PWA und checke ob Service Worker aktiv ist');
    console.log('   3. Prüfe ob "Nicht stören" aktiv ist');
    console.log('   4. Schaue in Notification Center (von oben wischen)');

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

sendDetailedTestPush();
