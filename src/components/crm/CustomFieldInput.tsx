'use client';

import React from 'react';
import { Plus, X } from 'lucide-react';
import { parseOptions, isCheckboxGroup } from '@/lib/customFields';

interface CustomFieldInputProps {
  field: { id: string; name: string; type: string; options?: string | null };
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

const inputClass = 'input-minimal w-full px-2.5 py-1.5 rounded-md text-xs';

export function CustomFieldInput({ field, value, onChange, disabled }: CustomFieldInputProps) {
  const options = parseOptions(field.options);

  switch (field.type) {
    case 'single_line':
      return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={inputClass} />;

    case 'multi_line':
      return <textarea rows={3} value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={`${inputClass} resize-none`} />;

    case 'number':
      return <input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} disabled={disabled} className={inputClass} />;

    case 'monetary':
      return (
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-xs">$</span>
          <input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} disabled={disabled} className={`${inputClass} pl-6`} />
        </div>
      );

    case 'phone':
      return <input type="tel" value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={inputClass} placeholder="+1 (555) 000-0000" />;

    case 'email':
      return <input type="email" value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={inputClass} placeholder="name@example.com" />;

    case 'url':
      return <input type="url" value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={inputClass} placeholder="https://" />;

    case 'textbox_list': {
      const list: string[] = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-1.5">
          {list.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                type="text"
                value={item}
                disabled={disabled}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = e.target.value;
                  onChange(next);
                }}
                className={inputClass}
              />
              {!disabled && (
                <button type="button" onClick={() => onChange(list.filter((_, idx) => idx !== i))} className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--danger)]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {!disabled && (
            <button type="button" onClick={() => onChange([...list, ''])} className="flex items-center gap-1 text-[11px] text-[var(--primary)] font-medium">
              <Plus className="w-3 h-3" /> Add item
            </button>
          )}
        </div>
      );
    }

    case 'dropdown_single':
      return (
        <select value={value || ''} onChange={(e) => onChange(e.target.value || null)} disabled={disabled} className={inputClass}>
          <option value="">—</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );

    case 'dropdown_multi': {
      const selected: string[] = Array.isArray(value) ? value : [];
      const toggle = (opt: string) => {
        onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
      };
      return (
        <div className="flex flex-wrap gap-1.5">
          {options.map((o) => (
            <button
              type="button"
              key={o}
              disabled={disabled}
              onClick={() => toggle(o)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                selected.includes(o) ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]' : 'border-[var(--border)] text-[var(--muted-foreground)]'
              }`}
            >
              {o}
            </button>
          ))}
          {options.length === 0 && <span className="text-[11px] text-[var(--muted-foreground)]">No options configured.</span>}
        </div>
      );
    }

    case 'radio':
      return (
        <div className="space-y-1.5">
          {options.map((o) => (
            <label key={o} className="flex items-center gap-2 text-xs text-[var(--foreground)]">
              <input type="radio" name={field.id} checked={value === o} disabled={disabled} onChange={() => onChange(o)} className="accent-[var(--primary)]" />
              {o}
            </label>
          ))}
          {options.length === 0 && <span className="text-[11px] text-[var(--muted-foreground)]">No options configured.</span>}
        </div>
      );

    case 'checkbox': {
      if (isCheckboxGroup(field.type, options)) {
        const selected: string[] = Array.isArray(value) ? value : [];
        const toggle = (opt: string) => {
          onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
        };
        return (
          <div className="space-y-1.5">
            {options.map((o) => (
              <label key={o} className="flex items-center gap-2 text-xs text-[var(--foreground)]">
                <input type="checkbox" checked={selected.includes(o)} disabled={disabled} onChange={() => toggle(o)} className="accent-[var(--primary)]" />
                {o}
              </label>
            ))}
          </div>
        );
      }
      return (
        <label className="flex items-center gap-2 text-xs text-[var(--foreground)]">
          <input type="checkbox" checked={!!value} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="accent-[var(--primary)]" />
          {value ? 'Yes' : 'No'}
        </label>
      );
    }

    default:
      return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={inputClass} />;
  }
}

// Read-only, compact rendering used on list/table views.
export function CustomFieldDisplay({ field, value }: { field: { type: string }; value: any }) {
  if (value == null || value === '') return <span className="text-[var(--muted-foreground)]">—</span>;
  if (field.type === 'monetary') return <span>${Number(value).toLocaleString()}</span>;
  if (field.type === 'checkbox' && typeof value === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>;
  if (Array.isArray(value)) return <span>{value.join(', ')}</span>;
  return <span>{String(value)}</span>;
}
