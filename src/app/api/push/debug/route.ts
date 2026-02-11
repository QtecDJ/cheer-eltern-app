import { NextResponse } from 'next/server';
import { getSession, isAdminOrTrainer } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    // Only allow admins to see this
    if (!session || !isAdminOrTrainer(session.roles ?? session.userRole ?? null)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPublicKey = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const hasPrivateKey = !!process.env.VAPID_PRIVATE_KEY;
    const hasSubject = !!process.env.VAPID_SUBJECT;
    
    const publicKeyLength = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.length || 0;
    const privateKeyLength = process.env.VAPID_PRIVATE_KEY?.length || 0;
    
    return NextResponse.json({
      vapid: {
        publicKey: {
          configured: hasPublicKey,
          length: publicKeyLength,
          preview: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.substring(0, 20) + '...'
        },
        privateKey: {
          configured: hasPrivateKey,
          length: privateKeyLength,
          preview: '***' // Never expose private key
        },
        subject: {
          configured: hasSubject,
          value: process.env.VAPID_SUBJECT || 'not set'
        }
      },
      ready: hasPublicKey && hasPrivateKey
    });
  } catch (error) {
    console.error('Push debug error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
