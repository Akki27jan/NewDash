"use client";

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
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
  created_at: string;
}

export default function FlashcardsPage() {
  // Data State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  // Create Form State
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit State
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  // Visibility toggle for table
  const [visibleBacks, setVisibleBacks] = useState<Set<string>>(new Set());

  // Review Mode State
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([]);
  const [reviewScore, setReviewScore] = useState(0);
  const [isReviewComplete, setIsReviewComplete] = useState(false);
  const [wrongCards, setWrongCards] = useState<Flashcard[]>([]);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewSubjectId, setReviewSubjectId] = useState('');
  const [reviewTopic, setReviewTopic] = useState('');

  const { user } = useAuth();

  const fetchData = async () => {
    try {
      if (flashcards.length === 0 && subjects.length === 0) {
        setLoading(true);
      }
      const [subRes, cardRes] = await Promise.all([
        fetch(`${API_URL}/api/subjects/`, { credentials: 'include' }),
        fetch(`${API_URL}/api/flashcards/`, { credentials: 'include' })
      ]);

      if (!subRes.ok) throw new Error('Failed to fetch subjects');
      if (!cardRes.ok) throw new Error('Failed to fetch flashcards');

      const subData = await subRes.json();
      const cardData = await cardRes.json();

      setSubjects(subData);
      setFlashcards(cardData);

      if (subData.length > 0 && !subjectId) {
        setSubjectId(subData[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!subjectId || !title || !topic || !front || !back) {
      setError('[ERROR] Missing fields');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/flashcards/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject_id: subjectId,
          title,
          topic,
          front,
          back
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to create flashcard');
      }

      setSuccessMsg('[SUCCESS] Flashcard added successfully');
      setTitle('');
      setTopic('');
      setFront('');
      setBack('');
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };

  const handleDeleteFlashcard = async (id: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/flashcards/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to delete flashcard');
      }
      setSuccessMsg('[SUCCESS] Flashcard deleted');
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };

  const handleEditClick = (card: Flashcard) => {
    setEditingCardId(card.id);
    setEditTitle(card.title);
    setEditTopic(card.topic);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
  };

  const handleSaveEdit = async (id: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/flashcards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editTitle,
          topic: editTopic,
          front: editFront,
          back: editBack
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to update flashcard');
      }
      setSuccessMsg('[SUCCESS] Flashcard updated');
      setEditingCardId(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };

  const toggleBackVisibility = (id: string) => {
    setVisibleBacks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const openReviewModal = () => {
    if (flashcards.length === 0) {
      setError('[ERROR] No flashcards available for review.');
      return;
    }
    if (subjects.length > 0) {
      setReviewSubjectId(subjects[0].id);
    }
    setReviewTopic('');
    setIsReviewModalOpen(true);
  };

  const startReviewSession = () => {
    let filtered = flashcards.filter(c => c.subject_id === reviewSubjectId);
    if (reviewTopic) {
      filtered = filtered.filter(c => c.topic === reviewTopic);
    }
    if (filtered.length === 0) {
      setError('[ERROR] No flashcards match this filter.');
      setIsReviewModalOpen(false);
      return;
    }
    
    // Shuffle using Fisher-Yates
    const shuffled = [...filtered];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setReviewCards(shuffled);
    setReviewIndex(0);
    setIsFlipped(false);
    setReviewScore(0);
    setIsReviewComplete(false);
    setWrongCards([]);
    localStorage.removeItem('review_wrong_cards');
    setIsReviewMode(true);
    setIsReviewModalOpen(false);
  };

  const goToNextOrFinish = () => {
    if (reviewIndex < reviewCards.length - 1) {
      setReviewIndex(reviewIndex + 1);
      setIsFlipped(false);
    } else {
      setIsReviewComplete(true);
    }
  };

  const handleMarkCorrect = () => {
    setReviewScore(prev => prev + 1);
    goToNextOrFinish();
  };

  const handleMarkWrong = () => {
    const card = reviewCards[reviewIndex];
    setWrongCards(prev => {
      const newWrong = [...prev, card];
      localStorage.setItem('review_wrong_cards', JSON.stringify(newWrong));
      return newWrong;
    });
    goToNextOrFinish();
  };

  const handleReviewWrong = () => {
    const saved = localStorage.getItem('review_wrong_cards');
    if (!saved) return;
    const cardsToReview: Flashcard[] = JSON.parse(saved);
    if (cardsToReview.length === 0) return;

    // Shuffle
    const shuffled = [...cardsToReview];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setReviewCards(shuffled);
    setReviewIndex(0);
    setIsFlipped(false);
    setReviewScore(0);
    setIsReviewComplete(false);
    setWrongCards([]);
    localStorage.removeItem('review_wrong_cards');
  };

  const handleGoBack = () => {
    setWrongCards([]);
    localStorage.removeItem('review_wrong_cards');
    setIsReviewMode(false);
  };

  return (
    <main className="flex-grow flex flex-col gap-8 w-full max-w-6xl mx-auto px-4 mt-8 mb-8">
      {/* Header */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h1 className="text-theme-primary font-bold text-2xl mb-4 border-b border-theme-border pb-2">
          <span className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</span>:~/flashcards# _
        </h1>
        <p className="text-theme-secondary mb-2">
          Manage your course flashcards. Add concepts below or enter Review Mode.
        </p>
      </div>

      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-theme-bg border border-theme-accent p-6 w-full max-w-md">
            <h2 className="text-theme-primary font-bold text-xl mb-4 border-b border-theme-border pb-2 flex items-center">
              <span className="text-theme-accent mr-2">&gt;</span> [CONFIGURE_REVIEW]
            </h2>
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col">
                <label className="text-theme-secondary mb-1">&gt; Select Subject:</label>
                <select
                  value={reviewSubjectId}
                  onChange={(e) => { setReviewSubjectId(e.target.value); setReviewTopic(''); }}
                  className="bg-transparent border border-theme-border text-theme-primary p-2 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id} className="bg-theme-bg text-theme-primary">{s.subject_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-theme-secondary mb-1">&gt; Select Topic:</label>
                <select
                  value={reviewTopic}
                  onChange={(e) => setReviewTopic(e.target.value)}
                  className="bg-transparent border border-theme-border text-theme-primary p-2 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent"
                >
                  <option value="" className="bg-theme-bg text-theme-primary">-- All Topics --</option>
                  {Array.from(new Set(flashcards.filter(c => c.subject_id === reviewSubjectId).map(c => c.topic))).map(t => (
                    <option key={t} value={t} className="bg-theme-bg text-theme-primary">{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-between">
              <Button label="CANCEL" color="red" onClick={() => setIsReviewModalOpen(false)} />
              <Button label="START" color="green" onClick={startReviewSession} />
            </div>
          </div>
        </div>
      )}

      {isReviewMode ? (
        // REVIEW MODE UI
        <div className="border border-theme-border p-6 bg-theme-bg flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-6 border-b border-theme-border pb-2">
            <h2 className="text-theme-primary font-bold text-xl flex items-center">
              <span className="text-theme-accent mr-2">&gt;</span> [REVIEW_MODE]
            </h2>
            <Button label="EXIT_REVIEW" color="red" onClick={handleGoBack} />
          </div>

          {isReviewComplete ? (
            <div className="flex flex-col items-center justify-center py-12">
              <h3 className="text-theme-primary text-2xl font-bold mb-4">REVIEW COMPLETE</h3>
              <p className="text-theme-secondary text-lg mb-8">Score: <span className="text-theme-accent text-2xl">{reviewScore}</span> / {reviewCards.length}</p>
              <div className="flex gap-4">
                <Button label="GO_BACK" color="blue" onClick={handleGoBack} />
                {wrongCards.length > 0 && (
                  <Button label="REVIEW_WRONG" color="red" onClick={handleReviewWrong} />
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="text-theme-muted mb-4">
                Card {reviewIndex + 1} of {reviewCards.length} | Subject: <span className="text-theme-accent">{reviewCards[reviewIndex]?.subject_name}</span> | Topic: {reviewCards[reviewIndex]?.topic}
              </div>

              <div 
                className={`w-full max-w-2xl min-h-[300px] border p-8 flex flex-col justify-center items-center transition-colors ${!isFlipped ? 'cursor-pointer border-theme-accent' : 'border-theme-border'}`}
                onClick={() => { if (!isFlipped) setIsFlipped(true); }}
              >
                {isFlipped ? (
                  <div className="text-theme-success whitespace-pre-wrap text-center text-lg">
                    <span className="text-sm text-theme-muted block mb-4 border-b border-theme-border pb-1">A:</span>
                    {reviewCards[reviewIndex]?.back}
                  </div>
                ) : (
                  <div className="text-theme-primary whitespace-pre-wrap text-center text-xl font-bold">
                    <span className="text-sm text-theme-muted block mb-4 border-b border-theme-border pb-1">Q:</span>
                    {reviewCards[reviewIndex]?.front}
                  </div>
                )}
              </div>
              
              {!isFlipped ? (
                <div className="text-theme-muted text-xs mt-4 mb-8 text-center">Click card to flip [?]</div>
              ) : (
                <div className="flex gap-4 mt-8 mb-4">
                  <Button label="MARK_WRONG" color="red" onClick={handleMarkWrong} />
                  <Button label="MARK_CORRECT" color="green" onClick={handleMarkCorrect} />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // NORMAL CRUD UI
        <>
          {/* CREATE FORM */}
          <div className="border border-theme-border p-6 bg-theme-bg">
            <h2 className="text-theme-primary font-bold text-xl mb-4 border-b border-theme-border pb-2 flex items-center">
              <span className="text-theme-accent mr-2">&gt;</span> [CREATE_FLASHCARD]
            </h2>

            {error && <div className="text-theme-accent text-sm mb-4 bg-theme-accent-bg p-2 border border-theme-accent">{error}</div>}
            {successMsg && <div className="text-theme-success text-sm mb-4 bg-theme-success-bg p-2 border border-theme-success">{successMsg}</div>}

            <form onSubmit={handleAddFlashcard} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center flex-1">
                  <label className="text-theme-secondary w-32">&gt; Subject:</label>
                  {subjects.length > 0 ? (
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="bg-transparent border border-theme-border text-theme-primary p-1 flex-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.id} className="bg-theme-bg text-theme-primary">{s.subject_name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-theme-accent text-sm">NO SUBJECTS AVAILABLE</span>
                  )}
                </div>

                <div className="flex items-center flex-1">
                  <label className="text-theme-secondary w-32">&gt; Topic:</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="bg-transparent border border-theme-border text-theme-primary p-1 flex-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent placeholder-theme-border"
                    placeholder="[ e.g. Sorting Algorithms ]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center flex-1">
                  <label className="text-theme-secondary w-32">&gt; Title:</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-transparent border border-theme-border text-theme-primary p-1 flex-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent placeholder-theme-border"
                    placeholder="[ e.g. Quick Sort Avg Case ]"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mt-2">
                <div className="flex flex-col flex-1">
                  <label className="text-theme-secondary mb-1">&gt; Front (Question):</label>
                  <textarea
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    rows={3}
                    className="bg-transparent border border-theme-border text-theme-primary p-2 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent resize-y"
                    placeholder="[ Question text... ]"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <label className="text-theme-secondary mb-1">&gt; Back (Answer):</label>
                  <textarea
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    rows={3}
                    className="bg-transparent border border-theme-border text-theme-primary p-2 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent resize-y"
                    placeholder="[ Answer text... ]"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <Button label="SUBMIT" color="red" />
              </div>
            </form>
          </div>

          {/* FLASHCARDS DIRECTORY */}
          <div className="border border-theme-border p-6 bg-theme-bg flex-grow">
            <div className="w-full flex justify-between items-center mb-6 border-b border-theme-border pb-2">
              <h2 className="text-theme-primary font-bold text-xl flex items-center">
                <span className="text-theme-accent mr-2">&gt;</span> [FLASHCARDS_DIRECTORY]
              </h2>
              <Button label="ENTER_REVIEW_MODE" color="green" onClick={openReviewModal} />
            </div>

            {loading ? (
              <div className="text-theme-primary animate-pulse">Loading database...</div>
            ) : subjects.length === 0 ? (
              <div className="text-theme-muted text-sm">System initialized. No subjects located.</div>
            ) : flashcards.length === 0 ? (
              <div className="text-theme-muted text-sm">No flashcards found. Create one to begin.</div>
            ) : (
              <div className="flex flex-col gap-6">
                {subjects.map(subject => {
                  const subjCards = flashcards.filter(c => c.subject_id === subject.id);
                  if (subjCards.length === 0) return null;

                  return (
                    <div key={subject.id} className="border border-theme-border p-4">
                      <h3 className="text-theme-secondary font-bold text-lg mb-4 border-b border-theme-border pb-1">
                        ~/flashcards/{subject.subject_name.toLowerCase().replace(/\s+/g, '_')}
                      </h3>

                      <div className="overflow-x-auto ml-2 border-l border-theme-border pl-4">
                        <table className="w-full text-left border-collapse border-spacing-0">
                          <thead>
                            <tr className="text-theme-muted text-xs border-b border-theme-border">
                              <th className="py-2 pr-4 font-normal">S.NO.</th>
                              <th className="py-2 pr-4 font-normal">TOPIC</th>
                              <th className="py-2 pr-4 font-normal">TITLE & CONTENT</th>
                              <th className="py-2 pr-4 font-normal text-right">ACTION</th>
                            </tr>
                          </thead>
                          <tbody className="text-theme-primary">
                            {subjCards.map((card, index) => {
                              const isEditing = editingCardId === card.id;
                              const showBack = visibleBacks.has(card.id);

                              return (
                                <tr key={card.id} className="border-b border-theme-border transition-colors">
                                  <td className="py-4 pr-4 text-xs text-theme-muted align-top">[{String(index + 1).padStart(2, '0')}]</td>
                                  
                                  {isEditing ? (
                                    <td colSpan={2} className="py-2 pr-4">
                                      <div className="flex flex-col gap-2">
                                        <input type="text" value={editTopic} onChange={e => setEditTopic(e.target.value)} placeholder="Topic" className="bg-transparent border border-theme-border text-theme-primary p-1 text-sm" />
                                        <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" className="bg-transparent border border-theme-border text-theme-primary p-1 text-sm" />
                                        <textarea value={editFront} onChange={e => setEditFront(e.target.value)} placeholder="Front" rows={2} className="bg-transparent border border-theme-border text-theme-primary p-1 text-sm" />
                                        <textarea value={editBack} onChange={e => setEditBack(e.target.value)} placeholder="Back" rows={2} className="bg-transparent border border-theme-border text-theme-primary p-1 text-sm" />
                                      </div>
                                    </td>
                                  ) : (
                                    <>
                                      <td className="py-4 pr-4 text-xs text-theme-warning align-top max-w-[120px] truncate" title={card.topic}>{card.topic}</td>
                                      <td className="py-4 pr-4 text-sm align-top">
                                        <div className="font-bold text-theme-secondary mb-2">{card.title}</div>
                                        <div className="text-theme-primary whitespace-pre-wrap text-sm mb-2"><span className="text-theme-muted text-xs">Q: </span>{card.front}</div>
                                        {showBack && (
                                          <div className="text-theme-success whitespace-pre-wrap text-sm mt-2 border-t border-theme-border border-dashed pt-2">
                                            <span className="text-theme-muted text-xs">A: </span>{card.back}
                                          </div>
                                        )}
                                      </td>
                                    </>
                                  )}

                                  <td className="py-4 pr-4 text-right whitespace-nowrap align-top">
                                    {isEditing ? (
                                      <div className="flex flex-col gap-2 items-end">
                                        <button onClick={() => handleSaveEdit(card.id)} className="text-theme-success hover:text-theme-success-hover text-base focus:outline-none">[SAVE]</button>
                                        <button onClick={handleCancelEdit} className="text-theme-warning-hover hover:text-theme-warning text-base focus:outline-none">[CANCEL]</button>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-3 items-end">
                                        <button onClick={() => toggleBackVisibility(card.id)} className="text-theme-accent hover:text-theme-accent-hover focus:outline-none text-base">
                                          [{showBack ? 'HIDE_ANS' : 'SHOW_ANS'}]
                                        </button>
                                        <button onClick={() => handleEditClick(card)} className="text-theme-primary hover:text-theme-accent focus:outline-none text-base">
                                          [EDIT]
                                        </button>
                                        <button onClick={() => handleDeleteFlashcard(card.id)} className="text-theme-accent hover:text-theme-accent-hover focus:outline-none text-base">
                                          [DEL]
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
