"use client";

import React from 'react';
import { format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths, isSameDay } from 'date-fns';
import { CalendarItem } from '@/app/dashboard/calendar/page';

interface MonthlyViewProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  items: CalendarItem[];
  onDayClick: (date: Date) => void;
  onAddEvent: (date: Date) => void;
  onDelete?: (id: string, type: 'todo' | 'event' | 'exam') => void;
}

export default function MonthlyView({ currentDate, setCurrentDate, items, onDayClick, onAddEvent, onDelete }: MonthlyViewProps) {
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = startOfMonth(currentDate);
  const startingDayOfWeek = getDay(firstDayOfMonth); // 0 = Sunday, 6 = Saturday

  // Create an array for the grid cells
  const blanksBefore = Array.from({ length: startingDayOfWeek }, (_, i) => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
    return d;
  });
  
  // Total cells must be a multiple of 7 to complete the last row
  const totalCells = blanksBefore.length + days.length;
  const blanksAfterLength = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const blanksAfter = Array.from({ length: blanksAfterLength }, (_, i) => null);

  const allCells = [...blanksBefore, ...days, ...blanksAfter];

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <div className="w-full flex flex-col h-full font-mono">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 text-theme-primary border border-theme-border p-2 bg-theme-bg">
        <button onClick={handlePrevMonth} className="px-2 hover:text-theme-accent transition-colors">&lt; PREV</button>
        <span className="font-bold text-lg tracking-widest">{format(currentDate, 'MMMM yyyy').toUpperCase()}</span>
        <button onClick={handleNextMonth} className="px-2 hover:text-theme-accent transition-colors">NEXT &gt;</button>
      </div>

      {/* Grid */}
      <div className="flex-grow flex flex-col border-l border-t border-theme-border/50">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-theme-border/20 text-theme-secondary text-xs sm:text-sm text-center border-b border-theme-border/50">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="py-2 border-r border-theme-border/50 font-bold">{day}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 flex-grow auto-rows-[minmax(100px,1fr)]">
          {allCells.map((date, index) => {
            if (!date) {
              // Empty padding cell (Option 4B)
              return (
                <div key={`blank-${index}`} className="border-r border-b border-theme-border/50 bg-theme-bg/30 p-1 flex flex-col opacity-20">
                  <span className="text-theme-muted text-xs">EOF</span>
                </div>
              );
            }

            // Actual day cell
            const dayItems = items.filter(item => isSameDay(item.start, date));
            const isToday = isSameDay(date, new Date());

            return (
              <div 
                key={`day-${date.toISOString()}`} 
                className={`border-r border-b border-theme-border/50 p-1 sm:p-2 flex flex-col relative group cursor-pointer transition-colors hover:bg-theme-border/10 ${isToday ? 'bg-theme-accent/5' : ''}`}
                onClick={() => onDayClick(date)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm ${isToday ? 'text-theme-accent font-bold' : 'text-theme-secondary'}`}>
                    {format(date, 'd')}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAddEvent(date); }}
                    className="text-theme-muted hover:text-theme-accent text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Add Event"
                  >
                    [+]
                  </button>
                </div>
                
                <div className="flex-grow overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {dayItems.map(item => (
                    <div 
                      key={item.id} 
                      className="text-[10px] sm:text-xs px-1 rounded-sm border-l-2 flex justify-between items-center group/item"
                      style={{ borderColor: item.color, backgroundColor: `${item.color}20`, color: item.color === '#555555' ? '#aaaaaa' : '#ffffff' }}
                      title={`${format(item.start, 'HH:mm')} - ${item.title}`}
                    >
                      <div className="truncate flex-1">
                        {item.type === 'todo' && <span className="mr-1">[]</span>}
                        {format(item.start, 'HH:mm')} {item.title}
                      </div>
                      
                      {onDelete && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(item.id, item.type); }}
                          className="opacity-0 group-hover/item:opacity-100 text-[9px] hover:text-red-500 transition-opacity px-1 flex-shrink-0"
                          title={`Delete ${item.type}`}
                        >
                          X
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
