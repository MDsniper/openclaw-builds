'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Mission {
  id: number;
  title: string;
  description: string;
  vision: string;
  core_values: string;
}

export default function MissionView() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', vision: '', core_values: '' });

  useEffect(() => {
    fetch('/api/missions').then(r => r.json()).then((data: Mission[]) => {
      if (data[0]) { setMission(data[0]); setForm({ title: data[0].title, description: data[0].description, vision: data[0].vision, core_values: data[0].core_values }); }
    });
  }, []);

  const save = async () => {
    const res = await fetch('/api/missions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: mission!.id, ...form }) });

    const updated = await res.json();
    setMission(updated);
    setEditing(false);
  };

  let valuesArr: string[] = [];
  try { valuesArr = JSON.parse(mission?.core_values || '[]'); } catch {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Mission</h1>
        <Button variant="outline" size="sm" onClick={() => setEditing(!editing)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
          {editing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Mission Title</label>
            <input className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-slate-100 text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <textarea rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-slate-100 text-sm" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Vision</label>
            <textarea rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-slate-100 text-sm" value={form.vision} onChange={e => setForm(f => ({ ...f, vision: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Values (JSON array)</label>
            <textarea rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-slate-100 text-sm font-mono" value={form.core_values} onChange={e => setForm(f => ({ ...f, core_values: e.target.value }))} />
          </div>
          <Button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="bg-slate-900 border-slate-800 p-5">
            <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-1">Mission</h2>
            <p className="text-slate-100 font-semibold text-lg">{mission?.title}</p>
            <p className="text-slate-400 text-sm mt-2">{mission?.description}</p>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-5">
            <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-2">Vision</h2>
            <p className="text-slate-300 text-sm italic">&ldquo;{mission?.vision}&rdquo;</p>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-5">
            <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">Values</h2>
            <ul className="space-y-2">
              {valuesArr.map((v, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-blue-400 mt-0.5">▸</span> {v}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
