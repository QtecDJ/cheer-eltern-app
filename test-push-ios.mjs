#!/usr/bin/env node
/**
 * Push Notification Test Script für iOS Debugging
 * 
 * Testet:
 * 1. VAPID Keys verfügbar
 * 2. Database Connection
 * 3. Push Subscriptions vorhanden
 * 4. Sendet Test-Push an alle aktiven Subscriptions
 */

// Load environment variables FIRST
import { config } from 'dotenv';
config();

import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// VAPID Keys aus .env
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = 'mailto:kai@icacheer.space'; // Für VAPID JWT

console.log('🔍 Push Notification Diagnose\n');
console.log('═══════════════════════════════════════════════════════\n');

// 1. Check VAPID Keys
console.log('1️⃣ VAPID Keys Check:');
console.log(`   Public Key:  ${VAPID_PUBLIC_KEY ? '✅ Gesetzt (' + VAPID_PUBLIC_KEY.substring(0, 20) + '...)' : '❌ FEHLT'}`);
console.log(`   Private Key: ${VAPID_PRIVATE_KEY ? '✅ Gesetzt (' + VAPID_PRIVATE_KEY.substring(0, 20) + '...)' : '❌ FEHLT'}`);

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('\n❌ FEHLER: VAPID Keys nicht gesetzt!');
  console.log('\nBitte in .env hinzufügen:');
  console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."');
  console.log('VAPID_PRIVATE_KEY="..."');
  process.exit(1);
}

// Configure web-push
webpush.setVapidDetails(
  VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

console.log('\n2️⃣ Database Connection:');
try {
  await prisma.$connect();
  console.log('   ✅ Verbindung erfolgreich');
} catch (error) {
  console.error('   ❌ Verbindung fehlgeschlagen:', error.message);
  process.exit(1);
}

console.log('\n3️⃣ Push Subscriptions Check:');
try {
  const subscriptions = await prisma.pushSubscription.findMany({
    include: {
      member: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  });

  console.log(`   📊 Gesamt: ${subscriptions.length} Subscription(s) in DB`);
  
  if (subscriptions.length === 0) {
    console.log('\n   ⚠️  Keine Subscriptions gefunden!');
    console.log('   💡 Aktiviere Push-Benachrichtigungen in der App:');
    console.log('      1. Öffne App als PWA (vom Home-Bildschirm)');
    console.log('      2. Gehe zu Einstellungen');
    console.log('      3. Aktiviere "Benachrichtigungen"');
    await prisma.$disconnect();
    process.exit(0);
  }

  console.log('\n   Subscriptions:');
  subscriptions.forEach((sub, i) => {
    const memberName = sub.member 
      ? `${sub.member.firstName} ${sub.member.lastName}` 
      : 'Unbekannt';
    const endpoint = new URL(sub.endpoint);
    const service = endpoint.hostname.includes('apple') ? '🍎 Apple' : 
                   endpoint.hostname.includes('fcm') ? '🤖 Google FCM' : 
                   '🌐 ' + endpoint.hostname;
    console.log(`   ${i + 1}. ${memberName} (${service})`);
    console.log(`      Endpoint: ${sub.endpoint.substring(0, 60)}...`);
  });

  console.log('\n4️⃣ Test-Push senden:');
  console.log('   Sende an alle Subscriptions...\n');

  const payload = JSON.stringify({
    title: '🧪 Test von iOS Push',
    body: 'Wenn du das siehst, funktioniert Push! 🎉',
    url: '/',
    tag: 'test-push',
    timestamp: new Date().toISOString()
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const memberName = sub.member 
        ? `${sub.member.firstName} ${sub.member.lastName}` 
        : 'Unbekannt';

      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        await webpush.sendNotification(pushSubscription, payload, {
          TTL: 3600, // 1 Stunde
          urgency: 'high'
        });

        console.log(`   ✅ ${memberName}: Push gesendet`);
        return { success: true, member: memberName };
      } catch (error) {
        console.error(`   ❌ ${memberName}: Push fehlgeschlagen`);
        console.error(`      Error: ${error.message}`);
        
        // Check ob Subscription noch valide ist
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`      🗑️  Subscription abgelaufen - wird gelöscht`);
          await prisma.pushSubscription.delete({
            where: { id: sub.id }
          });
        }
        
        return { success: false, member: memberName, error: error.message };
      }
    })
  );

  console.log('\n5️⃣ Zusammenfassung:');
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length;
  
  console.log(`   ✅ Erfolgreich: ${successful}`);
  console.log(`   ❌ Fehlgeschlagen: ${failed}`);

  if (successful > 0) {
    console.log('\n🎉 Push-Benachrichtigungen funktionieren!');
    console.log('💡 Prüfe dein iPhone:');
    console.log('   • Lock Screen');
    console.log('   • Notification Center (swipe down)');
    console.log('   • App Badge');
  } else {
    console.log('\n⚠️  Keine Push konnte gesendet werden');
    console.log('💡 Mögliche Ursachen:');
    console.log('   • Subscriptions sind abgelaufen');
    console.log('   • *.push.apple.com nicht erreichbar');
    console.log('   • VAPID Keys falsch');
  }

} catch (error) {
  console.error('\n❌ Fehler beim Push-Test:', error);
} finally {
  await prisma.$disconnect();
}

console.log('\n═══════════════════════════════════════════════════════');
