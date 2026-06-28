import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { CalendarItem } from '@/app/dashboard/calendar'; 

interface DailyViewProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  items: CalendarItem[];
  onDelete?: (id: string, type: 'todo' | 'event' | 'exam') => void;
  onAddEvent?: (date: Date) => void;
}

export default function DailyView({ currentDate, setCurrentDate, items, onDelete, onAddEvent }: DailyViewProps) {
  const dayItems = items.filter(item => isSameDay(item.start, currentDate)).sort((a, b) => a.start.getTime() - b.start.getTime());
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <View className="flex-col w-full flex-1">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4 border border-theme-border p-2 bg-theme-bg">
        <Pressable onPress={() => setCurrentDate(subDays(currentDate, 1))} className="p-1">
          <Text className="text-theme-secondary font-mono text-sm">&lt; PREV</Text>
        </Pressable>
        <View className="flex-col items-center">
          <Text className="font-bold text-lg tracking-widest text-theme-primary font-mono">{format(currentDate, 'EEEE').toUpperCase()}</Text>
          <Text className="text-sm text-theme-secondary font-mono">{format(currentDate, 'MMM do, yyyy')}</Text>
        </View>
        <Pressable onPress={() => setCurrentDate(addDays(currentDate, 1))} className="p-1">
          <Text className="text-theme-secondary font-mono text-sm">NEXT &gt;</Text>
        </Pressable>
      </View>

      <View className="mb-4 items-center">
        <Pressable onPress={() => setCurrentDate(new Date())} className="border border-theme-border px-2 py-1">
          <Text className="text-theme-secondary font-mono text-xs">[GO_TO_TODAY]</Text>
        </Pressable>
      </View>

      {/* Timeline */}
      <View className="flex-1 border border-theme-border/50 bg-theme-bg h-[60vh]">
        <ScrollView className="flex-1">
          <View className="flex-col pb-10">
            {hours.map(hour => {
              const hourItems = dayItems.filter(item => item.start.getHours() === hour);
              const hourDate = new Date(currentDate);
              hourDate.setHours(hour, 0, 0, 0);
              
              return (
                <View key={hour} className="flex-row min-h-[60px] border-b border-theme-border/30">
                  {/* Time Label Column */}
                  <View className="w-16 border-r border-theme-border/50 p-2 flex-col justify-start items-end">
                    <Text className="text-theme-secondary font-mono text-xs">{format(hourDate, 'HH:mm')}</Text>
                    {onAddEvent && (
                      <Pressable onPress={() => onAddEvent(hourDate)} className="mt-1">
                        <Text className="text-theme-accent font-mono text-xs">[+]</Text>
                      </Pressable>
                    )}
                  </View>
                  
                  {/* Events Column */}
                  <View className="flex-1 p-1 flex-col gap-1">
                    {hourItems.map(item => (
                      <View 
                        key={item.id}
                        className="border-l-4 p-2 bg-theme-border/10"
                        style={{ borderLeftColor: item.color }}
                      >
                        <View className="flex-row justify-between items-start mb-1">
                          <Text className="font-bold font-mono text-xs" style={{ color: item.color === '#555555' ? '#aaaaaa' : '#ffffff' }}>
                            {format(item.start, 'HH:mm')} - {format(item.end, 'HH:mm')}
                          </Text>
                          {onDelete && (
                            <Pressable onPress={() => onDelete(item.id, item.type)}>
                              <Text className="text-theme-accent font-mono text-xs">[DEL]</Text>
                            </Pressable>
                          )}
                        </View>
                        
                        <Text className="font-mono text-sm" style={{ color: item.color === '#555555' ? '#aaaaaa' : '#ffffff' }}>
                          {item.type === 'todo' ? `[TODO] ${item.title.replace('[TODO] ', '')}` : item.title}
                        </Text>
                        
                        {item.type === 'event' && item.originalData.description && (
                          <Text className="text-theme-secondary font-mono text-xs mt-1" numberOfLines={2}>
                            {item.originalData.description}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
