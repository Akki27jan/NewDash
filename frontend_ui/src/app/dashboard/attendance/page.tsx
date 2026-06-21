"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';

interface Subject {
  id: string;
  subject_name: string;
  credits: number;
}

interface AttendanceData {
  attended: number;
  total: number;
}

export default function AttendancePage() {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [threshold, setThreshold] = useState<number>(user?.attendance_threshold || 75);
  const [records, setRecords] = useState<Record<string, AttendanceData>>({});
  const updateTimeouts = React.useRef<Record<string, NodeJS.Timeout>>({});

  // Sync threshold with user object if available
  useEffect(() => {
    if (user?.attendance_threshold) {
      setThreshold(user.attendance_threshold);
    }
  }, [user?.attendance_threshold]);

  // Handle Threshold updates to Backend (Debounced)
  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(async () => {
      try {
        await fetch(`${API_URL}/api/auth/me/threshold`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attendance_threshold: threshold }),
          credentials: 'include'
        });
      } catch (err) {
        console.error("Failed to update threshold", err);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [threshold, user]);

  // Fetch subjects AND attendance records
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, attRes] = await Promise.all([
          fetch(`${API_URL}/api/subjects/`, { credentials: 'include' }),
          fetch(`${API_URL}/api/attendance/`, { credentials: 'include' })
        ]);
        
        if (!subRes.ok || !attRes.ok) throw new Error('Failed to fetch data');
        
        const subData = await subRes.json();
        const attData = await attRes.json();
        
        setSubjects(subData);

        const newRecords: Record<string, AttendanceData> = {};
        // Map backend attendance records
        attData.forEach((rec: any) => {
          newRecords[rec.subject_id] = { attended: rec.attended, total: rec.total };
        });
        
        // Init missing records
        subData.forEach((s: Subject) => {
          if (!newRecords[s.id]) {
            newRecords[s.id] = { attended: 0, total: 0 };
          }
        });
        setRecords(newRecords);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRecordChange = (subId: string, field: 'attended' | 'total', value: string) => {
    const parsed = parseInt(value, 10);
    const validValue = isNaN(parsed) ? 0 : Math.max(0, parsed);

    setRecords(prev => {
      const current = prev[subId] || { attended: 0, total: 0 };
      const updated = { ...current, [field]: validValue };

      if (updated.attended > updated.total) {
        setError('[ERROR] Attended classes cannot exceed total classes');
      } else {
        setError(''); // Clear error if valid
      }

      // Debounce API call
      if (updateTimeouts.current[subId]) {
        clearTimeout(updateTimeouts.current[subId]);
      }
      
      updateTimeouts.current[subId] = setTimeout(async () => {
        try {
          await fetch(`${API_URL}/api/attendance/${subId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attended: updated.attended, total: updated.total }),
            credentials: 'include'
          });
        } catch (err) {
          console.error("Failed to update attendance for", subId);
        }
      }, 500);

      return { ...prev, [subId]: updated };
    });
  };

  // Math Helper
  const getBunkPrediction = (attended: number, total: number) => {
    if (total === 0) return { type: 'NA', msg: 'No classes yet' };

    const currentPercent = (attended / total) * 100;
    const target = threshold / 100;

    if (currentPercent >= threshold) {
      // Safe, how many can we bunk?
      // Math.floor((A / target) - N)
      if (target === 0) return { type: 'SAFE', msg: 'Can bunk infinitely' };
      const canBunk = Math.floor((attended / target) - total);
      return { type: 'SAFE', msg: `Can safely skip ${canBunk} classes` };
    } else {
      // Danger, how many must we attend?
      // Math.ceil((target * N - A) / (1 - target))
      if (target === 1) return { type: 'DANGER', msg: 'Cannot reach 100%' };
      const needToAttend = Math.ceil((target * total - attended) / (1 - target));
      return { type: 'DANGER', msg: `Must attend next ${needToAttend} classes` };
    }
  };

  const getOverallStats = () => {
    let totalAttended = 0;
    let totalHeld = 0;

    subjects.forEach(sub => {
      const rec = records[sub.id];
      if (rec) {
        totalAttended += rec.attended;
        totalHeld += rec.total;
      }
    });

    const percentage = totalHeld === 0 ? 0 : (totalAttended / totalHeld) * 100;
    return {
      attended: totalAttended,
      total: totalHeld,
      percentage: percentage.toFixed(2)
    };
  };

  const overall = getOverallStats();

  return (
    <main className="flex-grow flex flex-col gap-8 w-full max-w-6xl mx-auto px-4 mt-8 mb-8">
      {/* Page Title */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h1 className="text-theme-primary font-bold text-2xl mb-4 border-b border-theme-border pb-2 flex justify-between items-center">
          <span><span className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</span>:~/attendance# _</span>

          <div className="flex items-center text-sm font-normal">
            <span className="text-theme-secondary mr-2">Target Threshold (%):</span>
            <input
              type="number"
              value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value) || 0)}
              className="bg-transparent border border-theme-border text-theme-warning p-1 w-16 focus:outline-none focus:border-theme-accent text-right"
              min="1"
              max="100"
            />
          </div>
        </h1>
        <p className="text-theme-secondary mb-2">
          Track class attendance and calculate safe skips. Data is securely persisted in your local environment.
        </p>
      </div>

      {error && <div className="text-theme-accent bg-theme-accent-bg border border-theme-accent p-4 mx-6">{error}</div>}

      {/* TRACKER MODULE */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h2 className="text-theme-primary font-bold text-xl mb-6 border-b border-theme-border pb-2 flex items-center">
          <span className="text-theme-accent mr-2">&gt;</span> [SUBJECT_TRACKER]
        </h2>

        {loading ? (
          <div className="text-theme-primary animate-pulse">Initializing tracker matrix...</div>
        ) : subjects.length === 0 ? (
          <div className="text-theme-muted text-sm">System initialized. No subjects located.</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="md:hidden text-theme-muted text-xs animate-pulse mb-2">[ swipe left/right to view details ]</div>
            <table className="w-full text-left border-collapse border-spacing-0">
              <thead>
                <tr className="text-theme-muted text-xs border-b border-theme-border/50 whitespace-nowrap">
                  <th className="py-2 pr-4 font-normal">S.NO.</th>
                  <th className="py-2 pr-4 font-normal">SUBJECT_NAME</th>
                  <th className="py-2 pr-4 font-normal text-center">ATTENDED</th>
                  <th className="py-2 pr-4 font-normal text-center">TOTAL</th>
                  <th className="py-2 pr-4 font-normal text-right">%</th>
                  <th className="py-2 pr-4 font-normal text-center">STATUS</th>
                  <th className="py-2 pr-4 font-normal">BUNK_PREDICTOR</th>
                </tr>
              </thead>
              <tbody className="text-theme-primary whitespace-nowrap">
                {subjects.map((sub, index) => {
                  const rec = records[sub.id] || { attended: 0, total: 0 };
                  const percent = rec.total === 0 ? 0 : (rec.attended / rec.total) * 100;
                  const isSafe = percent >= threshold;
                  const prediction = getBunkPrediction(rec.attended, rec.total);

                  return (
                    <tr key={sub.id} className="border-b border-theme-border/20 hover:bg-theme-border/10 transition-colors">
                      <td className="py-3 pr-4 text-xs text-theme-muted">[{String(index + 1).padStart(2, '0')}]</td>
                      <td className="py-3 pr-4 text-sm font-bold">{sub.subject_name}</td>
                      <td className="py-3 pr-4 text-center">
                        <input
                          type="number"
                          value={rec.attended || ''}
                          onChange={(e) => handleRecordChange(sub.id, 'attended', e.target.value)}
                          className="bg-transparent border border-theme-border text-theme-secondary p-1 w-16 text-center focus:outline-none focus:border-theme-accent"
                          min="0"
                        />
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <input
                          type="number"
                          value={rec.total || ''}
                          onChange={(e) => handleRecordChange(sub.id, 'total', e.target.value)}
                          className="bg-transparent border border-theme-border text-theme-secondary p-1 w-16 text-center focus:outline-none focus:border-theme-accent"
                          min="0"
                        />
                      </td>
                      <td className={`py-3 pr-4 text-right font-mono ${isSafe ? 'text-theme-success-hover' : 'text-theme-accent-hover animate-pulse'}`}>
                        {rec.total === 0 ? 'NA' : percent.toFixed(1)}%
                      </td>
                      <td className="py-3 pr-4 text-center">
                        {rec.total === 0 ? (
                          <span className="text-theme-muted text-xs">[PENDING]</span>
                        ) : isSafe ? (
                          <span className="text-theme-success text-xs font-bold border border-theme-success-border bg-theme-success-border/20 px-2 py-0.5">[SAFE]</span>
                        ) : (
                          <span className="text-theme-accent text-xs font-bold border border-theme-accent-border bg-theme-accent-border/20 px-2 py-0.5">[DANGER]</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs">
                        <span className={prediction.type === 'SAFE' ? 'text-theme-success-hover' : prediction.type === 'DANGER' ? 'text-theme-accent-hover' : 'text-theme-muted'}>
                          {prediction.msg}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OVERALL SUMMARY MODULE */}
      <div className="border border-theme-border p-6 bg-theme-bg flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col">
          <span className="text-theme-secondary text-sm">&gt; SYSTEM_WIDE_ATTENDANCE:</span>
          <span className="text-theme-muted text-xs mt-1">Aggregated totals across all modules</span>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col text-right">
            <span className="text-theme-muted text-xs">CLASSES_ATTENDED</span>
            <span className="text-theme-secondary font-mono text-xl">{overall.attended} / {overall.total}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-theme-muted text-xs">OVERALL_PERCENTAGE</span>
            <span className={`font-mono text-2xl font-bold ${parseFloat(overall.percentage) >= threshold ? 'text-theme-success' : 'text-theme-accent'}`}>
              {overall.total === 0 ? '0.00' : overall.percentage}%
            </span>
          </div>
        </div>
      </div>

    </main>
  );
}
