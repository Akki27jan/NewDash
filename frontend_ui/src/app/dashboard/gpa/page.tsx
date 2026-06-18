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
  }, []);

  // Save to local storage whenever assessments change
  useEffect(() => {
    localStorage.setItem('mark_calculator_assessments', JSON.stringify(assessments));
  }, [assessments]);

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
        data.forEach((s: Subject) => {
          initialGpas[s.id] = '';
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
    setExpectedGPAs({
      ...expectedGPAs,
      [id]: val,
    });
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
      <div className="border border-blue-900 p-6 bg-black">
        <h1 className="text-blue-500 font-bold text-2xl mb-4 border-b border-blue-900 pb-2">
          <span className="text-red-500">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</span>:~/gpa_calc# _
        </h1>
        <p className="text-blue-400 mb-2">
          Calculate individual assessment scores and predict your overall GPA.
        </p>
      </div>

      {/* MARK CALCULATOR SECTION */}
      <div className="border border-blue-900 p-6 bg-black">
        <h2 className="text-blue-500 font-bold mb-4 border-b border-blue-900 pb-2 flex justify-between items-center">
          <span><span className="text-red-500">system</span>:~/gpa_calc/mark_calculator# _</span>
          {assessments.length > 0 && (
            <button onClick={handleClearAssessments} className="text-red-500 hover:text-red-400 text-sm font-normal focus:outline-none">[CLEAR_ALL]</button>
          )}
        </h2>

        {markError && <div className="text-red-500 mb-4">{markError}</div>}

        <form onSubmit={handleAddAssessment} className="flex flex-col gap-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-blue-400 text-sm">&gt; Assessment Name:</label>
              <input
                type="text"
                value={assName}
                onChange={(e) => setAssName(e.target.value)}
                className="bg-transparent border border-blue-900 text-blue-500 p-1 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder-blue-900"
                placeholder="[ e.g. Midterm 1 ]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-blue-400 text-sm">&gt; Marks Obtained:</label>
              <input
                type="number"
                step="any"
                value={assObtained}
                onChange={(e) => setAssObtained(e.target.value)}
                className="bg-transparent border border-blue-900 text-blue-500 p-1 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder-blue-900"
                placeholder="[ e.g. 40 ]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-blue-400 text-sm">&gt; Total Marks:</label>
              <input
                type="number"
                step="any"
                value={assTotal}
                onChange={(e) => setAssTotal(e.target.value)}
                className="bg-transparent border border-blue-900 text-blue-500 p-1 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder-blue-900"
                placeholder="[ e.g. 50 ]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-blue-400 text-sm">&gt; Weightage (%):</label>
              <input
                type="number"
                step="any"
                value={assWeightage}
                onChange={(e) => setAssWeightage(e.target.value)}
                className="bg-transparent border border-blue-900 text-blue-500 p-1 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder-blue-900"
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
          <div className="text-blue-800 border-t border-blue-900 pt-4">No assessments added. Data is saved locally.</div>
        ) : (
          <div className="overflow-x-auto border-t border-blue-900 pt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-blue-400 border-b border-blue-900">
                  <th className="py-2 pr-4 font-normal">S.NO</th>
                  <th className="py-2 pr-4 font-normal">NAME</th>
                  <th className="py-2 pr-4 font-normal text-right">SCORE</th>
                  <th className="py-2 pr-4 font-normal text-right">WEIGHT</th>
                  <th className="py-2 pr-4 font-normal text-right">CONTRIB</th>
                  <th className="py-2 pr-4 font-normal text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="text-blue-500">
                {assessments.map((ass, index) => (
                  <tr key={ass.id} className="border-b border-blue-900/30 hover:bg-blue-900/10 transition-colors">
                    <td className="py-2 pr-4">[{String(index + 1).padStart(2, '0')}]</td>
                    <td className="py-2 pr-4">{ass.name}</td>
                    <td className="py-2 pr-4 text-right">{ass.obtained} / {ass.total}</td>
                    <td className="py-2 pr-4 text-right">{ass.weightage}%</td>
                    <td className="py-2 pr-4 text-right text-green-400">
                      +{((ass.obtained / ass.total) * ass.weightage).toFixed(2)}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <button
                        onClick={() => handleDeleteAssessment(ass.id)}
                        className="text-red-500 hover:text-red-400 px-2 py-1 focus:outline-none"
                        title="Delete Assessment"
                      >
                        [DEL]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 p-4 border border-blue-900 bg-blue-900/10 flex flex-col sm:flex-row justify-between items-center text-lg">
              <div className="text-blue-400">
                Total Weightage: <span className="text-blue-500">{calculateTotalWeightage()}%</span>
              </div>
              <div className="text-blue-400 font-bold mt-2 sm:mt-0">
                Final Score: <span className="text-green-500">{calculateTotalScore()} / 100</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GPA PREDICTOR SECTION */}
      <div className="border border-blue-900 p-6 bg-black">
        <h2 className="text-blue-500 font-bold mb-4 border-b border-blue-900 pb-2">
          <span className="text-red-500">system</span>:~/gpa_calc/predictor# ./run_prediction
        </h2>

        {gpaError && <div className="text-red-500 mb-4">[ERROR] {gpaError}</div>}

        {gpaLoading ? (
          <div className="text-blue-400 animate-pulse">Fetching subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="text-blue-800">No subjects found. Add subjects in the SUBJECTS tab first.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse mb-6">
              <thead>
                <tr className="text-blue-400 border-b border-blue-900">
                  <th className="py-2 pr-4 font-normal">S.NO</th>
                  <th className="py-2 pr-4 font-normal">SUBJECT</th>
                  <th className="py-2 pr-4 font-normal text-center">CREDITS</th>
                  <th className="py-2 pr-4 font-normal text-right">EXPECTED GPA</th>
                </tr>
              </thead>
              <tbody className="text-blue-500">
                {subjects.map((sub, index) => (
                  <tr key={sub.id} className="border-b border-blue-900/30 hover:bg-blue-900/10 transition-colors">
                    <td className="py-2 pr-4">[{String(index + 1).padStart(2, '0')}]</td>
                    <td className="py-2 pr-4">{sub.subject_name}</td>
                    <td className="py-2 pr-4 text-center">{sub.credits}</td>
                    <td className="py-2 pr-4 text-right">
                      <input
                        type="number"
                        step="any"
                        value={expectedGPAs[sub.id] || ''}
                        onChange={(e) => handleGpaChange(sub.id, e.target.value)}
                        className="bg-black border border-blue-900 text-blue-500 p-1 w-24 text-right focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder-blue-900"
                        placeholder="[ GPA ]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 border border-blue-900 bg-blue-900/10 flex justify-between items-center text-xl">
              <div className="text-blue-400 font-bold">
                &gt; PREDICTED_GPA:
              </div>
              <div className="text-green-500 font-bold font-mono">
                {calculatePredictedGPA()}
              </div>
            </div>

            <div className="mt-4 p-4 border border-blue-900 bg-black flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col gap-1 w-full sm:w-1/2">
                <label className="text-blue-400 text-sm">&gt; Previous GPA:</label>
                <input
                  type="number"
                  step="any"
                  value={prevGpa}
                  onChange={(e) => setPrevGpa(e.target.value)}
                  className="bg-transparent border border-blue-900 text-blue-500 p-1 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder-blue-900"
                  placeholder="[ e.g. 8.5 ]"
                />
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-1/2">
                <label className="text-blue-400 text-sm">&gt; Previous Total Credits:</label>
                <input
                  type="number"
                  step="any"
                  value={prevCredits}
                  onChange={(e) => setPrevCredits(e.target.value)}
                  className="bg-transparent border border-blue-900 text-blue-500 p-1 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder-blue-900"
                  placeholder="[ e.g. 60 ]"
                />
              </div>
            </div>

            <div className="mt-4 p-4 border border-blue-900 bg-blue-900/10 flex justify-between items-center text-xl">
              <div className="text-blue-400 font-bold">
                &gt; OVERALL_PREDICTED_GPA:
              </div>
              <div className="text-green-500 font-bold font-mono">
                {calculateOverallGPA()}
              </div>
            </div>
          </div>
        )}
      </div>

    </main>
  );
}
