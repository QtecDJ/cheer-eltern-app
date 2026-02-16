import { cookies } from 'next/headers';

// Simpler test to read session cookie
const { PrismaClient } = await import('@prisma/client');

const prisma = new PrismaClient();

try {
  console.log('\n🔍 Testing Session Cookie\n');
  
  // Get Kai's member data
  const kai = await prisma.member.findFirst({
    where: { firstName: { equals: 'kai', mode: 'insensitive' } },
    select: { id: true, firstName: true, lastName: true, name: true }
  });
  
  console.log('Kai in DB:', kai);
  
  // Get Zoey's member data
  const zoey = await prisma.member.findUnique({
    where: { id: 7 },
    select: { id: true, firstName: true, lastName: true, name: true }
  });
  
  console.log('Zoey in DB:', zoey);
  
  console.log('\n✅ Database check complete');
  console.log('\nNow manually check your browser:');
  console.log('1. Open DevTools (F12) → Application Tab → Cookies');
  console.log('2. Find cookie named "member_session"');
  console.log('3. Check the value - it should contain firstName and activeProfileId');
  console.log('\nWhen switched to Zoey:');
  console.log('  - activeProfileId should be: 7');
  console.log('  - firstName should be: "Zoey"');
  console.log('\nWhen switched to Kai:');
  console.log('  - activeProfileId should be: 1 (or missing)');
  console.log('  - firstName should be: "kai"');
  
} catch (error) {
  console.error('Error:', error);
} finally {
  await prisma.$disconnect();
}
