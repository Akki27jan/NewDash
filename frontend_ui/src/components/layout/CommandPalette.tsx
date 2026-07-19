"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const ROUTES = [
  { id: '01', name: 'SUBJECTS', path: '/dashboard/subjects' },
  { id: '02', name: 'GPA_CALCULATOR', path: '/dashboard/gpa' },
  { id: '03', name: 'TODO_LIST', path: '/dashboard/todos' },
  { id: '04', name: 'NOTES_CENTRE', path: '/dashboard/notes' },
  { id: '05', name: 'CALENDAR', path: '/dashboard/calendar' },
  { id: '06', name: 'TIMERS', path: '/dashboard/timers' },
  { id: '07', name: 'ATTENDANCE', path: '/dashboard/attendance' },
  { id: '08', name: 'FLASH_CARDS', path: '/dashboard/flashcards' },
  { id: '09', name: 'SETTINGS', path: '/dashboard/settings' },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut to open (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredRoutes = ROUTES.filter(route => 
    route.name.toLowerCase().includes(search.toLowerCase()) || 
    route.path.toLowerCase().includes(search.toLowerCase())
  );

  // Handle arrow keys and enter
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filteredRoutes.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredRoutes.length) % Math.max(filteredRoutes.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredRoutes.length > 0) {
        router.push(filteredRoutes[selectedIndex].path);
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div 
        className="w-full max-w-lg bg-theme-bg border border-theme-primary shadow-2xl flex flex-col font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-theme-primary p-3">
          <span className="text-theme-primary mr-2">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-white focus:outline-none placeholder-theme-secondary"
            placeholder="[ Search modules... ]"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
          />
          <span className="text-xs text-theme-secondary ml-2">[ESC to close]</span>
        </div>

        <div className="max-h-64 overflow-y-auto p-2">
          {filteredRoutes.length === 0 ? (
            <div className="p-2 text-theme-secondary text-sm">
              No matching modules found.
            </div>
          ) : (
            filteredRoutes.map((route, idx) => (
              <div
                key={route.id}
                className={`p-2 flex justify-between items-center cursor-pointer ${
                  idx === selectedIndex 
                    ? 'bg-theme-border-bg text-white border-l-2 border-theme-accent pl-1.5' 
                    : 'text-theme-primary border-l-2 border-transparent hover:bg-theme-border-bg/50 hover:text-white'
                }`}
                onClick={() => {
                  router.push(route.path);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <span>[{route.id}] {route.name}</span>
                <span className="text-xs text-theme-secondary opacity-50">{route.path}</span>
              </div>
            ))
          )}
        </div>
        
        <div className="p-2 border-t border-theme-primary flex justify-between text-xs text-theme-secondary">
          <span>Use <span className="text-theme-primary px-1">↑↓</span> to navigate</span>
          <span><span className="text-theme-primary px-1">↵</span> to select</span>
        </div>
      </div>
      
      {/* Backdrop click to close */}
      <div className="fixed inset-0 -z-10" onClick={() => setIsOpen(false)} />
    </div>
  );
}
