"use client";

import React from 'react';
import Link from 'next/link';
import Button from '../ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

export default function DashboardHeader() {
  const { checkAuth } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
    await checkAuth();
    router.push("/login");
  };

  return (
    <header className="flex items-center p-4 border-b border-theme-border overflow-x-auto">
      <div className="flex-1 min-w-max">
        <Link href="/dashboard" className="text-theme-primary font-bold text-xl tracking-widest hover:text-theme-accent transition-colors inline-block">
          NewDash_
        </Link>
      </div>

      <div className="flex gap-4 items-center flex-nowrap justify-center px-4">
        <Button label="SUBJECTS" color="blue" onClick={() => router.push('/dashboard/subjects')} />
        <Button label="GPA_CALC" color="blue" onClick={() => router.push('/dashboard/gpa')} />
        <Button label="TODO_LIST" color="blue" onClick={() => router.push('/dashboard/todos')} />
        <Button label="NOTES" color="blue" onClick={() => router.push('/dashboard/notes')} />
        <Button label="TIME_TABLE" color="blue" />
        <Button label="ATTENDANCE" color="blue" onClick={() => router.push('/dashboard/attendance')} />
        <Button label="SETTINGS" color="blue" onClick={() => router.push('/dashboard/settings')} />
      </div>

      <div className="flex-1 flex justify-end min-w-max">
        <Button label="LOGOUT" color="red" onClick={handleLogout} />
      </div>
    </header>
  );
}
