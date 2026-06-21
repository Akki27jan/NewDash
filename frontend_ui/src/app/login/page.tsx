import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-theme-border selection:text-white">
      <Header />
      
      <main className="flex-grow flex flex-col gap-12 mt-8">
        <LoginForm />
      </main>
      
      <Footer />
    </div>
  );
}
