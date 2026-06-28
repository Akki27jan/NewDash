import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function AttendanceScreen() {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [threshold, setThreshold] = useState<string>(user?.attendance_threshold?.toString() || '75');
  const [records, setRecords] = useState<Record<string, AttendanceData>>({});
  const updateTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (user?.attendance_threshold) {
      setThreshold(user.attendance_threshold.toString());
    }
  }, [user?.attendance_threshold]);

  useEffect(() => {
    if (!user) return;
    const numericThreshold = parseFloat(threshold) || 75;
    const timeout = setTimeout(async () => {
      try {
        await fetch(`${API_URL}/api/auth/me/threshold`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attendance_threshold: numericThreshold }),
          credentials: 'include'
        });
      } catch (err) {
        console.error("Failed to update threshold", err);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [threshold, user]);

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
        attData.forEach((rec: any) => {
          newRecords[rec.subject_id] = { attended: rec.attended, total: rec.total };
        });
        
        subData.forEach((s: Subject) => {
          if (!newRecords[s.id]) {
            newRecords[s.id] = { attended: 0, total: 0 };
          }
        });
        setRecords(newRecords);
      } catch (err: any) {
        setError(err.message || 'Error fetching data');
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
        setError('');
      }

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

  const getBunkPrediction = (attended: number, total: number) => {
    if (total === 0) return { type: 'NA', msg: 'No classes yet' };

    const currentPercent = (attended / total) * 100;
    const target = (parseFloat(threshold) || 75) / 100;

    if (currentPercent >= (parseFloat(threshold) || 75)) {
      if (target === 0) return { type: 'SAFE', msg: 'Can bunk infinitely' };
      const canBunk = Math.floor((attended / target) - total);
      return { type: 'SAFE', msg: `Can safely skip ${canBunk} classes` };
    } else {
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
  const numThreshold = parseFloat(threshold) || 75;

  return (
    <SafeAreaView className="flex-1 bg-theme-bg" edges={['left', 'right', 'bottom']}>
      
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Title Module */}
        <View className="border border-theme-border p-4 bg-theme-bg mb-6">
          <View className="border-b border-theme-border pb-2 mb-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text className="text-theme-primary font-bold text-lg font-mono whitespace-nowrap">
                <Text className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</Text>
                :~/attendance# _
              </Text>
            </ScrollView>
          </View>
          <Text className="text-theme-secondary font-mono text-xs leading-relaxed">
            Track class attendance and calculate safe skips. Data is securely persisted in your local environment.
          </Text>
        </View>

        {error ? (
          <View className="bg-theme-accent/10 border border-theme-accent p-3 mb-6">
            <Text className="text-theme-accent font-mono text-xs">{error}</Text>
          </View>
        ) : null}

        {/* TRACKER MODULE */}
        <View className="border border-theme-border p-4 bg-theme-bg mb-6">
          <View className="border-b border-theme-border pb-2 mb-4">
            <Text className="text-theme-primary font-bold font-mono text-lg">
              <Text className="text-theme-accent">&gt;</Text> [SUBJECT_TRACKER]
            </Text>
          </View>

          {loading ? (
            <Text className="text-theme-primary font-mono text-sm animate-pulse">[Initializing tracker matrix...]</Text>
          ) : subjects.length === 0 ? (
            <Text className="text-theme-muted font-mono text-xs">System initialized. No subjects located.</Text>
          ) : (
            <View className="flex-col gap-4">
              {subjects.map((sub, index) => {
                const rec = records[sub.id] || { attended: 0, total: 0 };
                const percent = rec.total === 0 ? 0 : (rec.attended / rec.total) * 100;
                const isSafe = percent >= numThreshold;
                const prediction = getBunkPrediction(rec.attended, rec.total);

                return (
                  <View key={sub.id} className="border border-theme-border/50 bg-theme-border-bg p-3 flex-col gap-3">
                    {/* Header: Name and Status */}
                    <View className="flex-row justify-between items-start">
                      <View className="flex-row flex-1">
                        <Text className="text-theme-muted font-mono text-xs mr-2">[{String(index + 1).padStart(2, '0')}]</Text>
                        <Text className="text-theme-primary font-bold font-mono text-sm flex-1">{sub.subject_name}</Text>
                      </View>
                      <View>
                        {rec.total === 0 ? (
                          <Text className="text-theme-muted font-mono text-xs">[PENDING]</Text>
                        ) : isSafe ? (
                          <Text className="text-theme-success font-mono text-xs font-bold border border-theme-success/50 bg-theme-success/10 px-1 py-0.5">[SAFE]</Text>
                        ) : (
                          <Text className="text-theme-accent font-mono text-xs font-bold border border-theme-accent/50 bg-theme-accent/10 px-1 py-0.5">[DANGER]</Text>
                        )}
                      </View>
                    </View>

                    {/* Middle: Inputs */}
                    <View className="flex-row gap-4 items-center">
                      <View className="flex-1 flex-col gap-1">
                        <Text className="text-theme-secondary font-mono text-xs">ATTENDED:</Text>
                        <TextInput
                          value={rec.attended.toString()}
                          onChangeText={(val) => handleRecordChange(sub.id, 'attended', val)}
                          keyboardType="numeric"
                          className="bg-transparent border border-theme-border text-theme-primary p-2 font-mono text-center focus:border-theme-accent"
                        />
                      </View>
                      <View className="flex-1 flex-col gap-1">
                        <Text className="text-theme-secondary font-mono text-xs">TOTAL:</Text>
                        <TextInput
                          value={rec.total.toString()}
                          onChangeText={(val) => handleRecordChange(sub.id, 'total', val)}
                          keyboardType="numeric"
                          className="bg-transparent border border-theme-border text-theme-primary p-2 font-mono text-center focus:border-theme-accent"
                        />
                      </View>
                    </View>

                    {/* Bottom: Prediction & Percent */}
                    <View className="flex-row justify-between items-end mt-1 border-t border-theme-border/30 pt-2">
                      <Text className={`font-mono text-xs flex-1 ${prediction.type === 'SAFE' ? 'text-theme-success' : prediction.type === 'DANGER' ? 'text-theme-accent' : 'text-theme-muted'}`}>
                        {prediction.msg}
                      </Text>
                      <Text className={`font-mono text-base font-bold ${isSafe ? 'text-theme-success' : 'text-theme-accent'}`}>
                        {rec.total === 0 ? 'NA' : `${percent.toFixed(1)}%`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* OVERALL SUMMARY MODULE */}
        <View className="border border-theme-border p-4 bg-theme-bg mb-6">
          <View className="flex-col gap-4">
            <View className="flex-col">
              <Text className="text-theme-secondary font-mono text-sm font-bold">&gt; SYSTEM_WIDE_ATTENDANCE:</Text>
              <Text className="text-theme-muted font-mono text-xs mt-1">Aggregated totals across all modules</Text>
            </View>

            <View className="flex-row justify-between items-center bg-theme-border-bg border border-theme-border/50 p-3">
              <View className="flex-col">
                <Text className="text-theme-muted font-mono text-[10px]">CLASSES_ATTENDED</Text>
                <Text className="text-theme-secondary font-mono text-lg">{overall.attended} / {overall.total}</Text>
              </View>
              <View className="flex-col items-end">
                <Text className="text-theme-muted font-mono text-[10px]">OVERALL_PERCENTAGE</Text>
                <Text className={`font-mono text-xl font-bold ${parseFloat(overall.percentage) >= numThreshold ? 'text-theme-success' : 'text-theme-accent'}`}>
                  {overall.total === 0 ? '0.00' : overall.percentage}%
                </Text>
              </View>
            </View>

            {/* Threshold Config */}
            <View className="flex-row items-center justify-between border-t border-theme-border/50 pt-4 mt-2">
              <Text className="text-theme-secondary font-mono text-xs">Target Threshold (%):</Text>
              <TextInput
                value={threshold}
                onChangeText={setThreshold}
                keyboardType="numeric"
                className="bg-transparent border border-theme-border text-theme-warning px-2 py-1 w-16 text-right font-mono focus:border-theme-accent"
              />
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
