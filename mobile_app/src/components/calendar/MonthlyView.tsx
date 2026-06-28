import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths, isSameDay } from 'date-fns';
import { CalendarItem } from '@/app/dashboard/calendar'; // will create this type in calendar.tsx

interface MonthlyViewProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  items: CalendarItem[];
  onDayClick: (date: Date) => void;
  onAddEvent: (date: Date) => void;
  onDelete?: (id: string, type: 'todo' | 'event' | 'exam') => void;
  selectedDate: Date;
}

export default function MonthlyView({ currentDate, setCurrentDate, items, onDayClick, onAddEvent, onDelete, selectedDate }: MonthlyViewProps) {
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = startOfMonth(currentDate);
  const startingDayOfWeek = getDay(firstDayOfMonth); // 0 = Sunday

  const blanksBefore = Array.from({ length: startingDayOfWeek }, (_, i) => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1));
  
  const totalCells = blanksBefore.length + days.length;
  const blanksAfterLength = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const blanksAfter = Array.from({ length: blanksAfterLength }, (_, i) => null);

  const allCells = [...blanksBefore, ...days, ...blanksAfter];
  const selectedDayItems = items.filter(item => isSameDay(item.start, selectedDate)).sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <View className="flex-col w-full h-full">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4 border border-theme-border p-2 bg-theme-bg">
        <Pressable onPress={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1">
          <Text className="text-theme-secondary font-mono text-sm">&lt; PREV</Text>
        </Pressable>
        <Text className="text-theme-primary font-bold font-mono tracking-widest text-base">
          {format(currentDate, 'MMMM yyyy').toUpperCase()}
        </Text>
        <Pressable onPress={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1">
          <Text className="text-theme-secondary font-mono text-sm">NEXT &gt;</Text>
        </Pressable>
      </View>

      {/* Grid */}
      <View className="flex-col border-l border-t border-theme-border mb-6">
        <View className="flex-row bg-theme-border/20 border-b border-theme-border">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <View key={day} className="flex-1 py-2 border-r border-theme-border items-center">
              <Text className="text-theme-secondary font-mono text-xs font-bold">{day}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row flex-wrap">
          {allCells.map((date, index) => {
            if (!date) {
              return (
                <View key={`blank-${index}`} style={{ width: '14.28%' }} className="aspect-square border-r border-b border-theme-border/50 bg-theme-bg/30 opacity-20 p-1" />
              );
            }

            const dayItems = items.filter(item => isSameDay(item.start, date));
            const isToday = isSameDay(date, new Date());
            const isSelected = isSameDay(date, selectedDate);

            return (
              <Pressable 
                key={date.toISOString()} 
                style={{ width: '14.28%' }}
                className={`aspect-square border-r border-b border-theme-border/50 p-1 flex-col items-center justify-start ${isToday ? 'bg-theme-accent/10' : ''} ${isSelected ? 'border border-theme-primary bg-theme-border-bg' : ''}`}
                onPress={() => onDayClick(date)}
              >
                <Text className={`font-mono text-xs mb-1 ${isToday || isSelected ? 'text-theme-accent font-bold' : 'text-theme-primary'}`}>
                  {format(date, 'd')}
                </Text>
                
                <View className="flex-row flex-wrap justify-center gap-1">
                  {dayItems.slice(0, 4).map(item => (
                    <View key={item.id} style={{ backgroundColor: item.color, width: 4, height: 4, borderRadius: 2 }} />
                  ))}
                  {dayItems.length > 4 && <Text className="text-[8px] text-theme-secondary leading-[6px]">+</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Agenda View */}
      <View className="flex-1 border border-theme-border bg-theme-bg p-4 flex-col">
        <View className="flex-row justify-between items-center border-b border-theme-border/50 pb-2 mb-2">
          <Text className="text-theme-primary font-bold font-mono text-sm">
            AGENDA: {format(selectedDate, 'MMM do, yyyy').toUpperCase()}
          </Text>
          <Pressable onPress={() => onAddEvent(selectedDate)} className="border border-theme-border px-2">
            <Text className="text-theme-secondary font-mono text-xs">+ ADD</Text>
          </Pressable>
        </View>

        <ScrollView className="max-h-64" contentContainerStyle={{ paddingBottom: 10 }}>
          {selectedDayItems.length === 0 ? (
            <Text className="text-theme-muted font-mono text-sm text-center py-4">No events scheduled.</Text>
          ) : (
            <View className="flex-col gap-2">
              {selectedDayItems.map(item => (
                <View key={item.id} className="flex-row border-l-2 bg-theme-border/10 p-2" style={{ borderLeftColor: item.color }}>
                  <Text className="text-theme-secondary font-mono text-xs w-12 pt-[2px]">{format(item.start, 'HH:mm')}</Text>
                  <View className="flex-1 flex-col">
                    <Text className="text-theme-primary font-bold font-mono text-sm" style={{ color: item.color === '#555555' ? '#aaaaaa' : '#ffffff' }}>
                      {item.title}
                    </Text>
                    {item.type === 'event' && item.originalData.description ? (
                      <Text className="text-theme-secondary font-mono text-xs mt-1" numberOfLines={2}>
                        {item.originalData.description}
                      </Text>
                    ) : null}
                  </View>
                  {onDelete && (
                    <Pressable onPress={() => onDelete(item.id, item.type)} className="justify-center pl-2">
                      <Text className="text-theme-accent font-mono text-xs">[X]</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
