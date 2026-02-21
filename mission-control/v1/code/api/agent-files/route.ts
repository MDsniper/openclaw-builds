import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const AGENT_WORKSPACES: Record<string, string> = {
  shisho: '/home/barty-bart/.openclaw/workspace',
  scout: '/home/barty-bart/.openclaw/workspace-research',
  fonzie: '/home/barty-bart/.openclaw/workspace-finance',
};

const ALLOWED_FILES = ['IDENTITY.md', 'SOUL.md', 'USER.md', 'AGENTS.md', 'HEARTBEAT.md'];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agent = searchParams.get('agent') || '';
  const file = searchParams.get('file') || '';

  const workspace = AGENT_WORKSPACES[agent];
  if (!workspace || !ALLOWED_FILES.includes(file)) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const filePath = path.join(workspace, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ content: '' });
  }
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { agent, file, content } = body;

  const workspace = AGENT_WORKSPACES[agent];
  if (!workspace || !ALLOWED_FILES.includes(file)) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const filePath = path.join(workspace, file);
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
