import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { useRouter } from 'expo-router';
import TerminalInput from '@/components/TerminalInput';
import TerminalButton from '@/components/TerminalButton';

import { API_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { control, handleSubmit } = useForm();
  const [successMsg, setSuccessMsg] = useState('');
  const [serverError, setServerError] = useState('');
  const router = useRouter();
  const { checkAuth } = useAuth();

  const onSubmit = async (data: any) => {
    setServerError('');
    setSuccessMsg('');
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setServerError(errorData.detail || 'Login failed. Please try again.');
        return;
      }

      setSuccessMsg('[SYSTEM] Authentication successful. Initializing dashboard...');
      await checkAuth();
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (err: any) {
      setServerError(`Connection error: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-theme-bg" edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 16, flexGrow: 1 }}>
        <View className="mb-8 border-b border-theme-border self-start pb-2">
          <Text className="text-theme-primary font-bold text-xl font-mono">
            <Text className="text-theme-accent">#</Text> ESTABLISH_CONNECTION
          </Text>
        </View>

        <View className="flex-col gap-2">
          <TerminalInput
            name="email"
            label="email"
            control={control}
            keyboardType="email-address"
            rules={{ required: "Email is required" }}
          />
          <TerminalInput
            name="password"
            label="password"
            control={control}
            secureTextEntry
            rules={{ required: "Password is required" }}
          />

          {serverError ? (
            <View className="mt-4 p-2 border border-theme-accent bg-[#450a0a33]">
              <Text className="text-theme-accent font-mono text-sm">[ERROR] {serverError}</Text>
            </View>
          ) : null}

          {successMsg ? (
            <View className="mt-4 p-2 border border-theme-success bg-[#052e1633]">
              <Text className="text-theme-success font-mono text-sm">{successMsg}</Text>
            </View>
          ) : null}

          <View className="mt-8 flex-col gap-4">
            <TerminalButton 
              title="EXECUTE_LOGIN" 
              onPress={handleSubmit(onSubmit)} 
            />
            <TerminalButton 
              title="BACK_TO_HOME" 
              variant="secondary" 
              onPress={() => router.push('/')} 
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
