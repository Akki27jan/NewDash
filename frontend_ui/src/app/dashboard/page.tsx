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
      <div className="border border-blue-900 p-6 bg-black">
        <h1 className="text-blue-500 font-bold text-2xl mb-4 border-b border-blue-900 pb-2">
          <span className="text-red-500">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</span>:~# _
        </h1>
        <p className="text-blue-400 mb-6">
          Welcome to the NewDash module control center. You have successfully authenticated.
        </p>
        <div className="text-blue-800 text-sm mb-4">
          [System status: ONLINE] <br />
          [Number of Subjects: {subjectCount}]
        </div>
        
        <div className="border-t border-blue-900/50 pt-4 mt-4">
          <h2 className="text-blue-500 font-bold mb-2">Pending Active Tasks:</h2>
          {pendingTasks.length > 0 ? (
            <ul className="list-none text-blue-400 text-sm space-y-1">
              {pendingTasks.map((t, idx) => {
                const d = new Date(t.due);
                const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                return (
                  <li key={t.id}>[{String(idx+1).padStart(2, '0')}] {t.task_name} <span className="text-blue-600">- Due: {dateStr}</span></li>
                );
              })}
            </ul>
          ) : (
            <div className="text-blue-800 text-sm">[No pending tasks]</div>
          )}
        </div>
      </div>
    </main>
  );
}
