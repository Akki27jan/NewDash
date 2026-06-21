"use client";

import React from 'react';
import { format, addDays, subDays, isSameDay, startOfDay } from 'date-fns';
import { CalendarItem } from '@/app/dashboard/calendar/page';

interface DailyViewProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  items: CalendarItem[];
  onDelete?: (id: string, type: 'todo' | 'event' | 'exam') => void;
  onAddEvent?: (date: Date) => void;
}

export default function DailyView({ currentDate, setCurrentDate, items, onDelete, onAddEvent }: DailyViewProps) {
  const handlePrevDay = () => setCurrentDate(subDays(currentDate, 1));
  const handleNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const dayItems = items.filter(item => isSameDay(item.start, currentDate)).sort((a, b) => a.start.getTime() - b.start.getTime());

  // Generate 24 hour slots
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="w-full flex flex-col h-full font-mono min-h-[600px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 text-theme-primary border border-theme-border p-2 bg-theme-bg">
        <button onClick={handlePrevDay} className="px-2 hover:text-theme-accent transition-colors">&lt; PREV</button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg tracking-widest">{format(currentDate, 'EEEE').toUpperCase()}</span>
          <span className="text-sm text-theme-secondary">{format(currentDate, 'MMM do, yyyy')}</span>
        </div>
        <button onClick={handleNextDay} className="px-2 hover:text-theme-accent transition-colors">NEXT &gt;</button>
      </div>

      <div className="mb-4 text-center">
        <button onClick={handleToday} className="text-theme-secondary hover:text-theme-primary text-xs border border-theme-border px-2 py-1">
          [GO_TO_TODAY]
        </button>
      </div>

      {/* Timeline */}
      <div className="flex-grow border border-theme-border/50 bg-theme-bg overflow-y-auto relative h-[600px] custom-scrollbar">
        {hours.map(hour => {
          // Filter items that fall into this specific hour block based on their start time
          const hourItems = dayItems.filter(item => item.start.getHours() === hour);
          const hourDate = new Date(currentDate);
          hourDate.setHours(hour, 0, 0, 0);
          
          return (
            <div key={hour} className="flex min-h-[60px] border-b border-theme-border/30 relative group/hour hover:bg-theme-border/5 transition-colors">
              <div className="w-16 flex-shrink-0 border-r border-theme-border/50 text-theme-secondary text-xs p-2 flex flex-col justify-start items-end gap-1">
                <span>{format(hourDate, 'HH:mm')}</span>
                {onAddEvent && (
                  <button 
                    onClick={() => onAddEvent(hourDate)}
                    className="opacity-0 group-hover/hour:opacity-100 text-theme-accent hover:text-theme-primary transition-opacity text-[10px]"
                    title={`Add event at ${format(hourDate, 'HH:mm')}`}
                  >
                    [+]
                  </button>
                )}
              </div>
              <div className="flex-grow p-1 relative flex flex-col gap-1">
                {hourItems.map(item => {
                  return (
                    <div 
                      key={item.id}
                      className="border-l-4 px-2 py-1 text-sm bg-theme-border/10 transition-colors hover:bg-theme-border/20 group relative"
                      style={{ borderLeftColor: item.color, color: item.color === '#555555' ? '#aaaaaa' : '#ffffff' }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-bold">{format(item.start, 'HH:mm')} - {format(item.end, 'HH:mm')}</div>
                        
                        {onDelete && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id, item.type); }}
                            className="text-theme-accent hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-theme-bg px-1 border border-theme-border"
                            title={`Delete ${item.type}`}
                          >
                            [DEL]
                          </button>
                        )}
                      </div>
                      
                      <div>{item.type === 'todo' ? `[TODO] ${item.title.replace('[TODO] ', '')}` : item.title}</div>
                      
                      {item.type === 'event' && item.originalData.description && (
                        <div className="text-xs text-theme-secondary mt-1 line-clamp-2">{item.originalData.description}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
