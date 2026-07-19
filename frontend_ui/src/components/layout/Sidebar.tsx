"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';

const NAV_LINKS = [
  { id: '01', label: 'SUBJECTS', path: '/dashboard/subjects' },
  { id: '02', label: 'GPA_CALC', path: '/dashboard/gpa' },
  { id: '03', label: 'TODO_LIST', path: '/dashboard/todos' },
  { id: '04', label: 'NOTES_CENTRE', path: '/dashboard/notes' },
  { id: '05', label: 'CALENDAR', path: '/dashboard/calendar' },
  { id: '06', label: 'TIMERS', path: '/dashboard/timers' },
  { id: '07', label: 'ATTENDANCE', path: '/dashboard/attendance' },
  { id: '08', label: 'FLASH_CARDS', path: '/dashboard/flashcards' },
  { id: '09', label: 'SETTINGS', path: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const { user } = useAuth();

  const username = user ? `${user.first_name.toLowerCase()}_${user.last_name.toLowerCase()}` : 'guest';

  const activeClasses = "text-theme-accent border-l-2 border-theme-accent pl-2 bg-theme-accent-bg";
  const inactiveClasses = "text-theme-primary hover:text-white hover:bg-theme-border-bg pl-2 border-l-2 border-transparent transition-colors";

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`
          fixed md:relative
          top-0 left-0 h-full w-64
          bg-theme-bg border-r border-theme-border
          flex flex-col
          transition-transform duration-300 ease-in-out z-50
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-4 border-b border-theme-border flex items-center justify-between md:block">
          <span className="text-theme-primary font-bold tracking-widest block md:hidden">Navigation_</span>
          <span className="text-theme-primary font-bold tracking-widest hidden md:block">Navigation_</span>
          {/* Close button for mobile only */}
          <button onClick={closeSidebar} className="md:hidden text-theme-accent focus:outline-none">
            [X]
          </button>
        </div>

        <nav className="flex-grow p-4 flex flex-col gap-2 overflow-y-auto">
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.path);
            return (
              <Link
                key={link.id}
                href={link.path}
                onClick={() => closeSidebar()}
                className={`block py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-theme-accent ${isActive ? activeClasses : inactiveClasses}`}
              >
                [{link.id}] {isActive ? '> ' : '  '}{link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-theme-border text-xs text-theme-secondary font-mono">
          <span className="text-theme-primary block mb-1">{username}@newdash:~$</span>
          [Ctrl+K: Command Palette]
        </div>
      </aside>
    </>
  );
}
