import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const missions = db.prepare('SELECT * FROM missions ORDER BY id DESC').all();
  return NextResponse.json(missions);
}

export async function POST(req: Request) {
  const body = await req.json();
  const stmt = db.prepare(`INSERT INTO missions (title, description, vision, core_values) VALUES (?, ?, ?, ?)`);
  const result = stmt.run(body.title || '', body.description || '', body.vision || '', body.core_values || '[]');
  const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(mission, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, ...fields } = body;
  const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  const vals = [...Object.values(fields), id];
  db.prepare(`UPDATE missions SET ${sets}, updated_at = datetime('now') WHERE id = ?`).run(...vals);
  const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(id);
  return NextResponse.json(mission);
}
