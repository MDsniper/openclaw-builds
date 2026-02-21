import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const goals = db.prepare('SELECT * FROM goals ORDER BY priority DESC, id ASC').all();
  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const body = await req.json();
  const stmt = db.prepare(`INSERT INTO goals (mission_id, title, description, status, priority) VALUES (?, ?, ?, ?, ?)`);
  const result = stmt.run(body.mission_id || null, body.title || '', body.description || '', body.status || 'up_next', body.priority || 'medium');
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(goal, { status: 201 });
}
