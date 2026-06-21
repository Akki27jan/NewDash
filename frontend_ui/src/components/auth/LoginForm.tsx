"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '../ui/Button';
import { API_URL } from '@/lib/api';

const InputField = ({ label, name, type = 'text', validation = {}, register, errors }: any) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
    <label className="text-theme-primary whitespace-nowrap min-w-[200px]">
      <span className="text-theme-accent">guest@newdash</span>:<span className="text-theme-primary">~</span>$ enter_{name}:
    </label>
    <div className="flex-grow flex flex-col">
      <div className="flex items-center">
        <span className="text-theme-muted mr-2">[</span>
        <input
          type={type}
          className="flex-grow bg-theme-bg text-white border-b border-theme-border focus:outline-none focus:border-theme-primary px-1 py-0.5 font-mono"
          {...register(name, validation)}
        />
        <span className="text-theme-muted ml-2">]</span>
      </div>
      {errors[name] && (
        <span className="text-theme-accent text-sm mt-1">
          * {errors[name]?.message?.toString() || 'This field is required'}
        </span>
      )}
    </div>
  </div>
);

export default function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
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
      
    } catch (err) {
      setServerError('Unable to connect to the server.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 w-full">
      <div className="mb-8 border-b border-theme-border inline-block">
        <h2 className="text-theme-primary font-bold text-xl">
          <span className="text-theme-accent">#</span> ESTABLISH_CONNECTION
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <InputField 
          label="Email" 
          name="email" 
          type="email" 
          validation={{ 
            required: "Email is required"
          }} 
          register={register}
          errors={errors}
        />
        <InputField 
          label="Password" 
          name="password" 
          type="password" 
          validation={{ 
            required: "Password is required"
          }} 
          register={register}
          errors={errors}
        />

        {serverError && (
          <div className="text-theme-accent mt-4 p-2 border border-theme-accent-border bg-theme-accent-bg/20">
            [ERROR] {serverError}
          </div>
        )}

        {successMsg && (
          <div className="text-theme-success mt-4 p-2 border border-theme-success-border bg-theme-success-bg/20">
            {successMsg}
          </div>
        )}

        <div className="mt-8 pt-4">
          <Button type="submit" label="EXECUTE_LOGIN" color="blue" className="w-full sm:w-auto" />
        </div>
      </form>
    </div>
  );
}
