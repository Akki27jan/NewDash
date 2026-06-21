"use client";

import React, { useState } from 'react';
import { useTimers } from '@/context/TimerContext';
import Button from '../ui/Button';

export default function RecurringTimer() {
  const { recurring, setRecurring } = useTimers();
  const [durationInput, setDurationInput] = useState(5);
  const [loopsInput, setLoopsInput] = useState(3);

  const handleStart = () => {
    if (recurring.status === 'idle' || recurring.status === 'paused') {
      if (recurring.status === 'idle') {
        setRecurring({ 
          duration: durationInput * 60, 
          timeRemaining: durationInput * 60, 
          totalLoops: loopsInput,
          currentLoop: 1,
          status: 'running' 
        });
      } else {
        setRecurring(prev => ({ ...prev, status: 'running' }));
      }
    }
  };

  const handlePause = () => {
    if (recurring.status === 'running') {
      setRecurring(prev => ({ ...prev, status: 'paused' }));
    }
  };

  const handleReset = () => {
    setRecurring({ 
      duration: durationInput * 60, 
      timeRemaining: durationInput * 60, 
      totalLoops: loopsInput,
      currentLoop: 1,
      status: 'idle' 
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto items-center p-4 border border-theme-border/50 bg-theme-bg">
      <h2 className="text-xl text-theme-primary font-bold border-b border-theme-border w-full text-center pb-2">
        RECURRING_TIMER
      </h2>
      
      <div className="text-6xl font-mono text-theme-accent tracking-widest my-4">
        {formatTime(recurring.timeRemaining)}
      </div>

      <div className="text-theme-secondary text-sm uppercase tracking-wider mb-2 font-bold">
        -- [LOOP: {recurring.currentLoop} / {recurring.totalLoops}] --
      </div>
      
      {recurring.status === 'idle' && (
        <div className="flex gap-4 w-full text-theme-secondary text-sm justify-between">
          <label className="flex flex-col gap-1 w-1/2">
            <span>MINS_PER_LOOP:</span>
            <input 
              type="number" 
              value={durationInput} 
              onChange={(e) => setDurationInput(Math.max(1, parseInt(e.target.value) || 0))}
              className="bg-theme-bg border border-theme-border text-theme-primary p-2 font-mono focus:outline-none focus:border-theme-accent"
              min="1"
            />
          </label>
          <label className="flex flex-col gap-1 w-1/2">
            <span>TOTAL_LOOPS:</span>
            <input 
              type="number" 
              value={loopsInput} 
              onChange={(e) => setLoopsInput(Math.max(1, parseInt(e.target.value) || 0))}
              className="bg-theme-bg border border-theme-border text-theme-primary p-2 font-mono focus:outline-none focus:border-theme-accent"
              min="1"
            />
          </label>
        </div>
      )}

      <div className="flex gap-4 mt-4 w-full justify-center">
        {recurring.status !== 'running' && (
          <Button label="[START]" color="blue" onClick={handleStart} />
        )}
        {recurring.status === 'running' && (
          <Button label="[PAUSE]" color="yellow" onClick={handlePause} />
        )}
        <Button label="[RESET]" color="red" onClick={handleReset} />
      </div>

      <div className="text-theme-muted text-xs mt-4 text-center">
        [Status: {recurring.status.toUpperCase()}]
      </div>
    </div>
  );
}
