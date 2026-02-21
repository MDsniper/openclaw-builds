'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

const AGENTS = [
  { id: 'shisho', name: 'Shisho', emoji: '🦉', role: 'Leader · Personal Assistant', channel: 'Telegram', color: 'border-amber-800', bgColor: 'bg-amber-700' },
  { id: 'scout', name: 'Scout', emoji: '🔍', role: 'Research Agent', channel: 'Discord #research', color: 'border-cyan-800', bgColor: 'bg-cyan-700' },
  { id: 'fonzie', name: 'Fonzie', emoji: '💰', role: 'Finance Agent', channel: 'Discord #finance', color: 'border-green-800', bgColor: 'bg-green-700' },
];

interface Message { id?: number; role: string; body: string; created_at?: string; }

const DEFAULT_SESSION = (agentId: string) => `mc:chat:${agentId}:default`;

function AgentChat({ agent }: { agent: typeof AGENTS[0] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [sessionKey, setSessionKey] = useState(DEFAULT_SESSION(agent.id));
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [fileSaving, setFileSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load persisted messages on mount / session change
  useEffect(() => {
    fetch(`/api/chat?agent=${agent.id}&session_key=${encodeURIComponent(sessionKey)}`)
      .then(r => r.json()).then(setMessages);
  }, [agent.id, sessionKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const newSession = async () => {
    const key = `mc:chat:${agent.id}:${Date.now()}`;
    setSessionKey(key);
    setMessages([]);
  };

  const send = async () => {
    if (!input.trim() || thinking) return;
    const text = input.trim();
    setInput('');

    // Save bart message to DB
    const bartRes = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agent.id, session_key: sessionKey, role: 'bart', message: text }),
    });
    const bartMsg = await bartRes.json();
    setMessages(m => [...m, bartMsg]);
    setThinking(true);

    try {
      // Build context from message history
      const history = messages.map(m => `[${m.role}]: ${m.body}`).join('\n');
      const contextMsg = history ? `${history}\n[bart]: ${text}` : text;

      const res = await fetch('/api/agent-call', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agent.id, message: contextMsg }),
      });
      const { reply } = await res.json();

      const agentRes = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agent.id, session_key: sessionKey, role: agent.id, message: reply || '(no response)' }),
      });
      const agentMsg = await agentRes.json();
      setMessages(m => [...m, agentMsg]);
    } catch {
      setMessages(m => [...m, { role: agent.id, body: '(error)' }]);
    }
    setThinking(false);
  };

  const openFile = async (file: string) => {
    if (editingFile === file) { setEditingFile(null); return; }
    const res = await fetch(`/api/agent-files?agent=${agent.id}&file=${file}`);
    const { content } = await res.json();
    setFileContent(content);
    setEditingFile(file);
  };

  const saveFile = async () => {
    if (!editingFile) return;
    setFileSaving(true);
    await fetch('/api/agent-files', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: agent.id, file: editingFile, content: fileContent }),
    });
    setFileSaving(false);
    setEditingFile(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{agent.emoji}</span>
          <div>
            <div className="text-sm font-semibold text-slate-100">{agent.name}</div>
            <div className="text-xs text-slate-500">{agent.role}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openFile('IDENTITY.md')} className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-800">Edit Identity</button>
          <Button size="sm" variant="outline" onClick={newSession} className="border-slate-700 text-slate-400 text-xs h-7">/new</Button>
        </div>
      </div>

      {/* File editor */}
      {editingFile && (
        <div className="border-b border-slate-800 p-4 space-y-2 bg-slate-950 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">{editingFile}</span>
            <div className="flex gap-2">
              <button onClick={saveFile} disabled={fileSaving} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">{fileSaving ? 'Saving…' : 'Save'}</button>
              <button onClick={() => setEditingFile(null)} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
            </div>
          </div>
          <textarea rows={8} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono resize-none focus:outline-none focus:border-slate-600"
            value={fileContent} onChange={e => setFileContent(e.target.value)} />
        </div>
      )}

      {/* Session key */}
      <div className="px-5 py-1.5 border-b border-slate-800 flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-slate-700 font-mono truncate">{sessionKey}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.length === 0 && (
          <p className="text-xs text-slate-600 text-center pt-12">Start a conversation with {agent.name}</p>
        )}
        {messages.map((m, i) => {
          const isBart = m.role === 'bart';
          return (
            <div key={m.id || i} className={`flex ${isBart ? 'justify-end' : 'justify-start'} gap-2`}>
              {!isBart && (
                <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm ${agent.bgColor} text-white mt-0.5`}>
                  {agent.emoji}
                </span>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isBart ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-100 rounded-bl-sm'}`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.body}</p>
                {m.created_at && <p className={`text-xs mt-1 ${isBart ? 'text-blue-200' : 'text-slate-500'}`}>
                  {new Date(m.created_at + 'Z').toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                </p>}
              </div>
            </div>
          );
        })}
        {thinking && (
          <div className="flex justify-start gap-2">
            <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm ${agent.bgColor} text-white mt-0.5`}>{agent.emoji}</span>
            <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3.5">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-slate-800 flex-shrink-0">
        <div className="flex gap-2">
          <textarea rows={2} placeholder={`Message ${agent.name}…`}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 resize-none focus:outline-none focus:border-slate-600"
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <Button onClick={send} disabled={thinking || !input.trim()} className="bg-blue-600 hover:bg-blue-700 text-white self-end px-4 h-9">↑</Button>
        </div>
        <p className="text-xs text-slate-700 mt-1.5">Enter to send · Shift+Enter for newline · /new to clear session</p>
      </div>
    </div>
  );
}

export default function TeamView() {
  const [activeAgent, setActiveAgent] = useState(AGENTS[0]);

  return (
    <div className="flex h-full">
      {/* Agent selector */}
      <div className="w-44 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
        <div className="px-4 py-4 border-b border-slate-800">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Agents</h2>
        </div>
        <div className="flex-1 p-2 space-y-1">
          {AGENTS.map(agent => (
            <button key={agent.id} onClick={() => setActiveAgent(agent)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${activeAgent.id === agent.id ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <span className="text-lg">{agent.emoji}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{agent.name}</div>
                <div className="text-xs text-slate-600 truncate">{agent.channel}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AgentChat key={activeAgent.id} agent={activeAgent} />
      </div>
    </div>
  );
}
