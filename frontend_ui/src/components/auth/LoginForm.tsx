"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button';

const InputField = ({ label, name, type = 'text', validation = {}, register, errors }: any) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
    <label className="text-blue-500 whitespace-nowrap min-w-[200px]">
      <span className="text-red-500">guest@newdash</span>:<span className="text-blue-500">~</span>$ enter_{name}:
    </label>
    <div className="flex-grow flex flex-col">
      <div className="flex items-center">
        <span className="text-blue-800 mr-2">[</span>
        <input
          type={type}
          className="flex-grow bg-black text-white border-b border-blue-900 focus:outline-none focus:border-blue-500 px-1 py-0.5 font-mono"
          {...register(name, validation)}
        />
        <span className="text-blue-800 ml-2">]</span>
      </div>
      {errors[name] && (
        <span className="text-red-500 text-sm mt-1">
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

  const onSubmit = async (data: any) => {
    setServerError('');
    setSuccessMsg('');
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
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
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (err) {
      setServerError('Unable to connect to the server.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 w-full">
      <div className="mb-8 border-b border-blue-900 inline-block">
        <h2 className="text-blue-500 font-bold text-xl">
          <span className="text-red-500">#</span> ESTABLISH_CONNECTION
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
          <div className="text-red-500 mt-4 p-2 border border-red-900 bg-red-950/20">
            [ERROR] {serverError}
          </div>
        )}

        {successMsg && (
          <div className="text-green-500 mt-4 p-2 border border-green-900 bg-green-950/20">
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
