"use client";

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

interface Subject {
  id: string;
  subject_name: string;
  credits: number;
  student_id: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [credits, setCredits] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editCredits, setEditCredits] = useState('');

  const fetchSubjects = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/subjects/', {
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
      const res = await fetch('http://localhost:8000/api/subjects/', {
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
      const res = await fetch(`http://localhost:8000/api/subjects/${subjectId}`, {
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
      const res = await fetch(`http://localhost:8000/api/subjects/${editingSubjectId}`, {
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

  return (
    <main className="flex-grow flex flex-col gap-8 mt-8 max-w-4xl mx-auto w-full px-4 mb-8">

      {/* Page Title */}
      <div className="border border-blue-900 p-6 bg-black">
        <h1 className="text-blue-500 font-bold text-2xl mb-4 border-b border-blue-900 pb-2">
          <span className="text-red-500">root@newdash</span>:~/subjects# _
        </h1>
        <p className="text-blue-400 mb-2">
          Manage your enrolled subjects here. Use the interface below to add new entries.
        </p>
      </div>

      {/* Add Subject Form */}
      <div className="border border-blue-900 p-6 bg-black">
        <h2 className="text-blue-500 font-bold mb-4 border-b border-blue-900 pb-2">
          <span className="text-red-500">guest@newdash</span>:~/subjects/add# _
        </h2>

        {error && <div className="text-red-500 mb-4">{error}</div>}
        {successMsg && <div className="text-green-500 mb-4">{successMsg}</div>}

        <form onSubmit={handleAddSubject} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-blue-400 w-32">&gt; Subject Name:</label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="bg-transparent border border-blue-900 text-blue-500 p-1 flex-1 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder-blue-900"
              placeholder="[ Enter Subject Name ]"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-blue-400 w-32">&gt; Credits:</label>
            <input
              type="number"
              step="any"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              className="bg-transparent border border-blue-900 text-blue-500 p-1 flex-1 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder-blue-900"
              placeholder="[ Enter Credits ]"
            />
          </div>
          <div className="mt-4">
            <Button type="submit" label="ADD_SUBJECT" color="red" />
          </div>
        </form>
      </div>

      {/* Subjects List */}
      <div className="border border-blue-900 p-6 bg-black">
        <h2 className="text-blue-500 font-bold mb-4 border-b border-blue-900 pb-2">
          <span className="text-red-500">system</span>:~/subjects/list# ls -la
        </h2>

        {loading ? (
          <div className="text-blue-400 animate-pulse">Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="text-blue-800">No subjects found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-blue-400 border-b border-blue-900">
                  <th className="py-2 pr-4 font-normal">S.NO</th>
                  <th className="py-2 pr-4 font-normal">NAME</th>
                  <th className="py-2 pr-4 font-normal text-right">CREDITS</th>
                  <th className="py-2 pr-4 font-normal text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="text-blue-500">
                {subjects.map((subject, index) => (
                  <tr key={subject.id} className="border-b border-blue-900/30 hover:bg-blue-900/10 transition-colors">
                    <td className="py-2 pr-4">[{String(index + 1).padStart(2, '0')}]</td>
                    {editingSubjectId === subject.id ? (
                      <>
                        <td className="py-2 pr-4">
                          <input
                            value={editSubjectName}
                            onChange={(e) => setEditSubjectName(e.target.value)}
                            className="bg-black border border-blue-900 text-blue-500 p-1 w-full focus:outline-none focus:border-red-500"
                          />
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <input
                            type="number"
                            step="any"
                            value={editCredits}
                            onChange={(e) => setEditCredits(e.target.value)}
                            className="bg-black border border-blue-900 text-blue-500 p-1 w-16 text-right focus:outline-none focus:border-red-500"
                          />
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-400 px-2 py-1 mr-2 focus:outline-none focus:ring-1 focus:ring-green-500" title="Save">[SAVE]</button>
                          <button onClick={() => setEditingSubjectId(null)} className="text-blue-500 hover:text-blue-400 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500" title="Cancel">[CANCEL]</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 pr-4">{subject.subject_name}</td>
                        <td className="py-2 pr-4 text-right">{subject.credits}</td>
                        <td className="py-2 pr-4 text-right">
                          <button
                            onClick={() => handleEditClick(subject)}
                            className="text-blue-500 hover:text-blue-400 px-2 py-1 mr-2 transition-colors focus:outline-none"
                            title="Edit Subject"
                          >
                            [EDIT]
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(subject.id)}
                            className="text-red-500 hover:text-red-400 hover:bg-red-950 px-2 py-1 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500"
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
            <div className="text-blue-800 text-sm mt-4">
              Total records: {subjects.length} <br />
              Total credits: {subjects.reduce((acc, subject) => acc + subject.credits, 0)}<br />
              EOF
            </div>
          </div>
        )}
      </div>

    </main>
  );
}
