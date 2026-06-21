"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { API_URL } from '@/lib/api';

interface ExamModalProps {
  isOpen: boolean;
  onClose: (wasSaved: boolean) => void;
  initialDate: Date | null;
}

interface ExamFormItem {
  id: number;
  subject: string;
  examDate: string; // YYYY-MM-DD
  examTime: string; // HH:mm
  duration: string;
}

export default function ExamModal({ isOpen, onClose, initialDate }: ExamModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Period Info
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [colorCode, setColorCode] = useState('#ef4444'); // Default RED for exams

  // Step 2: Nested Exams
  const [exams, setExams] = useState<ExamFormItem[]>([
    { id: Date.now(), subject: '', examDate: startDate, examTime: '09:00', duration: '120' }
  ]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setExams([...exams, { id: Date.now(), subject: '', examDate: startDate, examTime: '09:00', duration: '120' }]);
  };

  const handleRemoveRow = (id: number) => {
    setExams(exams.filter(e => e.id !== id));
  };

  const updateExamRow = (id: number, field: keyof ExamFormItem, value: string) => {
    setExams(exams.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSave = async () => {
    setError('');
    if (!title || !startDate || !endDate) {
      setError('[ERROR] Exam Period details are required.');
      return;
    }

    const invalidExams = exams.some(e => !e.subject || !e.examDate || !e.examTime);
    if (invalidExams) {
      setError('[ERROR] All exam rows must have a subject, date, and time.');
      return;
    }

    setLoading(true);

    try {
      // Format payload
      const formattedExams = exams.map(e => {
        const datetimeString = `${e.examDate}T${e.examTime}:00`;
        return {
          subject: e.subject,
          exam_time: new Date(datetimeString).toISOString(),
          duration_minutes: e.duration || null
        };
      });

      const payload = {
        title,
        start_date: new Date(`${startDate}T00:00:00`).toISOString(),
        end_date: new Date(`${endDate}T23:59:59`).toISOString(),
        color_code: colorCode,
        exams: formattedExams
      };

      const res = await fetch(`${API_URL}/api/exams/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to save exam timetable.');
      }

      onClose(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-theme-bg/90 flex items-center justify-center z-50 p-4 font-mono">
      <div className="w-full max-w-3xl border border-theme-border bg-theme-bg flex flex-col shadow-lg max-h-[90vh]">
        {/* Header */}
        <div className="bg-theme-border/20 border-b border-theme-border p-3 flex justify-between items-center">
          <h2 className="text-theme-primary font-bold tracking-wider">
            &gt; ADD_EXAM_TIMETABLE [Step {step}/2]
          </h2>
          <button onClick={() => onClose(false)} className="text-theme-secondary hover:text-theme-accent focus:outline-none">
            [X]
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {error && <div className="text-theme-accent text-sm mb-4 bg-theme-accent/10 border border-theme-accent p-2">{error}</div>}

          {step === 1 ? (
            <div className="flex flex-col gap-6 text-sm animate-fade-in">
              <div className="text-theme-secondary mb-2 border-b border-theme-border/30 pb-2">
                Define the overarching Exam Period (e.g. "Midterm Exams").
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-theme-secondary">EXAM_PERIOD_NAME:</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="bg-transparent border border-theme-border text-theme-primary p-2 focus:outline-none focus:border-theme-accent"
                  placeholder="[ e.g. Minor 1 ]"
                />
              </div>

              <div className="flex gap-4 flex-col sm:flex-row">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-theme-secondary">START_DATE:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="bg-transparent border border-theme-border text-theme-primary p-2 focus:outline-none focus:border-theme-accent custom-date-input"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-theme-secondary">END_DATE:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="bg-transparent border border-theme-border text-theme-primary p-2 focus:outline-none focus:border-theme-accent custom-date-input"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    if (!title) setError('[ERROR] Please provide a period name.');
                    else { setError(''); setStep(2); }
                  }}
                  className="bg-theme-border/20 border border-theme-border text-theme-primary hover:text-theme-accent hover:border-theme-accent transition-colors px-6 py-2"
                >
                  [NEXT_STEP] &gt;
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-sm animate-fade-in">
              <div className="flex justify-between items-end border-b border-theme-border/30 pb-2">
                <div className="text-theme-secondary">
                  Add specific subjects for <span className="text-theme-primary font-bold">{title}</span>
                </div>
                <button
                  onClick={handleAddRow}
                  className="text-theme-success hover:text-theme-success-hover text-xs border border-theme-success px-2 py-1"
                >
                  + ADD_SUBJECT
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {exams.map((exam, index) => (
                  <div key={exam.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-theme-border/5 p-2 border border-theme-border/30 relative group">
                    <div className="w-6 text-theme-muted text-xs hidden sm:block">#{index + 1}</div>

                    <input
                      type="text"
                      placeholder="Subject Name"
                      value={exam.subject}
                      onChange={e => updateExamRow(exam.id, 'subject', e.target.value)}
                      className="bg-transparent border border-theme-border text-theme-primary p-1 px-2 flex-1 focus:outline-none focus:border-theme-accent"
                    />

                    <input
                      type="date"
                      value={exam.examDate}
                      onChange={e => updateExamRow(exam.id, 'examDate', e.target.value)}
                      className="bg-transparent border border-theme-border text-theme-primary p-1 px-2 w-36 focus:outline-none focus:border-theme-accent custom-date-input"
                    />

                    <input
                      type="time"
                      value={exam.examTime}
                      onChange={e => updateExamRow(exam.id, 'examTime', e.target.value)}
                      className="bg-transparent border border-theme-border text-theme-primary p-1 px-2 w-28 focus:outline-none focus:border-theme-accent custom-time-input"
                    />

                    <input
                      type="text"
                      placeholder="Duration (mins)"
                      value={exam.duration}
                      onChange={e => updateExamRow(exam.id, 'duration', e.target.value)}
                      className="bg-transparent border border-theme-border text-theme-primary p-1 px-2 w-32 focus:outline-none focus:border-theme-accent"
                    />

                    <button
                      onClick={() => handleRemoveRow(exam.id)}
                      className="text-theme-accent hover:text-red-400 absolute top-1 right-1 sm:static sm:ml-2"
                      title="Remove row"
                    >
                      [X]
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between items-center border-t border-theme-border/30 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="text-theme-secondary hover:text-theme-primary transition-colors px-4 py-2 border border-transparent"
                >
                  &lt; [BACK]
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || exams.length === 0}
                  className="bg-theme-border/20 border border-theme-border text-theme-primary hover:text-theme-accent hover:border-theme-accent transition-colors px-6 py-2 disabled:opacity-50"
                >
                  {loading ? '[SAVING...]' : '[SAVE_TIMETABLE]'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
