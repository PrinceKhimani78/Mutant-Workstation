'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, Plus, Pencil, Trash2, X } from 'lucide-react';

const inputClass = 'input-minimal w-full px-3 py-2 rounded-lg text-xs';

export default function KnowledgePage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<any | null>(null); // null = closed, {} = new, object = editing
  const [form, setForm] = useState({ title: '', category: '', content: '', tags: '' });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchArticles = () => {
    fetch('/api/knowledge')
      .then((res) => res.json())
      .then((data) => data.articles && setArticles(data.articles));
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(articles.map((a) => a.category))).sort(),
    [articles]
  );

  const filtered = articles.filter((a) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      (a.tags || '').toLowerCase().includes(q);
    const matchesCategory = !category || a.category === category;
    return matchesSearch && matchesCategory;
  });

  const openNew = () => {
    setForm({ title: '', category: '', content: '', tags: '' });
    setEditing({});
  };

  const openEdit = (article: any) => {
    setForm({ title: article.title, category: article.category, content: article.content, tags: article.tags || '' });
    setEditing(article);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing?.id) {
      await fetch(`/api/knowledge/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setSaving(false);
    setEditing(null);
    fetchArticles();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this article? This can\'t be undone.')) return;
    setArticles((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
    fetchArticles();
  };

  return (
    <div className="space-y-5 max-w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-[var(--primary)]" />
            <span>Knowledge base & SOPs</span>
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Standard operating procedures, templates, and documentation — also what the AI assistant searches when you ask it about SOPs.
          </p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0">
          <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">New article</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="card p-3.5 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles, content, tags…"
            className="input-minimal w-full pl-9 pr-3 py-2 rounded-lg text-xs"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-minimal px-2.5 py-2 rounded-lg text-xs">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">
          <strong className="text-[var(--foreground)] font-semibold">{filtered.length}</strong> of {articles.length}
        </span>
      </div>

      {filtered.length === 0 && (
        <div className="card p-10 text-center text-sm text-[var(--muted-foreground)]">
          {articles.length === 0 ? 'No articles yet — add the first one.' : 'No articles match your filters.'}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((art) => {
          const isExpanded = expanded === art.id;
          const tagList = (art.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
          return (
            <div key={art.id} className="card p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="badge px-2 py-0.5 text-[10px] bg-[var(--primary-soft)] text-[var(--primary)]">
                    {art.category}
                  </span>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mt-2">{art.title}</h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(art)} className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(art.id)} className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className={`text-xs text-[var(--muted-foreground)] whitespace-pre-wrap leading-relaxed ${isExpanded ? '' : 'line-clamp-4'}`}>
                {art.content}
              </p>
              {art.content.length > 220 && (
                <button onClick={() => setExpanded(isExpanded ? null : art.id)} className="text-[11px] text-[var(--primary)] font-medium">
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}

              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tagList.map((t: string) => (
                    <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--surface-muted)] text-[var(--muted-foreground)]">{t}</span>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-[var(--muted-foreground)] pt-2 border-t border-[var(--border)]">
                By {art.author} · {new Date(art.updatedAt).toLocaleDateString()}
              </p>
            </div>
          );
        })}
      </div>

      {editing !== null && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl bg-white border border-[var(--border)] shadow-xl p-5 sm:p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setEditing(null)} className="absolute top-4 right-4 p-1 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">{editing?.id ? 'Edit article' : 'New article'}</h3>
            <form onSubmit={save} className="space-y-3">
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className={inputClass} />
              <input required list="kb-categories" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category (e.g. SOP, Guide, Template)" className={inputClass} />
              <datalist id="kb-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
              <textarea required rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Content…" className={`${inputClass} resize-none`} />
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags, comma separated" className={inputClass} />
              <button type="submit" disabled={saving} className="btn-primary w-full py-2 rounded-lg text-xs font-semibold disabled:opacity-50">
                {saving ? 'Saving…' : editing?.id ? 'Save changes' : 'Create article'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
