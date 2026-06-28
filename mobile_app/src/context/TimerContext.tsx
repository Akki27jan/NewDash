import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

if (Platform.OS !== 'web') {
  // Configure notification behavior when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

type TimerStatus = 'idle' | 'running' | 'paused';

export interface NormalTimerState {
  duration: number;
  timeRemaining: number;
  status: TimerStatus;
  notificationId?: string;
}

export interface PomodoroTimerState {
  workDuration: number;
  breakDuration: number;
  timeRemaining: number;
  phase: 'work' | 'break';
  status: TimerStatus;
  notificationId?: string;
}

export interface RecurringTimerState {
  duration: number;
  timeRemaining: number;
  totalLoops: number;
  currentLoop: number;
  status: TimerStatus;
  notificationId?: string;
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
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [normal, setNormal] = useState<NormalTimerState>({ duration: 0, timeRemaining: 0, status: 'idle' });
  const [pomodoro, setPomodoro] = useState<PomodoroTimerState>({ workDuration: 25 * 60, breakDuration: 5 * 60, timeRemaining: 25 * 60, phase: 'work', status: 'idle' });
  const [recurring, setRecurring] = useState<RecurringTimerState>({ duration: 0, timeRemaining: 0, totalLoops: 1, currentLoop: 1, status: 'idle' });
  const [stopwatch, setStopwatch] = useState<StopwatchState>({ timeElapsed: 0, status: 'idle', laps: [] });

  const stopwatchTickRef = useRef<number>(Date.now());
  const countdownTickRef = useRef<number>(Date.now());
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
        return;
      }
      
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Push notification permissions not granted');
      }
    })();
  }, []);

  // Handle precise background timing by measuring elapsed time since backgrounding
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // We just returned to the foreground. Calculate elapsed time.
        const now = Date.now();
        const elapsedSecs = Math.floor((now - countdownTickRef.current) / 1000);
        const elapsedMs = now - stopwatchTickRef.current;
        
        // Fast-forward stopwatch
        setStopwatch(prev => prev.status === 'running' ? { ...prev, timeElapsed: prev.timeElapsed + elapsedMs } : prev);
        
        // Note: For countdowns, it's safer to let the interval handle it on the next tick, 
        // but if it was heavily delayed (iOS suspends), we'd process it here. 
        // We let the interval loop catch up naturally in the next 100ms tick via the ref delta.
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
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
        countdownTickRef.current = now - (countdownDelta % 1000);

        // Update Normal Timer
        setNormal(prev => {
          if (prev.status === 'running' && prev.timeRemaining > 0) {
            const nextTime = Math.max(0, prev.timeRemaining - secondsElapsed);
            if (nextTime === 0) {
              return { ...prev, timeRemaining: 0, status: 'idle', notificationId: undefined };
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
              if (prev.phase === 'work') {
                return { ...prev, phase: 'break', timeRemaining: prev.breakDuration, notificationId: undefined };
              } else {
                return { ...prev, phase: 'work', timeRemaining: prev.workDuration, status: 'idle', notificationId: undefined };
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
                return { ...prev, currentLoop: prev.currentLoop + 1, timeRemaining: prev.duration, notificationId: undefined };
              } else {
                return { ...prev, timeRemaining: 0, status: 'idle', notificationId: undefined };
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
    <TimerContext.Provider value={{ normal, setNormal, pomodoro, setPomodoro, recurring, setRecurring, stopwatch, setStopwatch }}>
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

export const scheduleNotification = async (title: string, body: string, secondsInFuture: number) => {
  if (Platform.OS === 'web') {
    // Basic fallback for web testing
    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      } else {
        alert(`${title}\n${body}`);
      }
    }, secondsInFuture * 1000);
    return `web-notif-${Date.now()}`;
  }

  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: { 
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, 
      seconds: secondsInFuture 
    },
  });
};

export const cancelNotification = async (id?: string) => {
  if (Platform.OS === 'web') return; // Can't easily cancel simple setTimeout fallback
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
};
