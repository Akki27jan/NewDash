import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTimers } from '@/context/TimerContext';
import TerminalButton from '../TerminalButton';

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
    const milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    return `${m}:${s}.${milliseconds}`;
  };

  return (
    <View className="flex-col gap-6 w-full max-w-md mx-auto items-center p-6 border border-theme-border/50 bg-theme-bg">
      <Text className="text-xl text-theme-primary font-bold border-b border-theme-border w-full text-center pb-2 font-mono">
        STOPWATCH
      </Text>
      
      <Text className="text-6xl font-mono text-theme-accent tracking-widest my-4">
        {formatTime(stopwatch.timeElapsed)}
      </Text>

      <View className="flex-row gap-4 mt-4 w-full justify-center">
        {stopwatch.status !== 'running' && (
          <TerminalButton title="START" variant="default" onPress={handleStart} />
        )}
        {stopwatch.status === 'running' && (
          <>
            <TerminalButton title="PAUSE" variant="warning" onPress={handlePause} />
            <TerminalButton title="LAP" variant="default" onPress={handleLap} />
          </>
        )}
        <TerminalButton title="RESET" variant="danger" onPress={handleReset} />
      </View>

      <Text className="text-theme-muted font-mono text-xs mt-2 text-center">
        [Status: {stopwatch.status.toUpperCase()}]
      </Text>

      {stopwatch.laps.length > 0 && (
        <View className="w-full mt-4 border-t border-theme-border/50 pt-4">
          <Text className="text-theme-secondary text-sm font-bold font-mono mb-2">LAPS:</Text>
          <ScrollView className="max-h-40 w-full" contentContainerStyle={{ paddingBottom: 10 }}>
            {stopwatch.laps.map((lap, idx) => (
              <View key={idx} className="flex-row justify-between border-b border-theme-border/30 pb-2 mb-2 w-full">
                <Text className="text-theme-muted font-mono text-sm">Lap {String(idx + 1).padStart(2, '0')}</Text>
                <Text className="text-theme-muted font-mono text-sm">{formatTime(lap)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
