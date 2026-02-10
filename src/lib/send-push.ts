import { prisma } from "@/lib/db";
import { sendPushNotification } from "@/lib/push";

/**
 * Send push notification to a specific user (for messages)
 */
export async function sendPushToUser(memberId: number, payload: { title: string; body: string; url: string; icon?: string }) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { memberId },
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        const result = await sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          } as any,
          payload
        );

        // Remove expired subscriptions
        if (result.expired) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }

        return result;
      })
    );

    return results;
  } catch (error) {
    console.error("Failed to send push to user:", error);
    throw error;
  }
}

/**
 * Send push notification to team members (for announcements)
 */
export async function sendPushToTeam(teamIds: number[], payload: { title: string; body: string; url: string; icon?: string }) {
  try {
    const members = await prisma.member.findMany({
      where: {
        teamId: { in: teamIds },
      },
      select: { id: true },
    });

    const memberIds = members.map((m: any) => m.id);

    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        memberId: { in: memberIds },
      },
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        const result = await sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          } as any,
          payload
        );

        // Remove expired subscriptions
        if (result.expired) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }

        return result;
      })
    );

    return results;
  } catch (error) {
    console.error("Failed to send push to team:", error);
    throw error;
  }
}

/**
 * Send push notification to admins/orgas (for messages)
 */
export async function sendPushToStaff(payload: { title: string; body: string; url: string; icon?: string }) {
  try {
    const members = await prisma.member.findMany({
      where: {
        roles: {
          hasSome: ["admin", "orga"],
        },
      },
      select: { id: true },
    });

    const memberIds = members.map((m: any) => m.id);

    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        memberId: { in: memberIds },
      },
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        const result = await sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          } as any,
          payload
        );

        // Remove expired subscriptions
        if (result.expired) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }

        return result;
      })
    );

    return results;
  } catch (error) {
    console.error("Failed to send push to staff:", error);
    throw error;
  }
}
