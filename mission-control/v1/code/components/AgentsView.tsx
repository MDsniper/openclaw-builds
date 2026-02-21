'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Agent {
  id: string;
  identityName: string;
  identityEmoji: string;
  workspace: string;
  model: string;
  isDefault: boolean;
}

const EDITABLE_FILES = ['IDENTITY.md', 'SOUL.md', 'AGENTS.md', 'HEARTBEAT.md', 'USER.md'];

const AGENT_NAME_MAP: Record<string, string> = {
  main: 'shisho', research: 'scout', finance: 'fonzie',
};

function FileEditor({ agentId, file, onClose }: { agentId: string; file: string; onClose: () => void }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const agentName = AGENT_NAME_MAP[agentId] || agentId;

  useEffect(() => {
    fetch(`/api/agent-files?agent=${agentName}&file=${file}`)
      .then(r => r.json())
      .then(d => { setContent(d.content || ''); setLoading(false); });
  }, [agentName, file]);

  const save = async () => {
    setSaving(true);
    await fetch('/api/agent-files', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: agentName, file, content }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <span className="text-sm font-semibold text-slate-100 font-mono">{file}</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={onClose} className="border-slate-700 text-slate-400 text-xs">Close</Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="text-slate-500 text-sm">Loading…</div>
          ) : (
            <textarea
              className="w-full h-full min-h-64 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-100 font-mono resize-none focus:outline-none focus:border-slate-600"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgentsView() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [editFile, setEditFile] = useState<{ agentId: string; file: string } | null>(null);
  const [addingAgent, setAddingAgent] = useState(false);
  const [newAgent, setNewAgent] = useState({ id: '', name: '' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(setAgents);
  }, []);

  const addAgent = async () => {
    if (!newAgent.id.trim()) return;
    setAdding(true);
    setAddError('');
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAgent),
    });
    const data = await res.json();
    if (data.error) {
      setAddError(data.error);
    } else {
      const updated = await fetch('/api/agents').then(r => r.json());
      setAgents(updated);
      setNewAgent({ id: '', name: '' });
      setAddingAgent(false);
    }
    setAdding(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Agents</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your OpenClaw agent roster.</p>
        </div>
        <Button size="sm" onClick={() => setAddingAgent(!addingAgent)} className="bg-blue-600 hover:bg-blue-700 text-white">
          + New Agent
        </Button>
      </div>

      {addingAgent && (
        <Card className="bg-slate-900 border-slate-700 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-100">Add Agent</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Agent ID (no spaces)</label>
              <input
                placeholder="e.g. ops"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
                value={newAgent.id}
                onChange={e => setNewAgent(f => ({ ...f, id: e.target.value.toLowerCase().replace(/\s/g, '-') }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Display Name</label>
              <input
                placeholder="e.g. Ops Agent"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
                value={newAgent.name}
                onChange={e => setNewAgent(f => ({ ...f, name: e.target.value }))}
              />
            </div>
          </div>
          {addError && <p className="text-xs text-red-400">{addError}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={addAgent} disabled={adding} className="bg-blue-600 hover:bg-blue-700 text-white">
              {adding ? 'Creating…' : 'Create Agent'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAddingAgent(false)} className="border-slate-700 text-slate-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {agents.map(agent => (
          <Card key={agent.id} className="bg-slate-900 border-slate-800 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{agent.identityEmoji !== '(unset)' ? agent.identityEmoji : '🤖'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-100 font-semibold">{agent.identityName}</span>
                    {agent.isDefault && <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">default</span>}
                    <span className="text-xs text-slate-600 font-mono">id:{agent.id}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">{agent.workspace}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{agent.model}</div>
                </div>
              </div>
            </div>

            {/* File editor buttons */}
            <div className="mt-4 border-t border-slate-800 pt-3">
              <p className="text-xs text-slate-600 mb-2">Edit files:</p>
              <div className="flex flex-wrap gap-2">
                {EDITABLE_FILES.map(file => (
                  <button
                    key={file}
                    onClick={() => setEditFile({ agentId: agent.id, file })}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 px-3 py-1.5 rounded-md transition-colors font-mono"
                  >
                    {file}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editFile && (
        <FileEditor
          agentId={editFile.agentId}
          file={editFile.file}
          onClose={() => setEditFile(null)}
        />
      )}
    </div>
  );
}
