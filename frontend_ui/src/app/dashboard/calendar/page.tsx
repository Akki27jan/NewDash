"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import MonthlyView from '@/components/calendar/MonthlyView';
import DailyView from '@/components/calendar/DailyView';
import EventModal from '@/components/calendar/EventModal';
import ExamModal from '@/components/calendar/ExamModal';
import ManageEventsModal from '@/components/calendar/ManageEventsModal';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, parseISO, addMinutes } from 'date-fns';

export interface CalendarItem {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'todo' | 'event' | 'exam';
  color?: string;
  originalData: any;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [view, setView] = useState<'month' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
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
          color: t.status ? '#555555' : '#eab308', // grey if done, yellow if pending
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
          color: e.color_code || '#3b82f6', // default blue
          originalData: e
        });
      });

      examPeriods.forEach((period: any) => {
        // We push each specific exam into the calendar
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
            color: period.color_code || '#ef4444', // default red
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
  }, [currentDate]);

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setView('day');
  };

  const handleAddEvent = (date?: Date) => {
    setIsManageModalOpen(false);
    setIsExamModalOpen(false);
    setSelectedDateForNew(date || currentDate);
    setIsEventModalOpen(true);
  };

  const handleAddExam = (date?: Date) => {
    setIsManageModalOpen(false);
    setIsEventModalOpen(false);
    setSelectedDateForNew(date || currentDate);
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
    if (wasSaved) {
      fetchCalendarData();
    }
  };

  const handleManageModalClose = (wasSaved: boolean) => {
    setIsManageModalOpen(false);
    if (wasSaved) {
      fetchCalendarData();
    }
  };

  const handleDeleteItem = async (id: string, type: 'todo' | 'event' | 'exam') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      let endpoint = '';
      if (type === 'todo') endpoint = `/api/todos/${id}`;
      if (type === 'event') endpoint = `/api/events/${id}`;
      if (type === 'exam') endpoint = `/api/exams/paper/${id}`;

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (res.ok) {
        fetchCalendarData();
      } else {
        alert(`Failed to delete ${type}.`);
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting item.');
    }
  };

  return (
    <main className="flex-grow flex flex-col gap-8 mt-8 max-w-6xl mx-auto w-full px-4 mb-8">
      {/* Title Module */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h1 className="text-theme-primary font-bold text-2xl mb-4 border-b border-theme-border pb-2">
          <span className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</span>:~/calendar# _
        </h1>
        <p className="text-theme-secondary mb-2">
          Unified Calendar Interface. Viewing unified events, tasks, and exam timetables.
        </p>
      </div>

      <div className="border border-theme-border p-6 bg-theme-bg shadow-sm">
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b border-theme-border/50 gap-4">
          <div className="flex gap-2">
            <button 
              onClick={() => setView('month')}
              className={`px-4 py-1 border font-mono text-sm transition-colors ${view === 'month' ? 'bg-theme-accent text-black border-theme-accent' : 'border-theme-border text-theme-secondary hover:text-theme-primary'}`}
            >
              [MONTH]
            </button>
            <button 
              onClick={() => setView('day')}
              className={`px-4 py-1 border font-mono text-sm transition-colors ${view === 'day' ? 'bg-theme-accent text-black border-theme-accent' : 'border-theme-border text-theme-secondary hover:text-theme-primary'}`}
            >
              [DAY]
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={openManageModal}
              className="px-4 py-1 bg-transparent border border-blue-500 text-blue-500 hover:bg-blue-500/20 font-mono text-sm transition-colors"
            >
              [MANAGE_EVENTS]
            </button>
            <button 
              onClick={() => handleAddExam()}
              className="px-4 py-1 bg-transparent border border-red-500 text-red-500 hover:bg-red-500/20 font-mono text-sm transition-colors"
            >
              + ADD_EXAM
            </button>
            <button 
              onClick={() => handleAddEvent()}
              className="px-4 py-1 bg-transparent border border-green-500 text-green-500 hover:bg-green-500/20 font-mono text-sm transition-colors"
            >
              + ADD_EVENT
            </button>
          </div>
        </div>

        {/* View rendering */}
        <div className="min-h-[500px] relative">
          {loading && items.length === 0 && (
            <div className="text-theme-secondary animate-pulse text-center py-12 absolute inset-0 z-10 flex items-center justify-center bg-theme-bg/50">
              [Loading Calendar Data...]
            </div>
          )}
          
          <div className={`transition-opacity duration-200 ${loading && items.length > 0 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {view === 'month' && (
              <MonthlyView 
                currentDate={currentDate} 
                setCurrentDate={setCurrentDate} 
                items={items} 
                onDayClick={handleDayClick}
                onAddEvent={handleAddEvent}
                onDelete={handleDeleteItem}
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
          </div>
        </div>
      </div>

      {isEventModalOpen && (
        <EventModal 
          isOpen={isEventModalOpen}
          onClose={handleModalClose}
          initialDate={selectedDateForNew}
        />
      )}

      {isExamModalOpen && (
        <ExamModal 
          isOpen={isExamModalOpen}
          onClose={handleModalClose}
          initialDate={selectedDateForNew}
        />
      )}

      {isManageModalOpen && (
        <ManageEventsModal 
          isOpen={isManageModalOpen}
          onClose={handleManageModalClose}
          onAddEvent={() => handleAddEvent()}
          onAddExam={() => handleAddExam()}
        />
      )}
    </main>
  );
}
