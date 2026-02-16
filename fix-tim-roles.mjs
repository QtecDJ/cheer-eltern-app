import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

const prisma = new PrismaClient();

async function fixTim() {
  try {
    console.log('\n=== Fixing Tim\'s Roles ===\n');
    
    const tim = await prisma.member.findFirst({
      where: {
        firstName: { equals: 'Tim', mode: 'insensitive' },
        lastName: { equals: 'Richert', mode: 'insensitive' }
      }
    });

    if (!tim) {
      console.log('❌ Tim not found!');
      return;
    }

    console.log('Current state:');
    console.log('  userRole:', tim.userRole);
    console.log('  roles:', tim.roles);

    // Update Tim to have consistent roles
    await prisma.member.update({
      where: { id: tim.id },
      data: {
        userRole: 'parent,orga',
        roles: ['parent', 'orga']
      }
    });

    console.log('\n✅ Updated Tim\'s roles:');
    console.log('  userRole: "parent,orga"');
    console.log('  roles: ["parent", "orga"]');
    console.log('\nTim should now see Charlotte\'s dashboard with parent-child view!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTim();
