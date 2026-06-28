import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useTimers, scheduleNotification, cancelNotification } from '@/context/TimerContext';
import TerminalButton from '../TerminalButton';

export default function RecurringTimer() {
  const { recurring, setRecurring } = useTimers();
  const [inputMinutes, setInputMinutes] = useState('5');
  const [inputLoops, setInputLoops] = useState('3');

  const handleStart = async () => {
    if (recurring.status === 'idle' || recurring.status === 'paused') {
      let duration = recurring.timeRemaining;
      
      if (recurring.status === 'idle') {
        const dur = Math.max(1, parseInt(inputMinutes) || 0) * 60;
        const loops = Math.max(1, parseInt(inputLoops) || 1);
        duration = dur;
        
        const notifId = await scheduleNotification("Loop Completed", `Loop 1 of ${loops} finished.`, duration);

        setRecurring({ 
          duration: dur, 
          timeRemaining: duration, 
          totalLoops: loops,
          currentLoop: 1,
          status: 'running',
          notificationId: notifId
        });
      } else {
        const title = recurring.currentLoop < recurring.totalLoops ? "Loop Completed" : "Recurring Timer Finished";
        const body = recurring.currentLoop < recurring.totalLoops 
          ? `Loop ${recurring.currentLoop} of ${recurring.totalLoops} finished.` 
          : `All ${recurring.totalLoops} loops completed.`;
          
        const notifId = await scheduleNotification(title, body, duration);
        setRecurring(prev => ({ ...prev, status: 'running', notificationId: notifId }));
      }
    }
  };

  const handlePause = async () => {
    if (recurring.status === 'running') {
      await cancelNotification(recurring.notificationId);
      setRecurring(prev => ({ ...prev, status: 'paused', notificationId: undefined }));
    }
  };

  const handleReset = async () => {
    await cancelNotification(recurring.notificationId);
    setRecurring({ 
      duration: (parseInt(inputMinutes) || 5) * 60, 
      timeRemaining: 0, 
      totalLoops: parseInt(inputLoops) || 3,
      currentLoop: 1,
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
        RECURRING
      </Text>
      
      <Text className="text-6xl font-mono text-theme-accent tracking-widest my-4">
        {formatTime(recurring.timeRemaining)}
      </Text>

      <Text className="text-theme-secondary text-sm uppercase tracking-wider mb-2 font-bold font-mono">
        -- [LOOP {recurring.currentLoop} OF {recurring.totalLoops}] --
      </Text>
      
      {recurring.status === 'idle' && (
        <View className="flex-row gap-4 w-full justify-between">
          <View className="flex-col gap-1 flex-1">
            <Text className="text-theme-secondary text-xs font-mono">&gt; SET_MINUTES:</Text>
            <TextInput 
              value={inputMinutes} 
              onChangeText={setInputMinutes}
              keyboardType="numeric"
              className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent text-center"
            />
          </View>
          <View className="flex-col gap-1 flex-1">
            <Text className="text-theme-secondary text-xs font-mono">&gt; TOTAL_LOOPS:</Text>
            <TextInput 
              value={inputLoops} 
              onChangeText={setInputLoops}
              keyboardType="numeric"
              className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent text-center"
            />
          </View>
        </View>
      )}

      <View className="flex-row gap-4 mt-4 w-full justify-center">
        {recurring.status !== 'running' && (
          <TerminalButton title="START" variant="default" onPress={handleStart} />
        )}
        {recurring.status === 'running' && (
          <TerminalButton title="PAUSE" variant="warning" onPress={handlePause} />
        )}
        <TerminalButton title="RESET" variant="danger" onPress={handleReset} />
      </View>

      <Text className="text-theme-muted font-mono text-xs mt-4 text-center">
        [Status: {recurring.status.toUpperCase()}]
      </Text>
    </View>
  );
}
