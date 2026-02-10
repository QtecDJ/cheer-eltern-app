import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function checkPushSubscriptions() {
  try {
    console.log('🔍 Überprüfe Push-Subscriptions in der Datenbank...\n');

    // Get all push subscriptions
    const allSubscriptions = await prisma.pushSubscription.findMany({
      include: {
        member: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Gesamt: ${allSubscriptions.length} Push-Subscription(s) in der Datenbank\n`);

    if (allSubscriptions.length === 0) {
      console.log('⚠️  Keine Push-Subscriptions gefunden!');
      console.log('\n💡 Mögliche Gründe:');
      console.log('   1. Noch niemand hat auf den Bell-Button geklickt');
      console.log('   2. Die Tabelle ist leer');
      console.log('   3. Die Migration wurde nicht ausgeführt');
      
      // Check if table exists
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'push_subscriptions'
        );
      `;
      console.log('\n📋 Tabelle "push_subscriptions" existiert:', result[0]?.exists || false);
      
      return;
    }

    // Display subscriptions grouped by member
    const subscriptionsByMember = new Map();
    for (const sub of allSubscriptions) {
      const memberId = sub.memberId;
      if (!subscriptionsByMember.has(memberId)) {
        subscriptionsByMember.set(memberId, []);
      }
      subscriptionsByMember.get(memberId).push(sub);
    }

    for (const [memberId, subs] of subscriptionsByMember) {
      const member = subs[0].member;
      console.log(`👤 ${member.name} (ID: ${member.id})`);
      console.log(`   ${subs.length} Subscription(s):`);
      
      for (const sub of subs) {
        console.log(`   ├─ ID: ${sub.id}`);
        console.log(`   │  Endpoint: ${sub.endpoint.substring(0, 60)}...`);
        console.log(`   │  UserAgent: ${sub.userAgent || 'N/A'}`);
        console.log(`   │  Erstellt: ${sub.createdAt.toLocaleString('de-DE')}`);
        console.log(`   │  p256dh: ${sub.p256dh.substring(0, 30)}...`);
        console.log(`   │  auth: ${sub.auth.substring(0, 20)}...`);
        console.log(`   │`);
      }
      console.log('');
    }

    // Check specifically for Kai Püttmann
    const kaiSubs = allSubscriptions.filter(sub => 
      sub.member.name.toLowerCase().includes('püttmann') ||
      sub.member.firstName.toLowerCase().includes('kai')
    );

    if (kaiSubs.length > 0) {
      console.log(`✅ Kai Püttmann hat ${kaiSubs.length} aktive Subscription(s)`);
    } else {
      console.log('⚠️  Kai Püttmann hat KEINE Subscriptions');
      console.log('   → Er muss auf der Website einloggen und den Bell-Button klicken!');
    }

  } catch (error) {
    console.error('❌ Fehler:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkPushSubscriptions();
