"use client";

import React, { useState, useEffect } from 'react';
import { useTimers } from '@/context/TimerContext';
import Button from '../ui/Button';

export default function NormalTimer() {
  const { normal, setNormal } = useTimers();
  const [inputMinutes, setInputMinutes] = useState(25);
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
    if (normal.status === 'idle' || normal.status === 'paused') {
      if (normal.timeRemaining === 0) {
        setNormal({ duration: inputMinutes * 60, timeRemaining: inputMinutes * 60, status: 'running', youtubeUrl: youtubeLink || undefined });
      } else {
        setNormal(prev => ({ ...prev, status: 'running' }));
      }
    }
  };

  const handlePause = () => {
    if (normal.status === 'running') {
      setNormal(prev => ({ ...prev, status: 'paused' }));
    }
  };

  const handleReset = () => {
    setNormal({ duration: inputMinutes * 60, timeRemaining: inputMinutes * 60, status: 'idle', youtubeUrl: youtubeLink || undefined });
  };

  const handleCancel = () => {
    setNormal({ duration: 0, timeRemaining: 0, status: 'idle', youtubeUrl: youtubeLink || undefined });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto items-center p-4 border border-theme-border/50 bg-theme-bg">
      <h2 className="text-xl text-theme-primary font-bold border-b border-theme-border w-full text-center pb-2">
        NORMAL_TIMER
      </h2>
      
      <div className="text-6xl font-mono text-theme-accent tracking-widest my-4">
        {formatTime(normal.timeRemaining)}
      </div>
      
      {normal.status === 'idle' && normal.timeRemaining === 0 && (
        <div className="flex flex-col gap-2 w-full text-theme-secondary text-sm">
          <label className="flex flex-col gap-1">
            <span>SET_MINUTES:</span>
            <input 
              type="number" 
              value={inputMinutes} 
              onChange={(e) => setInputMinutes(Math.max(1, parseInt(e.target.value) || 0))}
              className="bg-theme-bg border border-theme-border text-theme-primary p-2 font-mono focus:outline-none focus:border-theme-accent"
              min="1"
            />
          </label>
          <label className="flex flex-col gap-1 mt-2">
            <span>YOUTUBE_ALARM_LINK (OPTIONAL):</span>
            <input 
              type="text" 
              value={youtubeLink} 
              onChange={handleYoutubeChange}
              placeholder="https://youtube.com/watch?v=..."
              className="bg-theme-bg border border-theme-border text-theme-primary p-2 font-mono focus:outline-none focus:border-theme-accent"
            />
          </label>
        </div>
      )}

      <div className="flex flex-col gap-4 mt-4 w-full items-center">
        <div className="flex gap-4 w-full justify-center">
          {normal.status !== 'running' && (
            <Button label="[START]" color="blue" onClick={handleStart} />
          )}
          {normal.status === 'running' && (
            <Button label="[PAUSE]" color="yellow" onClick={handlePause} />
          )}
          <Button label="[RESET]" color="red" onClick={handleReset} />
        </div>
        {!(normal.status === 'idle' && normal.timeRemaining === 0) && (
          <Button label="[CANCEL_TO_MENU]" color="yellow" onClick={handleCancel} />
        )}
      </div>

      <div className="text-theme-muted text-xs mt-4 text-center">
        [Status: {normal.status.toUpperCase()}]
      </div>
    </div>
  );
}
