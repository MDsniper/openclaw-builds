import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY id ASC').all();
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const body = await req.json();
  const stmt = db.prepare(`INSERT INTO tasks (goal_id, title, description, status, priority, assignee, tags, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const result = stmt.run(
    body.goal_id || null,
    body.title || '',
    body.description || '',
    body.status || 'up_next',
    body.priority || 'medium',
    body.assignee || 'bart',
    body.tags || '[]',
    body.scheduled_at || null
  );
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(task, { status: 201 });
}
