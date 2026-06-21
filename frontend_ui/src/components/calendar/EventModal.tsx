"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { API_URL } from '@/lib/api';

interface EventModalProps {
  isOpen: boolean;
  onClose: (wasSaved: boolean) => void;
  initialDate: Date | null;
}

export default function EventModal({ isOpen, onClose, initialDate }: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(initialDate ? format(initialDate, "HH:mm") : '09:00');
  const [endTime, setEndTime] = useState(initialDate ? format(initialDate, "HH:mm") : '10:00');
  const [colorCode, setColorCode] = useState('#3b82f6');
  const [recurringWeeks, setRecurringWeeks] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !eventDate) {
      setError('[ERROR] Title and Date are required');
      return;
    }

    setLoading(true);

    try {
      // Construct exact datetime objects from the selected date string
      const [startHour, startMin] = startTime.split(':');
      const startDateTime = new Date(eventDate);
      startDateTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

      const [endHour, endMin] = endTime.split(':');
      const endDateTime = new Date(eventDate);
      endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

      const res = await fetch(`${API_URL}/api/events/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          is_all_day: false,
          color_code: colorCode,
          recurring_weeks: recurringWeeks
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create event');
      }

      onClose(true); // pass true to trigger refetch
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-theme-bg/80 flex items-center justify-center z-50 p-4 font-mono">
      <div className="w-full max-w-lg border border-theme-border bg-theme-bg flex flex-col shadow-lg">
        {/* Header */}
        <div className="bg-theme-border/20 border-b border-theme-border p-3 flex justify-between items-center">
          <h2 className="text-theme-primary font-bold tracking-wider">
            &gt; CREATE_EVENT
          </h2>
          <button onClick={() => onClose(false)} className="text-theme-secondary hover:text-theme-accent focus:outline-none">
            [X]
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && <div className="text-theme-accent text-sm mb-4">{error}</div>}

          <form onSubmit={handleSave} className="flex flex-col gap-4 text-sm">
            <div className="flex flex-col gap-1">
              <label className="text-theme-secondary">TITLE:</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="bg-transparent border border-theme-border text-theme-primary p-2 focus:outline-none focus:border-theme-accent"
                placeholder="[ Event Title ]"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-theme-secondary">DATE:</label>
                <input 
                  type="date" 
                  value={eventDate} 
                  onChange={e => setEventDate(e.target.value)}
                  className="bg-transparent border border-theme-border text-theme-primary p-2 focus:outline-none focus:border-theme-accent custom-date-input"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-theme-secondary">START_TIME:</label>
                <input 
                  type="time" 
                  value={startTime} 
                  onChange={e => setStartTime(e.target.value)}
                  className="bg-transparent border border-theme-border text-theme-primary p-2 focus:outline-none focus:border-theme-accent custom-time-input"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-theme-secondary">END_TIME:</label>
                <input 
                  type="time" 
                  value={endTime} 
                  onChange={e => setEndTime(e.target.value)}
                  className="bg-transparent border border-theme-border text-theme-primary p-2 focus:outline-none focus:border-theme-accent custom-time-input"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-theme-secondary">COLOR_TAG:</label>
                <select 
                  value={colorCode} 
                  onChange={e => setColorCode(e.target.value)}
                  className="bg-theme-bg border border-theme-border text-theme-primary p-2 focus:outline-none focus:border-theme-accent"
                >
                  <option value="#3b82f6">BLUE (Default)</option>
                  <option value="#ef4444">RED (Urgent)</option>
                  <option value="#10b981">GREEN (Personal)</option>
                  <option value="#a855f7">PURPLE (Study)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <label className="text-theme-secondary">RECURRING (WEEKS):</label>
                <input 
                  type="number" 
                  min="0"
                  max="52"
                  value={recurringWeeks} 
                  onChange={e => setRecurringWeeks(parseInt(e.target.value) || 0)}
                  className="bg-transparent border border-theme-border text-theme-primary p-2 focus:outline-none focus:border-theme-accent"
                  placeholder="0 = No recurrence"
                />
                <span className="text-[10px] text-theme-muted mt-1">Total times event will occur</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-theme-secondary">DESCRIPTION (OPTIONAL):</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className="bg-transparent border border-theme-border text-theme-primary p-2 focus:outline-none focus:border-theme-accent resize-none h-24"
                placeholder="[ Event Description... ]"
              />
            </div>

            <div className="mt-4 flex justify-end gap-4">
              <button 
                type="button" 
                onClick={() => onClose(false)}
                className="text-theme-secondary hover:text-theme-primary transition-colors px-4 py-2 border border-transparent"
              >
                [CANCEL]
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-theme-border/20 border border-theme-border text-theme-primary hover:text-theme-accent hover:border-theme-accent transition-colors px-6 py-2 disabled:opacity-50"
              >
                {loading ? '[SAVING...]' : '[SAVE_EVENT]'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
