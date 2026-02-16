import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

const prisma = new PrismaClient();

async function debugParent() {
  try {
    console.log('\n=== PARENT DEBUG TOOL ===\n');
    
    // Find all members with parent role
    const parents = await prisma.member.findMany({
      where: {
        OR: [
          { roles: { has: 'parent' } },
          { userRole: { contains: 'parent' } }
        ]
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        userRole: true,
        roles: true,
      }
    });

    console.log(`Found ${parents.length} parent(s):\n`);
    
    for (const parent of parents) {
      console.log(`\n📋 Parent: ${parent.name} (ID: ${parent.id})`);
      console.log(`   Email: ${parent.email}`);
      console.log(`   userRole: ${parent.userRole}`);
      console.log(`   roles: ${JSON.stringify(parent.roles)}`);
      
      // Check if pure parent
      const userRoles = parent.roles || parent.userRole?.split(',').map(r => r.trim()) || [];
      const isPureParent = userRoles.includes('parent') && userRoles.length === 1;
      console.log(`   isPureParent: ${isPureParent}`);
      
      // Find their children
      const parentRelations = await prisma.parentChildRelation.findMany({
        where: {
          parentId: parent.id,
          isActive: true,
        },
        include: {
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              memberId: true,
              member: {
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                  userRole: true,
                  teamId: true,
                  team: {
                    select: {
                      name: true,
                    }
                  }
                },
              },
            },
          },
        },
      });

      console.log(`\n   👶 Children (${parentRelations.length}):`);
      
      if (parentRelations.length === 0) {
        console.log('      ⚠️  No children found in ParentChildRelation!');
      } else {
        for (const rel of parentRelations) {
          const child = rel.child;
          console.log(`\n      Child: ${child.firstName} ${child.lastName} (Child ID: ${child.id})`);
          console.log(`      memberId: ${child.memberId}`);
          
          if (child.member) {
            console.log(`      ✅ Has Member account:`);
            console.log(`         - Member ID: ${child.member.id}`);
            console.log(`         - Name: ${child.member.name}`);
            console.log(`         - Role: ${child.member.role}`);
            console.log(`         - userRole: ${child.member.userRole}`);
            console.log(`         - Team: ${child.member.team?.name || 'No team'} (ID: ${child.member.teamId})`);
          } else {
            console.log(`      ❌ No Member account linked!`);
          }
        }
      }
      
      console.log('\n' + '='.repeat(60));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugParent();
