import React from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import Footer from '@/components/layout/Footer';
import NotificationEngine from '@/components/layout/NotificationEngine';
import { TimerProvider } from '@/context/TimerContext';
import YoutubeAlarmPlayer from '@/components/timers/YoutubeAlarmPlayer';
import { SidebarProvider } from '@/context/SidebarContext';
import Sidebar from '@/components/layout/Sidebar';
import CommandPalette from '@/components/layout/CommandPalette';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TimerProvider>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden bg-theme-bg font-mono">
          <NotificationEngine />
          <YoutubeAlarmPlayer />
          <CommandPalette />
          
          <Sidebar />

          <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto flex flex-col">
              <div className="flex-grow">
                {children}
              </div>
              <Footer />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TimerProvider>
  );
}
