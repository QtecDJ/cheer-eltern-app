import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function findSandra() {
  console.log('🔍 Searching for Sandra...\n');
  
  const members = await prisma.member.findMany({
    where: {
      OR: [
        { firstName: { contains: 'sandra', mode: 'insensitive' } },
        { lastName: { contains: 'sandra', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      roles: true,
      userRole: true
    }
  });
  
  if (members.length === 0) {
    console.log('❌ No member found with name "Sandra"');
    console.log('\n📋 Showing all members with push subscriptions:\n');
    
    const withSubs = await prisma.member.findMany({
      where: {
        pushSubscriptions: {
          some: {}
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        _count: {
          select: { pushSubscriptions: true }
        }
      }
    });
    
    withSubs.forEach(m => {
      console.log(`- ${m.firstName} ${m.lastName} (ID: ${m.id}) - ${m._count.pushSubscriptions} subscription(s)`);
    });
  } else {
    console.log(`✅ Found ${members.length} member(s):\n`);
    members.forEach(m => {
      console.log(`- ${m.firstName} ${m.lastName} (ID: ${m.id})`);
      console.log(`  Email: ${m.email || 'N/A'}`);
      console.log(`  Roles: ${Array.isArray(m.roles) ? m.roles.join(', ') : m.userRole || 'member'}`);
    });
  }
}

findSandra()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
