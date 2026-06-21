import React from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import Footer from '@/components/layout/Footer';
import NotificationEngine from '@/components/layout/NotificationEngine';
import { TimerProvider } from '@/context/TimerContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TimerProvider>
      <div className="flex flex-col min-h-screen">
        <NotificationEngine />
        <DashboardHeader />
        <div className="flex-grow flex flex-col">
          {children}
        </div>
        <Footer />
      </div>
    </TimerProvider>
  );
}
