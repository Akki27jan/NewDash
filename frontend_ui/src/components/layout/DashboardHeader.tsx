"use client";

import React from 'react';
import Link from 'next/link';
import Button from '../ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { useSidebar } from '@/context/SidebarContext';

export default function DashboardHeader() {
  const { checkAuth } = useAuth();
  const router = useRouter();
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
    await checkAuth();
    router.push("/login");
  };

  return (
    <div className="relative z-40">
      <header className="flex items-center justify-between p-4 border-b border-theme-border bg-theme-bg">
        <div className="flex-1 min-w-max flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={toggleSidebar}
            className="md:hidden text-theme-primary hover:text-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent p-1"
          >
            {isSidebarOpen ? '[CLOSE]' : '[MENU]'}
          </button>

          <Link href="/dashboard" className="text-theme-primary font-bold text-xl tracking-widest hover:text-theme-accent transition-colors inline-block">
            NewDash_
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button label="LOGOUT" color="red" onClick={handleLogout} />
        </div>
      </header>
    </div>
  );
}
