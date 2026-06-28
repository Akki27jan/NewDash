import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import TerminalButton from '@/components/TerminalButton';

interface Subject {
  id: string;
  subject_name: string;
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

// Helper to format Date -> YYYY-MM-DD HH:MM
const formatToCustomDateString = (dateObj: Date, offsetMinutes: number = 0) => {
  const time = dateObj.getTime() + offsetMinutes * 60000;
  const d = new Date(time);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function TodosScreen() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  // Form State
  const [taskName, setTaskName] = useState('');
  const [dueDate, setDueDate] = useState(formatToCustomDateString(new Date(), 6));
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [subjectId, setSubjectId] = useState('');

  // Edit State
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editDue, setEditDue] = useState('');
  const [editPriority, setEditPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // SubTask Form
  const [newSubTaskName, setNewSubTaskName] = useState('');
  const [newSubTaskDue, setNewSubTaskDue] = useState(formatToCustomDateString(new Date(), 6));
  const [newSubTaskPriority, setNewSubTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // SubTask Edit
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
  const [editSubTaskName, setEditSubTaskName] = useState('');
  const [editSubTaskDue, setEditSubTaskDue] = useState('');
  const [editSubTaskPriority, setEditSubTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Status/Modals
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      if (todos.length === 0 && subjects.length === 0) setLoading(true);
      const [subRes, todoRes, subTaskRes] = await Promise.all([
        fetch(`${API_URL}/api/subjects/`, { credentials: 'include' }),
        fetch(`${API_URL}/api/todos/`, { credentials: 'include' }),
        fetch(`${API_URL}/api/subtasks/`, { credentials: 'include' })
      ]);
      if (!subRes.ok || !todoRes.ok || !subTaskRes.ok) throw new Error('Failed to fetch data');
      const subData = await subRes.json();
      setSubjects(subData);
      setTodos(await todoRes.json());
      setSubTasks(await subTaskRes.json());
      if (subData.length > 0 && !subjectId) setSubjectId(subData[0].id);
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Format YYYY-MM-DD HH:MM to ISO
  const parseCustomDateString = (str: string) => {
    const parts = str.split(' ');
    if (parts.length !== 2) return null;
    return new Date(`${parts[0]}T${parts[1]}:00`).toISOString();
  };

  const handleAddTask = async () => {
    setError(''); setSuccessMsg('');
    if (!taskName || !dueDate || !subjectId) return setError('[ERROR] Missing fields');

    const isoDate = parseCustomDateString(dueDate);
    if (!isoDate) return setError('[ERROR] Invalid date format. Use YYYY-MM-DD HH:MM');
    if (new Date(isoDate).getTime() < Date.now() + 5 * 60000) return setError('[ERROR] Task must be due at least 5 minutes from now');

    try {
      const res = await fetch(`${API_URL}/api/todos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject_id: subjectId, task_name: taskName, due: isoDate, priority }),
      });
      if (!res.ok) throw new Error('Failed to add task');
      setTaskName(''); setDueDate(formatToCustomDateString(new Date(), 6)); setPriority('Medium');
      setSuccessMsg(`[SUCCESS] Task added`);
      fetchData();
    } catch (err: any) { setError(`[ERROR] ${err.message}`); }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/todos/${id}`, { method: 'DELETE', credentials: 'include' });
      fetchData();
    } catch (err) { }
  };

  const handleSaveEdit = async () => {
    setError(''); setSuccessMsg('');
    const isoDate = parseCustomDateString(editDue);
    if (!isoDate) return setError('[ERROR] Invalid date format');
    try {
      const res = await fetch(`${API_URL}/api/todos/${editingTodoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ task_name: editTaskName, due: isoDate, priority: editPriority }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      setEditingTodoId(null);
      fetchData();
    } catch (err: any) { setError(`[ERROR] ${err.message}`); }
  };

  const handleToggleStatus = async (todo: Todo) => {
    try {
      await fetch(`${API_URL}/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: !todo.status }),
      });
      fetchData();
    } catch (err) { }
  };

