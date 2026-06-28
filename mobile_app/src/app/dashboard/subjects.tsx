import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import TerminalButton from '@/components/TerminalButton';

interface Subject {
  id: string;
  subject_name: string;
  credits: number;
  description?: string;
  student_id: string;
}

export default function SubjectsScreen() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [credits, setCredits] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editCredits, setEditCredits] = useState('');

  const [descModalSubject, setDescModalSubject] = useState<Subject | null>(null);
  const [modalDescription, setModalDescription] = useState('');

  const fetchSubjects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/subjects/`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch subjects');
      const data = await res.json();
      setSubjects(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAddSubject = async () => {
    setError('');
    setSuccessMsg('');
    if (!subjectName || !credits) {
      setError('[ERROR] Missing fields');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/subjects/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject_name: subjectName, credits: parseFloat(credits) }),
      });
      if (!res.ok) throw new Error('Failed to add subject');
      setSubjectName('');
      setCredits('');
      setSuccessMsg(`[SUCCESS] Subject added successfully`);
      fetchSubjects();
    } catch (err: any) {
      setError(`[ERROR] ${err.message}`);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/subjects/${subjectId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete subject');
      setSuccessMsg(`[SUCCESS] Subject deleted successfully`);
      fetchSubjects();
    } catch (err: any) {
      setError(`[ERROR] ${err.message}`);
    }
  };

  const handleEditClick = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setEditSubjectName(subject.subject_name);
    setEditCredits(subject.credits.toString());
  };

  const handleSaveEdit = async () => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/subjects/${editingSubjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject_name: editSubjectName, credits: parseFloat(editCredits) }),
      });
      if (!res.ok) throw new Error('Failed to update subject');
      setSuccessMsg(`[SUCCESS] Subject updated successfully`);
      setEditingSubjectId(null);
      fetchSubjects();
    } catch (err: any) {
      setError(`[ERROR] ${err.message}`);
    }
  };

  const handleOpenDescModal = (subject: Subject) => {
    setDescModalSubject(subject);
    setModalDescription(subject.description || '');
  };

  const handleSaveDescription = async () => {
    if (!descModalSubject) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/subjects/${descModalSubject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ description: modalDescription }),
      });
      if (!res.ok) throw new Error('Failed to update description');
      setSuccessMsg(`[SUCCESS] Description updated successfully`);
      setDescModalSubject(null);
      fetchSubjects();
    } catch (err: any) {
      setError(`[ERROR] ${err.message}`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-theme-bg" edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Page Title */}
        <View className="border border-theme-border p-4 bg-theme-bg mb-6">
          <View className="border-b border-theme-border pb-2 mb-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text className="text-theme-primary font-bold text-lg font-mono whitespace-nowrap">
                <Text className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</Text>
                :~/subjects# _
              </Text>
            </ScrollView>
          </View>
          <Text className="text-theme-secondary font-mono text-sm">
            Manage your enrolled subjects here.
          </Text>
        </View>

        {/* Add Subject Form */}
        <View className="border border-theme-border p-4 bg-theme-bg mb-6">
          <View className="border-b border-theme-border pb-2 mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text className="text-theme-primary font-bold font-mono text-lg whitespace-nowrap">
                <Text className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'guest@newdash'}</Text>
                :~/subjects/add# _
              </Text>
            </ScrollView>
          </View>

          {error ? <Text className="text-theme-accent font-mono mb-4 text-sm">{error}</Text> : null}
          {successMsg ? <Text className="text-theme-success font-mono mb-4 text-sm">{successMsg}</Text> : null}

          <View className="flex-col gap-4">
            <View className="flex-col gap-1">
              <Text className="text-theme-secondary font-mono text-sm">&gt; Sub_Name:</Text>
              <TextInput
                value={subjectName}
                onChangeText={setSubjectName}
                className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent"
                placeholder="[ Enter Subject Name ]"
                placeholderTextColor="#1e3a8a80"
              />
            </View>
            <View className="flex-col gap-1">
              <Text className="text-theme-secondary font-mono text-sm">&gt; Credits:</Text>
              <TextInput
                value={credits}
                onChangeText={setCredits}
                keyboardType="numeric"
                className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent"
                placeholder="[ Enter Credits ]"
                placeholderTextColor="#1e3a8a80"
              />
            </View>
            <View className="self-start mt-2">
              <TerminalButton title="ADD_SUBJECT" variant="danger" onPress={handleAddSubject} />
            </View>
          </View>
        </View>

        {/* Subjects List (Stacked Cards) */}
        <View className="border border-theme-border p-4 bg-theme-bg mb-8">
          <View className="border-b border-theme-border pb-2 mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text className="text-theme-primary font-bold font-mono text-lg whitespace-nowrap">
                <Text className="text-theme-accent">system</Text>:~/subjects/list# ls -la
              </Text>
            </ScrollView>
          </View>

          {loading ? (
            <Text className="text-theme-secondary font-mono">Loading subjects...</Text>
          ) : subjects.length === 0 ? (
            <Text className="text-theme-muted font-mono text-sm">No subjects found.</Text>
          ) : (
            <View className="flex-col gap-4">
              {subjects.map((subject, index) => (
                <View key={subject.id} className="border border-theme-border/50 p-3 bg-theme-border-bg">
                  {editingSubjectId === subject.id ? (
                    <View className="flex-col gap-2">
                      <Text className="text-theme-muted font-mono text-xs">[{String(index + 1).padStart(2, '0')}] EDITING</Text>
                      <TextInput
                        value={editSubjectName}
                        onChangeText={setEditSubjectName}
                        className="bg-theme-bg border border-theme-border text-theme-primary p-2 font-mono focus:border-theme-accent"
                      />
                      <TextInput
                        value={editCredits}
                        onChangeText={setEditCredits}
                        keyboardType="numeric"
                        className="bg-theme-bg border border-theme-border text-theme-primary p-2 font-mono focus:border-theme-accent"
                      />
                      <View className="flex-row gap-4 mt-2">
                        <Pressable onPress={handleSaveEdit}>
                          <Text className="text-theme-success font-mono">[SAVE]</Text>
                        </Pressable>
                        <Pressable onPress={() => setEditingSubjectId(null)}>
                          <Text className="text-theme-primary font-mono">[CANCEL]</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-col gap-1">
                      <Text className="text-theme-muted font-mono text-xs">[{String(index + 1).padStart(2, '0')}]</Text>
                      <Text className="text-theme-primary font-mono font-bold text-lg">{subject.subject_name}</Text>
                      <Text className="text-theme-secondary font-mono text-sm">Credits: {subject.credits}</Text>
                      
                      <View className="flex-row gap-4 mt-3 pt-2 border-t border-theme-border/30">
                        <Pressable onPress={() => handleEditClick(subject)}>
                          <Text className="text-theme-primary font-mono">[EDIT]</Text>
                        </Pressable>
                        <Pressable onPress={() => handleOpenDescModal(subject)}>
                          <Text className="text-theme-warning font-mono">[DESC]</Text>
                        </Pressable>
                        <Pressable onPress={() => handleDeleteSubject(subject.id)}>
                          <Text className="text-theme-accent font-mono">[DEL]</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              ))}

              <View className="mt-4 pt-2 border-t border-theme-border">
                <Text className="text-theme-muted font-mono text-xs">Total records: {subjects.length}</Text>
                <Text className="text-theme-muted font-mono text-xs">Total credits: {subjects.reduce((acc, s) => acc + s.credits, 0)}</Text>
                <Text className="text-theme-muted font-mono text-xs">EOF</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Nano Modal */}
      <Modal
        visible={!!descModalSubject}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDescModalSubject(null)}
      >
        <View className="flex-1 justify-center items-center bg-[#000000cc] p-4">
          <View className="w-full max-w-sm border border-theme-border bg-theme-bg shadow-lg shadow-theme-primary/20">
            {/* Nano Header */}
            <View className="bg-theme-border px-2 py-1 flex-row justify-between items-center">
              <Text className="text-black font-mono text-xs font-bold">UW PICO 5.09</Text>
              <Text className="text-black font-mono text-xs font-bold">
                File: {descModalSubject?.subject_name}.txt
              </Text>
            </View>
            
            <View className="p-2 border-b border-theme-border/50">
              <Text className="text-theme-secondary font-mono text-xs">
                &gt; Credits: {descModalSubject?.credits}
              </Text>
            </View>

            {/* Text Area */}
            <View className="p-2 h-64">
              <TextInput
                value={modalDescription}
                onChangeText={setModalDescription}
                multiline
                className="flex-1 bg-transparent text-theme-secondary font-mono leading-relaxed"
                placeholder="[ Enter description here... ]"
                placeholderTextColor="#1e3a8a80"
                textAlignVertical="top"
              />
            </View>

            {/* Nano Footer/Shortcuts */}
            <View className="bg-theme-border-bg p-2 border-t border-theme-border flex-row flex-wrap gap-4">
              <Pressable onPress={handleSaveDescription} className="flex-row items-center">
                <View className="bg-theme-border px-1 mr-1">
                  <Text className="text-black font-mono text-xs font-bold">^O</Text>
                </View>
                <Text className="text-theme-secondary font-mono text-xs">Write Out [SAVE]</Text>
              </Pressable>

              <Pressable onPress={() => setDescModalSubject(null)} className="flex-row items-center">
                <View className="bg-theme-border px-1 mr-1">
                  <Text className="text-black font-mono text-xs font-bold">^X</Text>
                </View>
                <Text className="text-theme-secondary font-mono text-xs">Exit [CANCEL]</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
