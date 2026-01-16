/**
 * Push Resubscribe API Endpoint
 * Wird vom Service Worker aufgerufen bei pushsubscriptionchange
 * 
 * iOS-OPTIMIERT: Automatisches Re-Subscribe bei Subscription-Verlust
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ResubscribeRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ResubscribeRequest = await request.json();
    const { endpoint, keys } = body;

    // Validierung
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Finde alte Subscription und update
    const oldSubscription = await prisma.pushSubscription.findFirst({
      where: {
        endpoint: {
          contains: endpoint.split('/').pop()?.substring(0, 20) || ''
        }
      }
    });

    if (!oldSubscription) {
      console.warn('[push/resubscribe] No old subscription found');
      return NextResponse.json(
        { error: 'No subscription found to update' },
        { status: 404 }
      );
    }

    // Update mit neuer Subscription
    const subscription = await prisma.pushSubscription.update({
      where: {
        id: oldSubscription.id,
      },
      data: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        updatedAt: new Date(),
      },
    });

    console.log('[push/resubscribe] Subscription updated:', {
      userId: subscription.memberId,
      subscriptionId: subscription.id,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
    });

  } catch (error) {
    console.error('[push/resubscribe] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
