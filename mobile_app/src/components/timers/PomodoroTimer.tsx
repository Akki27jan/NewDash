import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useTimers, scheduleNotification, cancelNotification } from '@/context/TimerContext';
import TerminalButton from '../TerminalButton';

export default function PomodoroTimer() {
  const { pomodoro, setPomodoro } = useTimers();
  const [workInput, setWorkInput] = useState('25');
  const [breakInput, setBreakInput] = useState('5');

  const handleStart = async () => {
    if (pomodoro.status === 'idle' || pomodoro.status === 'paused') {
      let duration = pomodoro.timeRemaining;
      
      if (pomodoro.status === 'idle') {
        const w = Math.max(1, parseInt(workInput) || 0) * 60;
        const b = Math.max(1, parseInt(breakInput) || 0) * 60;
        duration = w;
        
        const notifId = await scheduleNotification("Work Phase Over", "Time for a break!", duration);

        setPomodoro({ 
          workDuration: w, 
          breakDuration: b, 
          timeRemaining: duration, 
          phase: 'work',
          status: 'running',
          notificationId: notifId
        });
      } else {
        const title = pomodoro.phase === 'work' ? "Work Phase Over" : "Break Over";
        const body = pomodoro.phase === 'work' ? "Time for a break!" : "Time to get back to work!";
        const notifId = await scheduleNotification(title, body, duration);

        setPomodoro(prev => ({ ...prev, status: 'running', notificationId: notifId }));
      }
    }
  };

  const handlePause = async () => {
    if (pomodoro.status === 'running') {
      await cancelNotification(pomodoro.notificationId);
      setPomodoro(prev => ({ ...prev, status: 'paused', notificationId: undefined }));
    }
  };

  const handleReset = async () => {
    await cancelNotification(pomodoro.notificationId);
    setPomodoro({ 
      workDuration: (parseInt(workInput) || 25) * 60, 
      breakDuration: (parseInt(breakInput) || 5) * 60, 
      timeRemaining: (parseInt(workInput) || 25) * 60, 
      phase: 'work',
      status: 'idle',
      notificationId: undefined
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View className="flex-col gap-6 w-full max-w-md mx-auto items-center p-6 border border-theme-border/50 bg-theme-bg">
      <Text className="text-xl text-theme-primary font-bold border-b border-theme-border w-full text-center pb-2 font-mono">
        POMODORO
      </Text>
      
      <Text className={`text-6xl font-mono tracking-widest my-4 ${pomodoro.phase === 'work' ? 'text-theme-accent' : 'text-theme-success'}`}>
        {formatTime(pomodoro.timeRemaining)}
      </Text>

      <Text className="text-theme-secondary text-sm uppercase tracking-wider mb-2 font-bold font-mono">
        -- [PHASE: {pomodoro.phase}] --
      </Text>
      
      {pomodoro.status === 'idle' && (
        <View className="flex-row gap-4 w-full justify-between">
          <View className="flex-col gap-1 flex-1">
            <Text className="text-theme-secondary text-xs font-mono">&gt; WORK_MINS:</Text>
            <TextInput 
              value={workInput} 
              onChangeText={setWorkInput}
              keyboardType="numeric"
              className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent text-center"
            />
          </View>
          <View className="flex-col gap-1 flex-1">
            <Text className="text-theme-secondary text-xs font-mono">&gt; BREAK_MINS:</Text>
            <TextInput 
              value={breakInput} 
              onChangeText={setBreakInput}
              keyboardType="numeric"
              className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent text-center"
            />
          </View>
        </View>
      )}

      <View className="flex-row gap-4 mt-4 w-full justify-center">
        {pomodoro.status !== 'running' && (
          <TerminalButton title="START" variant="default" onPress={handleStart} />
        )}
        {pomodoro.status === 'running' && (
          <TerminalButton title="PAUSE" variant="warning" onPress={handlePause} />
        )}
        <TerminalButton title="RESET" variant="danger" onPress={handleReset} />
      </View>

      <Text className="text-theme-muted font-mono text-xs mt-4 text-center">
        [Status: {pomodoro.status.toUpperCase()}]
      </Text>
    </View>
  );
}
