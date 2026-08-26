'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, ListPlus } from 'lucide-react';
import { FIELD_TYPES, needsOptions } from '@/lib/customFields';

interface CustomFieldsManagerProps {
  fields: any[];
  onClose: () => void;
  onRefresh: () => void;
}

const inputClass = 'input-minimal w-full px-2.5 py-1.5 rounded-md text-xs';

export function CustomFieldsManager({ fields, onClose, onRefresh }: CustomFieldsManagerProps) {
  const [form, setForm] = useState({ name: '', type: 'single_line', options: [''] });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return;
    setCreating(true);
    const res = await fetch('/api/crm/custom-fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, type: form.type, options: form.options.filter((o) => o.trim()) }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      setError(data.error || 'Failed to create field');
      return;
    }
    setForm({ name: '', type: 'single_line', options: [''] });
    onRefresh();
  };

  const deleteField = async (id: string) => {
    if (!confirm('Delete this field? Every value stored for it on every lead will be lost.')) return;
    await fetch(`/api/crm/custom-fields/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl bg-white border border-[var(--border)] shadow-xl p-5 sm:p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <ListPlus className="w-4 h-4 text-[var(--primary)]" /> Custom fields
        </h3>

        {/* Existing fields */}
        <div className="space-y-2 mb-5">
          {fields.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">No custom fields yet.</p>}
          {fields.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-muted)]">
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--foreground)] truncate">{f.name}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">{FIELD_TYPES.find((t) => t.value === f.type)?.label}</p>
              </div>
              <button onClick={() => deleteField(f.id)} className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--danger)] hover:bg-white shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Create new field */}
        <form onSubmit={handleCreate} className="space-y-3 border-t border-[var(--border)] pt-4">
          <h4 className="text-xs font-semibold text-[var(--foreground)]">Add a field</h4>
          {error && <div className="p-2 rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] text-xs">{error}</div>}
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Field name (e.g. Deal Size, Referral Source)"
            className={inputClass}
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className={inputClass}
          >
            {['Text', 'Number & Value', 'Selection'].map((group) => (
              <optgroup key={group} label={group}>
                {FIELD_TYPES.filter((t) => t.group === group).map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </optgroup>
            ))}
          </select>

          {needsOptions(form.type) && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[var(--muted-foreground)]">Options</label>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...form.options];
                      next[i] = e.target.value;
                      setForm({ ...form, options: next });
                    }}
                    placeholder={`Option ${i + 1}`}
                    className={inputClass}
                  />
                  {form.options.length > 1 && (
                    <button type="button" onClick={() => setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) })} className="p-1 text-[var(--muted-foreground)] hover:text-[var(--danger)]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setForm({ ...form, options: [...form.options, ''] })} className="flex items-center gap-1 text-[11px] text-[var(--primary)] font-medium">
                <Plus className="w-3 h-3" /> Add option
              </button>
            </div>
          )}

          <button type="submit" disabled={creating} className="btn-primary w-full py-2 rounded-lg text-xs font-semibold disabled:opacity-50">
            {creating ? 'Creating…' : 'Create field'}
          </button>
        </form>
      </div>
    </div>
  );
}
