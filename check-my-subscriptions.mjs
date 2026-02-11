import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSubscriptions() {
  try {
    console.log('🔍 Checking for Kai subscriptions...\n');

    // Find Kai (email: kai or kaipu or similar)
    const kai = await prisma.member.findFirst({
      where: {
        OR: [
          { email: { contains: 'kai', mode: 'insensitive' } },
          { firstName: { contains: 'kai', mode: 'insensitive' } },
        ]
      },
      include: {
        pushSubscriptions: true
      }
    });

    if (!kai) {
      console.log('❌ Kai not found in database');
      return;
    }

    console.log(`✅ Found user: ${kai.firstName} ${kai.lastName}`);
    console.log(`   Email: ${kai.email}`);
    console.log(`   ID: ${kai.id}`);
    console.log(`   Roles: ${kai.roles?.join(', ') || 'none'}\n`);

    console.log(`📱 Push subscriptions: ${kai.pushSubscriptions.length}\n`);

    if (kai.pushSubscriptions.length === 0) {
      console.log('⚠️  No push subscriptions found!');
      console.log('   You need to enable notifications in the app.\n');
    } else {
      kai.pushSubscriptions.forEach((sub, index) => {
        console.log(`${index + 1}. Subscription ${sub.id}`);
        console.log(`   Endpoint: ${sub.endpoint}`);
        console.log(`   Auth: ${sub.auth ? '✅' : '❌'}`);
        console.log(`   P256dh: ${sub.p256dh ? '✅' : '❌'}`);
        console.log(`   User Agent: ${sub.userAgent || 'unknown'}`);
        console.log(`   Created: ${sub.createdAt}`);
        console.log('');
      });
    }

    // Check recent messages
    console.log('\n📨 Recent messages:\n');
    const recentMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: kai.id },
          { assignedTo: kai.id }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (recentMessages.length === 0) {
      console.log('No messages found.');
    } else {
      recentMessages.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.subject}`);
        console.log(`   From: ${msg.sender.firstName} ${msg.sender.lastName}`);
        console.log(`   Status: ${msg.status}`);
        console.log(`   Created: ${msg.createdAt}`);
        console.log(`   Assigned to: ${msg.assignedTo || 'none'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubscriptions();
