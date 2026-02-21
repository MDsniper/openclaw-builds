import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Persist chat messages per agent session
db.exec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    session_key TEXT NOT NULL,
    role TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_chat_agent ON chat_messages(agent_id, session_key);
`);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agent = searchParams.get('agent') || '';
  const session_key = searchParams.get('session_key') || '';
  const msgs = db.prepare(
    'SELECT * FROM chat_messages WHERE agent_id = ? AND session_key = ? ORDER BY created_at ASC'
  ).all(agent, session_key);
  return NextResponse.json(msgs);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { agent_id, session_key, role, message } = body;
  const result = db.prepare(
    'INSERT INTO chat_messages (agent_id, session_key, role, body) VALUES (?, ?, ?, ?)'
  ).run(agent_id, session_key, role, message);
  const msg = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(msg, { status: 201 });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const agent = searchParams.get('agent') || '';
  const session_key = searchParams.get('session_key') || '';
  db.prepare('DELETE FROM chat_messages WHERE agent_id = ? AND session_key = ?').run(agent, session_key);
  return NextResponse.json({ ok: true });
}
