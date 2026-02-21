import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { ...fields } = body;
  const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  const vals = [...Object.values(fields), id];
  db.prepare(`UPDATE goals SET ${sets}, updated_at = datetime('now') WHERE id = ?`).run(...vals);
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  return NextResponse.json(goal);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.prepare('DELETE FROM goals WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
