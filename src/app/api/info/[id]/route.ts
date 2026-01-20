import { NextRequest, NextResponse } from 'next/server';

// Note: Info sections are rendered via app routes. This endpoint is additive
// and returns a minimal JSON with a version. If you have DB-backed info,
// replace the placeholder with a DB query.

export async function GET(request: NextRequest, context: any) {
  try {
    const params = context?.params ?? {};
    const id = String(params.id || '');

    // For now return 204 if unknown; include a version to allow caching logic.
    const version = new Date().toISOString();

    // You can extend this to return actual HTML/JSON for known sections.
    return NextResponse.json({ section: id, version }, {
      headers: { 'x-content-version': version, 'Cache-Control': 'public, max-age=60' },
    });
  } catch (err) {
    console.error('[api/info/[id]] error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
