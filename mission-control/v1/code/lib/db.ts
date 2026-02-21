import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'mission-control.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    vision TEXT DEFAULT '',
    core_values TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER REFERENCES missions(id),
    title TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'up_next',
    priority TEXT DEFAULT 'medium',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER REFERENCES goals(id),
    title TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'up_next',
    priority TEXT DEFAULT 'medium',
    assignee TEXT DEFAULT 'bart',
    tags TEXT DEFAULT '[]',
    scheduled_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS task_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES tasks(id),
    event_type TEXT NOT NULL,
    actor TEXT DEFAULT 'system',
    details TEXT DEFAULT '',
    timestamp TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS task_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    author TEXT NOT NULL DEFAULT 'bart',
    body TEXT NOT NULL DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed if empty
const missionCount = (db.prepare('SELECT COUNT(*) as c FROM missions').get() as { c: number }).c;
if (missionCount === 0) {
  const insertMission = db.prepare(`INSERT INTO missions (title, description, vision, core_values) VALUES (?, ?, ?, ?)`);
  const m = insertMission.run(
    'Build an AI-powered personal operating system',
    'A lean, intelligent team of agents that handles research, finance, and daily ops so Bart can focus on high-leverage work.',
    'To make one person operate like a team of ten — with full visibility, no chaos.',
    JSON.stringify(["Speed over perfection", "Transparency first", "Automate the boring", "Human in the loop for big calls"])
  );

  const insertGoal = db.prepare(`INSERT INTO goals (mission_id, title, description, status, priority) VALUES (?, ?, ?, ?, ?)`);
  const g1 = insertGoal.run(m.lastInsertRowid, 'Launch Mission Control V1', 'A working dashboard to manage tasks, goals, and agent activity.', 'in_progress', 'high');
  const g2 = insertGoal.run(m.lastInsertRowid, 'Define agent roles and workflows', 'Set clear goals and output formats for Scout and Fonzie.', 'up_next', 'medium');

  const insertTask = db.prepare(`INSERT INTO tasks (goal_id, title, description, status, priority, assignee, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertTask.run(g1.lastInsertRowid, 'Build Kanban board UI', 'dnd-kit drag and drop with 3 columns', 'in_progress', 'high', 'shisho', null);
  insertTask.run(g1.lastInsertRowid, 'Set up SQLite schema and API routes', 'CRUD endpoints for missions, goals, tasks', 'completed', 'high', 'shisho', null);
  insertTask.run(g2.lastInsertRowid, 'Define Scout daily output format', 'Decide on bullet format, link style, topic scope', 'up_next', 'medium', 'bart', '2026-02-25T09:00:00');
  insertTask.run(g2.lastInsertRowid, 'Define Fonzie weekly brief format', 'Market summary, portfolio flags, tax notes', 'up_next', 'low', 'bart', '2026-02-26T09:00:00');
}

export default db;
