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
  console.log('[push/subscribe] Request received');
  
  try {
    const body: SubscribeRequest = await request.json();
    console.log('[push/subscribe] Body parsed:', {
      userId: body.userId,
      hasEndpoint: !!body.endpoint,
      hasKeys: !!body.keys,
      endpointLength: body.endpoint?.length
    });
    
    const { userId, endpoint, keys } = body;

    // Validierung
    if (!userId || !endpoint || !keys?.p256dh || !keys?.auth) {
      console.error('[push/subscribe] Validation failed:', {
        hasUserId: !!userId,
        hasEndpoint: !!endpoint,
        hasP256dh: !!keys?.p256dh,
        hasAuth: !!keys?.auth
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // User Agent für Multi-Device Support
    const userAgent = request.headers.get('user-agent') || 'unknown';
    console.log('[push/subscribe] User agent:', userAgent.substring(0, 50));

    // Prüfe ob User existiert
    console.log('[push/subscribe] Checking if member exists:', userId);
    const member = await prisma.member.findUnique({
      where: { id: userId },
      select: { id: true, name: true }
    });

    if (!member) {
      console.error('[push/subscribe] Member not found:', userId);
      return NextResponse.json(
        { error: `Member with id ${userId} not found` },
        { status: 404 }
      );
    }
    console.log('[push/subscribe] Member found:', member.name);

    // Subscription in DB speichern (upsert)
    console.log('[push/subscribe] Saving subscription to DB...');
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

    console.log('[push/subscribe] Subscription saved successfully:', {
      userId,
      userName: member.name,
      subscriptionId: subscription.id,
      endpoint: endpoint.substring(0, 50) + '...'
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
    });

  } catch (error) {
    console.error('[push/subscribe] Error details:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage,
        type: error instanceof Error ? error.name : 'Unknown'
      },
      { status: 500 }
    );
  }
}
