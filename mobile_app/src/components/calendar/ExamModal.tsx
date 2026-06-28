import React, { useState } from 'react';
import { View, Text, TextInput, Modal, Pressable, ScrollView } from 'react-native';
import { format } from 'date-fns';
import { API_URL } from '@/lib/api';
import TerminalButton from '../TerminalButton';

interface ExamModalProps {
  isOpen: boolean;
  onClose: (wasSaved: boolean) => void;
  initialDate: Date | null;
}

interface ExamFormItem {
  id: number;
  subject: string;
  examDate: string;
  examTime: string;
  duration: string;
}

export default function ExamModal({ isOpen, onClose, initialDate }: ExamModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const colorCode = '#ef4444'; // Red for exams

  const [exams, setExams] = useState<ExamFormItem[]>([
    { id: Date.now(), subject: '', examDate: startDate, examTime: '09:00', duration: '120' }
  ]);

  if (!isOpen) return null;

  const handleAddRow = () => setExams([...exams, { id: Date.now(), subject: '', examDate: startDate, examTime: '09:00', duration: '120' }]);
  const handleRemoveRow = (id: number) => setExams(exams.filter(e => e.id !== id));
  const updateExamRow = (id: number, field: keyof ExamFormItem, value: string) => setExams(exams.map(e => e.id === id ? { ...e, [field]: value } : e));

  const handleSave = async () => {
    setError('');
    const invalidExams = exams.some(e => !e.subject || !e.examDate || !e.examTime);
    if (invalidExams) return setError('[ERROR] All exam rows must have subject, date, and time.');

    setLoading(true);
    try {
      const formattedExams = exams.map(e => ({
        subject: e.subject,
        exam_time: new Date(`${e.examDate}T${e.examTime}:00`).toISOString(),
        duration_minutes: parseInt(e.duration) || 60
      }));

      const res = await fetch(`${API_URL}/api/exams/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          start_date: new Date(`${startDate}T00:00:00`).toISOString(),
          end_date: new Date(`${endDate}T23:59:59`).toISOString(),
          color_code: colorCode,
          exams: formattedExams
        })
      });

      if (!res.ok) throw new Error('Failed to save exam timetable.');
      onClose(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setLoading(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent={true} animationType="fade" onRequestClose={() => onClose(false)}>
      <View className="flex-1 justify-center items-center bg-[#000000cc] p-4">
        <View className="w-full max-w-sm border border-theme-border bg-theme-bg shadow-lg">
          <View className="bg-theme-border/20 border-b border-theme-border p-2 flex-row justify-between items-center">
            <Text className="text-theme-primary font-bold font-mono text-sm">&gt; ADD_EXAM [Step {step}/2]</Text>
            <Pressable onPress={() => onClose(false)} className="p-1"><Text className="text-theme-secondary font-mono text-sm">[X]</Text></Pressable>
          </View>

          <ScrollView className="max-h-[80vh] p-4" keyboardShouldPersistTaps="handled">
            {error ? <Text className="text-theme-accent font-mono text-xs mb-4">{error}</Text> : null}

            {step === 1 ? (
              <View className="flex-col gap-4">
                <Text className="text-theme-secondary font-mono text-xs border-b border-theme-border/30 pb-2">
                  Define the overarching Exam Period.
                </Text>

                <View className="flex-col gap-1">
                  <Text className="text-theme-secondary font-mono text-xs">&gt; PERIOD_NAME:</Text>
                  <TextInput 
                    value={title} onChangeText={setTitle}
                    className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent"
                    placeholder="[ e.g. Finals ]" placeholderTextColor="#1e3a8a80"
                  />
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1 flex-col gap-1">
                    <Text className="text-theme-secondary font-mono text-xs">&gt; START_DATE:</Text>
                    <TextInput 
                      value={startDate} onChangeText={setStartDate}
                      className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent text-center"
                      placeholder="YYYY-MM-DD" placeholderTextColor="#1e3a8a80"
                    />
                  </View>
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1 flex-col gap-1">
                    <Text className="text-theme-secondary font-mono text-xs">&gt; END_DATE:</Text>
                    <TextInput 
                      value={endDate} onChangeText={setEndDate}
                      className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent text-center"
                      placeholder="YYYY-MM-DD" placeholderTextColor="#1e3a8a80"
                    />
                  </View>
                </View>

                <View className="flex-row gap-4 mt-6 justify-end">
                  <TerminalButton title="NEXT_STEP" variant="default" onPress={() => { if (!title) setError('Name required'); else { setError(''); setStep(2); } }} />
                </View>
              </View>
            ) : (
              <View className="flex-col gap-4">
                <View className="flex-row justify-between items-center border-b border-theme-border/30 pb-2">
                  <Text className="text-theme-secondary font-mono text-xs flex-1">Add subjects for {title}</Text>
                  <Pressable onPress={handleAddRow} className="border border-theme-success p-1">
                    <Text className="text-theme-success font-mono text-xs">+ ADD</Text>
                  </Pressable>
                </View>

                {exams.map((exam, index) => (
                  <View key={exam.id} className="border border-theme-border/50 bg-theme-border-bg p-2 flex-col gap-2 relative">
                    <View className="flex-row justify-between items-center border-b border-theme-border/30 pb-1">
                      <Text className="text-theme-muted font-mono text-xs">#{index + 1}</Text>
                      {exams.length > 1 && (
                        <Pressable onPress={() => handleRemoveRow(exam.id)}>
                          <Text className="text-theme-accent font-mono text-xs">[DEL]</Text>
                        </Pressable>
                      )}
                    </View>
                    
                    <TextInput 
                      value={exam.subject} onChangeText={v => updateExamRow(exam.id, 'subject', v)}
                      placeholder="Subject" placeholderTextColor="#1e3a8a80"
                      className="bg-transparent border-b border-theme-border text-theme-primary py-1 font-mono focus:border-theme-accent"
                    />
                    
                    <View className="flex-row gap-2">
                      <TextInput 
                        value={exam.examDate} onChangeText={v => updateExamRow(exam.id, 'examDate', v)}
                        placeholder="YYYY-MM-DD" placeholderTextColor="#1e3a8a80"
                        className="bg-transparent border-b border-theme-border text-theme-primary py-1 font-mono focus:border-theme-accent flex-1"
                      />
                      <TextInput 
                        value={exam.examTime} onChangeText={v => updateExamRow(exam.id, 'examTime', v)}
                        placeholder="HH:MM" placeholderTextColor="#1e3a8a80"
                        className="bg-transparent border-b border-theme-border text-theme-primary py-1 font-mono focus:border-theme-accent flex-1"
                      />
                    </View>
                  </View>
                ))}

                <View className="flex-row gap-4 mt-4 justify-between items-center">
                  <TerminalButton title="BACK" variant="default" onPress={() => setStep(1)} />
                  <TerminalButton title={loading ? "SAVING" : "SAVE"} variant="danger" onPress={handleSave} />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
