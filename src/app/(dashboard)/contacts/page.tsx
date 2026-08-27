'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Contact, Search, Tag as TagIcon, Settings2, Columns3, Ghost, Briefcase, UserCheck } from 'lucide-react';
import { TagsManager } from '@/components/crm/TagsManager';
import { CustomFieldsManager } from '@/components/crm/CustomFieldsManager';
import { CustomFieldDisplay } from '@/components/crm/CustomFieldInput';
import { parseValue } from '@/lib/customFields';
import { AccessGuard } from '@/components/AccessGuard';

const SEARCH_SCOPES = [
  { value: 'all', label: 'All fields' },
  { value: 'name', label: 'Name' },
  { value: 'company', label: 'Company' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
];

function ContactsContent() {
  const [leads, setLeads] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [canManage, setCanManage] = useState(false);

  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'client' | 'lead'>('all');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState('');
  const [visibleFieldIds, setVisibleFieldIds] = useState<string[]>([]);
  const [showColumnsPicker, setShowColumnsPicker] = useState(false);
  const [showTagsManager, setShowTagsManager] = useState(false);
  const [showFieldsManager, setShowFieldsManager] = useState(false);

  const fetchAll = () => {
    fetch('/api/crm/leads').then((r) => r.json()).then((d) => d.leads && setLeads(d.leads));
    fetch('/api/clients').then((r) => r.json()).then((d) => d.clients && setClients(d.clients));
    fetch('/api/crm/stages').then((r) => r.json()).then((d) => d.stages && setStages(d.stages));
    fetch('/api/crm/tags').then((r) => r.json()).then((d) => d.tags && setTags(d.tags));
    fetch('/api/crm/custom-fields').then((r) => r.json()).then((d) => d.fields && setCustomFields(d.fields));
  };

  useEffect(() => {
    fetchAll();
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      setIsOwner(d?.user?.role === 'Owner');
      setCanManage(['Owner', 'Sales Manager', 'Sales Executive', 'Marketing Manager', 'Marketing Executive'].includes(d?.user?.role));
    });
  }, []);

  const getFieldValue = (lead: any, fieldId: string) => {
    const cfv = lead.customFieldValues?.find((v: any) => v.fieldId === fieldId);
    return cfv ? parseValue(cfv.value) : null;
  };

  // Combine both CRM Leads & Retainer/Hourly Clients into a single Contacts Directory
  const allContacts = useMemo(() => {
    const leadEntries = leads.map((l) => ({
      id: l.id,
      name: l.name,
      company: l.company,
      email: l.email,
      phone: l.phone,
      source: l.source,
      stageId: l.stageId,
      stageOrStatus: l.stage?.name || 'New',
      badgeColor: l.stage?.color || '#2563eb',
      tags: l.tags || [],
      customFieldValues: l.customFieldValues || [],
      isGhosted: l.isGhosted,
      isClient: false,
      rawItem: l,
    }));

    const clientEntries = clients.map((c) => ({
      id: c.id,
      name: c.contactPerson || c.company,
      company: c.company,
      email: c.email,
      phone: c.phone,
      source: c.source,
      stageId: '',
      stageOrStatus: `${c.billingType || 'Client'} · ${c.status || 'Active'}`,
      badgeColor: '#059669',
      tags: [],
      customFieldValues: [],
      isGhosted: false,
      isClient: true,
      rawItem: c,
    }));

    return [...clientEntries, ...leadEntries];
  }, [leads, clients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allContacts.filter((item) => {
      if (typeFilter === 'client' && !item.isClient) return false;
      if (typeFilter === 'lead' && item.isClient) return false;

      if (!item.isClient) {
        if (stageFilter && item.stageId !== stageFilter) return false;
        if (selectedTagIds.length > 0 && !item.tags?.some((t: any) => selectedTagIds.includes(t.id))) return false;
      }

      if (!q) return true;

      if (scope === 'all') {
        const haystacks = [item.name, item.company, item.email, item.phone, item.source, ...(item.customFieldValues || []).map((v: any) => v.value)];
        return haystacks.some((h) => h && String(h).toLowerCase().includes(q));
      }
      if (['name', 'company', 'email', 'phone'].includes(scope)) {
        return String((item as any)[scope] || '').toLowerCase().includes(q);
      }
      // scope is a custom field id
      if (!item.isClient) {
        const value = getFieldValue(item.rawItem, scope);
        return value != null && String(value).toLowerCase().includes(q);
      }
      return false;
    });
  }, [allContacts, search, scope, typeFilter, selectedTagIds, stageFilter]);

  const toggleTagFilter = (tagId: string) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };

  const toggleColumn = (fieldId: string) => {
    setVisibleFieldIds((prev) => (prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]));
  };

  return (
    <div className="space-y-5 max-w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <Contact className="w-4.5 h-4.5 text-[var(--primary)]" />
            <span>Contacts directory</span>
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">Unified directory of all converted clients, active retainer clients, and CRM leads.</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowTagsManager(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]">
              <TagIcon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Tags</span>
            </button>
            <button onClick={() => setShowFieldsManager(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]">
              <Settings2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Custom fields</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card p-3.5 space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts, clients, emails, phone numbers…"
              className="input-minimal w-full pl-9 pr-3 py-2 rounded-lg text-xs"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-[var(--surface-muted)] rounded-lg text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${typeFilter === 'all' ? 'bg-white dark:bg-zinc-800 text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'}`}
            >
              All ({allContacts.length})
            </button>
            <button
              onClick={() => setTypeFilter('client')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${typeFilter === 'client' ? 'bg-white dark:bg-zinc-800 text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'}`}
            >
              Clients ({clients.length})
            </button>
            <button
              onClick={() => setTypeFilter('lead')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${typeFilter === 'lead' ? 'bg-white dark:bg-zinc-800 text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'}`}
            >
              Leads ({leads.length})
            </button>
          </div>

          <select value={scope} onChange={(e) => setScope(e.target.value)} className="input-minimal px-2.5 py-2 rounded-lg text-xs">
            {SEARCH_SCOPES.map((s) => <option key={s.value} value={s.value}>Search in: {s.label}</option>)}
            {customFields.map((f) => <option key={f.id} value={f.id}>Search in: {f.name}</option>)}
          </select>
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="input-minimal px-2.5 py-2 rounded-lg text-xs">
            <option value="">All stages</option>
            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="relative">
            <button onClick={() => setShowColumnsPicker((v) => !v)} className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <Columns3 className="w-3.5 h-3.5" /> Columns
            </button>
            {showColumnsPicker && (
              <div className="absolute right-0 mt-1 w-56 rounded-lg bg-white border border-[var(--border)] shadow-lg p-2 z-20">
                <p className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase px-2 py-1">Show custom field columns</p>
                {customFields.length === 0 && <p className="text-xs text-[var(--muted-foreground)] px-2 py-1">No custom fields yet.</p>}
                {customFields.map((f) => (
                  <label key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--surface-muted)] text-xs cursor-pointer">
                    <input type="checkbox" checked={visibleFieldIds.includes(f.id)} onChange={() => toggleColumn(f.id)} className="accent-[var(--primary)]" />
                    {f.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTagFilter(t.id)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors"
                style={
                  selectedTagIds.includes(t.id)
                    ? { backgroundColor: `${t.color}1a`, color: t.color, borderColor: t.color }
                    : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
                }
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contacts Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-foreground)] uppercase text-[10px]">
                <th className="p-3.5 font-semibold">Type</th>
                <th className="p-3.5 font-semibold">Contact Name</th>
                <th className="p-3.5 font-semibold">Company</th>
                <th className="p-3.5 font-semibold">Email</th>
                <th className="p-3.5 font-semibold">Phone</th>
                <th className="p-3.5 font-semibold">Source</th>
                <th className="p-3.5 font-semibold">Status / Stage</th>
                {visibleFieldIds.map((fid) => {
                  const f = customFields.find((cf) => cf.id === fid);
                  return <th key={fid} className="p-3.5 font-semibold">{f?.name}</th>;
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((item) => (
                <tr key={`${item.isClient ? 'client' : 'lead'}-${item.id}`} className={`hover:bg-[var(--surface-muted)] transition-colors ${item.isGhosted ? 'opacity-60' : ''}`}>
                  <td className="p-3.5">
                    {item.isClient ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <Briefcase className="w-3 h-3" /> Client
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        <UserCheck className="w-3 h-3" /> CRM Lead
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-bold text-[var(--foreground)]">
                    {!item.isClient ? (
                      <Link href={`/crm/${item.id}`} className="hover:underline flex items-center gap-1.5">
                        {item.name}
                        {item.isGhosted && <Ghost className="w-3 h-3 text-[var(--muted-foreground)]" />}
                      </Link>
                    ) : (
                      <span>{item.name}</span>
                    )}
                  </td>
                  <td className="p-3.5 text-[var(--muted-foreground)] font-medium">{item.company}</td>
                  <td className="p-3.5 text-[var(--muted-foreground)]">{item.email}</td>
                  <td className="p-3.5 text-[var(--muted-foreground)]">{item.phone || '—'}</td>
                  <td className="p-3.5 text-[var(--muted-foreground)]">
                    {item.source ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--surface-muted)] text-[var(--muted-foreground)]">
                        {item.source}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className="badge px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: `${item.badgeColor}1a`, color: item.badgeColor }}>
                      {item.stageOrStatus}
                    </span>
                  </td>
                  {visibleFieldIds.map((fid) => {
                    const f = customFields.find((cf) => cf.id === fid);
                    const value = !item.isClient ? getFieldValue(item.rawItem, fid) : null;
                    const hidden = f?.type === 'monetary' && !isOwner;
                    return (
                      <td key={fid} className="p-3.5 text-[var(--muted-foreground)]">
                        {hidden ? '—' : f && <CustomFieldDisplay field={f} value={value} />}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7 + visibleFieldIds.length} className="p-8 text-center text-[var(--muted-foreground)]">No contacts match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showTagsManager && <TagsManager tags={tags} onClose={() => setShowTagsManager(false)} onRefresh={fetchAll} />}
      {showFieldsManager && <CustomFieldsManager fields={customFields} onClose={() => setShowFieldsManager(false)} onRefresh={fetchAll} />}
    </div>
  );
}

export default function ContactsPage() {
  return (
    <AccessGuard path="/contacts">
      <ContactsContent />
    </AccessGuard>
  );
}
