import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Alert } from 'react-native';
import { format, parseISO } from 'date-fns';
import { API_URL } from '@/lib/api';
import TerminalButton from '../TerminalButton';

interface ManageEventsModalProps {
  isOpen: boolean;
  onClose: (wasSaved: boolean) => void;
  onAddEvent: () => void;
  onAddExam: () => void;
}

export default function ManageEventsModal({ isOpen, onClose, onAddEvent, onAddExam }: ManageEventsModalProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [evRes, exRes] = await Promise.all([
        fetch(`${API_URL}/api/events/`, { credentials: 'include' }),
        fetch(`${API_URL}/api/exams/`, { credentials: 'include' })
      ]);
      const evs = evRes.ok ? await evRes.json() : [];
      const exs = exRes.ok ? await exRes.json() : [];

      setEvents(evs.sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
      setExams(exs.sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchItems();
  }, [isOpen]);

  const handleDeleteEvent = async (id: string) => {
    Alert.alert("Delete Event", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await fetch(`${API_URL}/api/events/${id}`, { method: 'DELETE', credentials: 'include' });
        fetchItems();
      }}
    ]);
  };

  const handleDeleteExamPeriod = async (id: string) => {
    Alert.alert("Delete Exam Period", "This deletes ALL associated subjects. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await fetch(`${API_URL}/api/exams/${id}`, { method: 'DELETE', credentials: 'include' });
        fetchItems();
      }}
    ]);
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent={true} animationType="fade" onRequestClose={() => onClose(false)}>
      <View className="flex-1 justify-center items-center bg-[#000000cc] p-4">
        <View className="w-full max-w-sm border border-theme-border bg-theme-bg shadow-lg flex-1 max-h-[85vh]">
          <View className="bg-theme-border/20 border-b border-theme-border p-2 flex-row justify-between items-center">
            <Text className="text-theme-primary font-bold font-mono text-sm">&gt; MANAGE_EVENTS</Text>
            <Pressable onPress={() => onClose(false)} className="p-1"><Text className="text-theme-secondary font-mono text-sm">[X]</Text></Pressable>
          </View>

          <View className="flex-row p-2 border-b border-theme-border/30 justify-around">
            <TerminalButton title="+ EVENT" variant="default" onPress={onAddEvent} />
            <TerminalButton title="+ EXAM" variant="default" onPress={onAddExam} />
          </View>

          <ScrollView className="p-4">
            {loading ? <Text className="text-theme-secondary font-mono text-sm text-center">Loading...</Text> : (
              <View className="flex-col gap-6">
                
                <View className="flex-col gap-2">
                  <Text className="text-theme-primary font-bold font-mono text-sm border-b border-theme-border pb-1">EVENTS</Text>
                  {events.length === 0 ? <Text className="text-theme-muted font-mono text-xs">No upcoming events.</Text> : (
                    events.map(ev => (
                      <View key={ev.id} className="border border-theme-border/50 bg-theme-border-bg p-2">
                        <View className="flex-row justify-between items-start">
                          <Text className="text-theme-primary font-bold font-mono text-sm flex-1">{ev.title}</Text>
                          <Pressable onPress={() => handleDeleteEvent(ev.id)}><Text className="text-theme-accent font-mono text-xs">[DEL]</Text></Pressable>
                        </View>
                        <Text className="text-theme-secondary font-mono text-xs mt-1">
                          {format(parseISO(ev.start_time), 'MMM do, yyyy HH:mm')}
                        </Text>
                      </View>
                    ))
                  )}
                </View>

                <View className="flex-col gap-2 pb-6">
                  <Text className="text-theme-primary font-bold font-mono text-sm border-b border-theme-border pb-1">EXAM PERIODS</Text>
                  {exams.length === 0 ? <Text className="text-theme-muted font-mono text-xs">No upcoming exams.</Text> : (
                    exams.map(ex => (
                      <View key={ex.id} className="border border-theme-border/50 bg-theme-border-bg p-2">
                        <View className="flex-row justify-between items-start">
                          <Text className="text-theme-primary font-bold font-mono text-sm flex-1">{ex.title}</Text>
                          <Pressable onPress={() => handleDeleteExamPeriod(ex.id)}><Text className="text-theme-accent font-mono text-xs">[DEL]</Text></Pressable>
                        </View>
                        <Text className="text-theme-secondary font-mono text-xs mt-1 mb-2">
                          {format(parseISO(ex.start_date), 'MMM do')} - {format(parseISO(ex.end_date), 'MMM do, yyyy')}
                        </Text>
                        
                        <View className="pl-2 border-l border-theme-border/50 mt-1">
                          {ex.exams.map((paper: any) => (
                            <Text key={paper.id} className="text-theme-muted font-mono text-xs">
                              - {paper.subject} ({format(parseISO(paper.exam_time), 'HH:mm')})
                            </Text>
                          ))}
                        </View>
                      </View>
                    ))
                  )}
                </View>

              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
