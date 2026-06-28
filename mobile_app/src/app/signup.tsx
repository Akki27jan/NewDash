import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { useRouter } from 'expo-router';
import TerminalInput from '@/components/TerminalInput';
import TerminalButton from '@/components/TerminalButton';

import { API_URL } from '@/lib/api';

export default function SignupScreen() {
  const { control, handleSubmit, watch } = useForm();
  const [successMsg, setSuccessMsg] = useState('');
  const [serverError, setServerError] = useState('');
  const router = useRouter();

  const password = watch("password");

  const onSubmit = async (data: any) => {
    setServerError('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setServerError(errorData.detail || 'Signup failed. Please try again.');
        return;
      }

      setSuccessMsg('[SYSTEM] User created. Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
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
            <Text className="text-theme-accent">#</Text> INITIALIZE_USER_PROFILE
          </Text>
        </View>

        <View className="flex-col gap-2">
          <TerminalInput
            name="first_name"
            label="first_name"
            control={control}
            rules={{ required: "First name is required" }}
          />
          <TerminalInput
            name="last_name"
            label="last_name"
            control={control}
            rules={{ required: "Last name is required" }}
          />
          <TerminalInput
            name="email"
            label="email"
            control={control}
            keyboardType="email-address"
            rules={{ 
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "invalid email address"
              }
            }}
          />
          <TerminalInput
            name="password"
            label="password"
            control={control}
            secureTextEntry
            rules={{ 
              required: "Password is required",
              minLength: { value: 6, message: "Password must be at least 6 characters" }
            }}
          />
          <TerminalInput
            name="confirm_password"
            label="confirm_password"
            control={control}
            secureTextEntry
            rules={{ 
              required: "Please confirm your password",
              validate: (value: string) => value === password || "Passwords do not match"
            }}
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

          <View className="mt-8 flex-col gap-4 pb-8">
            <TerminalButton 
              title="EXECUTE_SIGNUP" 
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
