"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';

export default function DashboardPage() {
  const [subjectCount, setSubjectCount] = useState<number | string>('...');
  const { user } = useAuth();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch(`${API_URL}/api/subjects/`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setSubjectCount(data.length);
        } else {
          setSubjectCount('ERROR');
        }
      } catch (err) {
        setSubjectCount('ERROR');
      }
    };
    fetchSubjects();
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
        <div className="text-blue-800 text-sm mb-8">
          [System status: ONLINE] <br />
          [Active modules: {subjectCount}]
        </div>
      </div>
    </main>
  );
}
