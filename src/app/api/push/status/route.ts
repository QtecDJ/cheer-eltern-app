import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await prisma.pushSubscription.count({
      where: { memberId: session.id },
    });

    return NextResponse.json({ enabled: count > 0 });
  } catch (error) {
    console.error('Push status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
