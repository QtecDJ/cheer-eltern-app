import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, context: any) {
  const params = context?.params ?? {};
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const ev = await prisma.event.findUnique({
      where: { id },
      select: { id: true, description: true, updatedAt: true, title: true },
    });

    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const version = ev.updatedAt ? ev.updatedAt.toISOString() : new Date().toISOString();

    return NextResponse.json({ description: ev.description ?? '', title: ev.title, version }, {
      headers: { 'x-content-version': version, 'Cache-Control': 'public, max-age=60' },
    });
  } catch (err) {
    console.error('[api/events/[id]/description] error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
