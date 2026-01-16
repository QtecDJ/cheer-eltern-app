/**
 * Push Unsubscribe API Endpoint
 * Entfernt Push-Subscription
 * 
 * iOS-OPTIMIERT: Schneller Cleanup
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UnsubscribeRequest {
  endpoint: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: UnsubscribeRequest = await request.json();
    const { endpoint } = body;

    // Validierung
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint' },
        { status: 400 }
      );
    }

    // Subscription aus DB entfernen
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
      },
    });

    console.log('[push/unsubscribe] Subscription removed:', {
      endpoint: endpoint.substring(0, 50) + '...'
    });

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error('[push/unsubscribe] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
