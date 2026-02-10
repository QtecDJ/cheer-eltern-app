import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';
import { config } from 'dotenv';

config({ path: '.env.local' });

const prisma = new PrismaClient();

// Configure VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || '';

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

async function testStaffPush() {
  try {
    console.log('🔍 Teste sendPushToStaff Logik...\n');

    // Find staff with admin/orga roles
    const members = await prisma.member.findMany({
      where: {
        roles: {
          hasSome: ["admin", "orga"],
        },
      },
      select: { id: true, name: true },
    });

    console.log(`✅ ${members.length} Staff-Member gefunden`);

    const memberIds = members.map(m => m.id);

    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        memberId: { in: memberIds },
      },
    });

    console.log(`✅ ${subscriptions.length} Push-Subscriptions für Staff gefunden\n`);

    if (subscriptions.length === 0) {
      console.log('❌ Keine Subscriptions → keine Push-Nachrichten werden gesendet!');
      return;
    }

    // Send push (same logic as sendPushToStaff)
    const payload = JSON.stringify({
      title: '📬 Test: Neue Nachricht',
      body: 'Das ist ein Test der Nachrichten-Benachrichtigung!',
      url: '/messages/1',
      icon: '/icons/icon-192x192.png',
    });

    console.log('📤 Sende Push an alle Staff-Subscriptions...\n');

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          console.log(`   Sende an: ${sub.endpoint.substring(0, 50)}...`);
          
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

          console.log(`   ✅ Status: ${result.statusCode}`);
          return { success: true, statusCode: result.statusCode };
        } catch (error) {
          console.log(`   ❌ Fehler: ${error.message}`);
          
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`   🗑️  Lösche abgelaufene Subscription...`);
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
            return { success: false, expired: true };
          }
          
          return { success: false, error: error.message };
        }
      })
    );

    console.log('\n📊 Ergebnisse:');
    let successCount = 0;
    let failCount = 0;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          successCount++;
        } else {
          failCount++;
        }
      } else {
        failCount++;
      }
    }

    console.log(`   ✅ Erfolgreich: ${successCount}`);
    console.log(`   ❌ Fehlgeschlagen: ${failCount}`);

  } catch (error) {
    console.error('❌ FEHLER:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testStaffPush();
