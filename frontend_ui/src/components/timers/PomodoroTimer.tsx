"use client";

import React, { useState, useEffect } from 'react';
import { useTimers } from '@/context/TimerContext';
import Button from '../ui/Button';

export default function PomodoroTimer() {
  const { pomodoro, setPomodoro } = useTimers();
  const [workInput, setWorkInput] = useState(25);
  const [breakInput, setBreakInput] = useState(5);
  const [youtubeLink, setYoutubeLink] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('savedYoutubeAlarmLink');
    if (saved) setYoutubeLink(saved);
  }, []);

  const handleYoutubeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setYoutubeLink(val);
    localStorage.setItem('savedYoutubeAlarmLink', val);
  };

  const handleStart = () => {
    if (pomodoro.status === 'idle' || pomodoro.status === 'paused') {
      // If we are starting fresh (from idle) we can apply new settings
      if (pomodoro.status === 'idle') {
        setPomodoro({ 
          workDuration: workInput * 60, 
          breakDuration: breakInput * 60, 
          timeRemaining: workInput * 60, 
          phase: 'work',
          status: 'running',
          youtubeUrl: youtubeLink || undefined
        });
      } else {
        setPomodoro(prev => ({ ...prev, status: 'running' }));
      }
    }
  };

  const handlePause = () => {
    if (pomodoro.status === 'running') {
      setPomodoro(prev => ({ ...prev, status: 'paused' }));
    }
  };

  const handleReset = () => {
    setPomodoro({ 
      workDuration: workInput * 60, 
      breakDuration: breakInput * 60, 
      timeRemaining: workInput * 60, 
      phase: 'work',
      status: 'idle',
      youtubeUrl: youtubeLink || undefined
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
        POMODORO
      </h2>
      
      <div className={`text-6xl font-mono tracking-widest my-4 ${pomodoro.phase === 'work' ? 'text-theme-accent' : 'text-green-400'}`}>
        {formatTime(pomodoro.timeRemaining)}
      </div>

      <div className="text-theme-secondary text-sm uppercase tracking-wider mb-2 font-bold">
        -- [PHASE: {pomodoro.phase}] --
      </div>
      
      {pomodoro.status === 'idle' && (
        <div className="flex gap-4 w-full text-theme-secondary text-sm justify-between">
          <label className="flex flex-col gap-1 w-1/2">
            <span>WORK_MINS:</span>
            <input 
              type="number" 
              value={workInput} 
              onChange={(e) => setWorkInput(Math.max(1, parseInt(e.target.value) || 0))}
              className="bg-theme-bg border border-theme-border text-theme-primary p-2 font-mono focus:outline-none focus:border-theme-accent"
              min="1"
            />
          </label>
          <label className="flex flex-col gap-1 w-1/2">
            <span>BREAK_MINS:</span>
            <input 
              type="number" 
              value={breakInput} 
              onChange={(e) => setBreakInput(Math.max(1, parseInt(e.target.value) || 0))}
              className="bg-theme-bg border border-theme-border text-theme-primary p-2 font-mono focus:outline-none focus:border-theme-accent"
              min="1"
            />
          </label>
        </div>
      )}

      {pomodoro.status === 'idle' && (
        <div className="flex flex-col gap-1 w-full text-theme-secondary text-sm mt-2">
          <span>YOUTUBE_ALARM_LINK (OPTIONAL):</span>
          <input 
            type="text" 
            value={youtubeLink} 
            onChange={handleYoutubeChange}
            placeholder="https://youtube.com/watch?v=..."
            className="bg-theme-bg border border-theme-border text-theme-primary p-2 font-mono focus:outline-none focus:border-theme-accent w-full"
          />
        </div>
      )}

      <div className="flex gap-4 mt-4 w-full justify-center">
        {pomodoro.status !== 'running' && (
          <Button label="[START]" color="blue" onClick={handleStart} />
        )}
        {pomodoro.status === 'running' && (
          <Button label="[PAUSE]" color="yellow" onClick={handlePause} />
        )}
        <Button label="[RESET]" color="red" onClick={handleReset} />
      </div>

      <div className="text-theme-muted text-xs mt-4 text-center">
        [Status: {pomodoro.status.toUpperCase()}]
      </div>
    </div>
  );
}
