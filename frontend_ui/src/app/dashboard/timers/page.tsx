"use client";

import React, { useState } from 'react';
import NormalTimer from '@/components/timers/NormalTimer';
import PomodoroTimer from '@/components/timers/PomodoroTimer';
import RecurringTimer from '@/components/timers/RecurringTimer';
import Stopwatch from '@/components/timers/Stopwatch';
import { useTimers } from '@/context/TimerContext';
import { useAuth } from '@/context/AuthContext';

type Tab = 'normal' | 'pomodoro' | 'recurring' | 'stopwatch';

export default function TimersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('normal');
  const { normal, pomodoro, recurring, stopwatch } = useTimers();
  const { user } = useAuth();

  // Helper to show a tiny indicator if a timer is active in background
  const isRunning = (status: string) => status === 'running';

  const tabs: { id: Tab; label: string; active: boolean }[] = [
    { id: 'normal', label: 'NORMAL', active: isRunning(normal.status) },
    { id: 'pomodoro', label: 'POMODORO', active: isRunning(pomodoro.status) },
    { id: 'recurring', label: 'RECURRING', active: isRunning(recurring.status) },
    { id: 'stopwatch', label: 'STOPWATCH', active: isRunning(stopwatch.status) }
  ];

  return (
    <main className="flex-grow flex flex-col gap-8 mt-8 max-w-4xl mx-auto w-full px-4 mb-8">
      {/* Page Title */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h1 className="text-theme-primary font-bold text-2xl mb-4 border-b border-theme-border pb-2">
          <span className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</span>:~/timers# _
        </h1>
        <p className="text-theme-secondary mb-2">
          Select a timer type below. Timers run continuously in the background and will trigger system notifications when complete.
        </p>
      </div>

      <div className="border border-theme-border p-6 bg-theme-bg shadow-sm">
        {/* Tabbed Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-theme-border/50 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 font-mono text-sm tracking-wider transition-colors
                ${activeTab === tab.id 
                  ? 'bg-theme-accent/20 text-theme-accent border border-theme-accent' 
                  : 'bg-theme-bg text-theme-secondary border border-theme-border hover:text-theme-primary'}
              `}
            >
              [{tab.label}]
              {tab.active && tab.id !== activeTab && (
                <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex justify-center items-start min-h-[400px]">
          {activeTab === 'normal' && <NormalTimer />}
          {activeTab === 'pomodoro' && <PomodoroTimer />}
          {activeTab === 'recurring' && <RecurringTimer />}
          {activeTab === 'stopwatch' && <Stopwatch />}
        </div>
      </div>
    </main>
  );
}
