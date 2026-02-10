import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { sendPushToStaff } from './src/lib/send-push.ts';

config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testMessagePush() {
  try {
    console.log('🔍 Teste Message Push System...\n');

    // Find members with admin or orga roles
    const staffMembers = await prisma.member.findMany({
      where: {
        roles: {
          hasSome: ["admin", "orga"],
        },
      },
      select: {
        id: true,
        name: true,
        roles: true,
      },
    });

    console.log(`👥 ${staffMembers.length} Staff Member(s) gefunden:`);
    for (const member of staffMembers) {
      console.log(`   - ${member.name} (ID: ${member.id}, Roles: ${member.roles.join(', ')})`);
    }
    console.log('');

    // Check push subscriptions for staff
    const staffIds = staffMembers.map(m => m.id);
    const staffSubs = await prisma.pushSubscription.findMany({
      where: {
        memberId: { in: staffIds },
      },
      select: {
        id: true,
        memberId: true,
        endpoint: true,
        createdAt: true,
        member: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`📱 ${staffSubs.length} Push-Subscription(s) für Staff:`);
    for (const sub of staffSubs) {
      console.log(`   - ${sub.member.name}: ${sub.endpoint.substring(0, 50)}... (${sub.createdAt.toLocaleString('de-DE')})`);
    }
    console.log('');

    // Test sendPushToStaff
    console.log('📤 Sende Test-Push an Staff...\n');
    
    const result = await sendPushToStaff({
      title: '🧪 Test: Neue Nachricht',
      body: 'Dies ist ein Test der Nachrichten-Benachrichtigung!',
      url: '/messages/999',
      icon: '/icons/icon-192x192.png',
    });

    console.log('✅ sendPushToStaff abgeschlossen!');
    console.log(`   Ergebnisse: ${result.length}`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const res of result) {
      if (res.status === 'fulfilled') {
        if (res.value?.success) {
          successCount++;
        } else {
          failCount++;
          console.log('   ❌ Fehler:', res.value?.error);
        }
      } else {
        failCount++;
        console.log('   ❌ Rejected:', res.reason?.message || res.reason);
      }
    }
    
    console.log(`\n📊 Zusammenfassung:`);
    console.log(`   ✅ Erfolgreich: ${successCount}`);
    console.log(`   ❌ Fehlgeschlagen: ${failCount}`);

  } catch (error) {
    console.error('❌ Fehler:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testMessagePush();
