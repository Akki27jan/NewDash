import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useTimers, scheduleNotification, cancelNotification } from '@/context/TimerContext';
import TerminalButton from '../TerminalButton';

export default function NormalTimer() {
  const { normal, setNormal } = useTimers();
  const [inputMinutes, setInputMinutes] = useState('25');

  const handleStart = async () => {
    if (normal.status === 'idle' || normal.status === 'paused') {
      let duration = normal.timeRemaining;
      
      if (normal.timeRemaining === 0) {
        duration = Math.max(1, parseInt(inputMinutes) || 0) * 60;
      }
      
      // Schedule deep OS notification
      const notifId = await scheduleNotification("Timer Finished", "Your normal timer has completed.", duration);
      
      setNormal(prev => ({ 
        ...prev, 
        duration: normal.timeRemaining === 0 ? duration : prev.duration,
        timeRemaining: duration,
        status: 'running',
        notificationId: notifId
      }));
    }
  };

  const handlePause = async () => {
    if (normal.status === 'running') {
      await cancelNotification(normal.notificationId);
      setNormal(prev => ({ ...prev, status: 'paused', notificationId: undefined }));
    }
  };

  const handleReset = async () => {
    await cancelNotification(normal.notificationId);
    setNormal({ duration: (parseInt(inputMinutes) || 25) * 60, timeRemaining: 0, status: 'idle', notificationId: undefined });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View className="flex-col gap-6 w-full max-w-md mx-auto items-center p-6 border border-theme-border/50 bg-theme-bg">
      <Text className="text-xl text-theme-primary font-bold border-b border-theme-border w-full text-center pb-2 font-mono">
        NORMAL_TIMER
      </Text>
      
      <Text className="text-6xl font-mono text-theme-accent tracking-widest my-4">
        {formatTime(normal.timeRemaining)}
      </Text>
      
      {normal.status === 'idle' && normal.timeRemaining === 0 && (
        <View className="flex-col gap-2 w-full">
          <Text className="text-theme-secondary text-sm font-mono">&gt; SET_MINUTES:</Text>
          <TextInput 
            value={inputMinutes} 
            onChangeText={setInputMinutes}
            keyboardType="numeric"
            className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent text-center"
          />
        </View>
      )}

      <View className="flex-row gap-4 mt-4 w-full justify-center">
        {normal.status !== 'running' && (
          <TerminalButton title="START" variant="default" onPress={handleStart} />
        )}
        {normal.status === 'running' && (
          <TerminalButton title="PAUSE" variant="warning" onPress={handlePause} />
        )}
        <TerminalButton title="RESET" variant="danger" onPress={handleReset} />
      </View>

      <Text className="text-theme-muted font-mono text-xs mt-4 text-center">
        [Status: {normal.status.toUpperCase()}]
      </Text>
    </View>
  );
}