  const toggleTaskExpansion = (taskId: string) => {
    const newSet = new Set(expandedTaskIds);
    newSet.has(taskId) ? newSet.delete(taskId) : newSet.add(taskId);
    setExpandedTaskIds(newSet);
  };

  // SubTasks
  const handleAddSubTask = async (taskId: string) => {
    setError(''); setSuccessMsg('');
    const isoDate = parseCustomDateString(newSubTaskDue);
    if (!isoDate) return setError('[ERROR] Invalid date format');
    const parentTask = todos.find(t => t.id === taskId);
    if (parentTask && new Date(isoDate) > new Date(parentTask.due)) return setError(`[ERROR] Sub-task due date cannot exceed parent`);

    try {
      const res = await fetch(`${API_URL}/api/subtasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ task_id: taskId, sub_task_name: newSubTaskName, due: isoDate, priority: newSubTaskPriority }),
      });
      if (!res.ok) throw new Error('Failed to add sub-task');
      setNewSubTaskName(''); setNewSubTaskDue(formatToCustomDateString(new Date(), 6));
      fetchData();
    } catch (err: any) { setError(`[ERROR] ${err.message}`); }
  };

  const cyclePriority = (current: 'Low' | 'Medium' | 'High', setter: (v: 'Low' | 'Medium' | 'High') => void) => {
    if (current === 'Low') setter('Medium');
    else if (current === 'Medium') setter('High');
    else setter('Low');
  };

  const groupedTodos = todos.reduce((acc, todo) => {
    if (!acc[todo.subject_id]) acc[todo.subject_id] = [];
    acc[todo.subject_id].push(todo);
    return acc;
  }, {} as Record<string, Todo[]>);

  const getPriorityColor = (p: string) => p === 'High' ? 'text-theme-accent' : p === 'Medium' ? 'text-theme-warning' : 'text-theme-secondary';

  return (
    <SafeAreaView className="flex-1 bg-theme-bg" edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>

        {/* Page Title */}
        <View className="border border-theme-border p-4 bg-theme-bg mb-6">
          <View className="border-b border-theme-border pb-2 mb-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text className="text-theme-primary font-bold text-lg font-mono whitespace-nowrap">
                <Text className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</Text>
                :~/todos# _
              </Text>
            </ScrollView>
          </View>
          <Text className="text-theme-secondary font-mono text-sm">
            Manage your daily task loads.
          </Text>
        </View>

        {/* Add Task Form */}
        <View className="border border-theme-border p-4 bg-theme-bg mb-6">
          <View className="border-b border-theme-border pb-2 mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text className="text-theme-primary font-bold font-mono text-lg whitespace-nowrap">
                <Text className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'guest@newdash'}</Text>
                :~/todos/add# _
              </Text>
            </ScrollView>
          </View>

          {error ? <Text className="text-theme-accent font-mono mb-4 text-sm">{error}</Text> : null}
          {successMsg ? <Text className="text-theme-success font-mono mb-4 text-sm">{successMsg}</Text> : null}

          <View className="flex-col gap-4">
            <View className="flex-col gap-1">
              <Text className="text-theme-secondary font-mono text-sm">&gt; Subject:</Text>
              <Pressable
                onPress={() => setIsSubjectModalOpen(true)}
                className="border-b border-theme-border py-2 flex-row justify-between"
              >
                <Text className="text-theme-primary font-mono">{subjects.find(s => s.id === subjectId)?.subject_name || '[ SELECT_SUBJECT ]'}</Text>
                <Text className="text-theme-muted font-mono">▼</Text>
              </Pressable>
            </View>

            <View className="flex-col gap-1">
              <Text className="text-theme-secondary font-mono text-sm">&gt; Task_Name:</Text>
              <TextInput
                value={taskName} onChangeText={setTaskName}
                className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent"
                placeholder="[ Enter Task Description ]" placeholderTextColor="#1e3a8a80"
              />
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1 flex-col gap-1">
                <Text className="text-theme-secondary font-mono text-sm">&gt; Due:</Text>
                <TextInput
                  value={dueDate} onChangeText={setDueDate}
                  className="bg-transparent border-b border-theme-border text-theme-primary py-2 font-mono focus:border-theme-accent"
                  placeholder="YYYY-MM-DD HH:MM" placeholderTextColor="#1e3a8a80"
                />
              </View>
              <View className="flex-1 flex-col gap-1">
                <Text className="text-theme-secondary font-mono text-sm">&gt; Priority:</Text>
                <Pressable onPress={() => cyclePriority(priority, setPriority)} className="border-b border-theme-border py-2">
                  <Text className={`${getPriorityColor(priority)} font-mono`}>[{priority}]</Text>
                </Pressable>
              </View>
            </View>

            <View className="self-start mt-2">
              <TerminalButton title="ADD_TASK" variant="danger" onPress={handleAddTask} />
            </View>
          </View>
        </View>

        {/* Task Tree */}
        <View className="border border-theme-border p-4 bg-theme-bg mb-8">
          <View className="border-b border-theme-border pb-2 mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text className="text-theme-primary font-bold font-mono text-lg whitespace-nowrap">
                <Text className="text-theme-accent">system</Text>:~/todos/list# tree --group-by-subject
              </Text>
            </ScrollView>
          </View>

          {loading ? (
            <Text className="text-theme-secondary font-mono">Scanning task queues...</Text>
          ) : todos.length === 0 ? (
            <Text className="text-theme-muted font-mono text-sm">No active tasks found. Enjoy the silence.</Text>
          ) : (
            <View className="flex-col gap-6">
              {Object.entries(groupedTodos).map(([subjId, subjTodos]) => {
                const subjectName = subjects.find(s => s.id === subjId)?.subject_name || subjId;
                return (
                  <View key={subjId} className="flex-col">
                    <Text className="text-[#93c5fd] font-bold font-mono border-b border-theme-border/50 pb-1 mb-2">
                      |- Directory: {subjectName}
                    </Text>

                    <View className="flex-col gap-3 pl-2">
                      {subjTodos.map((todo, index) => {
                        const isExpired = !todo.status && new Date(todo.due) < currentTime;
                        const isExpanded = expandedTaskIds.has(todo.id);

                        return (
                          <View key={todo.id} className={`border border-theme-border/50 bg-theme-border-bg p-3 ${todo.status ? 'opacity-50' : ''}`}>
                            {editingTodoId === todo.id ? (
                              <View className="flex-col gap-2">
                                <Text className="text-theme-muted font-mono text-xs">EDITING TASK</Text>
                                <TextInput value={editTaskName} onChangeText={setEditTaskName} className="border-b border-theme-border text-theme-primary py-1 font-mono focus:border-theme-accent" />
                                <View className="flex-row gap-2">
                                  <TextInput value={editDue} onChangeText={setEditDue} className="flex-1 border-b border-theme-border text-theme-primary py-1 font-mono focus:border-theme-accent" />
                                  <Pressable onPress={() => cyclePriority(editPriority, setEditPriority)} className="justify-center">
                                    <Text className={`${getPriorityColor(editPriority)} font-mono`}>[{editPriority}]</Text>
                                  </Pressable>
                                </View>
                                <View className="flex-row gap-4 mt-2">
                                  <Pressable onPress={handleSaveEdit}><Text className="text-theme-success font-mono">[SAVE]</Text></Pressable>
                                  <Pressable onPress={() => setEditingTodoId(null)}><Text className="text-theme-primary font-mono">[CANCEL]</Text></Pressable>
                                </View>
                              </View>
                            ) : (
                              <View className="flex-col gap-1">
                                <View className="flex-row items-center gap-2">
                                  <Pressable onPress={() => toggleTaskExpansion(todo.id)}>
                                    <Text className="text-theme-secondary font-mono text-lg">[{isExpanded ? '-' : '+'}]</Text>
                                  </Pressable>
                                  <Text className={`text-theme-primary font-mono font-bold flex-1 ${todo.status ? 'line-through' : ''}`}>{todo.task_name}</Text>
                                </View>

                                <View className="flex-row flex-wrap items-center mt-1">
                                  <Text className="text-theme-secondary font-mono text-xs mr-4">{formatToCustomDateString(new Date(todo.due))}</Text>
                                  <Text className={`${getPriorityColor(todo.priority)} font-mono text-xs mr-4`}>{todo.priority}</Text>
                                  {isExpired && <Text className="text-theme-accent font-mono text-xs font-bold">[EXPIRED]</Text>}
                                </View>

                                <View className="flex-row gap-4 mt-3 pt-2 border-t border-theme-border/30">
                                  <Pressable onPress={() => handleToggleStatus(todo)}>
                                    <Text className={`${todo.status ? 'text-theme-success' : 'text-theme-warning'} font-mono text-sm`}>[{todo.status ? 'DONE' : 'UNDONE'}]</Text>
                                  </Pressable>
                                  <Pressable onPress={() => { setEditingTodoId(todo.id); setEditTaskName(todo.task_name); setEditDue(formatToCustomDateString(new Date(todo.due))); setEditPriority(todo.priority); }}>
                                    <Text className="text-theme-primary font-mono text-sm">[EDIT]</Text>
                                  </Pressable>
                                  <Pressable onPress={() => handleDeleteTask(todo.id)}>
                                    <Text className="text-theme-accent font-mono text-sm">[DEL]</Text>
                                  </Pressable>
                                </View>
                              </View>
                            )}

                            {/* SubTasks Panel */}
                            {isExpanded && (
                              <View className="mt-4 p-3 border border-theme-border/50 bg-theme-bg">
                                <Text className="text-[#93c5fd] font-mono text-xs border-b border-theme-border/50 pb-1 mb-3">|- Sub-tasks</Text>

                                {/* Add Subtask Form */}
                                <View className="flex-col gap-3 mb-4 pb-4 border-b border-theme-border/30">
                                  <View className="flex-col gap-1">
                                    <Text className="text-theme-secondary font-mono text-xs">&gt; Sub-task_Name:</Text>
                                    <TextInput value={newSubTaskName} onChangeText={setNewSubTaskName} placeholder="[ Enter Name ]" placeholderTextColor="#1e3a8a80" className="bg-transparent border-b border-theme-border text-theme-primary py-1 font-mono text-sm focus:border-theme-accent" />
                                  </View>
                                  <View className="flex-row gap-4">
                                    <View className="flex-1 flex-col gap-1">
                                      <Text className="text-theme-secondary font-mono text-xs">&gt; Due:</Text>
                                      <TextInput value={newSubTaskDue} onChangeText={setNewSubTaskDue} className="bg-transparent border-b border-theme-border text-theme-primary py-1 font-mono text-sm focus:border-theme-accent" />
                                    </View>
                                    <View className="flex-1 flex-col gap-1">
                                      <Text className="text-theme-secondary font-mono text-xs">&gt; Priority:</Text>
                                      <Pressable onPress={() => cyclePriority(newSubTaskPriority, setNewSubTaskPriority)} className="border-b border-theme-border py-1">
                                        <Text className={`${getPriorityColor(newSubTaskPriority)} font-mono text-sm`}>[{newSubTaskPriority}]</Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <View className="self-start mt-1">
                                    <Pressable onPress={() => handleAddSubTask(todo.id)}>
                                      <Text className="text-theme-accent font-mono text-sm font-bold">[ADD_SUBTASK]</Text>
                                    </Pressable>
                                  </View>
                                </View>

                                {/* Subtasks List */}
                                <View className="flex-col gap-4">
                                  {subTasks.filter(st => st.task_id === todo.id).map((st, i) => {
                                    const stExpired = !st.status && new Date(st.due) < currentTime;
                                    return (
                                      <View key={st.id} className="border-l-2 border-theme-border/50 pl-3">
                                        <View className="flex-row gap-2 items-center">
                                          <Text className="text-theme-muted font-mono text-xs">[{String(i + 1).padStart(2, '0')}]</Text>
                                          <Text className={`text-theme-primary font-mono text-sm font-bold ${st.status ? 'line-through opacity-50' : ''}`}>{st.sub_task_name}</Text>
                                        </View>
                                        <View className="flex-row items-center gap-3 mt-1">
                                          <Text className="text-theme-secondary font-mono text-xs">{formatToCustomDateString(new Date(st.due))}</Text>
                                          <Text className={`${getPriorityColor(st.priority)} font-mono text-xs`}>[{st.priority}]</Text>
                                          {stExpired && <Text className="text-theme-accent font-mono text-xs font-bold">[EXPIRED]</Text>}
                                        </View>
                                        <View className="flex-row gap-4 mt-2">
                                          <Pressable onPress={async () => {
                                            await fetch(`${API_URL}/api/subtasks/${st.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status: !st.status }) });
                                            fetchData();
                                          }}>
                                            <Text className={`${st.status ? 'text-theme-success' : 'text-theme-warning'} font-mono text-xs`}>[{st.status ? 'DONE' : 'UNDONE'}]</Text>
                                          </Pressable>
                                          <Pressable onPress={async () => {
                                            await fetch(`${API_URL}/api/subtasks/${st.id}`, { method: 'DELETE', credentials: 'include' });
                                            fetchData();
                                          }}>
                                            <Text className="text-theme-accent font-mono text-xs">[DEL]</Text>
                                          </Pressable>
                                        </View>
                                      </View>
                                    );
                                  })}
                                  {subTasks.filter(st => st.task_id === todo.id).length === 0 && (
                                    <Text className="text-theme-muted font-mono text-xs">No sub-tasks. Directory empty.</Text>
                                  )}
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              <View className="mt-4 pt-4 border-t border-theme-border/30">
                <Text className="text-theme-muted font-mono text-xs">Total pending: {todos.filter(t => !t.status).length}</Text>
                <Text className="text-theme-muted font-mono text-xs">Total completed: {todos.filter(t => t.status).length}</Text>
                <Text className="text-theme-muted font-mono text-xs">EOF</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Subject Selector Modal */}
      <Modal visible={isSubjectModalOpen} transparent={true} animationType="fade" onRequestClose={() => setIsSubjectModalOpen(false)}>
        <View className="flex-1 justify-center items-center bg-[#000000cc] p-4">
          <View className="w-full max-w-sm border border-theme-border bg-theme-bg shadow-lg shadow-theme-primary/20">
            <View className="bg-theme-border px-2 py-1 flex-row justify-between items-center">
              <Text className="text-black font-mono text-xs font-bold">SELECT_SUBJECT</Text>
            </View>
            <ScrollView className="max-h-64 p-2">
              {subjects.map(s => (
                <Pressable
                  key={s.id}
                  onPress={() => { setSubjectId(s.id); setIsSubjectModalOpen(false); }}
                  className="py-3 px-2 border-b border-theme-border/30 active:bg-theme-border/20"
                >
                  <Text className="text-theme-primary font-mono text-sm">&gt; {s.subject_name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => setIsSubjectModalOpen(false)} className="bg-theme-border-bg p-2 border-t border-theme-border items-center">
              <Text className="text-theme-secondary font-mono text-xs">^X Exit [CANCEL]</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
