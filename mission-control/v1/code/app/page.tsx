'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MissionView from '@/components/MissionView';
import GoalsView from '@/components/GoalsView';
import TasksView from '@/components/TasksView';
import ScheduleView from '@/components/ScheduleView';
import TeamView from '@/components/TeamView';
import AgentsView from '@/components/AgentsView';

const FULL_BLEED = ['tasks', 'schedule', 'team'];

export default function Home() {
  const [active, setActive] = useState('mission');

  const views: Record<string, React.ReactNode> = {
    mission: <MissionView />,
    goals: <GoalsView />,
    tasks: <TasksView />,
    schedule: <ScheduleView />,
    team: <TeamView />,
    agents: <AgentsView />,
  };

  const isFullBleed = FULL_BLEED.includes(active);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar active={active} onNav={setActive} />
      <main className={`flex-1 overflow-hidden ${isFullBleed ? '' : 'overflow-y-auto p-8'}`}>
        {isFullBleed ? (
          <div className="h-full">{views[active]}</div>
        ) : (
          <div className="max-w-3xl mx-auto">{views[active]}</div>
        )}
      </main>
    </div>
  );
}
