'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import TaskDetail from './TaskDetail';

interface Task {
  id: number; goal_id: number | null; title: string; description: string;
  status: string; priority: string; assignee: string; tags: string; scheduled_at: string | null;
}
interface Goal { id: number; title: string; }

const STATUS_SECTIONS = [
  { id: 'in_progress', label: 'In Progress', dot: 'bg-blue-500' },
  { id: 'up_next', label: 'Up Next', dot: 'bg-slate-500' },
  { id: 'completed', label: 'Completed', dot: 'bg-green-500' },
];

const priorityBadge: Record<string, string> = {
  low: 'bg-slate-800 text-slate-500',
  medium: 'bg-amber-900/60 text-amber-300',
  high: 'bg-red-900/60 text-red-300',
};

const assigneeColor: Record<string, string> = {
  bart: 'bg-violet-700', shisho: 'bg-amber-600', scout: 'bg-cyan-700', fonzie: 'bg-green-700',
};

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selected, setSelected] = useState<Task | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(['completed']));
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignee: 'bart', goal_id: '', scheduled_at: '' });

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(setTasks);
    fetch('/api/goals').then(r => r.json()).then(setGoals);
  }, []);

  const toggleSection = (id: string) => setCollapsed(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const addTask = async () => {
    if (!form.title.trim()) return;
    const payload = { ...form, goal_id: form.goal_id ? parseInt(form.goal_id) : null, scheduled_at: form.scheduled_at || null };
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const t = await res.json();
    setTasks(ts => [t, ...ts]);
    setForm({ title: '', description: '', priority: 'medium', assignee: 'bart', goal_id: '', scheduled_at: '' });
    setAdding(false);
  };

  const updateTask = (updated: Task) => {
    setTasks(ts => ts.map(t => t.id === updated.id ? updated : t));
    setSelected(updated);
  };

  return (
    <div className="flex h-full gap-0 -m-8">
      {/* List panel */}
      <div className={`flex flex-col ${selected ? 'w-[58%]' : 'w-full'} overflow-y-auto p-8`}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-100">Tasks</h1>
          <Button size="sm" onClick={() => setAdding(!adding)} className="bg-blue-600 hover:bg-blue-700 text-white">+ Add Task</Button>
        </div>

        {adding && (
          <Card className="bg-slate-900 border-slate-700 p-4 space-y-3 mb-4">
            <input placeholder="Task title" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <div className="flex gap-3 flex-wrap">
              <select className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
              <select className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100" value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}>
                <option value="bart">Bart</option><option value="shisho">Shisho 🦉</option><option value="scout">Scout 🔍</option><option value="fonzie">Fonzie 💰</option>
              </select>
              <select className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100" value={form.goal_id} onChange={e => setForm(f => ({ ...f, goal_id: e.target.value }))}>
                <option value="">No goal</option>
                {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addTask} className="bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
              <Button size="sm" variant="outline" onClick={() => setAdding(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            </div>
          </Card>
        )}

        {STATUS_SECTIONS.map(section => {
          const sectionTasks = tasks.filter(t => t.status === section.id);
          const isCollapsed = collapsed.has(section.id);
          return (
            <div key={section.id} className="mb-4">
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center gap-2 w-full text-left py-2 px-1 group"
              >
                <span className={`w-2 h-2 rounded-full ${section.dot}`} />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{section.label}</span>
                <span className="text-xs text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded-full ml-1">{sectionTasks.length}</span>
                <span className="text-slate-600 ml-auto text-xs">{isCollapsed ? '▶' : '▼'}</span>
              </button>

              {!isCollapsed && (
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  {sectionTasks.length === 0 && (
                    <div className="px-4 py-3 text-xs text-slate-700">No tasks here.</div>
                  )}
                  {sectionTasks.map((task, i) => {
                    const goal = goals.find(g => g.id === task.goal_id);
                    const isSelected = selected?.id === task.id;
                    return (
                      <button
                        key={task.id}
                        onClick={() => setSelected(isSelected ? null : task)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${i > 0 ? 'border-t border-slate-800' : ''} ${isSelected ? 'bg-slate-800' : 'bg-slate-900 hover:bg-slate-800/50'}`}
                      >
                        <span className={`flex-shrink-0 w-2 h-2 rounded-full ${assigneeColor[task.assignee] || 'bg-slate-600'}`} />
                        <span className={`flex-1 text-sm ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-100'}`}>{task.title}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {goal && <span className="text-xs text-slate-600 hidden sm:inline">{goal.title.slice(0, 18)}{goal.title.length > 18 ? '…' : ''}</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityBadge[task.priority]}`}>{task.priority}</span>
                          {task.scheduled_at && <span className="text-xs text-slate-600">📅</span>}
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${assigneeColor[task.assignee] || 'bg-slate-600'}`}>
                            {task.assignee[0].toUpperCase()}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-[42%] border-l border-slate-800 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>
          <TaskDetail
            task={selected}
            goals={goals}
            onClose={() => setSelected(null)}
            onUpdate={updateTask}
          />
        </div>
      )}
    </div>
  );
}
