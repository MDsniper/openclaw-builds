import { NextResponse } from 'next/server';
import { spawnSync } from 'child_process';

const OC_ENV = {
  ...process.env,
  PATH: '/usr/local/bin:/usr/bin:/bin:/home/barty-bart/.nvm/versions/node/v22.22.0/bin:/home/barty-bart/.local/bin',
};

export async function GET() {
  const result = spawnSync('openclaw', ['agents', 'list', '--json'], { encoding: 'utf8', env: OC_ENV });
  try {
    const agents = JSON.parse(result.stdout || '[]');
    return NextResponse.json(agents);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { id, name } = body;
  // openclaw agents add <id> --name <name>
  const result = spawnSync('openclaw', ['agents', 'add', id, '--name', name || id], { encoding: 'utf8', env: OC_ENV });
  if (result.status !== 0) {
    return NextResponse.json({ error: result.stderr || 'Failed to add agent' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
