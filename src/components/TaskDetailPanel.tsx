'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Send, Clock, User, CheckCircle2, Play, Square } from 'lucide-react';

const STATUSES = ['To Do', 'In Progress', 'Review', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h > 0 ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface TaskDetailPanelProps {
  taskId: string | null;
  onClose: () => void;
  onChanged?: () => void;
}

export function TaskDetailPanel({ taskId, onClose, onChanged }: TaskDetailPanelProps) {
  const [task, setTask] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [now, setNow] = useState(() => Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTask = () => {
    if (!taskId) return;
    fetch(`/api/tasks/${taskId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.task) setTask(data.task);
      });
  };

  const fetchMembers = () => {
    fetch('/api/employees')
      .then((res) => res.json())
      .then((data) => {
        if (data.employees) setMembers(data.employees);
      });
  };

  const fetchTimer = () => {
    fetch('/api/timer/active')
      .then((res) => res.json())
      .then((data) => setActiveTimer(data.timer || null));
  };

  useEffect(() => {
    setTask(null);
    fetchTask();
    fetchMembers();
    fetchTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

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

  if (!taskId) return null;

  const isRunning = activeTimer?.taskId === taskId;
  const elapsed = isRunning ? now - new Date(activeTimer.startedAt).getTime() : 0;

  const startTimer = async () => {
    const res = await fetch('/api/timer/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });
    const data = await res.json();
    if (data.timer) setActiveTimer(data.timer);
    onChanged?.();
  };

  const stopTimer = async () => {
    setActiveTimer(null);
    await fetch('/api/timer/stop', { method: 'POST' });
    fetchTask();
    onChanged?.();
  };

  const updateField = async (field: string, value: any) => {
    setTask((prev: any) => ({ ...prev, [field]: value }));
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    onChanged?.();
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    await fetch(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: comment }),
    });
    setComment('');
    setPosting(false);
    fetchTask();
    onChanged?.();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[28rem] max-w-full bg-white border-l border-[var(--border)] shadow-xl z-50 flex flex-col">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Task details</h3>
            {task?.status === 'Completed' && (
              <span className="badge px-2 py-0.5 text-[10px] bg-[var(--success-soft)] text-[var(--success)] font-semibold">
                Completed
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!task ? (
          <div className="flex-1 flex items-center justify-center text-xs text-[var(--muted-foreground)]">Loading task…</div>
        ) : (
          <>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <p className="text-base font-bold text-[var(--foreground)]">{task.title}</p>
                {task.project?.name && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Project: {task.project.name}</p>}
                {task.description && <p className="text-xs text-[var(--muted-foreground)] mt-2 whitespace-pre-wrap">{task.description}</p>}
              </div>

              {/* Assignee & Status Controls (ClickUp style) */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[var(--surface-muted)]">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--muted-foreground)] mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-[var(--primary)]" /> Assigned To
                  </label>
                  <select
                    value={task.assigneeId || ''}
                    onChange={(e) => updateField('assigneeId', e.target.value)}
                    className="input-minimal w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--muted-foreground)] mb-1">Status</label>
                  <select
                    value={task.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="input-minimal w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1">Priority</label>
                  <select
                    value={task.priority}
                    onChange={(e) => updateField('priority', e.target.value)}
                    className="input-minimal w-full px-2.5 py-1.5 rounded-lg text-xs"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  {task.status !== 'Completed' ? (
                    <button
                      onClick={() => updateField('status', 'Completed')}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--success-soft)] text-[var(--success)] hover:bg-[var(--success)] hover:text-white transition-colors text-xs font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                    </button>
                  ) : (
                    <button
                      onClick={() => updateField('status', 'To Do')}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-xs font-medium"
                    >
                      Reopen Task
                    </button>
                  )}
                </div>
              </div>

              {/* Time Tracker Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--primary)]" />
                  <div>
                    <p className="text-[11px] text-[var(--muted-foreground)]">Time Logged</p>
                    <p className="text-xs font-bold text-[var(--foreground)]">{task.timeLogged || 0} hrs total</p>
                  </div>
                </div>

                {isRunning ? (
                  <button
                    onClick={stopTimer}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] font-mono font-semibold text-xs"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>{formatElapsed(elapsed)}</span>
                  </button>
                ) : (
                  <button
                    onClick={startTimer}
                    disabled={!!activeTimer}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] text-[var(--foreground)] font-semibold text-xs transition-colors disabled:opacity-40"
                  >
                    <Play className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>Start Timer</span>
                  </button>
                )}
              </div>

              {/* Logged Sessions Breakdown with Start & End Times */}
              {task.timeLogs && task.timeLogs.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Logged Sessions ({task.timeLogs.length})</p>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {task.timeLogs.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-[var(--surface-muted)]">
                        <div className="min-w-0">
                          <span className="font-semibold text-[var(--foreground)]">{log.user?.name || 'User'}</span>
                          <p className="text-[10px] text-[var(--muted-foreground)] truncate">
                            {new Date(log.date).toLocaleDateString()} {log.description ? `· ${log.description}` : ''}
                          </p>
                        </div>
                        <span className="font-bold text-[var(--primary)] shrink-0 ml-2">{log.hours} hrs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Thread */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <p className="text-xs font-semibold text-[var(--foreground)]">Comments ({task.comments?.length || 0})</p>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {(!task.comments || task.comments.length === 0) && (
                    <p className="text-[11px] text-[var(--muted-foreground)]">No comments yet. Start the conversation!</p>
                  )}
                  {task.comments?.map((c: any) => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-[var(--surface-muted)] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--foreground)]">{c.author?.name || 'User'}</span>
                        <span className="text-[10px] text-[var(--muted-foreground)]">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Comment Input */}
            <form onSubmit={submitComment} className="p-3 border-t border-[var(--border)] flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment or update…"
                className="input-minimal flex-1 px-3 py-2 rounded-lg text-xs"
              />
              <button type="submit" disabled={posting || !comment.trim()} className="btn-primary p-2 rounded-lg disabled:opacity-50 shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
