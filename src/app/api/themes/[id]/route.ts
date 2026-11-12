import { NextRequest } from 'next/server';
import { deviceOf, json, sql } from '@/lib/community-themes';

export const dynamic = 'force-dynamic';

/** DELETE /api/themes/:id takes down a theme; only the phone that shared it can. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const device = deviceOf(request);
  if (!device) return json({ error: 'Missing device id' }, 400);
  try {
    const rows = await sql()`delete from community_themes where id = ${id} and device = ${device} returning id`;
    if (rows.length === 0) return json({ error: 'Not your theme, or already gone' }, 404);
    return json({ ok: true });
  } catch (error) {
    console.error('Community themes delete error:', error);
    return json({ error: 'Unavailable right now' }, 503);
  }
}
