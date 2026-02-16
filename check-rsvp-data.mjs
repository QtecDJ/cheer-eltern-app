import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function checkRSVPData() {
  try {
    console.log('=== Checking RSVP Data ===\n');

    // Check all announcements
    const allAnnouncements = await prisma.announcement.findMany({
      select: {
        id: true,
        title: true,
        allowRsvp: true,
        _count: {
          select: {
            rsvps: true
          }
        }
      }
    });
    
    console.log(`Total announcements in database: ${allAnnouncements.length}`);
    console.log('\nAll announcements:');
    allAnnouncements.forEach(a => {
      console.log(`  - ID: ${a.id}, Title: "${a.title}", allowRsvp: ${a.allowRsvp}, RSVPs: ${a._count.rsvps}`);
    });

    // Check announcements with allowRsvp = true
    const withAllowRsvp = await prisma.announcement.findMany({
      where: { allowRsvp: true },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            rsvps: true
          }
        }
      }
    });
    
    console.log(`\nAnnouncements with allowRsvp=true: ${withAllowRsvp.length}`);
    withAllowRsvp.forEach(a => {
      console.log(`  - ID: ${a.id}, Title: "${a.title}", RSVPs: ${a._count.rsvps}`);
    });

    // Check announcements with RSVPs
    const withRsvps = await prisma.announcement.findMany({
      where: {
        rsvps: {
          some: {}
        }
      },
      select: {
        id: true,
        title: true,
        allowRsvp: true,
        _count: {
          select: {
            rsvps: true
          }
        }
      }
    });
    
    console.log(`\nAnnouncements with RSVPs (has at least one): ${withRsvps.length}`);
    withRsvps.forEach(a => {
      console.log(`  - ID: ${a.id}, Title: "${a.title}", allowRsvp: ${a.allowRsvp}, RSVPs: ${a._count.rsvps}`);
    });

    // Check total RSVPs
    const totalRsvps = await prisma.announcementRSVP.count();
    console.log(`\nTotal AnnouncementRSVP records in database: ${totalRsvps}`);

    // Test the exact query from the API
    console.log('\n=== Testing API Query ===');
    const apiQuery = await prisma.announcement.findMany({
      where: {
        OR: [
          { allowRsvp: true },
          { rsvps: { some: {} } }
        ]
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        expiresAt: true,
        category: true,
        priority: true,
        allowRsvp: true,
        rsvps: {
          include: {
            Member: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                teams: true
              }
            }
          },
          orderBy: {
            respondedAt: "desc"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    
    console.log(`API Query Result: ${apiQuery.length} announcements`);
    apiQuery.forEach(a => {
      console.log(`  - ID: ${a.id}, Title: "${a.title}", allowRsvp: ${a.allowRsvp}, RSVPs: ${a.rsvps.length}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRSVPData();
