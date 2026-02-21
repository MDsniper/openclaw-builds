'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Goal { id: number; mission_id: number; title: string; description: string; status: string; priority: string; }
interface Task { id: number; goal_id: number; title: string; status: string; priority: string; assignee: string; }

const statusColor: Record<string, string> = {
  up_next: 'bg-slate-700 text-slate-300',
  in_progress: 'bg-blue-900 text-blue-300',
  completed: 'bg-green-900 text-green-300',
};
const priorityColor: Record<string, string> = {
  low: 'bg-slate-800 text-slate-400',
  medium: 'bg-amber-900 text-amber-300',
  high: 'bg-red-900 text-red-300',
};

const emptyForm = { title: '', description: '', priority: 'medium', status: 'up_next' };

export default function GoalsView() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyForm });

  useEffect(() => {
    fetch('/api/goals').then(r => r.json()).then(setGoals);
    fetch('/api/tasks').then(r => r.json()).then(setTasks);
  }, []);

  const toggle = (id: number) => setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const startEdit = (goal: Goal) => {
    setEditingId(goal.id);
    setEditForm({ title: goal.title, description: goal.description, priority: goal.priority, status: goal.status });
  };

  const saveEdit = async (id: number) => {
    const res = await fetch(`/api/goals/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm),
    });
    const updated = await res.json();
    setGoals(gs => gs.map(g => g.id === id ? updated : g));
    setEditingId(null);
  };

  const addGoal = async () => {
    if (!addForm.title.trim()) return;
    const res = await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addForm) });
    const g = await res.json();
    setGoals(gs => [...gs, g]);
    setAddForm({ ...emptyForm });
    setAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Goals</h1>
        <Button size="sm" onClick={() => setAdding(!adding)} className="bg-blue-600 hover:bg-blue-700 text-white">+ Add Goal</Button>
      </div>

      {adding && (
        <Card className="bg-slate-900 border-slate-700 p-4 space-y-3">
          <input placeholder="Goal title" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100" value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} />
          <textarea placeholder="Description" rows={2} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100" value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex gap-3">
            <select className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100" value={addForm.priority} onChange={e => setAddForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
            <select className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100" value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))}>
              <option value="up_next">Up Next</option><option value="in_progress">In Progress</option><option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addGoal} className="bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
            <Button size="sm" variant="outline" onClick={() => setAdding(false)} className="border-slate-700 text-slate-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {goals.map(goal => {
          const goalTasks = tasks.filter(t => t.goal_id === goal.id);
          const isOpen = expanded.has(goal.id);
          const isEditing = editingId === goal.id;

          return (
            <Card key={goal.id} className="bg-slate-900 border-slate-800">
              {isEditing ? (
                <div className="p-4 space-y-3">
                  <input className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                  <textarea rows={2} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                  <div className="flex gap-3">
                    <select className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="up_next">Up Next</option><option value="in_progress">In Progress</option><option value="completed">Completed</option>
                    </select>
                    <select className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100" value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}>
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(goal.id)} className="bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="border-slate-700 text-slate-300">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggle(goal.id)} className="flex-1 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-100 font-medium text-sm">{goal.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[goal.status]}`}>{goal.status.replace('_', ' ')}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[goal.priority]}`}>{goal.priority}</span>
                        <span className="text-xs text-slate-600">{goalTasks.length} tasks {isOpen ? '▲' : '▼'}</span>
                      </div>
                      {goal.description && <p className="text-slate-500 text-xs mt-1">{goal.description}</p>}
                    </button>
                    <Button size="sm" variant="outline" onClick={() => startEdit(goal)} className="border-slate-700 text-slate-400 hover:text-slate-200 text-xs flex-shrink-0">
                      Edit
                    </Button>
                  </div>
                </div>
              )}

              {isOpen && !isEditing && (
                <div className="border-t border-slate-800 px-4 py-3 space-y-2">
                  {goalTasks.length === 0 && <div className="text-xs text-slate-600">No tasks linked.</div>}
                  {goalTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className={`w-2 h-2 rounded-full ${t.status === 'completed' ? 'bg-green-500' : t.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-600'}`} />
                      <span className="flex-1">{t.title}</span>
                      <span className="text-slate-600">{t.assignee}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
