"use client";

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';

// Interfaces
interface Subject {
  id: string;
  subject_name: string;
  credits: number;
}

interface Assessment {
  id: string;
  name: string;
  obtained: number;
  total: number;
  weightage: number;
}

export default function GPACalcPage() {
  const { user } = useAuth();
  // Mark Calculator State
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assName, setAssName] = useState('');
  const [assObtained, setAssObtained] = useState('');
  const [assTotal, setAssTotal] = useState('');
  const [assWeightage, setAssWeightage] = useState('');
  const [markError, setMarkError] = useState('');

  // GPA Predictor State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [expectedGPAs, setExpectedGPAs] = useState<Record<string, string>>({});
  const [gpaLoading, setGpaLoading] = useState(true);
  const [gpaError, setGpaError] = useState('');
  const [prevGpa, setPrevGpa] = useState('');
  const [prevCredits, setPrevCredits] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  const gpaUpdateRef = React.useRef<Record<string, NodeJS.Timeout>>({});
  const settingsUpdateRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync prevGpa and prevCredits with user object if available
  useEffect(() => {
    if (user?.prev_gpa !== undefined && user?.prev_gpa !== null) {
      setPrevGpa(user.prev_gpa.toString());
    }
    if (user?.prev_credits !== undefined && user?.prev_credits !== null) {
      setPrevCredits(user.prev_credits.toString());
    }
  }, [user?.prev_gpa, user?.prev_credits]);

  // Handle GPA settings updates to Backend (Debounced)
  useEffect(() => {
    if (!user) return;
    
    const pGpa = parseFloat(prevGpa);
    const pCreds = parseFloat(prevCredits);

    const payload: any = {};
    if (!isNaN(pGpa)) payload.prev_gpa = pGpa;
    if (!isNaN(pCreds)) payload.prev_credits = pCreds;
    if (prevGpa === '') payload.prev_gpa = null;
    if (prevCredits === '') payload.prev_credits = null;

    if (settingsUpdateRef.current) clearTimeout(settingsUpdateRef.current);
    settingsUpdateRef.current = setTimeout(async () => {
      try {
        await fetch(`${API_URL}/api/auth/me/gpa_settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include'
        });
      } catch (err) {
        console.error("Failed to update GPA settings", err);
      }
    }, 1000);
  }, [prevGpa, prevCredits, user]);

  // Load from local storage for Mark Calculator
  useEffect(() => {
    const saved = localStorage.getItem('mark_calculator_assessments');
    if (saved) {
      try {
        setAssessments(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage whenever assessments change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('mark_calculator_assessments', JSON.stringify(assessments));
    }
  }, [assessments, isLoaded]);

  // Fetch subjects for GPA Predictor
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch(`${API_URL}/api/subjects/`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch subjects');
        const data = await res.json();
        setSubjects(data);

        // initialize expectedGPAs
        const initialGpas: Record<string, string> = {};
        data.forEach((s: any) => {
          initialGpas[s.id] = s.expected_gpa !== null && s.expected_gpa !== undefined ? s.expected_gpa.toString() : '';
        });
        setExpectedGPAs(initialGpas);
      } catch (err: any) {
        setGpaError(err.message || 'Error fetching subjects');
      } finally {
        setGpaLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  // Mark Calc Handlers
  const handleAddAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    setMarkError('');
    if (!assName || !assObtained || !assTotal || !assWeightage) {
      setMarkError('[ERROR] Missing fields');
      return;
    }

    const newAssessment: Assessment = {
      id: Date.now().toString(),
      name: assName,
      obtained: parseFloat(assObtained),
      total: parseFloat(assTotal),
      weightage: parseFloat(assWeightage),
    };

    if (newAssessment.total <= 0) {
      setMarkError('[ERROR] Total marks must be greater than 0');
      return;
    }

    setAssessments([...assessments, newAssessment]);
    setAssName('');
    setAssObtained('');
    setAssTotal('');
    setAssWeightage('');
  };

  const handleDeleteAssessment = (id: string) => {
    setAssessments(assessments.filter((a) => a.id !== id));
  };

  const handleClearAssessments = () => {
    setAssessments([]);
  };

  // GPA Predictor Handlers
  const handleGpaChange = (id: string, val: string) => {
    setExpectedGPAs(prev => ({
      ...prev,
      [id]: val,
    }));

    if (gpaUpdateRef.current[id]) {
      clearTimeout(gpaUpdateRef.current[id]);
    }

    const numericVal = parseFloat(val);
    const payloadVal = isNaN(numericVal) ? null : numericVal;

    gpaUpdateRef.current[id] = setTimeout(async () => {
      try {
        await fetch(`${API_URL}/api/subjects/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expected_gpa: payloadVal }),
          credentials: 'include'
        });
      } catch (err) {
        console.error("Failed to update expected GPA for", id);
      }
    }, 500);
  };

  // Calculations
  const calculateTotalScore = () => {
    return assessments.reduce((acc, curr) => {
      return acc + (curr.obtained / curr.total) * curr.weightage;
    }, 0).toFixed(2);
  };

  const calculateTotalWeightage = () => {
    return assessments.reduce((acc, curr) => acc + curr.weightage, 0).toFixed(2);
  };

  const calculatePredictedGPA = () => {
    let totalCreditPoints = 0;
    let totalCredits = 0;

    subjects.forEach((s) => {
      const gpa = parseFloat(expectedGPAs[s.id]);
      if (!isNaN(gpa)) {
        totalCreditPoints += gpa * s.credits;
        totalCredits += s.credits;
      }
    });

    if (totalCredits === 0) return '0.00';
    return (totalCreditPoints / totalCredits).toFixed(2);
  };

  const calculateOverallGPA = () => {
    let currentCreditPoints = 0;
    let currentCredits = 0;

    subjects.forEach((s) => {
      const gpa = parseFloat(expectedGPAs[s.id]);
      if (!isNaN(gpa)) {
        currentCreditPoints += gpa * s.credits;
        currentCredits += s.credits;
      }
    });

    const pGpa = parseFloat(prevGpa);
    const pCredits = parseFloat(prevCredits);

    let totalCreditPoints = currentCreditPoints;
    let totalCredits = currentCredits;

    if (!isNaN(pGpa) && !isNaN(pCredits)) {
      totalCreditPoints += pGpa * pCredits;
      totalCredits += pCredits;
    }

    if (totalCredits === 0) return '0.00';
    return (totalCreditPoints / totalCredits).toFixed(2);
  };

  return (
    <main className="flex-grow flex flex-col gap-8 mt-8 max-w-4xl mx-auto w-full px-4 mb-8">
      {/* Page Title */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h1 className="text-theme-primary font-bold text-2xl mb-4 border-b border-theme-border pb-2">
          <span className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</span>:~/gpa_calc# _
        </h1>
        <p className="text-theme-secondary mb-2">
          Calculate individual assessment scores and predict your overall GPA.
        </p>
      </div>

      {/* MARK CALCULATOR SECTION */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h2 className="text-theme-primary font-bold mb-4 border-b border-theme-border pb-2 flex justify-between items-center">
          <span><span className="text-theme-accent">system</span>:~/gpa_calc/mark_calculator# _</span>
          {assessments.length > 0 && (
            <button onClick={handleClearAssessments} className="text-theme-accent hover:text-theme-accent-hover text-sm font-normal focus:outline-none">[CLEAR_ALL]</button>
          )}
        </h2>

        {markError && <div className="text-theme-accent mb-4">{markError}</div>}

        <form onSubmit={handleAddAssessment} className="flex flex-col gap-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-theme-secondary text-sm">&gt; Assessment Name:</label>
              <input
                type="text"
                value={assName}
                onChange={(e) => setAssName(e.target.value)}
                className="bg-transparent border border-theme-border text-theme-primary p-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors placeholder-theme-border"
                placeholder="[ e.g. Midterm 1 ]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-theme-secondary text-sm">&gt; Marks Obtained:</label>
              <input
                type="number"
                step="any"
                value={assObtained}
                onChange={(e) => setAssObtained(e.target.value)}
                className="bg-transparent border border-theme-border text-theme-primary p-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors placeholder-theme-border"
                placeholder="[ e.g. 40 ]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-theme-secondary text-sm">&gt; Total Marks:</label>
              <input
                type="number"
                step="any"
                value={assTotal}
                onChange={(e) => setAssTotal(e.target.value)}
                className="bg-transparent border border-theme-border text-theme-primary p-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors placeholder-theme-border"
                placeholder="[ e.g. 50 ]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-theme-secondary text-sm">&gt; Weightage (%):</label>
              <input
                type="number"
                step="any"
                value={assWeightage}
                onChange={(e) => setAssWeightage(e.target.value)}
                className="bg-transparent border border-theme-border text-theme-primary p-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors placeholder-theme-border"
                placeholder="[ e.g. 30 ]"
              />
            </div>
          </div>
          <div className="mt-2">
            <Button type="submit" label="ADD_ASSESSMENT" color="red" />
          </div>
        </form>

        {/* Assessments List */}
        {assessments.length === 0 ? (
          <div className="text-theme-muted border-t border-theme-border pt-4">No assessments added. Data is saved locally.</div>
        ) : (
          <div className="overflow-x-auto border-t border-theme-border pt-4">
            <div className="md:hidden text-theme-muted text-xs animate-pulse mb-2">[ swipe left/right to view details ]</div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-theme-secondary border-b border-theme-border whitespace-nowrap">
                  <th className="py-2 pr-4 font-normal">S.NO</th>
                  <th className="py-2 pr-4 font-normal">NAME</th>
                  <th className="py-2 pr-4 font-normal text-right">SCORE</th>
                  <th className="py-2 pr-4 font-normal text-right">WEIGHT</th>
                  <th className="py-2 pr-4 font-normal text-right">CONTRIB</th>
                  <th className="py-2 pr-4 font-normal text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="text-theme-primary whitespace-nowrap">
                {assessments.map((ass, index) => (
                  <tr key={ass.id} className="border-b border-theme-border/30 hover:bg-theme-border/10 transition-colors">
                    <td className="py-2 pr-4">[{String(index + 1).padStart(2, '0')}]</td>
                    <td className="py-2 pr-4">{ass.name}</td>
                    <td className="py-2 pr-4 text-right">{ass.obtained} / {ass.total}</td>
                    <td className="py-2 pr-4 text-right">{ass.weightage}%</td>
                    <td className="py-2 pr-4 text-right text-theme-success-hover">
                      +{((ass.obtained / ass.total) * ass.weightage).toFixed(2)}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <button
                        onClick={() => handleDeleteAssessment(ass.id)}
                        className="text-theme-accent hover:text-theme-accent-hover px-2 py-1 focus:outline-none"
                        title="Delete Assessment"
                      >
                        [DEL]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 p-4 border border-theme-border bg-theme-border/10 flex flex-col sm:flex-row justify-between items-center text-lg">
              <div className="text-theme-secondary">
                Total Weightage: <span className="text-theme-primary">{calculateTotalWeightage()}%</span>
              </div>
              <div className="text-theme-secondary font-bold mt-2 sm:mt-0">
                Final Score: <span className="text-theme-success">{calculateTotalScore()} / 100</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GPA PREDICTOR SECTION */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h2 className="text-theme-primary font-bold mb-4 border-b border-theme-border pb-2">
          <span className="text-theme-accent">system</span>:~/gpa_calc/predictor# ./run_prediction
        </h2>

        {gpaError && <div className="text-theme-accent mb-4">[ERROR] {gpaError}</div>}

        {gpaLoading ? (
          <div className="text-theme-secondary animate-pulse">Fetching subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="text-theme-muted">No subjects found. Add subjects in the SUBJECTS tab first.</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="md:hidden text-theme-muted text-xs animate-pulse mb-2">[ swipe left/right to view details ]</div>
            <table className="w-full text-left border-collapse mb-6">
              <thead>
                <tr className="text-theme-secondary border-b border-theme-border whitespace-nowrap">
                  <th className="py-2 pr-4 font-normal">S.NO</th>
                  <th className="py-2 pr-4 font-normal">SUBJECT</th>
                  <th className="py-2 pr-4 font-normal text-center">CREDITS</th>
                  <th className="py-2 pr-4 font-normal text-right">EXPECTED GPA</th>
                </tr>
              </thead>
              <tbody className="text-theme-primary whitespace-nowrap">
                {subjects.map((sub, index) => (
                  <tr key={sub.id} className="border-b border-theme-border/30 hover:bg-theme-border/10 transition-colors">
                    <td className="py-2 pr-4">[{String(index + 1).padStart(2, '0')}]</td>
                    <td className="py-2 pr-4">{sub.subject_name}</td>
                    <td className="py-2 pr-4 text-center">{sub.credits}</td>
                    <td className="py-2 pr-4 text-right">
                      <input
                        type="number"
                        step="any"
                        value={expectedGPAs[sub.id] || ''}
                        onChange={(e) => handleGpaChange(sub.id, e.target.value)}
                        className="bg-theme-bg border border-theme-border text-theme-primary p-1 w-24 text-right focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors placeholder-theme-border"
                        placeholder="[ GPA ]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 border border-theme-border bg-theme-border/10 flex justify-between items-center text-xl">
              <div className="text-theme-secondary font-bold">
                &gt; PREDICTED_GPA:
              </div>
              <div className="text-theme-success font-bold font-mono">
                {calculatePredictedGPA()}
              </div>
            </div>

            <div className="mt-4 p-4 border border-theme-border bg-theme-bg flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col gap-1 w-full sm:w-1/2">
                <label className="text-theme-secondary text-sm">&gt; Previous GPA:</label>
                <input
                  type="number"
                  step="any"
                  value={prevGpa}
                  onChange={(e) => setPrevGpa(e.target.value)}
                  className="bg-transparent border border-theme-border text-theme-primary p-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors placeholder-theme-border"
                  placeholder="[ e.g. 8.5 ]"
                />
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-1/2">
                <label className="text-theme-secondary text-sm">&gt; Previous Total Credits:</label>
                <input
                  type="number"
                  step="any"
                  value={prevCredits}
                  onChange={(e) => setPrevCredits(e.target.value)}
                  className="bg-transparent border border-theme-border text-theme-primary p-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors placeholder-theme-border"
                  placeholder="[ e.g. 60 ]"
                />
              </div>
            </div>

            <div className="mt-4 p-4 border border-theme-border bg-theme-border/10 flex justify-between items-center text-xl">
              <div className="text-theme-secondary font-bold">
                &gt; OVERALL_PREDICTED_GPA:
              </div>
              <div className="text-theme-success font-bold font-mono">
                {calculateOverallGPA()}
              </div>
            </div>
          </div>
        )}
      </div>

    </main>
  );
}
