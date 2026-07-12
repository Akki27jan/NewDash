"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

type TimerStatus = 'idle' | 'running' | 'paused';

export interface NormalTimerState {
  duration: number;
  timeRemaining: number;
  status: TimerStatus;
  youtubeUrl?: string;
}

export interface PomodoroTimerState {
  workDuration: number;
  breakDuration: number;
  timeRemaining: number;
  phase: 'work' | 'break';
  status: TimerStatus;
  youtubeUrl?: string;
}

export interface RecurringTimerState {
  duration: number;
  timeRemaining: number;
  totalLoops: number;
  currentLoop: number;
  status: TimerStatus;
  youtubeUrl?: string;
}

export interface StopwatchState {
  timeElapsed: number; // in milliseconds
  status: TimerStatus;
  laps: number[];
}

interface TimerContextType {
  normal: NormalTimerState;
  setNormal: React.Dispatch<React.SetStateAction<NormalTimerState>>;
  pomodoro: PomodoroTimerState;
  setPomodoro: React.Dispatch<React.SetStateAction<PomodoroTimerState>>;
  recurring: RecurringTimerState;
  setRecurring: React.Dispatch<React.SetStateAction<RecurringTimerState>>;
  stopwatch: StopwatchState;
  setStopwatch: React.Dispatch<React.SetStateAction<StopwatchState>>;
  playingYoutubeUrl: string | null;
  setPlayingYoutubeUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [normal, setNormal] = useState<NormalTimerState>({ duration: 0, timeRemaining: 0, status: 'idle' });
  const [pomodoro, setPomodoro] = useState<PomodoroTimerState>({ workDuration: 25 * 60, breakDuration: 5 * 60, timeRemaining: 25 * 60, phase: 'work', status: 'idle' });
  const [recurring, setRecurring] = useState<RecurringTimerState>({ duration: 0, timeRemaining: 0, totalLoops: 1, currentLoop: 1, status: 'idle' });
  const [stopwatch, setStopwatch] = useState<StopwatchState>({ timeElapsed: 0, status: 'idle', laps: [] });
  const [playingYoutubeUrl, setPlayingYoutubeUrl] = useState<string | null>(null);

  const stopwatchTickRef = useRef<number>(Date.now());
  const countdownTickRef = useRef<number>(Date.now());

  const triggerNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Update Stopwatch
      const stopwatchDelta = now - stopwatchTickRef.current;
      stopwatchTickRef.current = now;

      setStopwatch(prev => {
        if (prev.status === 'running') {
          return { ...prev, timeElapsed: prev.timeElapsed + stopwatchDelta };
        }
        return prev;
      });

      // Update Countdowns
      const countdownDelta = now - countdownTickRef.current;
      const secondsElapsed = Math.floor(countdownDelta / 1000);
      
      if (secondsElapsed > 0) {
        countdownTickRef.current = now - (countdownDelta % 1000); // retain the remainder

        // Update Normal Timer
        setNormal(prev => {
          if (prev.status === 'running' && prev.timeRemaining > 0) {
            const nextTime = Math.max(0, prev.timeRemaining - secondsElapsed);
            if (nextTime === 0) {
              triggerNotification("Timer Finished", "Your normal timer has completed.");
              if (prev.youtubeUrl) setPlayingYoutubeUrl(prev.youtubeUrl);
              return { ...prev, timeRemaining: 0, status: 'idle' };
            }
            return { ...prev, timeRemaining: nextTime };
          }
          return prev;
        });

        // Update Pomodoro
        setPomodoro(prev => {
          if (prev.status === 'running' && prev.timeRemaining > 0) {
            const nextTime = prev.timeRemaining - secondsElapsed;
            if (nextTime <= 0) {
              if (prev.youtubeUrl) setPlayingYoutubeUrl(prev.youtubeUrl);
              if (prev.phase === 'work') {
                triggerNotification("Work Phase Over", "Time for a break!");
                return { ...prev, phase: 'break', timeRemaining: prev.breakDuration, status: 'paused' };
              } else {
                triggerNotification("Break Over", "Time to get back to work!");
                return { ...prev, phase: 'work', timeRemaining: prev.workDuration, status: 'paused' }; 
              }
            }
            return { ...prev, timeRemaining: nextTime };
          }
          return prev;
        });

        // Update Recurring
        setRecurring(prev => {
          if (prev.status === 'running' && prev.timeRemaining > 0) {
            const nextTime = prev.timeRemaining - secondsElapsed;
            if (nextTime <= 0) {
              if (prev.currentLoop < prev.totalLoops) {
                triggerNotification("Loop Completed", `Loop ${prev.currentLoop} of ${prev.totalLoops} finished.`);
                return { ...prev, currentLoop: prev.currentLoop + 1, timeRemaining: prev.duration };
              } else {
                triggerNotification("Recurring Timer Finished", `All ${prev.totalLoops} loops completed.`);
                if (prev.youtubeUrl) setPlayingYoutubeUrl(prev.youtubeUrl);
                return { ...prev, timeRemaining: 0, status: 'idle' };
              }
            }
            return { ...prev, timeRemaining: nextTime };
          }
          return prev;
        });
      }

    }, 100); 

    return () => clearInterval(interval);
  }, []);

  return (
    <TimerContext.Provider value={{ normal, setNormal, pomodoro, setPomodoro, recurring, setRecurring, stopwatch, setStopwatch, playingYoutubeUrl, setPlayingYoutubeUrl }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimers() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimers must be used within a TimerProvider');
  }
  return context;
}
