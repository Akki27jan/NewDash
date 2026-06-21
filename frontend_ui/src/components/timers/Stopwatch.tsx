"use client";

import React from 'react';
import { useTimers } from '@/context/TimerContext';
import Button from '../ui/Button';

export default function Stopwatch() {
  const { stopwatch, setStopwatch } = useTimers();

  const handleStart = () => {
    if (stopwatch.status === 'idle' || stopwatch.status === 'paused') {
      setStopwatch(prev => ({ ...prev, status: 'running' }));
    }
  };

  const handlePause = () => {
    if (stopwatch.status === 'running') {
      setStopwatch(prev => ({ ...prev, status: 'paused' }));
    }
  };

  const handleLap = () => {
    if (stopwatch.status === 'running') {
      setStopwatch(prev => ({ ...prev, laps: [...prev.laps, prev.timeElapsed] }));
    }
  };

  const handleReset = () => {
    setStopwatch({ timeElapsed: 0, status: 'idle', laps: [] });
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    const milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0'); // Show centiseconds
    return `${m}:${s}.${milliseconds}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto items-center p-4 border border-theme-border/50 bg-theme-bg">
      <h2 className="text-xl text-theme-primary font-bold border-b border-theme-border w-full text-center pb-2">
        STOPWATCH
      </h2>
      
      <div className="text-6xl font-mono text-theme-accent tracking-widest my-4">
        {formatTime(stopwatch.timeElapsed)}
      </div>

      <div className="flex gap-4 mt-4 w-full justify-center">
        {stopwatch.status !== 'running' && (
          <Button label="[START]" color="blue" onClick={handleStart} />
        )}
        {stopwatch.status === 'running' && (
          <>
            <Button label="[PAUSE]" color="yellow" onClick={handlePause} />
            <Button label="[LAP]" color="blue" onClick={handleLap} />
          </>
        )}
        <Button label="[RESET]" color="red" onClick={handleReset} />
      </div>

      <div className="text-theme-muted text-xs mt-2 text-center">
        [Status: {stopwatch.status.toUpperCase()}]
      </div>

      {stopwatch.laps.length > 0 && (
        <div className="w-full mt-4 border-t border-theme-border/50 pt-4">
          <h3 className="text-theme-secondary text-sm font-bold mb-2">LAPS:</h3>
          <ul className="text-theme-muted font-mono text-sm max-h-40 overflow-y-auto space-y-1">
            {stopwatch.laps.map((lap, idx) => (
              <li key={idx} className="flex justify-between border-b border-theme-border/30 pb-1">
                <span>Lap {String(idx + 1).padStart(2, '0')}</span>
                <span>{formatTime(lap)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
