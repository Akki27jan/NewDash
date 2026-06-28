import React, { useState } from 'react';
import { View, Text, TextInput, Modal, Pressable, ScrollView } from 'react-native';
import { format } from 'date-fns';
import { API_URL } from '@/lib/api';
import TerminalButton from '../TerminalButton';

interface EventModalProps {
  isOpen: boolean;
  onClose: (wasSaved: boolean) => void;
  initialDate: Date | null;
}

export default function EventModal({ isOpen, onClose, initialDate }: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(initialDate ? format(initialDate, "HH:mm") : '09:00');
  const [endTime, setEndTime] = useState(initialDate ? format(initialDate, "HH:mm") : '10:00');
  const [colorCode, setColorCode] = useState('#3b82f6');
  const [recurringWeeks, setRecurringWeeks] = useState('0');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Simple color picker choices
  const colors = [
    { label: 'BLUE', value: '#3b82f6' },
    { label: 'RED', value: '#ef4444' },
    { label: 'GREEN', value: '#10b981' },
    { label: 'PURPLE', value: '#a855f7' }
  ];

  if (!isOpen) return null;

  const handleSave = async () => {
    setError('');
    if (!title || !eventDate) {
      setError('[ERROR] Title and Date are required');
      return;
    }

    setLoading(true);
    try {
      const [startHour, startMin] = startTime.split(':');
      const startDateTime = new Date(eventDate);
      startDateTime.setHours(parseInt(startHour || '0'), parseInt(startMin || '0'), 0, 0);

      const [endHour, endMin] = endTime.split(':');
      const endDateTime = new Date(eventDate);
      endDateTime.setHours(parseInt(endHour || '0'), parseInt(endMin || '0'), 0, 0);

      const res = await fetch(`${API_URL}/api/events/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          is_all_day: false,
          color_code: colorCode,
          recurring_weeks: parseInt(recurringWeeks) || 0
        })
      });

      if (!res.ok) throw new Error('Failed to create event');
      
      onClose(true);
      // Reset form
      setTitle(''); setDescription('');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent={true} animationType="fade" onRequestClose={() => onClose(false)}>
      <View className="flex-1 justify-center items-center bg-[#000000cc] p-4">
        <View className="w-full max-w-sm border border-theme-border bg-theme-bg shadow-lg">
          {/* Header */}
          <View className="bg-theme-border/20 border-b border-theme-border p-2 flex-row justify-between items-center">
            <Text className="text-theme-primary font-bold font-mono text-sm">&gt; CREATE_EVENT</Text>
            <Pressable onPress={() => onClose(false)} className="p-1">
              <Text className="text-theme-secondary font-mono text-sm">[X]</Text>
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView className="max-h-[80vh] p-4" keyboardShouldPersistTaps="handled">
            {error ? <Text className="text-theme-accent font-mono text-xs mb-4">{error}</Text> : null}

            <View className="flex-col gap-4">
              <View className="flex-col gap-1">
                <Text className="text-theme-secondary font-mono text-xs">&gt; TITLE:</Text>
                <TextInput 
                  value={title} onChangeText={setTitle}
                  className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent"
                  placeholder="[ Event Title ]" placeholderTextColor="#1e3a8a80"
                />
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1 flex-col gap-1">
                  <Text className="text-theme-secondary font-mono text-xs">&gt; DATE (YYYY-MM-DD):</Text>
                  <TextInput 
                    value={eventDate} onChangeText={setEventDate}
                    className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent text-center"
                    placeholder="YYYY-MM-DD" placeholderTextColor="#1e3a8a80"
                  />
                </View>
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1 flex-col gap-1">
                  <Text className="text-theme-secondary font-mono text-xs">&gt; START (HH:MM):</Text>
                  <TextInput 
                    value={startTime} onChangeText={setStartTime}
                    className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent text-center"
                    placeholder="09:00" placeholderTextColor="#1e3a8a80"
                  />
                </View>
                <View className="flex-1 flex-col gap-1">
                  <Text className="text-theme-secondary font-mono text-xs">&gt; END (HH:MM):</Text>
                  <TextInput 
                    value={endTime} onChangeText={setEndTime}
                    className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent text-center"
                    placeholder="10:00" placeholderTextColor="#1e3a8a80"
                  />
                </View>
              </View>

              <View className="flex-col gap-1 mt-2">
                <Text className="text-theme-secondary font-mono text-xs">&gt; COLOR_TAG:</Text>
                <View className="flex-row gap-2 mt-1">
                  {colors.map(c => (
                    <Pressable 
                      key={c.value} 
                      onPress={() => setColorCode(c.value)}
                      className={`flex-1 items-center justify-center py-2 border ${colorCode === c.value ? 'border-theme-primary bg-theme-border-bg' : 'border-theme-border'}`}
                    >
                      <View style={{ backgroundColor: c.value, width: 12, height: 12, borderRadius: 6 }} />
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="flex-col gap-1 mt-2">
                <Text className="text-theme-secondary font-mono text-xs">&gt; RECURRING (WEEKS):</Text>
                <TextInput 
                  value={recurringWeeks} onChangeText={setRecurringWeeks} keyboardType="numeric"
                  className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent text-center"
                />
              </View>

              <View className="flex-col gap-1 mt-2">
                <Text className="text-theme-secondary font-mono text-xs">&gt; DESCRIPTION:</Text>
                <TextInput 
                  value={description} onChangeText={setDescription} multiline
                  className="bg-transparent border border-theme-border text-theme-primary p-2 font-mono min-h-[80px]"
                  textAlignVertical="top"
                />
              </View>

              <View className="flex-row gap-4 mt-6 justify-end">
                <TerminalButton title="CANCEL" variant="default" onPress={() => onClose(false)} />
                <TerminalButton title={loading ? "SAVING" : "SAVE_EVENT"} variant="danger" onPress={handleSave} />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
