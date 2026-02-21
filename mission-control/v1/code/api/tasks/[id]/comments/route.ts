import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comments = db.prepare('SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC').all(id);
  return NextResponse.json(comments);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const result = db.prepare(
    'INSERT INTO task_comments (task_id, author, body) VALUES (?, ?, ?)'
  ).run(id, body.author || 'bart', body.body || '');
  const comment = db.prepare('SELECT * FROM task_comments WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(comment, { status: 201 });
}
