"use client";

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';

interface Subject {
  id: string;
  subject_name: string;
  credits: number;
}

interface Todo {
  id: string;
  student_id: string;
  subject_id: string;
  task_name: string;
  status: boolean;
  due: string;
  priority: 'Low' | 'Medium' | 'High';
}

export default function TodosPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);

  // Add Form State
  const getLocalISOString = (dateObj: Date = new Date()) => {
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    return new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [taskName, setTaskName] = useState('');
  const [dueDate, setDueDate] = useState(getLocalISOString());
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [subjectId, setSubjectId] = useState('');

  // Edit State
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editDue, setEditDue] = useState('');
  const [editPriority, setEditPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Status State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      if (todos.length === 0 && subjects.length === 0) {
        setLoading(true);
      }
      const [subRes, todoRes] = await Promise.all([
        fetch(`${API_URL}/api/subjects/`, { credentials: 'include' }),
        fetch(`${API_URL}/api/todos/`, { credentials: 'include' })
      ]);

      if (!subRes.ok) throw new Error('Failed to fetch subjects');
      if (!todoRes.ok) throw new Error('Failed to fetch todos');

      const subData = await subRes.json();
      const todoData = await todoRes.json();

      setSubjects(subData);
      setTodos(todoData);

      if (subData.length > 0 && !subjectId) {
        setSubjectId(subData[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!taskName || !dueDate || !subjectId) {
      setError('[ERROR] Missing fields');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/todos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject_id: subjectId,
          task_name: taskName,
          due: new Date(dueDate).toISOString(),
          priority: priority,
        }),
      });

      if (!res.ok) throw new Error('Failed to add task');

      setTaskName('');
      setDueDate(getLocalISOString());
      setPriority('Medium');
      setSuccessMsg(`[SUCCESS] Task added successfully`);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`[ERROR] ${msg}`);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/todos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete task');
      setSuccessMsg(`[SUCCESS] Task deleted`);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`[ERROR] ${msg}`);
    }
  };

  const handleEditClick = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditTaskName(todo.task_name);
    setEditDue(getLocalISOString(new Date(todo.due)));
    setEditPriority(todo.priority);
  };

  const handleSaveEdit = async () => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/todos/${editingTodoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          task_name: editTaskName,
          due: new Date(editDue).toISOString(),
          priority: editPriority,
        }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      setSuccessMsg(`[SUCCESS] Task updated`);
      setEditingTodoId(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`[ERROR] ${msg}`);
    }
  };

  const handleToggleStatus = async (todo: Todo) => {
    try {
      const res = await fetch(`${API_URL}/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: !todo.status }),
      });
      if (!res.ok) throw new Error('Failed to toggle status');
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`[ERROR] ${msg}`);
    }
  };

  // Group by Subject ID
  const groupedTodos = todos.reduce((acc, todo) => {
    if (!acc[todo.subject_id]) acc[todo.subject_id] = [];
    acc[todo.subject_id].push(todo);
    return acc;
  }, {} as Record<string, Todo[]>);

  return (
    <main className="flex-grow flex flex-col gap-8 mt-8 max-w-5xl mx-auto w-full px-4 mb-8">

      {/* Page Title */}
      <div className="border border-blue-900 p-6 bg-black">
        <h1 className="text-blue-500 font-bold text-2xl mb-4 border-b border-blue-900 pb-2">
          <span className="text-red-500">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</span>:~/todos# _
        </h1>
        <p className="text-blue-400 mb-2">
          Manage your daily task loads. Use the form below to allocate tasks to subjects.
        </p>
      </div>

      {/* Add Task Form */}
      <div className="border border-blue-900 p-6 bg-black">
        <h2 className="text-blue-500 font-bold mb-4 border-b border-blue-900 pb-2">
          <span className="text-red-500">{user ? `${user.first_name}_${user.last_name}@newdash` : 'guest@newdash'}</span>:~/todos/add# _
        </h2>

        {error && <div className="text-red-500 mb-4">{error}</div>}
        {successMsg && <div className="text-green-500 mb-4">{successMsg}</div>}

        <form onSubmit={handleAddTask} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-blue-400 w-32">&gt; Subject:</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="bg-transparent border border-blue-900 text-blue-500 p-1 flex-1 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              <option value="" className="bg-black text-blue-500">-- Select Subject --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id} className="bg-black text-blue-500">
                  {s.subject_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-blue-400 w-32">&gt; Task_Name:</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="bg-transparent border border-blue-900 text-blue-500 p-1 flex-1 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder-blue-900"
              placeholder="[ Enter Task Description ]"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-blue-400 w-32">&gt; Due_Date:</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-transparent border border-blue-900 text-blue-500 p-1 flex-1 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 color-scheme-dark"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-blue-400 w-32">&gt; Priority:</label>
            <select
              value={priority}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value as any)}
              className="bg-transparent border border-blue-900 text-blue-500 p-1 flex-1 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              <option value="Low" className="bg-black text-blue-500">Low</option>
              <option value="Medium" className="bg-black text-blue-500">Medium</option>
              <option value="High" className="bg-black text-blue-500">High</option>
            </select>
          </div>

          <div className="mt-4">
            <Button type="submit" label="ADD_TASK" color="red" />
          </div>
        </form>
      </div>

      {/* Task List (Grouped by Subject) */}
      <div className="border border-blue-900 p-6 bg-black">
        <h2 className="text-blue-500 font-bold mb-4 border-b border-blue-900 pb-2">
          <span className="text-red-500">system</span>:~/todos/list# tree --group-by-subject
        </h2>

        {loading ? (
          <div className="text-blue-400 animate-pulse">Scanning task queues...</div>
        ) : todos.length === 0 ? (
          <div className="text-blue-800">No active tasks found. Enjoy the silence.</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTodos).map(([subjId, subjTodos]) => {
              const subjectName = subjects.find(s => s.id === subjId)?.subject_name || subjId;
              return (
                <div key={subjId}>
                  <h3 className="text-blue-300 font-bold mb-2 border-b border-blue-900/50 pb-1">
                    |- Directory: {subjectName}
                  </h3>
                  <div className="overflow-x-auto pl-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-blue-800 border-b border-blue-900/30 text-sm">
                          <th className="py-2 pr-4 font-normal">S.NO</th>
                          <th className="py-2 pr-4 font-normal">TASK</th>
                          <th className="py-2 pr-4 font-normal">DUE</th>
                          <th className="py-2 pr-4 font-normal">PRIORITY</th>
                          <th className="py-2 pr-4 font-normal">STATUS</th>
                          <th className="py-2 pr-4 font-normal text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="text-blue-500">
                        {subjTodos.map((todo, index) => (
                          <tr key={todo.id} className={`border-b border-blue-900/20 hover:bg-blue-900/10 transition-colors ${todo.status ? 'opacity-50' : ''}`}>
                            <td className="py-2 pr-4 text-xs text-blue-600">[{String(index + 1).padStart(2, '0')}]</td>

                            {editingTodoId === todo.id ? (
                              <>
                                <td className="py-2 pr-4">
                                  <input
                                    value={editTaskName}
                                    onChange={(e) => setEditTaskName(e.target.value)}
                                    className="bg-black border border-blue-900 text-blue-500 p-1 w-full focus:outline-none focus:border-red-500 text-sm"
                                  />
                                </td>
                                <td className="py-2 pr-4">
                                  <input
                                    type="datetime-local"
                                    value={editDue}
                                    onChange={(e) => setEditDue(e.target.value)}
                                    className="bg-black border border-blue-900 text-blue-500 p-1 w-full focus:outline-none focus:border-red-500 text-sm"
                                    style={{ colorScheme: 'dark' }}
                                  />
                                </td>
                                <td className="py-2 pr-4">
                                  <select
                                    value={editPriority}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditPriority(e.target.value as any)}
                                    className="bg-black border border-blue-900 text-blue-500 p-1 focus:outline-none focus:border-red-500 text-sm"
                                  >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                  </select>
                                </td>
                                <td className="py-2 pr-4 text-blue-800 text-sm">{todo.status ? 'DONE' : 'PENDING'}</td>
                                <td className="py-2 pr-4 text-right">
                                  <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-400 px-2 py-1 focus:outline-none text-sm">[SAVE]</button>
                                  <button onClick={() => setEditingTodoId(null)} className="text-blue-500 hover:text-blue-400 px-2 py-1 focus:outline-none text-sm">[CANCEL]</button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-2 pr-4 text-sm" style={{ textDecoration: todo.status ? 'line-through' : 'none' }}>
                                  {todo.task_name}
                                </td>
                                <td className="py-2 pr-4 text-sm whitespace-nowrap text-blue-400">
                                  {(() => {
                                    const d = new Date(todo.due);
                                    const day = String(d.getDate()).padStart(2, '0');
                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                    const year = d.getFullYear();
                                    const hours = String(d.getHours()).padStart(2, '0');
                                    const mins = String(d.getMinutes()).padStart(2, '0');
                                    return `${day}/${month}/${year} ${hours}:${mins}`;
                                  })()}
                                </td>
                                <td className="py-2 pr-4 text-sm">
                                  <span className={todo.priority === 'High' ? 'text-red-400' : todo.priority === 'Medium' ? 'text-yellow-400' : 'text-blue-400'}>
                                    {todo.priority}
                                  </span>
                                </td>
                                <td className="py-2 pr-4 text-sm">
                                  <button
                                    onClick={() => handleToggleStatus(todo)}
                                    className={todo.status ? "text-green-500 hover:text-red-400 focus:outline-none" : "text-yellow-500 hover:text-green-400 focus:outline-none"}
                                  >
                                    [{todo.status ? 'DONE' : 'UNDONE'}]
                                  </button>
                                </td>
                                <td className="py-2 pr-4 text-right whitespace-nowrap">
                                  <button onClick={() => handleEditClick(todo)} className="text-blue-500 hover:text-blue-400 px-2 py-1 focus:outline-none text-sm">
                                    [EDIT]
                                  </button>
                                  <button onClick={() => handleDeleteTask(todo.id)} className="text-red-500 hover:bg-red-950 px-2 py-1 focus:outline-none text-sm">
                                    [DEL]
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            <div className="text-blue-800 text-sm mt-4 pt-4 border-t border-blue-900/30">
              Total pending tasks: {todos.filter(t => !t.status).length} <br />
              Total completed tasks: {todos.filter(t => t.status).length}<br />
              EOF
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
