'use client';

import React, { useEffect, useState } from 'react';
import { X, Plus } from 'lucide-react';

const TAG_COLORS = ['#6b7280', '#fc6203', '#2563eb', '#7c3aed', '#d97706', '#db2777', '#059669', '#dc2626'];

interface TagPickerProps {
  leadId: string;
  tags: any[];
  onChanged: () => void;
}

export function TagPicker({ leadId, tags, onChanged }: TagPickerProps) {
  const [allTags, setAllTags] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const fetchTags = () => {
    fetch('/api/crm/tags').then((r) => r.json()).then((d) => d.tags && setAllTags(d.tags));
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const assignedIds = new Set(tags.map((t) => t.id));
  const suggestions = allTags.filter((t) => !assignedIds.has(t.id) && t.name.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = allTags.some((t) => t.name.toLowerCase() === query.trim().toLowerCase());

  const addTag = async (tagId: string) => {
    await fetch(`/api/crm/leads/${leadId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId }),
    });
    setQuery('');
    setOpen(false);
    onChanged();
  };

  const createAndAddTag = async () => {
    if (!query.trim()) return;
    const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
    const res = await fetch('/api/crm/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: query.trim(), color }),
    });
    const data = await res.json();
    if (data.tag) await addTag(data.tag.id);
  };

  const removeTag = async (tagId: string) => {
    await fetch(`/api/crm/leads/${leadId}/tags?tagId=${tagId}`, { method: 'DELETE' });
    onChanged();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t.id} className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-full text-[11px] font-medium" style={{ backgroundColor: `${t.color}1a`, color: t.color }}>
            {t.name}
            <button onClick={() => removeTag(t.id)} className="p-0.5 rounded-full hover:bg-black/10">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border border-dashed border-[var(--border-strong)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]"
        >
          <Plus className="w-3 h-3" /> Add tag
        </button>
      </div>

      {open && (
        <div className="p-2 rounded-lg border border-[var(--border)] bg-white space-y-1.5">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or create a tag…"
            className="input-minimal w-full px-2.5 py-1.5 rounded-md text-xs"
          />
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {suggestions.map((t) => (
              <button
                key={t.id}
                onClick={() => addTag(t.id)}
                className="w-full text-left px-2 py-1.5 rounded-md text-xs hover:bg-[var(--surface-muted)] flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                {t.name}
              </button>
            ))}
            {query.trim() && !exactMatch && (
              <button onClick={createAndAddTag} className="w-full text-left px-2 py-1.5 rounded-md text-xs text-[var(--primary)] font-medium hover:bg-[var(--primary-soft)]">
                + Create "{query.trim()}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
