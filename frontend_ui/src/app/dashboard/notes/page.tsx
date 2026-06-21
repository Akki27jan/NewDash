"use client";

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';

interface Subject {
  id: string;
  subject_name: string;
  credits: number;
}

interface Note {
  id: string;
  subject_id: string;
  note_name: string;
  note_link: string;
  note_type: string;
  created_at: string;
}

export default function NotesPage() {
  // State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Form State
  const [subjectId, setSubjectId] = useState('');
  const [noteName, setNoteName] = useState('');
  const [noteLink, setNoteLink] = useState('');
  const [noteType, setNoteType] = useState('');

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteName, setEditNoteName] = useState('');
  const [editNoteLink, setEditNoteLink] = useState('');
  const [editNoteType, setEditNoteType] = useState('');

  const { user } = useAuth();

  const fetchData = async () => {
    try {
      if (notes.length === 0 && subjects.length === 0) {
        setLoading(true);
      }

      const [subRes, noteRes] = await Promise.all([
        fetch(`${API_URL}/api/subjects/`, { credentials: 'include' }),
        fetch(`${API_URL}/api/notes/`, { credentials: 'include' })
      ]);

      if (!subRes.ok) throw new Error('Failed to fetch subjects');
      if (!noteRes.ok) throw new Error('Failed to fetch notes');

      const subData = await subRes.json();
      const noteData = await noteRes.json();

      setSubjects(subData);
      setNotes(noteData);

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

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!noteName || !noteLink || !noteType || !subjectId) {
      setError('[ERROR] Missing fields');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/notes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject_id: subjectId,
          note_name: noteName,
          note_link: noteLink,
          note_type: noteType
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to add note');
      }

      setSuccessMsg('[SUCCESS] Note added successfully');
      setNoteName('');
      setNoteLink('');
      setNoteType('');
      fetchData(); // Refresh data
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };

  const handleDeleteNote = async (id: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/notes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to delete note');
      }

      setSuccessMsg('[SUCCESS] Note deleted');
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };
  const handleEditClick = (note: Note) => {
    setEditingNoteId(note.id);
    setEditNoteName(note.note_name);
    setEditNoteLink(note.note_link);
    setEditNoteType(note.note_type);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
  };

  const handleSaveEdit = async (id: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          note_name: editNoteName,
          note_link: editNoteLink,
          note_type: editNoteType
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to update note');
      }
      setSuccessMsg('[SUCCESS] Note updated');
      setEditingNoteId(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };


  return (
    <main className="flex-grow flex flex-col gap-8 w-full max-w-5xl mx-auto px-4 mt-8 mb-8">
      {/* Page Title */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h1 className="text-theme-primary font-bold text-2xl mb-4 border-b border-theme-border pb-2">
          <span className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</span>:~/notes# _
        </h1>
        <p className="text-theme-secondary mb-2">
          Manage your course notes and resources. Upload links or references below.
        </p>
      </div>

      {/* ADD NOTE MODULE */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h2 className="text-theme-primary font-bold text-xl mb-4 border-b border-theme-border pb-2 flex items-center">
          <span className="text-theme-accent mr-2">&gt;</span> [ADD_NOTE]
        </h2>

        {error && <div className="text-theme-accent text-sm mb-4 bg-theme-accent-bg p-2 border border-theme-accent">{error}</div>}
        {successMsg && <div className="text-theme-success text-sm mb-4 bg-theme-success-bg p-2 border border-theme-success">{successMsg}</div>}

        <form onSubmit={handleAddNote} className="flex flex-col gap-4">
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
              <label className="text-theme-secondary w-32">&gt; Note Name:</label>
              <input
                type="text"
                value={noteName}
                onChange={(e) => setNoteName(e.target.value)}
                className="bg-transparent border border-theme-border text-theme-primary p-1 flex-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent placeholder-theme-border"
                placeholder="[ e.g. Lecture 1 ]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center flex-1">
              <label className="text-theme-secondary w-32">&gt; URL/Link:</label>
              <input
                type="text"
                value={noteLink}
                onChange={(e) => setNoteLink(e.target.value)}
                className="bg-transparent border border-theme-border text-theme-primary p-1 flex-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent placeholder-theme-border"
                placeholder="[ https://... ]"
              />
            </div>

            <div className="flex items-center flex-1">
              <label className="text-theme-secondary w-32">&gt; Note Type:</label>
              <input
                type="text"
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                className="bg-transparent border border-theme-border text-theme-primary p-1 flex-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent placeholder-theme-border"
                placeholder="[ e.g. Lecture, Revision ]"
              />
            </div>
          </div>

          <div className="flex justify-end mt-2">
            <Button label="SUBMIT" color="red" />
          </div>
        </form>
      </div>

      {/* NOTES DIRECTORY MODULE */}
      <div className="border border-theme-border p-6 bg-theme-bg flex-grow">
        <h2 className="text-theme-primary font-bold text-xl mb-6 border-b border-theme-border pb-2 flex items-center">
          <span className="text-theme-accent mr-2">&gt;</span> [NOTES_DIRECTORY]
        </h2>

        {loading ? (
          <div className="text-theme-primary animate-pulse">Loading directory contents...</div>
        ) : subjects.length === 0 ? (
          <div className="text-theme-muted text-sm">System initialized. No subjects located.</div>
        ) : (
          <div className="flex flex-col gap-6">
            {subjects.map(subject => {
              const subjNotes = notes.filter(n => n.subject_id === subject.id);

              return (
                <div key={subject.id} className="border border-theme-border p-4">
                  <h3 className="text-theme-secondary font-bold text-lg mb-4 border-b border-theme-border pb-1">
                    ~/subjects/{subject.subject_name.toLowerCase().replace(/\s+/g, '_')}
                  </h3>

                  {subjNotes.length === 0 ? (
                    <div className="text-theme-muted text-xs pl-4 py-2">Directory empty.</div>
                  ) : (
                    <div className="overflow-x-auto ml-2 border-l border-theme-border pl-4">
                      <table className="w-full text-left border-collapse border-spacing-0">
                        <thead>
                          <tr className="text-theme-muted text-xs border-b border-theme-border">
                            <th className="py-2 pr-4 font-normal">S.NO.</th>
                            <th className="py-2 pr-4 font-normal">NOTE_NAME</th>
                            <th className="py-2 pr-4 font-normal">TYPE</th>
                            <th className="py-2 pr-4 font-normal">LINK</th>
                            <th className="py-2 pr-4 font-normal text-right">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="text-theme-primary">
                          {subjNotes.map((note, index) => {
                            const isEditing = editingNoteId === note.id;
                            return (
                              <tr key={note.id} className="border-b border-theme-border hover:bg-theme-border transition-colors">
                                <td className="py-2 pr-4 text-xs text-theme-muted">[{String(index + 1).padStart(2, '0')}]</td>
                                {isEditing ? (
                                  <>
                                    <td className="py-1 pr-4">
                                      <input type="text" value={editNoteName} onChange={(e) => setEditNoteName(e.target.value)} className="bg-transparent border border-theme-border text-theme-secondary p-1 w-full text-sm" />
                                    </td>
                                    <td className="py-1 pr-4">
                                      <input type="text" value={editNoteType} onChange={(e) => setEditNoteType(e.target.value)} className="bg-transparent border border-theme-border text-theme-secondary p-1 w-full text-xs" />
                                    </td>
                                    <td className="py-1 pr-4">
                                      <input type="text" value={editNoteLink} onChange={(e) => setEditNoteLink(e.target.value)} className="bg-transparent border border-theme-border text-theme-secondary p-1 w-full text-xs" />
                                    </td>
                                    <td className="py-1 pr-4 text-right whitespace-nowrap">
                                      <button onClick={() => handleSaveEdit(note.id)} className="text-theme-success hover:text-theme-success-hover px-1 text-xs focus:outline-none">[SAVE]</button>
                                      <button onClick={handleCancelEdit} className="text-theme-warning-hover hover:text-theme-warning px-1 text-xs focus:outline-none">[CANCEL]</button>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="py-2 pr-4 text-sm">{note.note_name}</td>
                                    <td className="py-2 pr-4 text-xs text-theme-warning">{note.note_type}</td>
                                    <td className="py-2 pr-4 text-sm">
                                      <a
                                        href={note.note_link.startsWith('http') ? note.note_link : `https://${note.note_link}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-theme-success hover:text-theme-success-hover focus:outline-none inline-block border border-theme-success-border hover:bg-theme-success-border/30 px-2 py-0.5"
                                      >
                                        [OPEN]
                                      </a>
                                    </td>
                                    <td className="py-2 pr-4 text-right whitespace-nowrap">
                                      <button onClick={() => handleEditClick(note)} className="text-theme-primary hover:bg-theme-border-bg px-2 py-1 focus:outline-none text-sm border border-transparent hover:border-theme-border mr-1">
                                        [EDIT]
                                      </button>
                                      <button onClick={() => handleDeleteNote(note.id)} className="text-theme-accent hover:bg-theme-accent-bg px-2 py-1 focus:outline-none text-sm border border-transparent hover:border-theme-accent-border">
                                        [DEL]
                                      </button>
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
