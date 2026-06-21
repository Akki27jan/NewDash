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

interface SubTask {
  id: string;
  task_id: string;
  sub_task_name: string;
  status: boolean;
  due: string;
  priority: 'Low' | 'Medium' | 'High';
}

export default function TodosPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  // Add Form State
  const getLocalISOString = (dateObj: Date = new Date(), offsetMinutes: number = 0) => {
    const time = dateObj.getTime() + offsetMinutes * 60000;
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    return new Date(time - tzOffset).toISOString().slice(0, 16);
  };

  const [taskName, setTaskName] = useState('');
  const [dueDate, setDueDate] = useState(getLocalISOString(new Date(), 6));
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [subjectId, setSubjectId] = useState('');

  // Edit State (Todo)
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editDue, setEditDue] = useState('');
  const [editPriority, setEditPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // SubTask Form State
  const [newSubTaskName, setNewSubTaskName] = useState('');
  const [newSubTaskDue, setNewSubTaskDue] = useState(getLocalISOString(new Date(), 6));
  const [newSubTaskPriority, setNewSubTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Edit State (SubTask)
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
  const [editSubTaskName, setEditSubTaskName] = useState('');
  const [editSubTaskDue, setEditSubTaskDue] = useState('');
  const [editSubTaskPriority, setEditSubTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Status State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Real-time tracking for EXPIRED tags
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      if (todos.length === 0 && subjects.length === 0) {
        setLoading(true);
      }
      const [subRes, todoRes, subTaskRes] = await Promise.all([
        fetch(`${API_URL}/api/subjects/`, { credentials: 'include' }),
        fetch(`${API_URL}/api/todos/`, { credentials: 'include' }),
        fetch(`${API_URL}/api/subtasks/`, { credentials: 'include' })
      ]);

      if (!subRes.ok) throw new Error('Failed to fetch subjects');
      if (!todoRes.ok) throw new Error('Failed to fetch todos');
      if (!subTaskRes.ok) throw new Error('Failed to fetch subtasks');

      const subData = await subRes.json();
      const todoData = await todoRes.json();
      const subTaskData = await subTaskRes.json();

      setSubjects(subData);
      setTodos(todoData);
      setSubTasks(subTaskData);

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

    if (new Date(dueDate).getTime() < Date.now() + 5 * 60000) {
      setError('[ERROR] Task must be due at least 5 minutes from now');
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
      setDueDate(getLocalISOString(new Date(), 6));
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

  const toggleTaskExpansion = (taskId: string) => {
    const newSet = new Set(expandedTaskIds);
    if (newSet.has(taskId)) {
      newSet.delete(taskId);
    } else {
      newSet.add(taskId);
    }
    setExpandedTaskIds(newSet);
  };

  const handleAddSubTask = async (taskId: string) => {
    setError('');
    setSuccessMsg('');
    if (!newSubTaskName || !newSubTaskDue) {
      setError('[ERROR] Missing fields for sub-task');
      return;
    }

    if (new Date(newSubTaskDue).getTime() <= Date.now()) {
      setError('[ERROR] Sub-task due date must be in the future');
      return;
    }

    const parentTask = todos.find(t => t.id === taskId);
    if (parentTask && new Date(newSubTaskDue) > new Date(parentTask.due)) {
      setError(`[ERROR] Sub-task due date cannot exceed parent due date`);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/subtasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          task_id: taskId,
          sub_task_name: newSubTaskName,
          due: new Date(newSubTaskDue).toISOString(),
          priority: newSubTaskPriority,
        }),
      });
      if (!res.ok) throw new Error('Failed to add sub-task');
      setNewSubTaskName('');
      setNewSubTaskDue(getLocalISOString(new Date(), 6));
      setNewSubTaskPriority('Medium');
      setSuccessMsg(`[SUCCESS] Sub-task added successfully`);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`[ERROR] ${msg}`);
    }
  };

  const handleDeleteSubTask = async (id: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/subtasks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete sub-task');
      setSuccessMsg(`[SUCCESS] Sub-task deleted`);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`[ERROR] ${msg}`);
    }
  };

  const handleEditSubTaskClick = (st: SubTask) => {
    setEditingSubTaskId(st.id);
    setEditSubTaskName(st.sub_task_name);
    setEditSubTaskDue(getLocalISOString(new Date(st.due)));
    setEditSubTaskPriority(st.priority);
  };

  const handleSaveEditSubTask = async () => {
    setError('');
    setSuccessMsg('');

    const st = subTasks.find(s => s.id === editingSubTaskId);
    const parentTask = st ? todos.find(t => t.id === st.task_id) : null;
    if (parentTask && new Date(editSubTaskDue) > new Date(parentTask.due)) {
      setError(`[ERROR] Sub-task due date cannot exceed parent due date`);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/subtasks/${editingSubTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sub_task_name: editSubTaskName,
          due: new Date(editSubTaskDue).toISOString(),
          priority: editSubTaskPriority,
        }),
      });
      if (!res.ok) throw new Error('Failed to update sub-task');
      setSuccessMsg(`[SUCCESS] Sub-task updated`);
      setEditingSubTaskId(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`[ERROR] ${msg}`);
    }
  };

  const handleToggleSubTaskStatus = async (st: SubTask) => {
    try {
      const res = await fetch(`${API_URL}/api/subtasks/${st.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: !st.status }),
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
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h1 className="text-theme-primary font-bold text-2xl mb-4 border-b border-theme-border pb-2">
          <span className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</span>:~/todos# _
        </h1>
        <p className="text-theme-secondary mb-2">
          Manage your daily task loads. Use the form below to allocate tasks to subjects.
        </p>
      </div>

      {/* Add Task Form */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h2 className="text-theme-primary font-bold mb-4 border-b border-theme-border pb-2">
          <span className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'guest@newdash'}</span>:~/todos/add# _
        </h2>

        {error && <div className="text-theme-accent mb-4">{error}</div>}
        {successMsg && <div className="text-theme-success mb-4">{successMsg}</div>}

        <form onSubmit={handleAddTask} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-theme-secondary w-32">&gt; Subject:</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="bg-transparent border border-theme-border text-theme-primary p-1 flex-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent"
            >
              <option value="" className="bg-theme-bg text-theme-primary">-- Select Subject --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id} className="bg-theme-bg text-theme-primary">
                  {s.subject_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-theme-secondary w-32">&gt; Task_Name:</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="bg-transparent border border-theme-border text-theme-primary p-1 flex-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent placeholder-theme-border"
              placeholder="[ Enter Task Description ]"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-theme-secondary w-32">&gt; Due_Date:</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-transparent border border-theme-border text-theme-primary p-1 flex-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent color-scheme-dark"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-theme-secondary w-32">&gt; Priority:</label>
            <select
              value={priority}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value as 'Low' | 'Medium' | 'High')}
              className="bg-transparent border border-theme-border text-theme-primary p-1 flex-1 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent"
            >
              <option value="Low" className="bg-theme-bg text-theme-primary">Low</option>
              <option value="Medium" className="bg-theme-bg text-theme-primary">Medium</option>
              <option value="High" className="bg-theme-bg text-theme-primary">High</option>
            </select>
          </div>

          <div className="mt-4">
            <Button type="submit" label="ADD_TASK" color="red" />
          </div>
        </form>
      </div>

      {/* Task List (Grouped by Subject) */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h2 className="text-theme-primary font-bold mb-4 border-b border-theme-border pb-2">
          <span className="text-theme-accent">system</span>:~/todos/list# tree --group-by-subject
        </h2>

        {loading ? (
          <div className="text-theme-secondary animate-pulse">Scanning task queues...</div>
        ) : todos.length === 0 ? (
          <div className="text-theme-muted">No active tasks found. Enjoy the silence.</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTodos).map(([subjId, subjTodos]) => {
              const subjectName = subjects.find(s => s.id === subjId)?.subject_name || subjId;
              return (
                <div key={subjId}>
                  <h3 className="text-blue-300 font-bold mb-2 border-b border-theme-border/50 pb-1">
                    |- Directory: {subjectName}
                  </h3>
                  <div className="overflow-x-auto pl-4">
                    <div className="md:hidden text-theme-muted text-xs animate-pulse mb-2">[ swipe left/right to view details ]</div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-theme-muted border-b border-theme-border/30 text-sm whitespace-nowrap">
                          <th className="py-2 pr-4 font-normal">S.NO</th>
                          <th className="py-2 pr-4 font-normal">TASK</th>
                          <th className="py-2 pr-4 font-normal">DUE</th>
                          <th className="py-2 pr-4 font-normal">PRIORITY</th>
                          <th className="py-2 pr-4 font-normal">STATUS</th>
                          <th className="py-2 pr-4 font-normal text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="text-theme-primary whitespace-nowrap">
                        {subjTodos.map((todo, index) => {
                          const isExpired = !todo.status && new Date(todo.due) < currentTime;
                          return (
                          <React.Fragment key={todo.id}>
                            <tr className={`border-b border-theme-border/20 hover:bg-theme-border/10 transition-colors ${todo.status ? 'opacity-50' : ''}`}>
                              <td className="py-2 pr-4 text-xs text-theme-muted">[{String(index + 1).padStart(2, '0')}]</td>

                              {editingTodoId === todo.id ? (
                                <>
                                  <td className="py-2 pr-4">
                                    <input
                                      value={editTaskName}
                                      onChange={(e) => setEditTaskName(e.target.value)}
                                      className="bg-theme-bg border border-theme-border text-theme-primary p-1 w-full focus:outline-none focus:border-theme-accent text-sm"
                                    />
                                  </td>
                                  <td className="py-2 pr-4">
                                    <input
                                      type="datetime-local"
                                      value={editDue}
                                      onChange={(e) => setEditDue(e.target.value)}
                                      className="bg-theme-bg border border-theme-border text-theme-primary p-1 w-full focus:outline-none focus:border-theme-accent text-sm"
                                      style={{ colorScheme: 'dark' }}
                                    />
                                  </td>
                                  <td className="py-2 pr-4">
                                    <select
                                      value={editPriority}
                                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditPriority(e.target.value as 'Low' | 'Medium' | 'High')}
                                      className="bg-theme-bg border border-theme-border text-theme-primary p-1 focus:outline-none focus:border-theme-accent text-sm"
                                    >
                                      <option value="Low">Low</option>
                                      <option value="Medium">Medium</option>
                                      <option value="High">High</option>
                                    </select>
                                  </td>
                                  <td className="py-2 pr-4 text-theme-muted text-sm">{todo.status ? 'DONE' : 'PENDING'}</td>
                                  <td className="py-2 pr-4 text-right">
                                    <button onClick={handleSaveEdit} className="text-theme-success hover:text-theme-success-hover px-2 py-1 focus:outline-none text-sm">[SAVE]</button>
                                    <button onClick={() => setEditingTodoId(null)} className="text-theme-primary hover:text-theme-secondary px-2 py-1 focus:outline-none text-sm">[CANCEL]</button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-2 pr-4 text-sm" style={{ textDecoration: todo.status ? 'line-through' : 'none' }}>
                                    <button onClick={() => toggleTaskExpansion(todo.id)} className="text-theme-secondary hover:text-blue-300 mr-2 focus:outline-none">
                                      [{expandedTaskIds.has(todo.id) ? '-' : '+'}]
                                    </button>
                                    {todo.task_name}
                                  </td>
                                  <td className="py-2 pr-4 text-sm whitespace-nowrap text-theme-secondary">
                                    {(() => {
                                      const d = new Date(todo.due);
                                      const day = String(d.getDate()).padStart(2, '0');
                                      const month = String(d.getMonth() + 1).padStart(2, '0');
                                      const year = d.getFullYear();
                                      const hours = String(d.getHours()).padStart(2, '0');
                                      const mins = String(d.getMinutes()).padStart(2, '0');
                                      return `${day}/${month}/${year} ${hours}:${mins}`;
                                    })()}
                                    {isExpired && <span className="text-theme-accent ml-2 animate-pulse">[EXPIRED]</span>}
                                  </td>
                                  <td className="py-2 pr-4 text-sm">
                                    <span className={todo.priority === 'High' ? 'text-theme-accent-hover' : todo.priority === 'Medium' ? 'text-theme-warning' : 'text-theme-secondary'}>
                                      {todo.priority}
                                    </span>
                                  </td>
                                  <td className="py-2 pr-4 text-sm">
                                    <button
                                      onClick={() => handleToggleStatus(todo)}
                                      className={todo.status ? "text-theme-success hover:text-theme-accent-hover focus:outline-none" : "text-theme-warning-hover hover:text-theme-success-hover focus:outline-none"}
                                    >
                                      [{todo.status ? 'DONE' : 'UNDONE'}]
                                    </button>
                                  </td>
                                  <td className="py-2 pr-4 text-right whitespace-nowrap">
                                    <button onClick={() => handleEditClick(todo)} className="text-theme-primary hover:text-theme-secondary px-2 py-1 focus:outline-none text-sm">
                                      [EDIT]
                                    </button>
                                    <button onClick={() => handleDeleteTask(todo.id)} className="text-theme-accent hover:bg-theme-accent-bg px-2 py-1 focus:outline-none text-sm">
                                      [DEL]
                                    </button>
                                  </td>
                                </>
                              )}
                            </tr>
                            {expandedTaskIds.has(todo.id) && (
                              <tr className="bg-theme-border/10">
                                <td colSpan={6} className="p-4 border-b border-theme-border/30">
                                  <div className="text-blue-300 text-sm mb-4 border-b border-theme-border/50 pb-1 w-full">
                                    |- Sub-tasks for [{todo.task_name}]
                                  </div>
                                  <div className="mb-4 flex flex-col sm:flex-row gap-2">
                                    <input type="text" value={newSubTaskName} onChange={e => setNewSubTaskName(e.target.value)} placeholder="[ New Sub-task Name ]" className="bg-transparent border border-theme-border text-theme-primary p-1 focus:outline-none focus:border-theme-accent text-sm flex-1" />
                                    <input type="datetime-local" value={newSubTaskDue} max={getLocalISOString(new Date(todo.due))} onChange={e => setNewSubTaskDue(e.target.value)} className="bg-transparent border border-theme-border text-theme-primary p-1 focus:outline-none focus:border-theme-accent text-sm" style={{ colorScheme: 'dark' }} />
                                    <select value={newSubTaskPriority} onChange={e => setNewSubTaskPriority(e.target.value as 'Low' | 'Medium' | 'High')} className="bg-transparent border border-theme-border text-theme-primary p-1 focus:outline-none focus:border-theme-accent text-sm">
                                      <option value="Low" className="bg-theme-bg text-theme-primary">Low</option>
                                      <option value="Medium" className="bg-theme-bg text-theme-primary">Medium</option>
                                      <option value="High" className="bg-theme-bg text-theme-primary">High</option>
                                    </select>
                                    <button onClick={() => handleAddSubTask(todo.id)} className="text-theme-accent hover:bg-theme-accent-bg border border-theme-accent px-3 py-1 text-sm focus:outline-none">[ADD]</button>
                                  </div>

                                  {subTasks.filter(st => st.task_id === todo.id).length > 0 ? (
                                    <div className="overflow-x-auto ml-4 border-l border-theme-border/50 pl-4">
                                      <table className="w-full text-left border-collapse border-spacing-0">
                                        <tbody>
                                          {subTasks.filter(st => st.task_id === todo.id).map((st, i) => {
                                            const isSubTaskExpired = !st.status && new Date(st.due) < currentTime;
                                            return (
                                            <tr key={st.id} className={`border-b border-theme-border/20 hover:bg-theme-border/20 transition-colors ${st.status ? 'opacity-50' : ''}`}>
                                              <td className="py-1 pr-4 text-xs text-theme-muted w-8">[{String(i + 1).padStart(2, '0')}]</td>
                                              {editingSubTaskId === st.id ? (
                                                <>
                                                  <td className="py-1 pr-2"><input value={editSubTaskName} onChange={e => setEditSubTaskName(e.target.value)} className="bg-theme-bg border border-theme-border text-theme-primary p-1 w-full focus:outline-none focus:border-theme-accent text-xs" /></td>
                                                  <td className="py-1 pr-2"><input type="datetime-local" value={editSubTaskDue} max={getLocalISOString(new Date(todo.due))} onChange={e => setEditSubTaskDue(e.target.value)} className="bg-theme-bg border border-theme-border text-theme-primary p-1 w-full focus:outline-none focus:border-theme-accent text-xs" style={{ colorScheme: 'dark' }} /></td>
                                                  <td className="py-1 pr-2"><select value={editSubTaskPriority} onChange={e => setEditSubTaskPriority(e.target.value as 'Low' | 'Medium' | 'High')} className="bg-theme-bg border border-theme-border text-theme-primary p-1 focus:outline-none focus:border-theme-accent text-xs"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></td>
                                                  <td className="py-1 pr-2 text-right whitespace-nowrap">
                                                    <button onClick={handleSaveEditSubTask} className="text-theme-success hover:text-theme-success-hover px-1 text-xs">[SAVE]</button>
                                                    <button onClick={() => setEditingSubTaskId(null)} className="text-theme-primary hover:text-theme-secondary px-1 text-xs">[CANCEL]</button>
                                                  </td>
                                                </>
                                              ) : (
                                                <>
                                                  <td className="py-1 pr-4 text-sm" style={{ textDecoration: st.status ? 'line-through' : 'none' }}>{st.sub_task_name}</td>
                                                  <td className="py-1 pr-4 text-xs text-theme-secondary whitespace-nowrap">
                                                    {new Date(st.due).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    {isSubTaskExpired && <span className="text-theme-accent ml-2 animate-pulse">[EXPIRED]</span>}
                                                  </td>
                                                  <td className="py-1 pr-4 text-xs"><span className={st.priority === 'High' ? 'text-theme-accent-hover' : st.priority === 'Medium' ? 'text-theme-warning' : 'text-theme-secondary'}>{st.priority}</span></td>
                                                  <td className="py-1 pr-4 text-xs">
                                                    <button onClick={() => handleToggleSubTaskStatus(st)} className={st.status ? "text-theme-success hover:text-theme-accent-hover" : "text-theme-warning-hover hover:text-theme-success-hover"}>[{st.status ? 'DONE' : 'UNDONE'}]</button>
                                                  </td>
                                                  <td className="py-1 pr-4 text-right whitespace-nowrap">
                                                    <button onClick={() => handleEditSubTaskClick(st)} className="text-theme-primary hover:text-theme-secondary px-1 text-xs">[EDIT]</button>
                                                    <button onClick={() => handleDeleteSubTask(st.id)} className="text-theme-accent hover:text-theme-accent-hover px-1 text-xs">[DEL]</button>
                                                  </td>
                                                </>
                                              )}
                                            </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="text-theme-muted text-xs ml-4 border-l border-theme-border/50 pl-4 py-2">No sub-tasks. Directory empty.</div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            <div className="text-theme-muted text-sm mt-4 pt-4 border-t border-theme-border/30">
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
