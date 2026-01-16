/**
 * Push Subscribe API Endpoint
 * Speichert Push-Subscription für einen User
 * 
 * iOS-OPTIMIERT: Schnelle Responses, Error Handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SubscribeRequest {
  userId: number;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SubscribeRequest = await request.json();
    const { userId, endpoint, keys } = body;

    // Validierung
    if (!userId || !endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // User Agent für Multi-Device Support
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Subscription in DB speichern (upsert)
    const subscription = await prisma.pushSubscription.upsert({
      where: {
        endpoint,
      },
      update: {
        memberId: userId,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
        updatedAt: new Date(),
      },
      create: {
        memberId: userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
      },
    });

    console.log('[push/subscribe] Subscription saved:', {
      userId,
      subscriptionId: subscription.id,
      endpoint: endpoint.substring(0, 50) + '...'
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
    });

  } catch (error) {
    console.error('[push/subscribe] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
