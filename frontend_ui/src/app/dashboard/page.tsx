"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';

interface Todo {
  id: string;
  task_name: string;
  due: string;
  status: boolean;
}

export default function DashboardPage() {
  const [subjectCount, setSubjectCount] = useState<number | string>('...');
  const [pendingTasks, setPendingTasks] = useState<Todo[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, todoRes] = await Promise.all([
          fetch(`${API_URL}/api/subjects/`, { credentials: 'include' }),
          fetch(`${API_URL}/api/todos/`, { credentials: 'include' })
        ]);

        if (subRes.ok) {
          const subData = await subRes.json();
          setSubjectCount(subData.length);
        } else {
          setSubjectCount('ERROR');
        }

        if (todoRes.ok) {
          const todoData: Todo[] = await todoRes.json();
          const now = new Date();
          const validTasks = todoData.filter(t => !t.status && new Date(t.due) >= now);
          validTasks.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
          setPendingTasks(validTasks);
        }
      } catch (err) {
        setSubjectCount('ERROR');
      }
    };
    fetchData();
  }, []);

  return (
    <main className="flex-grow flex flex-col gap-12 mt-8 max-w-4xl mx-auto w-full px-4">
      <div className="border border-theme-border p-4 sm:p-6 bg-theme-bg overflow-hidden w-full">
        <h1 className="text-theme-primary font-bold text-xl sm:text-2xl mb-4 border-b border-theme-border pb-2 break-all sm:break-normal">
          <span className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</span>:~# _
        </h1>
        <p className="text-theme-secondary mb-6 text-sm sm:text-base">
          Welcome to the NewDash module control center. You have successfully authenticated.
        </p>
        <div className="text-theme-muted text-xs sm:text-sm mb-4">
          [System status: ONLINE] <br />
          [Number of Subjects: {subjectCount}]
        </div>

        <div className="border-t border-theme-border/50 pt-4 mt-4 w-full">
          <h2 className="text-theme-primary font-bold mb-2">Pending Active Tasks:</h2>
          <div className="overflow-x-auto w-full pb-2">
            {pendingTasks.length > 0 ? (
              <ul className="list-none text-theme-secondary text-xs sm:text-sm space-y-2 min-w-max">
                {pendingTasks.map((t, idx) => {
                  const d = new Date(t.due);
                  const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                  return (
                    <li key={t.id}>[{String(idx + 1).padStart(2, '0')}] {t.task_name} <span className="text-theme-muted">- Due: {dateStr}</span></li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-theme-muted text-xs sm:text-sm">[No pending tasks]</div>
            )}
          </div>
        </div>
        <div className="border-t border-theme-border/50 pt-4 mt-4 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-theme-primary font-bold text-sm mb-1">NewDash Mobile Access:</h2>
            <p className="text-theme-muted text-xs">Download the standalone Android package for your phone.</p>
          </div>
          <a
            href="/NewDash.apk"
            download="NewDash.apk"
            className="px-4 py-2 border border-theme-accent text-theme-accent hover:bg-theme-accent hover:text-black font-bold text-xs sm:text-sm transition-colors uppercase whitespace-nowrap"
          >
            [INSTALL .APK]
          </a>
        </div>
      </div>
    </main>
  );
}
