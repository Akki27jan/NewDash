import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTimers } from '@/context/TimerContext';
import NormalTimer from '@/components/timers/NormalTimer';
import PomodoroTimer from '@/components/timers/PomodoroTimer';
import RecurringTimer from '@/components/timers/RecurringTimer';
import Stopwatch from '@/components/timers/Stopwatch';

type Tab = 'normal' | 'pomodoro' | 'recurring' | 'stopwatch';

export default function TimersScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('normal');
  const { normal, pomodoro, recurring, stopwatch } = useTimers();

  const isRunning = (status: string) => status === 'running';

  const tabs: { id: Tab; label: string; active: boolean }[] = [
    { id: 'normal', label: 'NORMAL', active: isRunning(normal.status) },
    { id: 'pomodoro', label: 'POMODORO', active: isRunning(pomodoro.status) },
    { id: 'recurring', label: 'RECURRING', active: isRunning(recurring.status) },
    { id: 'stopwatch', label: 'STOPWATCH', active: isRunning(stopwatch.status) }
  ];

  return (
    <SafeAreaView className="flex-1 bg-theme-bg" edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        
        {/* Page Title */}
        <View className="border border-theme-border p-4 bg-theme-bg mb-6">
          <View className="border-b border-theme-border pb-2 mb-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text className="text-theme-primary font-bold text-lg font-mono whitespace-nowrap">
                <Text className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</Text>
                :~/timers# _
              </Text>
            </ScrollView>
          </View>
          <Text className="text-theme-secondary font-mono text-sm">
            Select a timer type below. Timers will trigger system notifications when complete.
          </Text>
        </View>

        <View className="border border-theme-border p-4 bg-theme-bg shadow-sm">
          {/* Tabbed Navigation - Horizontal Scroll for narrow screens */}
          <View className="mb-6 border-b border-theme-border/50 pb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {tabs.map((tab) => (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  className={`
                    px-4 py-2 flex-row items-center justify-center border
                    ${activeTab === tab.id 
                      ? 'bg-theme-accent-bg border-theme-accent' 
                      : 'bg-theme-bg border-theme-border'}
                  `}
                >
                  <Text className={`font-mono text-sm tracking-wider ${activeTab === tab.id ? 'text-theme-accent font-bold' : 'text-theme-secondary'}`}>
                    [{tab.label}]
                  </Text>
                  {tab.active && tab.id !== activeTab && (
                    <View className="ml-2 w-2 h-2 rounded-full bg-theme-success animate-pulse" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Tab Content */}
          <View className="flex justify-center items-start min-h-[400px] w-full">
            {activeTab === 'normal' && <NormalTimer />}
            {activeTab === 'pomodoro' && <PomodoroTimer />}
            {activeTab === 'recurring' && <RecurringTimer />}
            {activeTab === 'stopwatch' && <Stopwatch />}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
