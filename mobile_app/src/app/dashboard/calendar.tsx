import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import { parseISO, addMinutes } from 'date-fns';

import MonthlyView from '@/components/calendar/MonthlyView';
import DailyView from '@/components/calendar/DailyView';
import EventModal from '@/components/calendar/EventModal';
import ExamModal from '@/components/calendar/ExamModal';
import ManageEventsModal from '@/components/calendar/ManageEventsModal';
import TerminalButton from '@/components/TerminalButton';

export interface CalendarItem {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'todo' | 'event' | 'exam';
  color?: string;
  originalData: any;
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const [view, setView] = useState<'month' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date()); // specifically for Monthly view selection
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedDateForNew, setSelectedDateForNew] = useState<Date | null>(null);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const [todosRes, eventsRes, examsRes] = await Promise.all([
        fetch(`${API_URL}/api/todos/`, { credentials: 'include' }),
        fetch(`${API_URL}/api/events/`, { credentials: 'include' }),
        fetch(`${API_URL}/api/exams/`, { credentials: 'include' })
      ]);

      const todos = todosRes.ok ? await todosRes.json() : [];
      const events = eventsRes.ok ? await eventsRes.json() : [];
      const examPeriods = examsRes.ok ? await examsRes.json() : [];

      const merged: CalendarItem[] = [];

      todos.forEach((t: any) => {
        merged.push({
          id: t.id,
          title: `[TODO] ${t.task_name}`,
          start: parseISO(t.due),
          end: parseISO(t.due),
          type: 'todo',
          color: t.status ? '#555555' : '#eab308',
          originalData: t
        });
      });

      events.forEach((e: any) => {
        merged.push({
          id: e.id,
          title: e.title,
          start: parseISO(e.start_time),
          end: parseISO(e.end_time),
          type: 'event',
          color: e.color_code || '#3b82f6',
          originalData: e
        });
      });

      examPeriods.forEach((period: any) => {
        period.exams.forEach((exam: any) => {
          const startTime = parseISO(exam.exam_time);
          const duration = parseInt(exam.duration_minutes) || 60;
          const endTime = addMinutes(startTime, duration);
          
          merged.push({
            id: exam.id,
            title: `[EXAM] ${exam.subject} (${period.title})`,
            start: startTime,
            end: endTime,
            type: 'exam',
            color: period.color_code || '#ef4444',
            originalData: { ...exam, period }
          });
        });
      });

      setItems(merged);
    } catch (err) {
      console.error("Failed to fetch calendar data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    // If they double click or want day view they can switch via tabs, 
    // but in mobile, selecting the day shows agenda.
  };

  const handleAddEvent = (date?: Date) => {
    setIsManageModalOpen(false);
    setIsExamModalOpen(false);
    setSelectedDateForNew(date || selectedDate);
    setIsEventModalOpen(true);
  };

  const handleAddExam = (date?: Date) => {
    setIsManageModalOpen(false);
    setIsEventModalOpen(false);
    setSelectedDateForNew(date || selectedDate);
    setIsExamModalOpen(true);
  };

  const openManageModal = () => {
    setIsEventModalOpen(false);
    setIsExamModalOpen(false);
    setIsManageModalOpen(true);
  };

  const handleModalClose = (wasSaved: boolean) => {
    setIsEventModalOpen(false);
    setIsExamModalOpen(false);
    if (wasSaved) fetchCalendarData();
  };

  const handleManageModalClose = (wasSaved: boolean) => {
    setIsManageModalOpen(false);
    if (wasSaved) fetchCalendarData();
  };

  const handleDeleteItem = async (id: string, type: 'todo' | 'event' | 'exam') => {
    Alert.alert(`Delete ${type}`, "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            let endpoint = '';
            if (type === 'todo') endpoint = `/api/todos/${id}`;
            if (type === 'event') endpoint = `/api/events/${id}`;
            if (type === 'exam') endpoint = `/api/exams/paper/${id}`;

            const res = await fetch(`${API_URL}${endpoint}`, {
              method: 'DELETE',
              credentials: 'include'
            });
            
            if (res.ok) fetchCalendarData();
            else Alert.alert("Error", `Failed to delete ${type}.`);
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Server connection failed.");
          }
      }}
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-theme-bg" edges={['left', 'right', 'bottom']}>
      
      {/* Title Module */}
      <View className="border border-theme-border p-4 bg-theme-bg m-4">
        <View className="border-b border-theme-border pb-2 mb-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text className="text-theme-primary font-bold text-lg font-mono whitespace-nowrap">
              <Text className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</Text>
              :~/calendar# _
            </Text>
          </ScrollView>
        </View>
        <Text className="text-theme-secondary font-mono text-xs">
          Unified events, tasks, and exam timetables.
        </Text>
      </View>

      <View className="flex-1 mx-4 mb-4">
        {/* Controls */}
        <View className="flex-col gap-4 mb-4">
          <View className="flex-row gap-2">
            <Pressable 
              onPress={() => setView('month')}
              className={`flex-1 items-center py-2 border ${view === 'month' ? 'bg-theme-primary border-theme-primary' : 'border-theme-border'}`}
            >
              <Text className={`font-mono text-sm ${view === 'month' ? 'text-theme-bg font-bold' : 'text-theme-secondary'}`}>
                [MONTH]
              </Text>
            </Pressable>
            <Pressable 
              onPress={() => setView('day')}
              className={`flex-1 items-center py-2 border ${view === 'day' ? 'bg-theme-primary border-theme-primary' : 'border-theme-border'}`}
            >
              <Text className={`font-mono text-sm ${view === 'day' ? 'text-theme-bg font-bold' : 'text-theme-secondary'}`}>
                [DAY]
              </Text>
            </Pressable>
          </View>
          
          <View className="flex-row justify-center pb-1">
            <TerminalButton title="MANAGE_EVENTS" variant="default" onPress={openManageModal} />
          </View>
        </View>

        {/* View rendering */}
        <View className="flex-1 relative">
          {loading && items.length === 0 && (
            <View className="absolute inset-0 z-10 flex items-center justify-center bg-theme-bg/50">
              <Text className="text-theme-secondary font-mono text-sm animate-pulse">[Loading...]</Text>
            </View>
          )}
          
          <View className={`flex-1 ${loading && items.length > 0 ? 'opacity-50' : 'opacity-100'}`}>
            {view === 'month' && (
              <MonthlyView 
                currentDate={currentDate} 
                setCurrentDate={setCurrentDate} 
                items={items} 
                onDayClick={handleDayClick}
                onAddEvent={handleAddEvent}
                onDelete={handleDeleteItem}
                selectedDate={selectedDate}
              />
            )}
            {view === 'day' && (
              <DailyView 
                currentDate={currentDate} 
                setCurrentDate={setCurrentDate} 
                items={items} 
                onDelete={handleDeleteItem}
                onAddEvent={handleAddEvent}
              />
            )}
          </View>
        </View>
      </View>

      <EventModal isOpen={isEventModalOpen} onClose={handleModalClose} initialDate={selectedDateForNew} />
      <ExamModal isOpen={isExamModalOpen} onClose={handleModalClose} initialDate={selectedDateForNew} />
      <ManageEventsModal isOpen={isManageModalOpen} onClose={handleManageModalClose} onAddEvent={() => handleAddEvent()} onAddExam={() => handleAddExam()} />

    </SafeAreaView>
  );
}
