"use client";

import React, { useEffect, useRef } from 'react';
import { API_URL } from '@/lib/api';

interface Todo {
  id: string;
  task_name: string;
  due: string;
  status: boolean;
}

export default function NotificationEngine() {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Request permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const fetchAndCheckTodos = async () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/todos/`, {
          credentials: 'include'
        });
        
        if (!res.ok) return;
        
        const todos: Todo[] = await res.json();
        const now = new Date().getTime();
        
        // Get locally tracked notifications
        const notifiedData = localStorage.getItem('notified_tasks');
        const notified = notifiedData ? JSON.parse(notifiedData) : {};
        let modified = false;

        todos.forEach(todo => {
          if (todo.status) return; // Skip completed
          
          const dueTime = new Date(todo.due).getTime();
          const deltaMinutes = (dueTime - now) / (1000 * 60);

          if (deltaMinutes <= 0 && deltaMinutes > -60 && !notified[`${todo.id}_0m`]) {
            new Notification("Task Expired!", { body: `Your task '${todo.task_name}' has just expired.` });
            notified[`${todo.id}_0m`] = true;
            notified[`${todo.id}_5m`] = true;
            notified[`${todo.id}_10m`] = true;
            modified = true;
          } 
          else if (deltaMinutes <= 5 && deltaMinutes > 0 && !notified[`${todo.id}_5m`]) {
            new Notification("Task Expiring Soon", { body: `Your task '${todo.task_name}' is due in less than 5 minutes!` });
            notified[`${todo.id}_5m`] = true;
            notified[`${todo.id}_10m`] = true;
            modified = true;
          }
          else if (deltaMinutes <= 10 && deltaMinutes > 5 && !notified[`${todo.id}_10m`]) {
            new Notification("Task Reminder", { body: `Your task '${todo.task_name}' is due in 10 minutes.` });
            notified[`${todo.id}_10m`] = true;
            modified = true;
          }
        });

        if (modified) {
          localStorage.setItem('notified_tasks', JSON.stringify(notified));
        }
      } catch (err) {
        console.error("NotificationEngine failed to fetch tasks", err);
      }
    };

    // Run once immediately, then every 30 seconds
    fetchAndCheckTodos();
    checkIntervalRef.current = setInterval(fetchAndCheckTodos, 30000);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, []);

  return null; // Headless component
}
