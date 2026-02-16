import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

const prisma = new PrismaClient();

async function checkTim() {
  try {
    console.log('\n=== Checking Tim Richert ===\n');
    
    // Find Tim in members
    const tim = await prisma.member.findFirst({
      where: {
        OR: [
          { firstName: { equals: 'Tim', mode: 'insensitive' } },
          { name: { contains: 'Tim', mode: 'insensitive' } }
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
        teamId: true,
        team: {
          select: {
            name: true,
          }
        }
      }
    });

    if (!tim) {
      console.log('❌ Tim not found in Member table!');
      return;
    }

    console.log('✅ Found Tim in Member table:');
    console.log('   ID:', tim.id);
    console.log('   Name:', tim.name);
    console.log('   Email:', tim.email);
    console.log('   userRole:', tim.userRole);
    console.log('   roles:', tim.roles);
    console.log('   Team:', tim.team?.name || 'No team');
    
    const userRoles = tim.roles || (tim.userRole ? tim.userRole.split(',').map(r => r.trim()) : []);
    const isPureParent = userRoles.includes('parent') && userRoles.length === 1;
    console.log('   Computed roles:', userRoles);
    console.log('   isPureParent:', isPureParent);

    // Check if Tim is a parent
    console.log('\n--- Checking as Parent ---');
    const asParent = await prisma.parentChildRelation.findMany({
      where: {
        parentId: tim.id,
        isActive: true,
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberId: true,
            teamId: true,
            team: {
              select: {
                name: true,
              }
            },
            member: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                role: true,
                userRole: true,
                roles: true,
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

    if (asParent.length > 0) {
      console.log(`✅ Tim is a parent of ${asParent.length} child(ren):`);
      for (const rel of asParent) {
        const child = rel.child;
        console.log(`\n   👶 Child: ${child.firstName} ${child.lastName} (Child ID: ${child.id})`);
        console.log(`      Child Team: ${child.team?.name || 'No team'}`);
        console.log(`      memberId: ${child.memberId}`);
        
        if (child.member) {
          console.log(`      ✅ Linked Member Account:`);
          console.log(`         - Member ID: ${child.member.id}`);
          console.log(`         - Name: ${child.member.name}`);
          console.log(`         - Role: ${child.member.role}`);
          console.log(`         - userRole: ${child.member.userRole}`);
          console.log(`         - roles: ${JSON.stringify(child.member.roles)}`);
          console.log(`         - Team: ${child.member.team?.name || 'No team'} (ID: ${child.member.teamId})`);
        } else {
          console.log(`      ❌ No Member account linked!`);
        }
      }
    } else {
      console.log('   No children found');
    }

    // Check if Tim is a child
    console.log('\n--- Checking as Child ---');
    const asChild = await prisma.child.findFirst({
      where: {
        OR: [
          { firstName: { equals: 'Tim', mode: 'insensitive' } },
        ]
      },
      include: {
        parentRelations: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    if (asChild) {
      console.log('✅ Found Tim in Child table:');
      console.log('   Child ID:', asChild.id);
      console.log('   memberId:', asChild.memberId);
      console.log('   Parents:');
      for (const rel of asChild.parentRelations) {
        console.log(`      - ${rel.parent.name} (ID: ${rel.parent.id})`);
      }
    } else {
      console.log('   Not found in Child table');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTim();
