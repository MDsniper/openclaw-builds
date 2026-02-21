import { NextResponse } from 'next/server';
import { spawnSync } from 'child_process';

const AGENT_IDS: Record<string, string> = {
  shisho: 'main',
  scout: 'research',
  fonzie: 'finance',
};

export async function POST(req: Request) {
  const body = await req.json();
  const { agent, message } = body;

  const agentId = AGENT_IDS[agent] || agent;

  // Use a unique derived session key to avoid file-lock contention with live chat sessions.
  // (The OpenClaw agent runtime can lock the main session file while Telegram is active.)
  const sessionTo = body.session_to || '+19999999999';

  const result = spawnSync(
    'openclaw',
    ['agent', '--agent', agentId, '--to', sessionTo, '--message', message, '--timeout', '120', '--json'],
    {
      encoding: 'utf8',
      timeout: 130000,
      env: { ...process.env, PATH: '/usr/local/bin:/usr/bin:/bin:/home/barty-bart/.nvm/versions/node/v22.22.0/bin:/home/barty-bart/.local/bin' },
    }
  );

  if (result.error) {
    return NextResponse.json({ error: result.error.message, reply: `Error: ${result.error.message}` }, { status: 500 });
  }

  const stdout = (result.stdout || '').trim();
  const stderr = (result.stderr || '').trim();

  // openclaw agent --json outputs { result: { payloads: [{ text }] } }
  try {
    const parsed = JSON.parse(stdout);
    const reply =
      parsed?.result?.payloads?.map((p: any) => p?.text).filter(Boolean).join('\n') ||
      parsed?.reply ||
      parsed?.message ||
      parsed?.text ||
      stdout;
    return NextResponse.json({ reply: reply || '(no response)' });
  } catch {
    const reply = stdout || stderr || '(no response)';
    return NextResponse.json({ reply });
  }
}
