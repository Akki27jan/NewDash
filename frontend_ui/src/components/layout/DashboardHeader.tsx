"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Button from '../ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

export default function DashboardHeader() {
  const { checkAuth } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
    await checkAuth();
    router.push("/login");
  };

  return (
    <div className="relative">
      <header className="flex items-center justify-between p-4 border-b border-theme-border">
        <div className="flex-1 min-w-max">
          <Link href="/dashboard" className="text-theme-primary font-bold text-xl tracking-widest hover:text-theme-accent transition-colors inline-block">
            NewDash_
          </Link>
        </div>

        {/* Mobile View */}
        <div className="flex md:hidden items-center gap-4">
          <Button label={isMenuOpen ? "[CLOSE]" : "[MENU]"} color="blue" onClick={() => setIsMenuOpen(!isMenuOpen)} />
          <Button label="LOGOUT" color="red" onClick={handleLogout} />
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex gap-4 items-center justify-center px-4">
          <Button label="SUBJECTS" color="blue" onClick={() => router.push('/dashboard/subjects')} />
          <Button label="GPA_CALC" color="blue" onClick={() => router.push('/dashboard/gpa')} />
          <Button label="TODO_LIST" color="blue" onClick={() => router.push('/dashboard/todos')} />
          <Button label="NOTES_CENTRE" color="blue" onClick={() => router.push('/dashboard/notes')} />
          <Button label="CALENDAR" color="blue" onClick={() => router.push('/dashboard/calendar')} />
          <Button label="TIMERS" color="blue" onClick={() => router.push('/dashboard/timers')} />
          <Button label="ATTENDANCE" color="blue" onClick={() => router.push('/dashboard/attendance')} />
          <Button label="SETTINGS" color="blue" onClick={() => router.push('/dashboard/settings')} />
        </div>

        <div className="hidden md:flex flex-1 justify-end min-w-max">
          <Button label="LOGOUT" color="red" onClick={handleLogout} />
        </div>
      </header>

      {/* Mobile Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-theme-bg border-b border-theme-border z-50 flex flex-col p-4 gap-4">
          <Button label="SUBJECTS" color="blue" onClick={() => { setIsMenuOpen(false); router.push('/dashboard/subjects'); }} />
          <Button label="GPA_CALC" color="blue" onClick={() => { setIsMenuOpen(false); router.push('/dashboard/gpa'); }} />
          <Button label="TODO_LIST" color="blue" onClick={() => { setIsMenuOpen(false); router.push('/dashboard/todos'); }} />
          <Button label="NOTES_CENTRE" color="blue" onClick={() => { setIsMenuOpen(false); router.push('/dashboard/notes'); }} />
          <Button label="CALENDAR" color="blue" onClick={() => { setIsMenuOpen(false); router.push('/dashboard/calendar'); }} />
          <Button label="TIMERS" color="blue" onClick={() => { setIsMenuOpen(false); router.push('/dashboard/timers'); }} />
          <Button label="ATTENDANCE" color="blue" onClick={() => { setIsMenuOpen(false); router.push('/dashboard/attendance'); }} />
          <Button label="SETTINGS" color="blue" onClick={() => { setIsMenuOpen(false); router.push('/dashboard/settings'); }} />
        </div>
      )}
    </div>
  );
}
