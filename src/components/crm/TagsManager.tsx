'use client';

import React, { useState } from 'react';
import { X, Tag as TagIcon, Trash2, Pencil, Check } from 'lucide-react';

const TAG_COLORS = ['#6b7280', '#fc6203', '#2563eb', '#7c3aed', '#d97706', '#db2777', '#059669', '#dc2626'];

interface TagsManagerProps {
  tags: any[];
  onClose: () => void;
  onRefresh: () => void;
}

export function TagsManager({ tags, onClose, onRefresh }: TagsManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', color: TAG_COLORS[0] });

  const startEdit = (tag: any) => {
    setEditingId(tag.id);
    setForm({ name: tag.name, color: tag.color });
  };

  const save = async (id: string) => {
    await fetch(`/api/crm/tags/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setEditingId(null);
    onRefresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this tag? It will be removed from every lead.')) return;
    await fetch(`/api/crm/tags/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white border border-[var(--border)] shadow-xl p-5 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <TagIcon className="w-4 h-4 text-[var(--primary)]" /> Manage tags
        </h3>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {tags.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">No tags yet — create one from any lead's page.</p>}
          {tags.map((t) => (
            <div key={t.id} className="p-2.5 rounded-lg bg-[var(--surface-muted)]">
              {editingId === t.id ? (
                <div className="space-y-2">
                  <input
                    autoFocus
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-minimal w-full px-2 py-1.5 rounded-md text-xs"
                  />
                  <div className="flex items-center gap-1">
                    {TAG_COLORS.map((c) => (
                      <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-4 h-4 rounded-full ${form.color === c ? 'ring-2 ring-offset-1 ring-[var(--foreground)]' : ''}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => save(t.id)} className="btn-primary flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-semibold">
                      <Check className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: `${t.color}1a`, color: t.color }}>
                    {t.name} · {t._count?.leads ?? 0}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(t)} className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-white">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => remove(t.id)} className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--danger)] hover:bg-white">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
