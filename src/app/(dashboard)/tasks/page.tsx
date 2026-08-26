'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckSquare, Plus, Play, Square, MessageSquare, X } from 'lucide-react';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h > 0 ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [now, setNow] = useState(() => Date.now());
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', projectId: '', assigneeId: '', priority: 'Medium' });
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTasks = () => {
    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => {
        if (data.tasks) setTasks(data.tasks);
      });
  };

  const fetchTimer = () => {
    fetch('/api/timer/active')
      .then((res) => res.json())
      .then((data) => setActiveTimer(data.timer || null));
  };

  useEffect(() => {
    fetchTasks();
    fetchTimer();
    fetch('/api/employees').then((r) => r.json()).then((d) => d.employees && setMembers(d.employees));
    fetch('/api/projects').then((r) => r.json()).then((d) => d.projects && setProjects(d.projects));
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      if (d?.user?.id) {
        setCurrentUserId(d.user.id);
        setForm((f) => ({ ...f, assigneeId: d.user.id }));
      }
    });
  }, []);

  useEffect(() => {
    if (activeTimer) {
      tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    } else if (tickRef.current) {
      clearInterval(tickRef.current);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [activeTimer]);

  const startTimer = async (taskId: string) => {
    const res = await fetch('/api/timer/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });
    const data = await res.json();
    if (data.timer) setActiveTimer(data.timer);
  };

  const stopTimer = async () => {
    setActiveTimer(null);
    await fetch('/api/timer/stop', { method: 'POST' });
    fetchTasks();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        projectId: form.projectId || undefined,
        assigneeId: form.assigneeId || currentUserId,
        priority: form.priority,
      }),
    });
    setForm({ title: '', projectId: '', assigneeId: currentUserId || '', priority: 'Medium' });
    setShowCreate(false);
    fetchTasks();
  };

  const toggleQuickStatus = async (task: any) => {
    const nextStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
  };

  return (
    <div className="space-y-5 max-w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <CheckSquare className="w-4.5 h-4.5 text-[var(--primary)]" />
            <span>Tasks & time tracking</span>
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">Your assigned work — start a timer, comment, and track progress.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New task</span>
        </button>
      </div>

      {tasks.length === 0 && (
        <div className="card p-10 text-center text-sm text-[var(--muted-foreground)]">No tasks yet — create your first one.</div>
      )}

      <div className="space-y-2">
        {tasks.map((task) => {
          const isRunning = activeTimer?.taskId === task.id;
          const elapsed = isRunning ? now - new Date(activeTimer.startedAt).getTime() : 0;

          return (
            <div
              key={task.id}
              className="card card-hover p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <button
                className="flex items-center gap-3 min-w-0 text-left flex-1"
                onClick={() => setOpenTaskId(task.id)}
              >
                <input
                  type="checkbox"
                  checked={task.status === 'Completed'}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleQuickStatus(task);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-0 shrink-0"
                />
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${task.status === 'Completed' ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">
                    {task.project?.name && <>{task.project.name} · </>}
                    Assigned to {task.assignee?.name || 'Unassigned'}
                    {task._count?.comments > 0 && (
                      <span className="inline-flex items-center gap-0.5 ml-1.5">
                        <MessageSquare className="w-3 h-3 inline" /> {task._count.comments}
                      </span>
                    )}
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-2 text-xs shrink-0 pl-7 sm:pl-0">
                <span className="text-[var(--muted-foreground)]">{task.timeLogged || 0} hrs logged</span>
                <span className="badge px-2.5 py-1 bg-[var(--surface-muted)] text-[var(--muted-foreground)]">{task.priority}</span>
                {isRunning ? (
                  <button
                    onClick={() => stopTimer()}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] font-mono font-semibold text-xs"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    {formatElapsed(elapsed)}
                  </button>
                ) : (
                  <button
                    onClick={() => startTimer(task.id)}
                    disabled={!!activeTimer}
                    title={activeTimer ? 'Stop the current timer first' : 'Start timer'}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)] font-medium text-xs disabled:opacity-40"
                  >
                    <Play className="w-3 h-3" />
                    Start
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskDetailPanel taskId={openTaskId} onClose={() => setOpenTaskId(null)} onChanged={fetchTasks} />

      {showCreate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white border border-[var(--border)] shadow-xl p-5 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 p-1 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">New task</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                required
                type="text"
                placeholder="Task title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-minimal w-full px-3 py-2 rounded-lg text-xs"
              />
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="input-minimal w-full px-3 py-2 rounded-lg text-xs"
              >
                <option value="">No project (personal task)</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={form.assigneeId}
                  onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                  className="input-minimal px-3 py-2 rounded-lg text-xs"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.id === currentUserId ? 'Myself' : m.name}</option>
                  ))}
                </select>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="input-minimal px-3 py-2 rounded-lg text-xs"
                >
                  {['Low', 'Medium', 'High', 'Urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-primary w-full py-2 rounded-lg text-xs font-semibold">
                Create task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
