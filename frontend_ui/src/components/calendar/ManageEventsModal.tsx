"use client";

import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { API_URL } from '@/lib/api';

interface ManageEventsModalProps {
  isOpen: boolean;
  onClose: (wasChanged: boolean) => void;
  onAddEvent: () => void;
  onAddExam: () => void;
}

type UnifiedItem = {
  id: string;
  type: 'event' | 'exam_period';
  title: string;
  start: Date;
  end: Date;
  color: string;
  originalData: any;
};

export default function ManageEventsModal({ isOpen, onClose, onAddEvent, onAddExam }: ManageEventsModalProps) {
  const [items, setItems] = useState<UnifiedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [eventsRes, examsRes] = await Promise.all([
        fetch(`${API_URL}/api/events/`, { credentials: 'include' }),
        fetch(`${API_URL}/api/exams/`, { credentials: 'include' })
      ]);

      const eventsData = eventsRes.ok ? await eventsRes.json() : [];
      const examsData = examsRes.ok ? await examsRes.json() : [];

      const unified: UnifiedItem[] = [];

      eventsData.forEach((e: any) => {
        unified.push({
          id: e.id,
          type: 'event',
          title: e.title,
          start: parseISO(e.start_time),
          end: parseISO(e.end_time),
          color: e.color_code || '#3b82f6',
          originalData: e
        });
      });

      examsData.forEach((period: any) => {
        unified.push({
          id: period.id,
          type: 'exam_period',
          title: period.title,
          start: parseISO(period.start_date),
          end: parseISO(period.end_date),
          color: period.color_code || '#ef4444',
          originalData: period
        });
      });

      // Sort chronologically by start time
      unified.sort((a, b) => a.start.getTime() - b.start.getTime());
      setItems(unified);
    } catch (err: any) {
      setError('Failed to fetch events and exams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleDelete = async (id: string, type: 'event' | 'exam_period' | 'paper') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      let endpoint = '';
      if (type === 'event') endpoint = `/api/events/${id}`;
      if (type === 'exam_period') endpoint = `/api/exams/${id}`;
      if (type === 'paper') endpoint = `/api/exams/paper/${id}`;

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) throw new Error(`Failed to delete ${type}`);
      
      // Refetch
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-theme-bg/95 flex items-center justify-center z-50 p-4 font-mono">
      <div className="w-full max-w-4xl border border-theme-border bg-theme-bg flex flex-col shadow-lg max-h-[90vh]">
        {/* Header */}
        <div className="bg-theme-border/20 border-b border-theme-border p-4 flex justify-between items-center">
          <h2 className="text-theme-primary font-bold text-lg tracking-wider">
            &gt; MANAGE_EVENTS_AND_EXAMS
          </h2>
          <button onClick={() => onClose(true)} className="text-theme-secondary hover:text-theme-accent focus:outline-none px-2 py-1 border border-transparent hover:border-theme-accent transition-colors">
            [CLOSE]
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-theme-border flex gap-4 bg-theme-bg/50">
          <button 
            onClick={onAddExam}
            className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 transition-colors text-sm"
          >
            + ADD_EXAM_TIMETABLE
          </button>
          <button 
            onClick={onAddEvent}
            className="px-4 py-2 border border-green-500 text-green-500 hover:bg-green-500/10 transition-colors text-sm"
          >
            + ADD_EVENT
          </button>
          <button 
            onClick={fetchData}
            className="px-4 py-2 border border-theme-border text-theme-secondary hover:text-theme-primary transition-colors text-sm ml-auto"
          >
            [REFRESH]
          </button>
        </div>

        {/* List View */}
        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="text-center text-theme-secondary py-12 animate-pulse">[LOADING DATA...]</div>
          ) : error ? (
            <div className="text-red-500 border border-red-500 p-4">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-center text-theme-secondary py-12">[NO EVENTS FOUND]</div>
          ) : (
            <div className="flex flex-col gap-6">
              {items.map((item) => (
                <div key={`${item.type}-${item.id}`} className="border border-theme-border/50 bg-theme-border/5 p-4 relative group">
                  
                  {/* Master Row Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-sm flex-shrink-0" 
                        style={{ backgroundColor: item.color }} 
                      />
                      <div>
                        <div className="text-theme-primary font-bold text-lg">
                          {item.type === 'exam_period' ? `[EXAM PERIOD] ${item.title}` : `[EVENT] ${item.title}`}
                        </div>
                        <div className="text-theme-secondary text-sm mt-1">
                          {item.type === 'event' && (
                            <>Date: {format(item.start, 'MMM do, yyyy')} | Time: {format(item.start, 'HH:mm')} - {format(item.end, 'HH:mm')}</>
                          )}
                          {item.type === 'exam_period' && (
                            <>Period: {format(item.start, 'MMM do, yyyy')} to {format(item.end, 'MMM do, yyyy')}</>
                          )}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDelete(item.id, item.type)}
                      className="text-theme-accent hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity border border-theme-border hover:border-red-500 px-2 py-1 text-xs"
                    >
                      [DELETE_{item.type === 'event' ? 'EVENT' : 'PERIOD'}]
                    </button>
                  </div>

                  {/* Description (Events Only) */}
                  {item.type === 'event' && item.originalData.description && (
                    <div className="mt-3 text-sm text-theme-secondary pl-6 border-l-2 border-theme-border/50">
                      {item.originalData.description}
                    </div>
                  )}

                  {/* Sub-list (Exams Only) */}
                  {item.type === 'exam_period' && item.originalData.exams && item.originalData.exams.length > 0 && (
                    <div className="mt-4 pl-6">
                      <div className="text-theme-secondary text-xs mb-2 tracking-widest border-b border-theme-border/30 pb-1 w-fit">
                        &gt; TIMETABLE
                      </div>
                      <div className="flex flex-col gap-2">
                        {item.originalData.exams.sort((a: any, b: any) => new Date(a.exam_time).getTime() - new Date(b.exam_time).getTime()).map((paper: any) => (
                          <div key={paper.id} className="flex justify-between items-center bg-theme-bg p-2 border border-theme-border/30 group/paper">
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-theme-primary w-32 truncate" title={paper.subject}>{paper.subject}</span>
                              <span className="text-theme-secondary">{format(parseISO(paper.exam_time), 'MMM do, yyyy')}</span>
                              <span className="text-theme-secondary">{format(parseISO(paper.exam_time), 'HH:mm')}</span>
                              <span className="text-theme-muted">{paper.duration_minutes ? `${paper.duration_minutes} mins` : ''}</span>
                            </div>
                            <button 
                              onClick={() => handleDelete(paper.id, 'paper')}
                              className="text-theme-accent hover:text-red-500 opacity-0 group-hover/paper:opacity-100 transition-opacity text-xs"
                              title="Delete specific paper"
                            >
                              [X]
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
