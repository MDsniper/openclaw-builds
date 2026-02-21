'use client';

import { useEffect, useState } from 'react';
import TaskDetail from './TaskDetail';

interface Task {
  id: number; goal_id: number | null; title: string; description: string;
  status: string; priority: string; assignee: string; tags: string; scheduled_at: string | null;
}
interface Goal { id: number; title: string; }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const priorityDot: Record<string, string> = {
  low: 'bg-slate-500', medium: 'bg-amber-500', high: 'bg-red-500',
};
const assigneeColor: Record<string, string> = {
  bart: 'bg-violet-700', shisho: 'bg-amber-600', scout: 'bg-cyan-700', fonzie: 'bg-green-700',
};

function getWeekStart(offset = 0): Date {
  const now = new Date();
  const day = now.getDay(); // 0=sun, 1=mon ... 6=sat
  // Days to subtract to get to Monday: sun→6, mon→0, tue→1 ... sat→5
  const daysToMon = day === 0 ? 6 : day - 1;
  const mon = new Date(now);
  mon.setDate(now.getDate() - daysToMon + offset * 7);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function dateKey(d: Date) {
  return d.toISOString().split('T')[0];
}

function isToday(d: Date) {
  return dateKey(d) === dateKey(new Date());
}

export default function ScheduleView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<Task | null>(null);
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [quickForm, setQuickForm] = useState({ title: '', assignee: 'bart', time: '' });

  const weekStart = getWeekStart(weekOffset);
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(setTasks);
    fetch('/api/goals').then(r => r.json()).then(setGoals);
  }, []);

  const weekLabel = `${weekDays[0].toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – ${weekDays[4].toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const tasksForDay = (day: Date) => tasks.filter(t => t.scheduled_at && t.scheduled_at.startsWith(dateKey(day)));

  const addQuickTask = async (day: Date) => {
    if (!quickForm.title.trim()) return;
    const scheduled_at = quickForm.time ? `${dateKey(day)}T${quickForm.time}:00` : `${dateKey(day)}T09:00:00`;
    const res = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: quickForm.title, assignee: quickForm.assignee, scheduled_at, status: 'up_next', priority: 'medium' }),
    });
    const t = await res.json();
    setTasks(ts => [...ts, t]);
    setQuickForm({ title: '', assignee: 'bart', time: '' });
    setAddingDay(null);
  };

  const updateTask = (updated: Task) => {
    setTasks(ts => ts.map(t => t.id === updated.id ? updated : t));
    setSelected(updated);
  };

  return (
    <div className="flex h-full gap-0 -m-8">
      <div className={`flex flex-col ${selected ? 'w-[60%]' : 'w-full'} overflow-y-auto p-8`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-100">Schedule</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setWeekOffset(w => w - 1)} className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1 rounded hover:bg-slate-800">← Prev</button>
            <span className="text-sm text-slate-400">{weekLabel}</span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1 rounded hover:bg-slate-800">Next →</button>
            <button onClick={() => setWeekOffset(0)} className="text-xs text-blue-400 hover:text-blue-300 ml-1">Today</button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-5 gap-3 flex-1">
          {weekDays.map((day, di) => {
            const dayTasks = tasksForDay(day);
            const today = isToday(day);
            const dayStr = dateKey(day);
            const isAddingHere = addingDay === dayStr;

            return (
              <div key={di} className={`bg-slate-900 rounded-xl border flex flex-col min-h-48 ${today ? 'border-blue-600' : 'border-slate-800'}`}>
                {/* Day header */}
                <div className={`px-3 py-2 border-b ${today ? 'border-blue-600' : 'border-slate-800'} flex items-center justify-between`}>
                  <div>
                    <div className={`text-xs font-semibold ${today ? 'text-blue-400' : 'text-slate-400'}`}>{DAYS[di]}</div>
                    <div className={`text-sm font-bold ${today ? 'text-blue-300' : 'text-slate-300'}`}>
                      {day.getDate()}
                    </div>
                  </div>
                  <button onClick={() => setAddingDay(isAddingHere ? null : dayStr)}
                    className="w-5 h-5 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center text-xs">+</button>
                </div>

                {/* Quick add */}
                {isAddingHere && (
                  <div className="px-2 py-2 border-b border-slate-800 space-y-1.5">
                    <input
                      autoFocus
                      placeholder="Task title"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100"
                      value={quickForm.title}
                      onChange={e => setQuickForm(f => ({ ...f, title: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') addQuickTask(day); if (e.key === 'Escape') setAddingDay(null); }}
                    />
                    <div className="flex gap-1">
                      <select className="flex-1 bg-slate-800 border border-slate-700 rounded px-1 py-1 text-xs text-slate-100" value={quickForm.assignee} onChange={e => setQuickForm(f => ({ ...f, assignee: e.target.value }))}>
                        <option value="bart">Bart</option><option value="shisho">🦉</option><option value="scout">🔍</option><option value="fonzie">💰</option>
                      </select>
                      <input type="time" className="flex-1 bg-slate-800 border border-slate-700 rounded px-1 py-1 text-xs text-slate-100" value={quickForm.time} onChange={e => setQuickForm(f => ({ ...f, time: e.target.value }))} />
                    </div>
                    <button onClick={() => addQuickTask(day)} className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white rounded py-1">Add</button>
                  </div>
                )}

                {/* Tasks */}
                <div className="flex-1 p-2 space-y-1.5">
                  {dayTasks.map(t => (
                    <button key={t.id} onClick={() => setSelected(selected?.id === t.id ? null : t)}
                      className={`w-full text-left rounded-md px-2 py-1.5 flex items-center gap-1.5 transition-colors ${selected?.id === t.id ? 'bg-slate-700' : 'bg-slate-800 hover:bg-slate-700'}`}>
                      <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${priorityDot[t.priority]}`} />
                      <span className="text-xs text-slate-300 flex-1 truncate">{t.title}</span>
                      <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white ${assigneeColor[t.assignee] || 'bg-slate-600'}`}>
                        {t.assignee[0].toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="w-[40%] border-l border-slate-800 overflow-hidden flex flex-col" style={{ height: 'calc(100vh)' }}>
          <TaskDetail task={selected} goals={goals} onClose={() => setSelected(null)} onUpdate={updateTask} />
        </div>
      )}
    </div>
  );
}
