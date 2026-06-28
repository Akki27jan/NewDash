import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import TerminalButton from '@/components/TerminalButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function GpaScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'MARK_CALC' | 'GPA_PREDICTOR'>('MARK_CALC');

  // Mark Calculator State
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assName, setAssName] = useState('');
  const [assObtained, setAssObtained] = useState('');
  const [assTotal, setAssTotal] = useState('');
  const [assWeightage, setAssWeightage] = useState('');
  const [markError, setMarkError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // GPA Predictor State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [expectedGPAs, setExpectedGPAs] = useState<Record<string, string>>({});
  const [gpaLoading, setGpaLoading] = useState(true);
  const [gpaError, setGpaError] = useState('');
  const [prevGpa, setPrevGpa] = useState('');
  const [prevCredits, setPrevCredits] = useState('');

  const gpaUpdateRef = useRef<Record<string, NodeJS.Timeout>>({});
  const settingsUpdateRef = useRef<NodeJS.Timeout | null>(null);

  // Load Assessments from AsyncStorage
  useEffect(() => {
    const loadAssessments = async () => {
      try {
        const saved = await AsyncStorage.getItem('mark_calculator_assessments');
        if (saved) setAssessments(JSON.parse(saved));
      } catch (e) { }
      setIsLoaded(true);
    };
    loadAssessments();
  }, []);

  // Save Assessments to AsyncStorage
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem('mark_calculator_assessments', JSON.stringify(assessments)).catch(() => {});
    }
  }, [assessments, isLoaded]);

  // Sync user GPA settings
  useEffect(() => {
    if (user?.prev_gpa !== undefined && user?.prev_gpa !== null) setPrevGpa(user.prev_gpa.toString());
    if (user?.prev_credits !== undefined && user?.prev_credits !== null) setPrevCredits(user.prev_credits.toString());
  }, [user]);

  // Debounced save for GPA settings
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
      } catch (err) {}
    }, 1000);
  }, [prevGpa, prevCredits, user]);

  // Fetch subjects for GPA Predictor
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch(`${API_URL}/api/subjects/`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch subjects');
        const data = await res.json();
        setSubjects(data);
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

  // Handlers: Mark Calc
  const handleAddAssessment = () => {
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
      setMarkError('[ERROR] Total marks must be > 0');
      return;
    }
    setAssessments([...assessments, newAssessment]);
    setAssName(''); setAssObtained(''); setAssTotal(''); setAssWeightage('');
  };

  const handleDeleteAssessment = (id: string) => {
    setAssessments(assessments.filter((a) => a.id !== id));
  };

  // Handlers: GPA Predictor
  const handleGpaChange = (id: string, val: string) => {
    setExpectedGPAs(prev => ({ ...prev, [id]: val }));
    if (gpaUpdateRef.current[id]) clearTimeout(gpaUpdateRef.current[id]);
    
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
      } catch (err) {}
    }, 500);
  };

  // Calculations
  const calculateTotalScore = () => assessments.reduce((acc, curr) => acc + (curr.obtained / curr.total) * curr.weightage, 0).toFixed(2);
  const calculateTotalWeightage = () => assessments.reduce((acc, curr) => acc + curr.weightage, 0).toFixed(2);

  const calculatePredictedGPA = () => {
    let tPoints = 0, tCreds = 0;
    subjects.forEach((s) => {
      const g = parseFloat(expectedGPAs[s.id]);
      if (!isNaN(g)) { tPoints += g * s.credits; tCreds += s.credits; }
    });
    return tCreds === 0 ? '0.00' : (tPoints / tCreds).toFixed(2);
  };

  const calculateOverallGPA = () => {
    let tPoints = 0, tCreds = 0;
    subjects.forEach((s) => {
      const g = parseFloat(expectedGPAs[s.id]);
      if (!isNaN(g)) { tPoints += g * s.credits; tCreds += s.credits; }
    });
    const pGpa = parseFloat(prevGpa);
    const pCreds = parseFloat(prevCredits);
    if (!isNaN(pGpa) && !isNaN(pCreds)) {
      tPoints += pGpa * pCreds; tCreds += pCreds;
    }
    return tCreds === 0 ? '0.00' : (tPoints / tCreds).toFixed(2);
  };

  return (
    <SafeAreaView className="flex-1 bg-theme-bg" edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        
        {/* Top Tab Switcher */}
        <View className="flex-row border border-theme-border mb-6">
          <Pressable 
            onPress={() => setActiveTab('MARK_CALC')}
            className={`flex-1 p-3 items-center justify-center border-r border-theme-border ${activeTab === 'MARK_CALC' ? 'bg-theme-border/20' : 'bg-theme-bg'}`}
          >
            <Text className={`${activeTab === 'MARK_CALC' ? 'text-theme-primary' : 'text-theme-secondary'} font-mono text-sm font-bold`}>
              [ MARK_CALC ]
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => setActiveTab('GPA_PREDICTOR')}
            className={`flex-1 p-3 items-center justify-center ${activeTab === 'GPA_PREDICTOR' ? 'bg-theme-border/20' : 'bg-theme-bg'}`}
          >
            <Text className={`${activeTab === 'GPA_PREDICTOR' ? 'text-theme-primary' : 'text-theme-secondary'} font-mono text-sm font-bold`}>
              [ GPA_PRED ]
            </Text>
          </Pressable>
        </View>

        {activeTab === 'MARK_CALC' ? (
          <View className="border border-theme-border p-4 bg-theme-bg mb-8">
            <View className="border-b border-theme-border pb-2 mb-4">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text className="text-theme-primary font-bold font-mono text-lg whitespace-nowrap">
                  <Text className="text-theme-accent">system</Text>:~/gpa_calc/mark_calculator# _
                </Text>
              </ScrollView>
            </View>

            {markError ? <Text className="text-theme-accent font-mono mb-4 text-sm">{markError}</Text> : null}

            {/* Add Assessment Form */}
            <View className="flex-col gap-4 mb-6">
              <View className="flex-col gap-1">
                <Text className="text-theme-secondary font-mono text-sm">&gt; Assessment Name:</Text>
                <TextInput
                  value={assName} onChangeText={setAssName}
                  className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent"
                  placeholder="[ e.g. Midterm 1 ]" placeholderTextColor="#1e3a8a80"
                />
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1 flex-col gap-1">
                  <Text className="text-theme-secondary font-mono text-sm">&gt; Obtained:</Text>
                  <TextInput
                    value={assObtained} onChangeText={setAssObtained} keyboardType="numeric"
                    className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent"
                    placeholder="[ 40 ]" placeholderTextColor="#1e3a8a80"
                  />
                </View>
                <View className="flex-1 flex-col gap-1">
                  <Text className="text-theme-secondary font-mono text-sm">&gt; Total:</Text>
                  <TextInput
                    value={assTotal} onChangeText={setAssTotal} keyboardType="numeric"
                    className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent"
                    placeholder="[ 50 ]" placeholderTextColor="#1e3a8a80"
                  />
                </View>
              </View>
              <View className="flex-col gap-1">
                <Text className="text-theme-secondary font-mono text-sm">&gt; Weightage (%):</Text>
                <TextInput
                  value={assWeightage} onChangeText={setAssWeightage} keyboardType="numeric"
                  className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent"
                  placeholder="[ 30 ]" placeholderTextColor="#1e3a8a80"
                />
              </View>
              <View className="self-start mt-2 flex-row gap-4">
                <TerminalButton title="ADD_ASSESSMENT" variant="danger" onPress={handleAddAssessment} />
                {assessments.length > 0 && (
                  <TerminalButton title="CLEAR_ALL" onPress={() => setAssessments([])} />
                )}
              </View>
            </View>

            {/* Assessment Cards */}
            {assessments.length === 0 ? (
              <Text className="text-theme-muted font-mono text-sm border-t border-theme-border pt-4">
                No assessments added. Data is saved locally.
              </Text>
            ) : (
              <View className="flex-col gap-4 border-t border-theme-border pt-4">
                {assessments.map((ass, index) => (
                  <View key={ass.id} className="border border-theme-border/50 p-3 bg-theme-border-bg flex-row justify-between items-center">
                    <View className="flex-col gap-1 flex-1">
                      <Text className="text-theme-muted font-mono text-xs">[{String(index + 1).padStart(2, '0')}] {ass.name}</Text>
                      <Text className="text-theme-primary font-mono text-sm">Score: {ass.obtained} / {ass.total}</Text>
                      <Text className="text-theme-secondary font-mono text-xs">Weight: {ass.weightage}% | Contrib: <Text className="text-theme-success">+{((ass.obtained / ass.total) * ass.weightage).toFixed(2)}</Text></Text>
                    </View>
                    <Pressable onPress={() => handleDeleteAssessment(ass.id)}>
                      <Text className="text-theme-accent font-mono text-sm">[DEL]</Text>
                    </Pressable>
                  </View>
                ))}

                <View className="mt-2 p-3 border border-theme-border bg-theme-border/20 flex-col gap-2">
                  <Text className="text-theme-secondary font-mono">Total Weightage: <Text className="text-theme-primary">{calculateTotalWeightage()}%</Text></Text>
                  <Text className="text-theme-secondary font-mono font-bold">Final Score: <Text className="text-theme-success text-lg">{calculateTotalScore()} / 100</Text></Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View className="border border-theme-border p-4 bg-theme-bg mb-8">
            <View className="border-b border-theme-border pb-2 mb-4">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text className="text-theme-primary font-bold font-mono text-lg whitespace-nowrap">
                  <Text className="text-theme-accent">system</Text>:~/gpa_calc/predictor# ./run
                </Text>
              </ScrollView>
            </View>

            {gpaError ? <Text className="text-theme-accent font-mono mb-4 text-sm">[ERROR] {gpaError}</Text> : null}

            {gpaLoading ? (
              <Text className="text-theme-secondary font-mono">Fetching subjects...</Text>
            ) : subjects.length === 0 ? (
              <Text className="text-theme-muted font-mono text-sm">No subjects found. Add subjects in the SUBJECTS tab first.</Text>
            ) : (
              <View className="flex-col gap-4">
                {subjects.map((sub, index) => (
                  <View key={sub.id} className="border border-theme-border/50 p-3 bg-theme-border-bg flex-row justify-between items-center">
                    <View className="flex-col gap-1 flex-1">
                      <Text className="text-theme-muted font-mono text-xs">[{String(index + 1).padStart(2, '0')}]</Text>
                      <Text className="text-theme-primary font-mono font-bold text-base" numberOfLines={1}>{sub.subject_name}</Text>
                      <Text className="text-theme-secondary font-mono text-xs">Credits: {sub.credits}</Text>
                    </View>
                    <View className="flex-row items-center border-b border-theme-border">
                      <Text className="text-theme-muted font-mono mr-2">&gt;</Text>
                      <TextInput
                        value={expectedGPAs[sub.id] || ''}
                        onChangeText={(val) => handleGpaChange(sub.id, val)}
                        keyboardType="numeric"
                        className="bg-transparent text-theme-primary py-1 font-mono text-right w-16 focus:text-theme-accent"
                        placeholder="GPA"
                        placeholderTextColor="#1e3a8a80"
                      />
                    </View>
                  </View>
                ))}

                <View className="p-3 border border-theme-border bg-theme-border/10 flex-row justify-between items-center mt-2">
                  <Text className="text-theme-secondary font-mono font-bold">&gt; P_GPA:</Text>
                  <Text className="text-theme-success font-bold font-mono text-lg">{calculatePredictedGPA()}</Text>
                </View>

                <View className="flex-col gap-4 mt-4 p-3 border border-theme-border bg-theme-bg">
                  <View className="flex-col gap-1">
                    <Text className="text-theme-secondary font-mono text-sm">&gt; Previous GPA:</Text>
                    <TextInput
                      value={prevGpa} onChangeText={setPrevGpa} keyboardType="numeric"
                      className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent"
                      placeholder="[ e.g. 8.5 ]" placeholderTextColor="#1e3a8a80"
                    />
                  </View>
                  <View className="flex-col gap-1">
                    <Text className="text-theme-secondary font-mono text-sm">&gt; Previous Credits:</Text>
                    <TextInput
                      value={prevCredits} onChangeText={setPrevCredits} keyboardType="numeric"
                      className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent"
                      placeholder="[ e.g. 60 ]" placeholderTextColor="#1e3a8a80"
                    />
                  </View>
                </View>

                <View className="p-3 border border-theme-border bg-theme-border/10 flex-row justify-between items-center mt-2">
                  <Text className="text-theme-secondary font-mono font-bold">&gt; OVERALL_GPA:</Text>
                  <Text className="text-theme-success font-bold font-mono text-lg">{calculateOverallGPA()}</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
