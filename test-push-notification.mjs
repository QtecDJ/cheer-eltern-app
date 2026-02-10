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

async function sendTestPush() {
  try {
    // Find Kai Püttmann
    const kai = await prisma.member.findFirst({
      where: {
        OR: [
          { firstName: { contains: 'Kai', mode: 'insensitive' } },
          { lastName: { contains: 'Püttmann', mode: 'insensitive' } },
          { name: { contains: 'Püttmann', mode: 'insensitive' } },
        ],
      },
      include: {
        pushSubscriptions: true,
      },
    });

    if (!kai) {
      console.log('❌ Kai Püttmann nicht in der Datenbank gefunden');
      return;
    }

    console.log(`✓ Kai gefunden: ${kai.name} (ID: ${kai.id})`);

    if (!kai.pushSubscriptions || kai.pushSubscriptions.length === 0) {
      console.log('⚠️  Kai hat noch keine Push-Subscriptions.');
      console.log('   Er muss zuerst auf den Bell-Button klicken und Push-Benachrichtigungen aktivieren!');
      return;
    }

    console.log(`✓ ${kai.pushSubscriptions.length} Push-Subscription(s) gefunden`);

    // Send test notification to all subscriptions
    const payload = JSON.stringify({
      title: '🔔 Test-Benachrichtigung',
      body: 'Dies ist eine Test-Push-Nachricht für Kai Püttmann!',
      url: '/',
      icon: '/icons/icon-192x192.png',
    });

    let successCount = 0;

    for (const sub of kai.pushSubscriptions) {
      try {
        console.log(`Sende an Subscription: ${sub.endpoint.substring(0, 50)}...`);
        
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );

        console.log('✓ Push-Nachricht erfolgreich gesendet!');
        successCount++;
      } catch (error) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log('⚠️  Subscription ist abgelaufen, wird gelöscht...');
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          console.error('❌ Fehler beim Senden:', error.message);
        }
      }
    }

    console.log(`\n✅ Fertig! ${successCount} von ${kai.pushSubscriptions.length} Nachricht(en) erfolgreich gesendet.`);
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

sendTestPush();
