import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/push';

export async function GET() {
  try {
    const publicKey = getVapidPublicKey();
    
    if (!publicKey) {
      return NextResponse.json(
        { error: 'VAPID public key not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({ publicKey });
  } catch (error) {
    console.error('Failed to get VAPID public key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
