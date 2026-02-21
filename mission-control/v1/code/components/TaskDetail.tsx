'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface Task {
  id: number; goal_id: number | null; title: string; description: string;
  status: string; priority: string; assignee: string; tags: string; scheduled_at: string | null;
}
interface Goal { id: number; title: string; }
interface Comment { id: number; task_id: number; author: string; body: string; created_at: string; }

const AGENTS = ['shisho', 'scout', 'fonzie'];

const assigneeColor: Record<string, string> = {
  bart: 'bg-violet-700', shisho: 'bg-amber-600', scout: 'bg-cyan-700', fonzie: 'bg-green-700',
};
const assigneeEmoji: Record<string, string> = {
  bart: '👤', shisho: '🦉', scout: '🔍', fonzie: '💰',
};

interface Props {
  task: Task;
  goals: Goal[];
  onClose: () => void;
  onUpdate: (t: Task) => void;
}

export default function TaskDetail({ task, goals, onClose, onUpdate }: Props) {
  const [form, setForm] = useState({ ...task });
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [agentThinking, setAgentThinking] = useState(false);
  const [mention, setMention] = useState<{ query: string; pos: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setForm({ ...task });
    setComments([]);
    fetch(`/api/tasks/${task.id}/comments`).then(r => r.json()).then(setComments);
  }, [task.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleCommentChange = (val: string) => {
    setCommentText(val);
    // Detect @mention being typed
    const match = val.slice(0, textareaRef.current?.selectionStart ?? val.length).match(/@(\w*)$/);
    if (match) {
      setMention({ query: match[1].toLowerCase(), pos: match.index! });
    } else {
      setMention(null);
    }
  };

  const insertMention = (agent: string) => {
    const before = commentText.slice(0, mention!.pos);
    const after = commentText.slice((textareaRef.current?.selectionStart ?? commentText.length));
    setCommentText(`${before}@${agent} ${after}`);
    setMention(null);
    textareaRef.current?.focus();
  };

  const filteredAgents = mention
    ? AGENTS.filter(a => a.startsWith(mention.query))
    : [];

  // Render comment body with @mentions highlighted
  const renderBody = (body: string) => {
    const parts = body.split(/(@(?:shisho|scout|fonzie|bart))/gi);
    return parts.map((part, i) =>
      /^@(shisho|scout|fonzie|bart)$/i.test(part)
        ? <span key={i} className="text-blue-400 font-semibold">{part}</span>
        : <span key={i}>{part}</span>
    );
  };

  const save = async () => {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    onUpdate(await res.json());
  };

  const sendComment = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    const agentMatch = commentText.match(/@(shisho|scout|fonzie)/i);

    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: 'bart', body: commentText }),
    });
    const newComment = await res.json();
    setComments(c => [...c, newComment]);
    const msgText = commentText;
    setCommentText('');
    setSending(false);
    setMention(null);

    if (agentMatch) {
      const agent = agentMatch[1].toLowerCase();
      setAgentThinking(true);
      try {
        // Build context: task info + thread history
        const threadContext = comments.map(c => `[${c.author}]: ${c.body}`).join('\n');
        const contextMsg = `You are helping with a task in Mission Control.\n\nTask: "${task.title}"\nDescription: ${task.description || 'none'}\n\n${threadContext ? `Thread so far:\n${threadContext}\n\n` : ''}New message: ${msgText}`;

        const agentRes = await fetch('/api/agent-call', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent, message: contextMsg }),
        });
        const { reply } = await agentRes.json();
        const replyRes = await fetch(`/api/tasks/${task.id}/comments`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ author: agent, body: reply }),
        });
        const replyComment = await replyRes.json();
        setComments(c => [...c, replyComment]);
      } catch { /* ignore */ }
      setAgentThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 flex-shrink-0">
        <span className="text-xs text-slate-500 font-mono">TASK #{task.id}</span>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800">×</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Title */}
        <input
          className="w-full bg-transparent text-slate-100 font-semibold text-lg border-b border-transparent hover:border-slate-700 focus:border-slate-600 outline-none pb-1"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        />

        {/* Fields */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Status', field: 'status', opts: [['up_next','Up Next'],['in_progress','In Progress'],['completed','Completed']] },
            { label: 'Priority', field: 'priority', opts: [['low','Low'],['medium','Medium'],['high','High']] },
            { label: 'Assignee', field: 'assignee', opts: [['bart','Bart'],['shisho','Shisho 🦉'],['scout','Scout 🔍'],['fonzie','Fonzie 💰']] },
          ].map(({ label, field, opts }) => (
            <div key={field}>
              <label className="block text-xs text-slate-500 mb-1">{label}</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-100"
                value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}>
                {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="block text-xs text-slate-500 mb-1">Goal</label>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-100"
              value={form.goal_id || ''} onChange={e => setForm(f => ({ ...f, goal_id: e.target.value ? parseInt(e.target.value) : null }))}>
              <option value="">No goal</option>
              {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Scheduled</label>
            <input type="datetime-local" className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-100"
              value={form.scheduled_at || ''} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value || null }))} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Description</label>
            <textarea rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-100 resize-none"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>

        <Button size="sm" onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">Save Changes</Button>

        {/* Thread */}
        <div className="border-t border-slate-800 pt-4">
          <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-4">Thread</h3>
          <div className="space-y-4">
            {comments.length === 0 && <p className="text-xs text-slate-700">No comments yet. Use @shisho, @scout, or @fonzie to involve an agent.</p>}
            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${assigneeColor[c.author] || 'bg-slate-600'}`}>
                  {assigneeEmoji[c.author] || c.author[0].toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-200 capitalize">{c.author}</span>
                    <span className="text-xs text-slate-600">{new Date(c.created_at + 'Z').toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">{renderBody(c.body)}</p>
                </div>
              </div>
            ))}
            {agentThinking && (
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center text-xs">🦉</span>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* Comment input */}
      <div className="px-5 py-4 border-t border-slate-800 flex-shrink-0">
        <div className="relative">
          {/* @mention dropdown */}
          {mention && filteredAgents.length > 0 && (
            <div className="absolute bottom-full mb-1 left-0 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-lg z-10">
              {filteredAgents.map(agent => (
                <button key={agent} onClick={() => insertMention(agent)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 text-left">
                  <span>{assigneeEmoji[agent]}</span>
                  <span className="text-blue-400 font-semibold">@{agent}</span>
                </button>
              ))}
            </div>
          )}
          <textarea
            ref={textareaRef}
            rows={2}
            placeholder="Add a comment… type @ to mention an agent"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-100 resize-none focus:outline-none focus:border-slate-500 pr-16"
            value={commentText}
            onChange={e => handleCommentChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') setMention(null);
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendComment();
            }}
          />
          <Button size="sm" onClick={sendComment} disabled={sending || agentThinking}
            className="absolute right-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-3">
            Send
          </Button>
        </div>
        <p className="text-xs text-slate-700 mt-1.5">Cmd+Enter to send · @ to mention an agent</p>
      </div>
    </div>
  );
}
