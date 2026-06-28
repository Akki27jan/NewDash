import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Modal, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import TerminalButton from '@/components/TerminalButton';

interface Subject {
  id: string;
  subject_name: string;
}

interface Note {
  id: string;
  subject_id: string;
  note_name: string;
  note_link: string;
  note_type: string;
  created_at: string;
}

export default function NotesScreen() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Form State
  const [subjectId, setSubjectId] = useState('');
  const [noteName, setNoteName] = useState('');
  const [noteLink, setNoteLink] = useState('');
  const [noteType, setNoteType] = useState('');
  
  // Edit State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteName, setEditNoteName] = useState('');
  const [editNoteLink, setEditNoteLink] = useState('');
  const [editNoteType, setEditNoteType] = useState('');

  // Status/Modals
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      if (notes.length === 0 && subjects.length === 0) setLoading(true);
      const [subRes, noteRes] = await Promise.all([
        fetch(`${API_URL}/api/subjects/`, { credentials: 'include' }),
        fetch(`${API_URL}/api/notes/`, { credentials: 'include' })
      ]);
      if (!subRes.ok || !noteRes.ok) throw new Error('Failed to fetch data');
      const subData = await subRes.json();
      setSubjects(subData);
      setNotes(await noteRes.json());
      if (subData.length > 0 && !subjectId) setSubjectId(subData[0].id);
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddNote = async () => {
    setError(''); setSuccessMsg('');
    if (!noteName || !noteLink || !noteType || !subjectId) return setError('[ERROR] Missing fields');
    
    try {
      const res = await fetch(`${API_URL}/api/notes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject_id: subjectId, note_name: noteName, note_link: noteLink, note_type: noteType }),
      });
      if (!res.ok) throw new Error('Failed to add note');
      setNoteName(''); setNoteLink(''); setNoteType('');
      setSuccessMsg(`[SUCCESS] Note added`);
      fetchData();
    } catch (err: any) { setError(`[ERROR] ${err.message}`); }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/notes/${id}`, { method: 'DELETE', credentials: 'include' });
      fetchData();
    } catch (err) {}
  };

  const handleSaveEdit = async () => {
    setError(''); setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/notes/${editingNoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note_name: editNoteName, note_link: editNoteLink, note_type: editNoteType }),
      });
      if (!res.ok) throw new Error('Failed to update note');
      setEditingNoteId(null);
      fetchData();
    } catch (err: any) { setError(`[ERROR] ${err.message}`); }
  };

  const openLink = async (url: string) => {
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    const supported = await Linking.canOpenURL(formattedUrl);
    if (supported) {
      await Linking.openURL(formattedUrl);
    } else {
      setError(`[ERROR] Cannot open URL: ${formattedUrl}`);
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
                :~/notes# _
              </Text>
            </ScrollView>
          </View>
          <Text className="text-theme-secondary font-mono text-sm">
            Manage your course notes and resources.
          </Text>
        </View>

        {/* Add Note Form */}
        <View className="border border-theme-border p-4 bg-theme-bg mb-6">
          <View className="border-b border-theme-border pb-2 mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text className="text-theme-primary font-bold font-mono text-lg whitespace-nowrap">
                <Text className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'guest@newdash'}</Text>
                :~/notes/add# _
              </Text>
            </ScrollView>
          </View>

          {error ? <Text className="text-theme-accent font-mono mb-4 text-sm">{error}</Text> : null}
          {successMsg ? <Text className="text-theme-success font-mono mb-4 text-sm">{successMsg}</Text> : null}

          <View className="flex-col gap-4">
            <View className="flex-col gap-1">
              <Text className="text-theme-secondary font-mono text-sm">&gt; Subject:</Text>
              <Pressable 
                onPress={() => setIsSubjectModalOpen(true)}
                className="border-b border-theme-border py-2 flex-row justify-between"
              >
                <Text className="text-theme-primary font-mono">{subjects.find(s => s.id === subjectId)?.subject_name || '[ SELECT_SUBJECT ]'}</Text>
                <Text className="text-theme-muted font-mono">▼</Text>
              </Pressable>
            </View>

            <View className="flex-col gap-1">
              <Text className="text-theme-secondary font-mono text-sm">&gt; Note_Name:</Text>
              <TextInput
                value={noteName} onChangeText={setNoteName}
                className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent"
                placeholder="[ e.g. Lecture 1 ]" placeholderTextColor="#1e3a8a80"
              />
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1 flex-col gap-1">
                <Text className="text-theme-secondary font-mono text-sm">&gt; URL/Link:</Text>
                <TextInput
                  value={noteLink} onChangeText={setNoteLink}
                  className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent"
                  placeholder="[ https://... ]" placeholderTextColor="#1e3a8a80"
                  autoCapitalize="none"
                />
              </View>
              <View className="flex-1 flex-col gap-1">
                <Text className="text-theme-secondary font-mono text-sm">&gt; Note_Type:</Text>
                <TextInput
                  value={noteType} onChangeText={setNoteType}
                  className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent"
                  placeholder="[ e.g. Lecture ]" placeholderTextColor="#1e3a8a80"
                />
              </View>
            </View>

            <View className="self-start mt-2">
              <TerminalButton title="ADD_NOTE" variant="danger" onPress={handleAddNote} />
            </View>
          </View>
        </View>

        {/* Notes Directory */}
        <View className="border border-theme-border p-4 bg-theme-bg mb-8">
          <View className="border-b border-theme-border pb-2 mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text className="text-theme-primary font-bold font-mono text-lg whitespace-nowrap">
                <Text className="text-theme-accent">system</Text>:~/notes/directory# ls -R
              </Text>
            </ScrollView>
          </View>

          {loading ? (
            <Text className="text-theme-secondary font-mono">Scanning directories...</Text>
          ) : subjects.length === 0 ? (
            <Text className="text-theme-muted font-mono text-sm">System initialized. No subjects located.</Text>
          ) : (
            <View className="flex-col gap-6">
              {subjects.map(subject => {
                const subjNotes = notes.filter(n => n.subject_id === subject.id);
                
                return (
                  <View key={subject.id} className="flex-col">
                    <Text className="text-[#93c5fd] font-bold font-mono border-b border-theme-border/50 pb-1 mb-2">
                      ~/subjects/{subject.subject_name.toLowerCase().replace(/\s+/g, '_')}
                    </Text>
                    
                    {subjNotes.length === 0 ? (
                      <Text className="text-theme-muted font-mono text-xs pl-2">Directory empty.</Text>
                    ) : (
                      <View className="flex-col gap-3 pl-2">
                        {subjNotes.map((note, index) => {
                          const isEditing = editingNoteId === note.id;
                          return (
                            <View key={note.id} className="border border-theme-border/50 bg-theme-border-bg p-3">
                              {isEditing ? (
                                <View className="flex-col gap-2">
                                  <Text className="text-theme-muted font-mono text-xs">EDITING NOTE</Text>
                                  <TextInput value={editNoteName} onChangeText={setEditNoteName} placeholder="Name" className="border-b border-theme-border text-theme-primary py-1 font-mono focus:border-theme-accent" />
                                  <View className="flex-row gap-2">
                                    <TextInput value={editNoteLink} onChangeText={setEditNoteLink} placeholder="URL" className="flex-1 border-b border-theme-border text-theme-primary py-1 font-mono focus:border-theme-accent" autoCapitalize="none" />
                                    <TextInput value={editNoteType} onChangeText={setEditNoteType} placeholder="Type" className="flex-1 border-b border-theme-border text-theme-primary py-1 font-mono focus:border-theme-accent" />
                                  </View>
                                  <View className="flex-row gap-4 mt-2">
                                    <Pressable onPress={handleSaveEdit}><Text className="text-theme-success font-mono">[SAVE]</Text></Pressable>
                                    <Pressable onPress={() => setEditingNoteId(null)}><Text className="text-theme-primary font-mono">[CANCEL]</Text></Pressable>
                                  </View>
                                </View>
                              ) : (
                                <View className="flex-col gap-1">
                                  <View className="flex-row items-center gap-2">
                                    <Text className="text-theme-muted font-mono text-xs">[{String(index + 1).padStart(2, '0')}]</Text>
                                    <Text className="text-theme-primary font-mono font-bold flex-1">{note.note_name}</Text>
                                  </View>
                                  
                                  <View className="flex-row flex-wrap items-center mt-1">
                                    <Text className="text-theme-warning font-mono text-xs mr-4">{note.note_type}</Text>
                                    <Text className="text-theme-secondary font-mono text-xs flex-1" numberOfLines={1} ellipsizeMode="tail">{note.note_link}</Text>
                                  </View>

                                  <View className="flex-row gap-4 mt-3 pt-2 border-t border-theme-border/30">
                                    <Pressable onPress={() => openLink(note.note_link)} className="border border-theme-success-border bg-theme-success-bg/20 px-2 py-1">
                                      <Text className="text-theme-success font-mono text-xs font-bold">[OPEN_LINK]</Text>
                                    </Pressable>
                                    <Pressable onPress={() => { setEditingNoteId(note.id); setEditNoteName(note.note_name); setEditNoteLink(note.note_link); setEditNoteType(note.note_type); }} className="justify-center">
                                      <Text className="text-theme-primary font-mono text-sm">[EDIT]</Text>
                                    </Pressable>
                                    <Pressable onPress={() => handleDeleteNote(note.id)} className="justify-center">
                                      <Text className="text-theme-accent font-mono text-sm">[DEL]</Text>
                                    </Pressable>
                                  </View>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Subject Selector Modal */}
      <Modal visible={isSubjectModalOpen} transparent={true} animationType="fade" onRequestClose={() => setIsSubjectModalOpen(false)}>
        <View className="flex-1 justify-center items-center bg-[#000000cc] p-4">
          <View className="w-full max-w-sm border border-theme-border bg-theme-bg shadow-lg shadow-theme-primary/20">
            <View className="bg-theme-border px-2 py-1 flex-row justify-between items-center">
              <Text className="text-black font-mono text-xs font-bold">SELECT_SUBJECT</Text>
            </View>
            <ScrollView className="max-h-64 p-2">
              {subjects.map(s => (
                <Pressable 
                  key={s.id} 
                  onPress={() => { setSubjectId(s.id); setIsSubjectModalOpen(false); }}
                  className="py-3 px-2 border-b border-theme-border/30 active:bg-theme-border/20"
                >
                  <Text className="text-theme-primary font-mono text-sm">&gt; {s.subject_name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => setIsSubjectModalOpen(false)} className="bg-theme-border-bg p-2 border-t border-theme-border items-center">
              <Text className="text-theme-secondary font-mono text-xs">^X Exit [CANCEL]</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
