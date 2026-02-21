import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const sets = Object.keys(body).map(k => `${k} = ?`).join(', ');
  const vals = [...Object.values(body), id];
  db.prepare(`UPDATE tasks SET ${sets}, updated_at = datetime('now') WHERE id = ?`).run(...vals);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return NextResponse.json(task);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
