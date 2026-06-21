"use client";

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';

interface Subject {
  id: string;
  subject_name: string;
  credits: number;
  description?: string;
  student_id: string;
}

export default function SubjectsPage() {
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
      const res = await fetch(`${API_URL}/api/subjects/`, {
        credentials: 'include',
      });
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

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!subjectName || !credits) {
      setError('[ERROR] Missing fields');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/subjects/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subject_name: subjectName,
          credits: parseFloat(credits),
        }),
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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete subject');
      }

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
        body: JSON.stringify({
          subject_name: editSubjectName,
          credits: parseFloat(editCredits),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update subject');
      }

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

  const handleCloseDescModal = () => {
    setDescModalSubject(null);
    setModalDescription('');
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
        body: JSON.stringify({
          description: modalDescription,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update description');
      }
      
      setSuccessMsg(`[SUCCESS] Description updated successfully`);
      handleCloseDescModal();
      fetchSubjects();
    } catch (err: any) {
      setError(`[ERROR] ${err.message}`);
    }
  };

  return (
    <main className="flex-grow flex flex-col gap-8 mt-8 max-w-4xl mx-auto w-full px-4 mb-8">

      {/* Page Title */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h1 className="text-theme-primary font-bold text-2xl mb-4 border-b border-theme-border pb-2">
          <span className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</span>:~/subjects# _
        </h1>
        <p className="text-theme-secondary mb-2">
          Manage your enrolled subjects here. Use the interface below to add new entries.
        </p>
      </div>

      {/* Add Subject Form */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h2 className="text-theme-primary font-bold mb-4 border-b border-theme-border pb-2">
          <span className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'guest@newdash'}</span>:~/subjects/add# _
        </h2>

        {error && <div className="text-theme-accent mb-4">{error}</div>}
        {successMsg && <div className="text-theme-success mb-4">{successMsg}</div>}

        <form onSubmit={handleAddSubject} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-theme-secondary w-32">&gt; Sub_Name:</label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="bg-transparent border border-theme-border text-theme-primary p-1 flex-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors placeholder-theme-border"
              placeholder="[ Enter Subject Name ]"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-theme-secondary w-32">&gt; Credits:</label>
            <input
              type="number"
              step="any"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              className="bg-transparent border border-theme-border text-theme-primary p-1 flex-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors placeholder-theme-border"
              placeholder="[ Enter Credits ]"
            />
          </div>
          <div className="mt-4">
            <Button type="submit" label="ADD_SUBJECT" color="red" />
          </div>
        </form>
      </div>

      {/* Subjects List */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h2 className="text-theme-primary font-bold mb-4 border-b border-theme-border pb-2">
          <span className="text-theme-accent">system</span>:~/subjects/list# ls -la
        </h2>

        {loading ? (
          <div className="text-theme-secondary animate-pulse">Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="text-theme-muted">No subjects found.</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="md:hidden text-theme-muted text-xs animate-pulse mb-2">[ swipe left/right to view details ]</div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-theme-secondary border-b border-theme-border whitespace-nowrap">
                  <th className="py-2 pr-4 font-normal">S.NO</th>
                  <th className="py-2 pr-4 font-normal">NAME</th>
                  <th className="py-2 pr-4 font-normal text-right">CREDITS</th>
                  <th className="py-2 pr-4 font-normal text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="text-theme-primary whitespace-nowrap">
                {subjects.map((subject, index) => (
                  <tr key={subject.id} className="border-b border-theme-border/30 hover:bg-theme-border/10 transition-colors">
                    <td className="py-2 pr-4">[{String(index + 1).padStart(2, '0')}]</td>
                    {editingSubjectId === subject.id ? (
                      <>
                        <td className="py-2 pr-4">
                          <input
                            value={editSubjectName}
                            onChange={(e) => setEditSubjectName(e.target.value)}
                            className="bg-theme-bg border border-theme-border text-theme-primary p-1 w-full focus:outline-none focus:border-theme-accent"
                          />
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <input
                            type="number"
                            step="any"
                            value={editCredits}
                            onChange={(e) => setEditCredits(e.target.value)}
                            className="bg-theme-bg border border-theme-border text-theme-primary p-1 w-16 text-right focus:outline-none focus:border-theme-accent"
                          />
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <button onClick={handleSaveEdit} className="text-theme-success hover:text-theme-success-hover px-2 py-1 mr-2 focus:outline-none focus:ring-1 focus:ring-theme-success" title="Save">[SAVE]</button>
                          <button onClick={() => setEditingSubjectId(null)} className="text-theme-primary hover:text-theme-secondary px-2 py-1 focus:outline-none focus:ring-1 focus:ring-theme-primary" title="Cancel">[CANCEL]</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 pr-4">{subject.subject_name}</td>
                        <td className="py-2 pr-4 text-right">{subject.credits}</td>
                        <td className="py-2 pr-4 text-right">
                          <button
                            onClick={() => handleEditClick(subject)}
                            className="text-theme-primary hover:text-theme-secondary px-2 py-1 mr-2 transition-colors focus:outline-none"
                            title="Edit Subject"
                          >
                            [EDIT]
                          </button>
                          <button
                            onClick={() => handleOpenDescModal(subject)}
                            className="text-theme-warning-hover hover:text-theme-warning px-2 py-1 mr-2 transition-colors focus:outline-none"
                            title="Edit Description"
                          >
                            [DESC]
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(subject.id)}
                            className="text-theme-accent hover:text-theme-accent-hover hover:bg-theme-accent-bg px-2 py-1 transition-colors focus:outline-none focus:ring-1 focus:ring-theme-accent"
                            title="Delete Subject"
                          >
                            [DEL]
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-theme-muted text-sm mt-4">
              Total records: {subjects.length} <br />
              Total credits: {subjects.reduce((acc, subject) => acc + subject.credits, 0)}<br />
              EOF
            </div>
          </div>
        )}
      </div>

      {/* Description Modal (Nano-style) */}
      {descModalSubject && (
        <div className="fixed inset-0 bg-theme-bg/90 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl border border-theme-border bg-theme-bg flex flex-col shadow-[0_0_20px_rgba(0,0,255,0.15)] font-mono">
            {/* Nano Header */}
            <div className="bg-theme-border text-black px-2 py-1 flex justify-between items-center text-sm font-bold">
              <span>UW PICO 5.09</span>
              <span>File: {descModalSubject.subject_name}.txt</span>
              <span>{modalDescription ? 'Modified' : ''}</span>
            </div>
            
            <div className="p-2 border-b border-theme-border/50 text-theme-secondary text-sm">
              &gt; Credits: {descModalSubject.credits}
            </div>

            {/* Text Area */}
            <div className="flex-grow p-2">
              <textarea
                value={modalDescription}
                onChange={(e) => setModalDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleSaveDescription();
                  }
                }}
                className="w-full h-64 bg-transparent text-blue-300 focus:outline-none resize-none leading-relaxed"
                placeholder="[ Enter description here... ]"
                autoFocus
              />
            </div>

            {/* Nano Footer/Shortcuts */}
            <div className="bg-theme-border/20 text-theme-secondary p-2 text-xs flex flex-wrap gap-x-6 gap-y-2 border-t border-theme-border">
              <div className="flex items-center cursor-pointer hover:text-white" onClick={handleSaveDescription}>
                <span className="bg-theme-border text-black px-1 mr-1 font-bold">^O</span> Write Out [SAVE]
              </div>
              <div className="flex items-center cursor-pointer hover:text-white" onClick={handleCloseDescModal}>
                <span className="bg-theme-border text-black px-1 mr-1 font-bold">^X</span> Exit [CANCEL]
              </div>
              <div className="flex items-center cursor-pointer hover:text-white" onClick={handleSaveDescription}>
                <span className="bg-theme-border text-black px-1 mr-1 font-bold">ESC</span> Save & Exit
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
