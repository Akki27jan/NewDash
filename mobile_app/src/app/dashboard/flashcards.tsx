import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, Modal } from 'react-native';
import TerminalButton from '@/components/TerminalButton';
import { API_URL } from '@/lib/api';

interface Subject {
  id: string;
  subject_name: string;
}

interface Flashcard {
  id: string;
  subject_id: string;
  subject_name: string;
  title: string;
  topic: string;
  front: string;
  back: string;
  retention_score: number;
}

export default function FlashcardsScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Mode: 'list', 'create', 'reviewConfig', 'reviewing'
  const [mode, setMode] = useState<'list' | 'create' | 'reviewConfig' | 'reviewing'>('list');

  // Create Form State
  const [subjectId, setSubjectId] = useState('');
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkCards, setBulkCards] = useState([{ id: 'b1', title: '', front: '', back: '' }]);

  // Review State
  const [reviewSubjectId, setReviewSubjectId] = useState('');
  const [reviewTopic, setReviewTopic] = useState('');
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewScore, setReviewScore] = useState(0);
  const [isReviewComplete, setIsReviewComplete] = useState(false);
  const [wrongCards, setWrongCards] = useState<Flashcard[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subjRes, flashRes] = await Promise.all([
        fetch(`${API_URL}/api/subjects/`, { credentials: 'include' }),
        fetch(`${API_URL}/api/flashcards/`, { credentials: 'include' })
      ]);
      
      if (subjRes.ok) setSubjects(await subjRes.json());
      if (flashRes.ok) setFlashcards(await flashRes.json());
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (msg: string, isError = false) => {
    if (isError) setError(msg);
    else setSuccessMsg(msg);
    setTimeout(() => { setError(''); setSuccessMsg(''); }, 3000);
  };

  const handleCreate = async () => {
    if (!subjectId || !topic) {
      showMsg('[ERROR] Subject and Topic required', true);
      return;
    }

    try {
      if (isBulkMode) {
        const validCards = bulkCards.filter(c => c.title && c.front && c.back);
        if (!validCards.length) {
          showMsg('[ERROR] No valid cards to upload', true);
          return;
        }
        const payload = validCards.map(c => ({
          subject_id: subjectId,
          topic,
          title: c.title,
          front: c.front,
          back: c.back
        }));
        const res = await fetch(`${API_URL}/api/flashcards/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to bulk upload');
        showMsg(`[SUCCESS] ${validCards.length} cards added`);
        setBulkCards([{ id: `b${Date.now()}`, title: '', front: '', back: '' }]);
      } else {
        if (!title || !front || !back) {
          showMsg('[ERROR] Missing fields', true);
          return;
        }
        const res = await fetch(`${API_URL}/api/flashcards/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ subject_id: subjectId, title, topic, front, back })
        });
        if (!res.ok) throw new Error('Failed to create');
        showMsg('[SUCCESS] Card created');
        setTitle(''); setFront(''); setBack('');
      }
      fetchData();
      setMode('list');
    } catch (err: any) {
      showMsg(err.message || 'Error creating cards', true);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/flashcards/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        fetchData();
        showMsg('[SUCCESS] Deleted');
      }
    } catch (e) {
      showMsg('[ERROR] Delete failed', true);
    }
  };

  const startReview = () => {
    if (!reviewSubjectId) {
      showMsg('[ERROR] Select a subject', true);
      return;
    }
    let cards = flashcards.filter(c => c.subject_id === reviewSubjectId);
    if (reviewTopic) {
      cards = cards.filter(c => c.topic.toLowerCase() === reviewTopic.toLowerCase());
    }
    if (cards.length === 0) {
      showMsg('[ERROR] No cards found for criteria', true);
      return;
    }
    // Shuffle
    const shuffled = [...cards].sort(() => 0.5 - Math.random());
    setReviewCards(shuffled);
    setReviewIndex(0);
    setReviewScore(0);
    setWrongCards([]);
    setIsFlipped(false);
    setIsReviewComplete(false);
    setMode('reviewing');
  };

  const handleReviewAnswer = async (correct: boolean) => {
    const currentCard = reviewCards[reviewIndex];
    if (correct) {
      setReviewScore(prev => prev + 1);
    } else {
      setWrongCards(prev => [...prev, currentCard]);
    }

    try {
      await fetch(`${API_URL}/api/flashcards/${currentCard.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ correct })
      });
    } catch (e) {
      console.log('Failed to update stats');
    }

    if (reviewIndex + 1 < reviewCards.length) {
      setReviewIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setIsReviewComplete(true);
    }
  };

  const renderSubjectChips = (selectedId: string, onSelect: (id: string) => void) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      {subjects.map(s => (
        <Pressable 
          key={s.id} 
          onPress={() => onSelect(s.id)}
          className={`mr-2 px-3 py-2 border ${selectedId === s.id ? 'border-theme-accent bg-theme-accent/20' : 'border-theme-border'}`}
        >
          <Text className={`font-mono ${selectedId === s.id ? 'text-theme-accent' : 'text-theme-secondary'}`}>
            {s.subject_name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-theme-bg justify-center items-center p-4">
        <ActivityIndicator size="large" color="#00ff00" />
        <Text className="text-theme-primary font-mono mt-4">INITIALIZING_FLASHCARDS...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-theme-bg p-4">
      <View className="flex-row justify-between items-center mb-4 border-b border-theme-border pb-2">
        <Text className="text-theme-primary font-bold text-xl font-mono">
          ~/flashcards
        </Text>
        {mode === 'list' && (
          <View className="flex-row gap-2">
            <TerminalButton title="+ NEW" onPress={() => setMode('create')} variant="primary" />
            <TerminalButton title="REVIEW" onPress={() => setMode('reviewConfig')} variant="success" />
          </View>
        )}
        {mode !== 'list' && mode !== 'reviewing' && (
          <TerminalButton title="BACK" onPress={() => setMode('list')} />
        )}
      </View>

      {error ? <Text className="text-theme-accent font-mono mb-2 bg-theme-accent/10 p-2 border border-theme-accent">{error}</Text> : null}
      {successMsg ? <Text className="text-theme-success font-mono mb-2 bg-theme-success/10 p-2 border border-theme-success">{successMsg}</Text> : null}

      {mode === 'list' && (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {subjects.length === 0 ? (
            <Text className="text-theme-muted font-mono">No subjects available.</Text>
          ) : (
            subjects.map(sub => {
              const subCards = flashcards.filter(c => c.subject_id === sub.id);
              if (!subCards.length) return null;
              return (
                <View key={sub.id} className="mb-6 border border-theme-border p-3">
                  <Text className="text-theme-secondary font-bold font-mono border-b border-theme-border pb-1 mb-2">
                    &gt; {sub.subject_name}
                  </Text>
                  {subCards.map((c, i) => (
                    <View key={c.id} className="flex-row justify-between items-start py-2 border-b border-theme-border/30">
                      <View className="flex-1">
                        <Text className="text-theme-primary font-mono text-sm">[{c.topic}] {c.title}</Text>
                        <Text className="text-theme-muted font-mono text-xs mt-1" numberOfLines={1}>{c.front}</Text>
                      </View>
                      <Pressable onPress={() => handleDelete(c.id)} className="p-2 ml-2">
                        <Text className="text-theme-accent font-mono font-bold">[X]</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {mode === 'create' && (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="flex-row gap-2 mb-4">
            <TerminalButton title="SINGLE" onPress={() => setIsBulkMode(false)} variant={!isBulkMode ? 'success' : 'default'} />
            <TerminalButton title="BULK" onPress={() => setIsBulkMode(true)} variant={isBulkMode ? 'success' : 'default'} />
          </View>

          <Text className="text-theme-secondary font-mono mb-2">&gt; Subject:</Text>
          {renderSubjectChips(subjectId, setSubjectId)}
          
          <Text className="text-theme-secondary font-mono mb-2">&gt; Topic (Optional):</Text>
          <TextInput
            value={topic}
            onChangeText={setTopic}
            className="border border-theme-border text-theme-primary font-mono p-3 mb-4"
            placeholder="[ e.g. Sorting ]"
            placeholderTextColor="#444"
          />

          {!isBulkMode ? (
            <View>
              <Text className="text-theme-secondary font-mono mb-2">&gt; Title:</Text>
              <TextInput value={title} onChangeText={setTitle} className="border border-theme-border text-theme-primary font-mono p-3 mb-4" />
              <Text className="text-theme-secondary font-mono mb-2">&gt; Front (Question):</Text>
              <TextInput value={front} onChangeText={setFront} multiline numberOfLines={3} className="border border-theme-border text-theme-primary font-mono p-3 mb-4" />
              <Text className="text-theme-secondary font-mono mb-2">&gt; Back (Answer):</Text>
              <TextInput value={back} onChangeText={setBack} multiline numberOfLines={3} className="border border-theme-border text-theme-primary font-mono p-3 mb-4" />
            </View>
          ) : (
            <View>
              {bulkCards.map((card, idx) => (
                <View key={card.id} className="border-l-2 border-theme-border pl-3 mb-6 relative">
                  <Text className="absolute -left-[3px] top-0 text-theme-muted font-mono text-xs bg-theme-bg">[{idx+1}]</Text>
                  
                  <View className="flex-row justify-between items-center mb-2 mt-1">
                     <Text className="text-theme-secondary font-mono">&gt; Title:</Text>
                     {bulkCards.length > 1 && (
                       <Pressable onPress={() => setBulkCards(bulkCards.filter(c => c.id !== card.id))}>
                         <Text className="text-theme-accent font-mono font-bold">[X]</Text>
                       </Pressable>
                     )}
                  </View>
                  <TextInput 
                    value={card.title} 
                    onChangeText={(t) => setBulkCards(bulkCards.map(c => c.id === card.id ? {...c, title: t} : c))} 
                    className="border border-theme-border text-theme-primary font-mono p-2 mb-3" 
                  />
                  
                  <Text className="text-theme-secondary font-mono mb-2 text-xs">&gt; Front:</Text>
                  <TextInput 
                    value={card.front} 
                    onChangeText={(t) => setBulkCards(bulkCards.map(c => c.id === card.id ? {...c, front: t} : c))} 
                    multiline className="border border-theme-border text-theme-primary font-mono p-2 mb-3 h-16" 
                  />
                  
                  <Text className="text-theme-secondary font-mono mb-2 text-xs">&gt; Back:</Text>
                  <TextInput 
                    value={card.back} 
                    onChangeText={(t) => setBulkCards(bulkCards.map(c => c.id === card.id ? {...c, back: t} : c))} 
                    multiline className="border border-theme-border text-theme-primary font-mono p-2 mb-3 h-16" 
                  />
                </View>
              ))}
              <View className="mb-4 items-start">
                <TerminalButton title="+ ADD_ROW" onPress={() => setBulkCards([...bulkCards, { id: `b${Date.now()}`, title: '', front: '', back: '' }])} variant="primary" />
              </View>
            </View>
          )}

          <TerminalButton title="SUBMIT_ALL" onPress={handleCreate} variant="danger" />
          <View className="h-20" />
        </ScrollView>
      )}

      {mode === 'reviewConfig' && (
        <View className="flex-1">
          <Text className="text-theme-primary font-bold font-mono text-lg mb-6 border-b border-theme-border pb-2">&gt; CONFIGURE_REVIEW</Text>
          <Text className="text-theme-secondary font-mono mb-2">&gt; Target Subject:</Text>
          {renderSubjectChips(reviewSubjectId, setReviewSubjectId)}
          
          <Text className="text-theme-secondary font-mono mb-2 mt-4">&gt; Target Topic (Leave blank for all):</Text>
          <TextInput
            value={reviewTopic}
            onChangeText={setReviewTopic}
            className="border border-theme-border text-theme-primary font-mono p-3 mb-6"
            placeholder="[ Filter by topic... ]"
            placeholderTextColor="#444"
          />

          <TerminalButton title="START_ENGINE" onPress={startReview} variant="success" />
        </View>
      )}

      {/* REVIEWING MODAL overlay */}
      <Modal visible={mode === 'reviewing'} animationType="slide" transparent={false}>
        <View className="flex-1 bg-theme-bg p-4 pt-12">
          {!isReviewComplete ? (
            <View className="flex-1">
              <View className="flex-row justify-between items-center border-b border-theme-border pb-2 mb-8">
                <Text className="text-theme-primary font-mono font-bold">
                  CARD [{reviewIndex + 1}/{reviewCards.length}]
                </Text>
                <TerminalButton title="ABORT" onPress={() => setMode('list')} variant="danger" />
              </View>

              <Pressable 
                onPress={() => setIsFlipped(!isFlipped)} 
                className="flex-1 border border-theme-border bg-theme-bg justify-center items-center p-6 mb-8 active:opacity-70"
              >
                <Text className="text-theme-secondary font-mono text-sm absolute top-4 left-4">
                  &gt; {isFlipped ? 'BACK (ANSWER)' : 'FRONT (QUESTION)'}
                </Text>
                <Text className="text-theme-primary font-mono text-xl text-center">
                  {isFlipped ? reviewCards[reviewIndex]?.back : reviewCards[reviewIndex]?.front}
                </Text>
                <Text className="text-theme-muted font-mono text-xs absolute bottom-4 text-center">
                  [ TAP_TO_FLIP ]
                </Text>
              </Pressable>

              {isFlipped && (
                <View className="flex-row gap-4 mb-8">
                  <View className="flex-1">
                    <TerminalButton title="WRONG" onPress={() => handleReviewAnswer(false)} variant="danger" />
                  </View>
                  <View className="flex-1">
                    <TerminalButton title="CORRECT" onPress={() => handleReviewAnswer(true)} variant="success" />
                  </View>
                </View>
              )}
            </View>
          ) : (
            <ScrollView className="flex-1">
              <Text className="text-theme-primary font-mono font-bold text-2xl text-center mt-12 mb-2">
                REVIEW_COMPLETE
              </Text>
              <Text className="text-theme-accent font-mono text-xl text-center mb-8">
                SCORE: {reviewScore}/{reviewCards.length} ({Math.round((reviewScore/reviewCards.length)*100)}%)
              </Text>

              {wrongCards.length > 0 && (
                <View className="mb-8 border border-theme-border p-4">
                  <Text className="text-theme-secondary font-mono font-bold border-b border-theme-border pb-2 mb-4">
                    &gt; REQUIRES_ATTENTION
                  </Text>
                  {wrongCards.map((c, i) => (
                    <View key={i} className="mb-4">
                      <Text className="text-theme-primary font-mono text-sm font-bold">Q: {c.front}</Text>
                      <Text className="text-theme-muted font-mono text-sm mt-1">A: {c.back}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TerminalButton title="RETURN_TO_DIRECTORY" onPress={() => setMode('list')} />
            </ScrollView>
          )}
        </View>
      </Modal>

    </View>
  );
}
