import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, context: any) {
  const params = context?.params ?? {};
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const a = await prisma.announcement.findUnique({
      where: { id },
      select: { id: true, content: true, title: true, updatedAt: true },
    });

    if (!a) return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });

    const version = a.updatedAt ? a.updatedAt.toISOString() : new Date().toISOString();

    return NextResponse.json({ id: a.id, title: a.title, content: a.content, version }, {
      headers: { 'x-content-version': version, 'Cache-Control': 'public, max-age=60' },
    });
  } catch (err) {
    console.error('[api/announcements/[id]] error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
