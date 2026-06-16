import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SignupForm from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-900 selection:text-white">
      <Header />
      
      <main className="flex-grow flex flex-col gap-12 mt-8">
        <SignupForm />
      </main>
      
      <Footer />
    </div>
  );
}
