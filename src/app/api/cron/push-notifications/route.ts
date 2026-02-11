import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPushToUser } from '@/lib/send-push';

export const maxDuration = 60; // 60 seconds max duration for cron job

export async function GET(req: Request) {
  try {
    // Verify this is a cron job request (for security)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('[CRON] Unauthorized request to push cron');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting push notification check...');

    // Find messages that are unread and created in the last 24 hours
    // We don't want to spam old messages
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const unreadMessages = await prisma.message.findMany({
      where: {
        status: { in: ['pending', 'assigned', 'in_progress'] },
        createdAt: { gte: oneDayAgo },
        // Has an assignee who should be notified
        assignedTo: { not: null },
      },
      select: {
        id: true,
        subject: true,
        assignedTo: true,
        createdAt: true,
        // Check if there are any replies (if yes, don't send notification)
        replies: {
          select: { id: true },
          take: 1,
        },
        // Get the last time a notification was sent (we'll track this)
        updatedAt: true,
      },
    });

    console.log(`[CRON] Found ${unreadMessages.length} potentially unread messages`);

    let sentCount = 0;
    let skippedCount = 0;

    for (const message of unreadMessages) {
      // Skip if there are already replies (message has been seen)
      if (message.replies && message.replies.length > 0) {
        skippedCount++;
        continue;
      }

      // Only send push if message is less than 4 hours old
      // This prevents spamming for older messages
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      if (message.createdAt < fourHoursAgo) {
        skippedCount++;
        continue;
      }

      if (message.assignedTo) {
        try {
          const result = await sendPushToUser(message.assignedTo, {
            title: 'Infinity Cheer Allstars',
            body: `Erinnerung: ${message.subject}`,
            url: `/messages/${message.id}`,
            icon: '/icons/icon-192x192.png',
          });

          if (result.some((r: any) => r.status === 'fulfilled' && r.value.success)) {
            sentCount++;
            console.log(`[CRON] Sent reminder push for message ${message.id}`);
          }
        } catch (error) {
          console.error(`[CRON] Failed to send push for message ${message.id}:`, error);
        }
      }
    }

    console.log(`[CRON] Push check complete: ${sentCount} sent, ${skippedCount} skipped`);

    return NextResponse.json({
      success: true,
      checked: unreadMessages.length,
      sent: sentCount,
      skipped: skippedCount,
    });
  } catch (error) {
    console.error('[CRON] Push notification check failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
