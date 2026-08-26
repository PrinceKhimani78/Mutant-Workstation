'use client';

import React, { useEffect, useState } from 'react';
import { X, Send, Clock } from 'lucide-react';

const STATUSES = ['To Do', 'In Progress', 'Review', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

interface TaskDetailPanelProps {
  taskId: string | null;
  onClose: () => void;
  onChanged?: () => void;
}

export function TaskDetailPanel({ taskId, onClose, onChanged }: TaskDetailPanelProps) {
  const [task, setTask] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchTask = () => {
    if (!taskId) return;
    fetch(`/api/tasks/${taskId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.task) setTask(data.task);
      });
  };

  useEffect(() => {
    setTask(null);
    fetchTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  if (!taskId) return null;

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
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[26rem] max-w-full bg-white border-l border-[var(--border)] shadow-xl z-50 flex flex-col">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Task details</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!task ? (
          <div className="flex-1 flex items-center justify-center text-xs text-[var(--muted-foreground)]">Loading…</div>
        ) : (
          <>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{task.title}</p>
                {task.project?.name && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Project: {task.project.name}</p>}
                {task.description && <p className="text-xs text-[var(--muted-foreground)] mt-2 whitespace-pre-wrap">{task.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1">Status</label>
                  <select
                    value={task.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="input-minimal w-full px-2.5 py-1.5 rounded-lg text-xs"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1">Priority</label>
                  <select
                    value={task.priority}
                    onChange={(e) => updateField('priority', e.target.value)}
                    className="input-minimal w-full px-2.5 py-1.5 rounded-lg text-xs"
                  >
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] p-2.5 rounded-lg bg-[var(--surface-muted)]">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Time logged</span>
                <span className="font-semibold text-[var(--foreground)]">{task.timeLogged || 0} hrs</span>
              </div>

              {/* Comments */}
              <div>
                <p className="text-xs font-semibold text-[var(--foreground)] mb-2">Comments</p>
                <div className="space-y-2.5">
                  {(!task.comments || task.comments.length === 0) && (
                    <p className="text-[11px] text-[var(--muted-foreground)]">No comments yet.</p>
                  )}
                  {task.comments?.map((c: any) => (
                    <div key={c.id} className="p-2.5 rounded-lg bg-[var(--surface-muted)]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--foreground)]">{c.author?.name || 'Someone'}</span>
                        <span className="text-[10px] text-[var(--muted-foreground)]">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1 whitespace-pre-wrap">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={submitComment} className="p-4 border-t border-[var(--border)] flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment…"
                className="input-minimal flex-1 px-3 py-2 rounded-lg text-xs"
              />
              <button type="submit" disabled={posting} className="btn-primary p-2 rounded-lg disabled:opacity-50 shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
