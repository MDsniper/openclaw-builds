'use client';

import { useState } from 'react';

const navItems = [
  { id: 'mission', label: 'Mission', icon: '🎯' },
  { id: 'goals', label: 'Goals', icon: '🏆' },
  { id: 'tasks', label: 'Tasks', icon: '📋' },
  { id: 'schedule', label: 'Schedule', icon: '📅' },
  { id: 'team', label: 'Chat', icon: '💬' },
  { id: 'agents', label: 'Agents', icon: '🤖' },
];

interface SidebarProps {
  active: string;
  onNav: (id: string) => void;
}

export default function Sidebar({ active, onNav }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? 'w-14' : 'w-52'} transition-all duration-200 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 flex-shrink-0`}>
      {/* Header */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-5 border-b border-slate-800`}>
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">🦉</span>
            <div className="min-w-0">
              <div className="font-bold text-slate-100 text-sm truncate">Mission Control</div>
              <div className="text-slate-500 text-xs truncate">Shisho HQ</div>
            </div>
          </div>
        )}
        {collapsed && <span className="text-xl">🦉</span>}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`flex-shrink-0 ${collapsed ? 'mt-0' : 'ml-1'} text-slate-600 hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-800`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            title={collapsed ? item.label : undefined}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm transition-colors ${
              active === item.id
                ? 'bg-slate-700 text-slate-100 font-medium'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-600">
          Pi 5 · SQLite · Local
        </div>
      )}
    </aside>
  );
}
