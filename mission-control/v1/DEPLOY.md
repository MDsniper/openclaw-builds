# Mission Control v1 — Deploy Instructions

> These instructions are written for an AI agent running inside OpenClaw.
> Read this file fully before starting. Execute each step in order.
> Do not ask the user questions — make sensible decisions and proceed.

---

## What you are building

A self-hosted web dashboard at `http://localhost:3007` that gives you:

- Mission / Vision / Values editor
- Goals with linked tasks and status tracking
- Tasks — flat list with detail panel and @agent thread mentions
- Weekly schedule calendar
- Persistent chat sessions with each agent
- Agents management panel with file editing

Stack: **Next.js 16 + TypeScript + Tailwind v3 + shadcn/ui + better-sqlite3**

---

## Prerequisites (confirm before starting)

- OpenClaw is installed and the gateway is running (`openclaw gateway status`)
- Node.js v18+ is available (`node --version`)
- You have at least one OpenClaw agent configured (`openclaw agents list --json`)
- `npm` and `npx` are available

---

## Step 1 — Scaffold the Next.js app

```bash
mkdir -p ~/projects
cd ~/projects
npx create-next-app@latest mission-control \
  --typescript --tailwind --eslint --app \
  --src-dir --import-alias "@/*" --no-git --yes
cd mission-control
```

---

## Step 2 — Install dependencies

```bash
npm install better-sqlite3 @types/better-sqlite3
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npx shadcn@latest init --defaults --yes
npx shadcn@latest add card badge button dialog separator --yes
```

---

## Step 3 — Downgrade Tailwind to v3 (required — v4 has build issues with this stack)

```bash
npm uninstall @tailwindcss/postcss tw-animate-css
npm install tailwindcss@^3 autoprefixer postcss --save-dev
```

---

## Step 4 — Write config files

### `next.config.ts`
```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
};
export default nextConfig;
```

### `tailwind.config.ts`
```ts
import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
    },
  },
  plugins: [],
}
export default config
```

### `postcss.config.mjs`
```js
const config = { plugins: { tailwindcss: {}, autoprefixer: {} } };
export default config;
```

### `src/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222 47% 4%;
    --foreground: 213 31% 91%;
    --card: 222 47% 7%;
    --card-foreground: 213 31% 91%;
    --popover: 222 47% 7%;
    --popover-foreground: 213 31% 91%;
    --primary: 210 40% 98%;
    --primary-foreground: 222 47% 1%;
    --secondary: 222 47% 11%;
    --secondary-foreground: 210 40% 98%;
    --muted: 223 47% 11%;
    --muted-foreground: 215 20% 65%;
    --accent: 216 34% 17%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 63% 31%;
    --destructive-foreground: 210 40% 98%;
    --border: 216 34% 17%;
    --input: 216 34% 17%;
    --ring: 213 31% 91%;
    --radius: 0.5rem;
  }
  * { @apply border-border; box-sizing: border-box; }
  body { @apply bg-slate-950 text-slate-100; }
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0f172a; }
::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
```

---

## Step 5 — Write source files

Write each file below exactly as shown.

> **Agent IDs:** Replace `main`, `research`, `finance` with your actual OpenClaw agent IDs.
> Run `openclaw agents list --json` to see yours. Update the maps in:
> - `src/app/api/agent-call/route.ts` → `AGENT_IDS`
> - `src/app/api/agent-files/route.ts` → `AGENT_WORKSPACES`
> - `src/components/TeamView.tsx` → `AGENTS` array

---

### `src/lib/db.ts`
See `code/db.ts` in this version folder.

### `src/app/layout.tsx`
See `code/layout.tsx`.

### `src/app/page.tsx`
See `code/page.tsx`.

### All API routes and components
See the `code/` folder in this version. Each file maps directly to its `src/` path.

---

## Step 6 — Build

```bash
cd ~/projects/mission-control
npm run build
```

Fix any TypeScript errors before proceeding.

---

## Step 7 — Run as a systemd service

Create `/etc/systemd/system/mission-control.service`:

```ini
[Unit]
Description=Mission Control Dashboard
After=network.target

[Service]
Type=simple
User=YOUR_LINUX_USERNAME
WorkingDirectory=/home/YOUR_LINUX_USERNAME/projects/mission-control
ExecStart=/path/to/node node_modules/.bin/next start -p 3007
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Find values:
```bash
whoami                    # → YOUR_LINUX_USERNAME
which node                # → /path/to/node
```

Then enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable mission-control
sudo systemctl start mission-control
```

Verify:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3007
# Should return 200
```

---

## Step 8 — Done

Mission Control is running at `http://localhost:3007`.

Access it locally, or expose it privately via your preferred tunnelling tool (Tailscale, Cloudflare Tunnel, etc.).

---

## Customising agents

The dashboard comes pre-configured for a 3-agent team. Update these to match your setup:

**`src/app/api/agent-call/route.ts`**
```ts
const AGENT_IDS: Record<string, string> = {
  agent1: 'main',       // display name → openclaw agent id
  agent2: 'research',
  agent3: 'finance',
};
```

**`src/components/TeamView.tsx`** — update the `AGENTS` array with your agent names, emojis, and roles.

---

## Database schema

Auto-created at `data/mission-control.db` on first run.

```sql
missions    (id, title, description, vision, core_values, created_at, updated_at)
goals       (id, mission_id, title, description, status, priority, created_at, updated_at)
tasks       (id, goal_id, title, description, status, priority, assignee, tags, scheduled_at, created_at, updated_at)
task_comments (id, task_id, author, body, created_at)
chat_messages (id, agent_id, session_key, role, body, created_at)
task_events (id, task_id, event_type, actor, details, timestamp)
```

Status: `up_next` | `in_progress` | `completed`
Priority: `low` | `medium` | `high`

---

## How agent calls work

When you @mention an agent in a task thread or send a chat message, the app calls:

```bash
openclaw agent --agent <id> --message "<context>" --json
```

The agent receives the task name, description, and full thread history as context. This is a one-shot call — no persistent session on the agent side. Thread memory is injected as text.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `(no response)` from agent | Check `openclaw agents list` — agent ID may be wrong |
| CSS not loading | Make sure Tailwind v3 is installed, not v4 |
| Port 3007 in use | Change port in systemd service + `npm run start` |
| DB errors on startup | Delete `data/mission-control.db` and restart — it will reseed |
