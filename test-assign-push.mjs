import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAssignPush() {
  console.log('🔍 Checking push subscriptions for Kai Püttmann...\n');
  
  // Find Kai
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
  
  // Check subscriptions
  const subs = await prisma.pushSubscription.findMany({
    where: { memberId: kai.id }
  });
  
  console.log(`\n📱 Active subscriptions: ${subs.length}`);
  subs.forEach((sub, i) => {
    console.log(`   ${i + 1}. ${sub.userAgent?.slice(0, 50) || 'Unknown device'}`);
    console.log(`      Endpoint: ${sub.endpoint.slice(0, 60)}...`);
  });
  
  // Check recent messages assigned to Kai
  const messages = await prisma.message.findMany({
    where: { assignedTo: kai.id },
    orderBy: { updatedAt: 'desc' },
    take: 3,
    select: {
      id: true,
      subject: true,
      assignedTo: true,
      updatedAt: true,
      status: true
    }
  });
  
  console.log(`\n📧 Recent messages assigned to Kai: ${messages.length}`);
  messages.forEach(msg => {
    console.log(`   - ID ${msg.id}: "${msg.subject}" (${msg.status})`);
    console.log(`     Updated: ${msg.updatedAt.toLocaleString('de-DE')}`);
  });
  
  console.log('\n💡 Test: Assign a message to Kai in the UI and check if push is sent');
  console.log('   Check Vercel logs for: "Failed to send assignment push" or push errors');
}

testAssignPush()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
