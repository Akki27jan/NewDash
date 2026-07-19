import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import TerminalButton from '@/components/TerminalButton';
import { useRouter } from 'expo-router';

interface Todo {
  id: string;
  task_name: string;
  due: string;
  status: boolean;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [subjectCount, setSubjectCount] = useState<number | string>('...');
  const [pendingTasks, setPendingTasks] = useState<Todo[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, todoRes] = await Promise.all([
          fetch(`${API_URL}/api/subjects/`, { credentials: 'include' }),
          fetch(`${API_URL}/api/todos/`, { credentials: 'include' })
        ]);
        
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubjectCount(subData.length);
        } else {
          setSubjectCount('ERROR');
        }

        if (todoRes.ok) {
          const todoData: Todo[] = await todoRes.json();
          const now = new Date();
          const validTasks = todoData.filter((t: Todo) => !t.status && new Date(t.due) >= now);
          validTasks.sort((a: Todo, b: Todo) => new Date(a.due).getTime() - new Date(b.due).getTime());
          setPendingTasks(validTasks);
        }
      } catch (err) {
        setSubjectCount('ERROR');
      }
    };
    fetchData();
  }, []);

  return (
    <ScrollView className="flex-1 bg-theme-bg" contentContainerStyle={{ padding: 16 }}>
      <View className="border border-theme-border p-4 bg-theme-bg mb-6">
        <View className="border-b border-theme-border pb-2 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text className="text-theme-primary font-bold text-lg font-mono whitespace-nowrap">
              <Text className="text-theme-accent">
                {user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}
              </Text>
              :~/dashboard# _
            </Text>
          </ScrollView>
        </View>

        <Text className="text-theme-secondary font-mono mb-4 text-sm">
          Welcome to the NewDash module control center. You have successfully authenticated.
        </Text>

        <View className="mb-4">
          <Text className="text-theme-muted font-mono text-xs">[System status: ONLINE]</Text>
          <Text className="text-theme-muted font-mono text-xs">[Number of Subjects: {subjectCount}]</Text>
        </View>

        <View className="border-t border-theme-border pt-4 mt-2">
          <Text className="text-theme-primary font-bold font-mono mb-2">Pending Active Tasks:</Text>
          {pendingTasks.length > 0 ? (
            <View className="flex-col gap-1">
              {pendingTasks.map((t, idx) => {
                const d = new Date(t.due);
                const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                return (
                  <Text key={t.id} className="text-theme-secondary font-mono text-xs">
                    [{String(idx+1).padStart(2, '0')}] {t.task_name} <Text className="text-theme-muted">- Due: {dateStr}</Text>
                  </Text>
                );
              })}
            </View>
          ) : (
            <Text className="text-theme-muted font-mono text-xs">[No pending tasks]</Text>
          )}
        </View>
      </View>

      {/* Navigation Modules */}
      <Text className="text-theme-primary font-bold text-lg font-mono mb-4 border-b border-theme-border self-start pr-8">
        <Text className="text-theme-accent">#</Text> SELECT_MODULE
      </Text>
      
      <View className="flex-row flex-wrap justify-between gap-y-4 pb-8">
        <View className="w-[48%]">
          <TerminalButton title="SUBJECTS" onPress={() => router.push('/dashboard/subjects')} />
        </View>
        <View className="w-[48%]">
          <TerminalButton title="GPA_CALC" onPress={() => router.push('/dashboard/gpa')} />
        </View>
        <View className="w-[48%]">
          <TerminalButton title="TODO_LIST" onPress={() => router.push('/dashboard/todos')} />
        </View>
        <View className="w-[48%]">
          <TerminalButton title="NOTES" onPress={() => router.push('/dashboard/notes')} />
        </View>
        <View className="w-[48%]">
          <TerminalButton title="CALENDAR" onPress={() => router.push('/dashboard/calendar')} />
        </View>
        <View className="w-[48%]">
          <TerminalButton title="TIMERS" onPress={() => router.push('/dashboard/timers')} />
        </View>
        <View className="w-[48%]">
          <TerminalButton title="ATTENDANCE" onPress={() => router.push('/dashboard/attendance')} />
        </View>
        <View className="w-[48%]">
          <TerminalButton title="FLASHCARDS" onPress={() => router.push('/dashboard/flashcards')} />
        </View>
        <View className="w-[48%]">
          <TerminalButton title="SETTINGS" onPress={() => router.push('/dashboard/settings')} />
        </View>
      </View>
    </ScrollView>
  );
}
