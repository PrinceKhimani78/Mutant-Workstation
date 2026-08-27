'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Mail, Phone, MessageCircle, Globe, Link2, MapPin, Tag,
  Ghost, Trash2, Pencil, Check, X, Phone as PhoneIcon, Mail as MailIcon,
  Users as UsersIcon, StickyNote, Send, Eye, EyeOff, Settings2,
} from 'lucide-react';
import { TagPicker } from '@/components/crm/TagPicker';
import { CustomFieldInput } from '@/components/crm/CustomFieldInput';
import { CustomFieldsManager } from '@/components/crm/CustomFieldsManager';
import { parseValue, isEmptyValue } from '@/lib/customFields';

const ACTIVITY_TYPES = [
  { value: 'Call', icon: PhoneIcon },
  { value: 'Email', icon: MailIcon },
  { value: 'Meeting', icon: UsersIcon },
  { value: 'Note', icon: StickyNote },
];

const FIELD_ROWS: { key: string; label: string; icon: any }[] = [
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'phone', label: 'Phone', icon: Phone },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { key: 'website', label: 'Website', icon: Globe },
  { key: 'linkedin', label: 'LinkedIn', icon: Link2 },
  { key: 'country', label: 'Country', icon: MapPin },
  { key: 'industry', label: 'Industry', icon: Tag },
];

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: 'Call', title: '', description: '' });
  const [postingActivity, setPostingActivity] = useState(false);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [savingFields, setSavingFields] = useState(false);
  const [hideEmptyFields, setHideEmptyFields] = useState(false);
  const [showFieldsManager, setShowFieldsManager] = useState(false);
  const [canManageFields, setCanManageFields] = useState(false);

  const fetchLead = () => {
    fetch(`/api/crm/leads/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.lead) {
          setLead(data.lead);
          setNotesDraft(data.lead.notes || '');
          const values: Record<string, any> = {};
          (data.lead.customFieldValues || []).forEach((cfv: any) => {
            values[cfv.fieldId] = parseValue(cfv.value);
          });
          setFieldValues(values);
        }
      });
  };

  const fetchCustomFields = () => {
    fetch('/api/crm/custom-fields').then((r) => r.json()).then((d) => d.fields && setCustomFields(d.fields));
  };

  useEffect(() => {
    fetchLead();
    fetchCustomFields();
    fetch('/api/crm/stages').then((r) => r.json()).then((d) => d.stages && setStages(d.stages));
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      setIsOwner(d?.user?.role === 'Owner');
      setCanManageFields(['Owner', 'Sales Manager', 'Sales Executive', 'Marketing Manager', 'Marketing Executive'].includes(d?.user?.role));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!lead) {
    return <div className="text-xs text-[var(--muted-foreground)]">Loading…</div>;
  }

  const startEdit = () => {
    setForm({
      name: lead.name, company: lead.company, email: lead.email, phone: lead.phone || '',
      whatsapp: lead.whatsapp || '', website: lead.website || '', linkedin: lead.linkedin || '',
      country: lead.country || '', industry: lead.industry || '',
      estimateType: lead.estimateType || 'Fixed',
      budget: lead.budget ?? '', hourlyRate: lead.hourlyRate ?? '', estimatedWeeklyHours: lead.estimatedWeeklyHours ?? '',
      probability: lead.probability ?? '', proposalValue: lead.proposalValue ?? '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    const res = await fetch(`/api/crm/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.lead) setLead(data.lead);
    setEditing(false);
  };

  const changeStage = async (stageId: string) => {
    const res = await fetch(`/api/crm/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageId }),
    });
    const data = await res.json();
    if (data.lead) setLead(data.lead);
    fetchLead();
  };

  const toggleGhosted = async () => {
    const res = await fetch(`/api/crm/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isGhosted: !lead.isGhosted }),
    });
    const data = await res.json();
    if (data.lead) setLead(data.lead);
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    const res = await fetch(`/api/crm/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notesDraft }),
    });
    const data = await res.json();
    if (data.lead) setLead(data.lead);
    setSavingNotes(false);
  };

  const deleteLead = async () => {
    if (!confirm("Remove this lead from the pipeline? This can't be undone.")) return;
    await fetch(`/api/crm/leads/${id}`, { method: 'DELETE' });
    router.push('/crm');
  };

  const originalFieldValues: Record<string, any> = {};
  (lead.customFieldValues || []).forEach((cfv: any) => { originalFieldValues[cfv.fieldId] = parseValue(cfv.value); });
  const fieldsDirty = JSON.stringify(fieldValues) !== JSON.stringify(originalFieldValues);

  const saveCustomFields = async () => {
    setSavingFields(true);
    const values = Object.entries(fieldValues).map(([fieldId, value]) => ({ fieldId, value }));
    const res = await fetch(`/api/crm/leads/${id}/custom-fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    });
    setSavingFields(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Failed to save fields');
      return;
    }
    fetchLead();
  };

  const submitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.title.trim()) return;
    setPostingActivity(true);
    await fetch(`/api/crm/leads/${id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityForm),
    });
    setActivityForm({ type: 'Call', title: '', description: '' });
    setPostingActivity(false);
    fetchLead();
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <Link href="/crm" className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to pipeline
      </Link>

      {/* Header */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[var(--foreground)]">{lead.company}</h1>
              {lead.isGhosted && (
                <span className="badge px-2 py-0.5 text-[10px] bg-[var(--surface-muted)] text-[var(--muted-foreground)]">
                  <Ghost className="w-3 h-3" /> Ghosted
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{lead.name} · {lead.source}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={lead.stageId}
              onChange={(e) => changeStage(e.target.value)}
              className="input-minimal px-3 py-2 rounded-lg text-xs font-medium"
              style={{ color: lead.stage?.color }}
            >
              {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button
              onClick={toggleGhosted}
              title={lead.isGhosted ? 'Mark as active' : 'Mark as ghosted'}
              className={`p-2 rounded-lg border transition-colors ${lead.isGhosted ? 'border-[var(--foreground)] text-[var(--foreground)]' : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
            >
              <Ghost className="w-4 h-4" />
            </button>
            <button
              onClick={deleteLead}
              title="Delete lead"
              className="p-2 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--danger)] hover:border-[var(--danger)] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <TagPicker leadId={id} tags={lead.tags || []} onChanged={fetchLead} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: contact + deal info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">Contact info</h3>
              <button onClick={() => (editing ? setEditing(false) : startEdit())} className="p-1 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
                {editing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
              </button>
            </div>

            {editing ? (
              <div className="space-y-2.5">
                {['name', 'company', 'email', 'phone', 'whatsapp', 'website', 'linkedin', 'country', 'industry'].map((key) => (
                  <div key={key}>
                    <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-0.5 capitalize">{key}</label>
                    <input
                      value={form[key] ?? ''}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="input-minimal w-full px-2.5 py-1.5 rounded-md text-xs"
                    />
                  </div>
                ))}
                {isOwner && (
                  <>
                    <div>
                      <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-0.5">Estimate type</label>
                      <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface-muted)]">
                        {['Fixed', 'Hourly'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setForm({ ...form, estimateType: t })}
                            className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-colors ${form.estimateType === t ? 'bg-white text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    {form.estimateType === 'Hourly' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-0.5">Hourly rate ($)</label>
                          <input type="number" value={form.hourlyRate ?? ''} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} className="input-minimal w-full px-2.5 py-1.5 rounded-md text-xs" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-0.5">Hours/week</label>
                          <input type="number" value={form.estimatedWeeklyHours ?? ''} onChange={(e) => setForm({ ...form, estimatedWeeklyHours: e.target.value })} className="input-minimal w-full px-2.5 py-1.5 rounded-md text-xs" />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-0.5">Budget ($)</label>
                        <input type="number" value={form.budget ?? ''} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="input-minimal w-full px-2.5 py-1.5 rounded-md text-xs" />
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-0.5">Probability (%)</label>
                      <input type="number" value={form.probability ?? ''} onChange={(e) => setForm({ ...form, probability: e.target.value })} className="input-minimal w-full px-2.5 py-1.5 rounded-md text-xs" />
                    </div>
                  </>
                )}
                <button onClick={saveEdit} className="btn-primary w-full py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Save changes
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {FIELD_ROWS.filter((f) => lead[f.key]).map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.key} className="flex items-center gap-2.5 text-xs">
                      <Icon className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                      <span className="text-[var(--foreground)] truncate">{lead[f.key]}</span>
                    </div>
                  );
                })}
                {FIELD_ROWS.every((f) => !lead[f.key]) && (
                  <p className="text-xs text-[var(--muted-foreground)]">No contact details yet.</p>
                )}
              </div>
            )}
          </div>

          {isOwner && (
            <div className="card p-5 space-y-2.5">
              <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">Deal</h3>
              {lead.estimateType === 'Hourly' ? (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--muted-foreground)]">Hourly rate</span>
                    <span className="font-semibold text-[var(--foreground)]">{lead.hourlyRate ? `$${lead.hourlyRate}/hr` : '—'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--muted-foreground)]">Estimated hours/week</span>
                    <span className="font-semibold text-[var(--foreground)]">{lead.estimatedWeeklyHours ?? '—'}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">Budget</span>
                  <span className="font-semibold text-[var(--foreground)]">{lead.budget ? `$${lead.budget.toLocaleString()}` : '—'}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">Proposal value</span>
                <span className="font-semibold text-[var(--foreground)]">{lead.proposalValue ? `$${lead.proposalValue.toLocaleString()}` : '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">Probability</span>
                <span className="font-semibold text-[var(--foreground)]">{lead.probability != null ? `${lead.probability}%` : '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">Assigned to</span>
                <span className="font-semibold text-[var(--foreground)]">{lead.assignedSalesperson?.name || '—'}</span>
              </div>
            </div>
          )}

          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">Custom fields</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setHideEmptyFields((v) => !v)}
                  title={hideEmptyFields ? 'Show empty fields' : 'Hide empty fields'}
                  className="p-1 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
                >
                  {hideEmptyFields ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {canManageFields && (
                  <button onClick={() => setShowFieldsManager(true)} title="Manage fields" className="p-1 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {customFields.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                No custom fields yet.{canManageFields && ' Create one to start tracking anything you need.'}
              </p>
            ) : (
              <div className="space-y-3">
                {customFields
                  .filter((f) => !hideEmptyFields || !isEmptyValue(fieldValues[f.id]))
                  .map((f) => (
                    <div key={f.id}>
                      <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-1">{f.name}</label>
                      <CustomFieldInput
                        field={f}
                        value={fieldValues[f.id]}
                        onChange={(v) => setFieldValues({ ...fieldValues, [f.id]: v })}
                        disabled={f.type === 'monetary' && !isOwner}
                      />
                    </div>
                  ))}
                {hideEmptyFields && customFields.every((f) => isEmptyValue(fieldValues[f.id])) && (
                  <p className="text-xs text-[var(--muted-foreground)]">All fields are empty.</p>
                )}
              </div>
            )}

            {fieldsDirty && (
              <button onClick={saveCustomFields} disabled={savingFields} className="btn-primary w-full py-1.5 rounded-md text-xs font-semibold disabled:opacity-50">
                {savingFields ? 'Saving…' : 'Save fields'}
              </button>
            )}
          </div>

          <div className="card p-5 space-y-2.5">
            <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">Notes</h3>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={5}
              placeholder="Add notes about this lead…"
              className="input-minimal w-full px-2.5 py-2 rounded-md text-xs resize-none"
            />
            <button
              onClick={saveNotes}
              disabled={savingNotes || notesDraft === (lead.notes || '')}
              className="btn-primary w-full py-1.5 rounded-md text-xs font-semibold disabled:opacity-40"
            >
              {savingNotes ? 'Saving…' : 'Save notes'}
            </button>
          </div>
        </div>

        {/* Right column: activity timeline */}
        <div className="lg:col-span-2 card p-5 sm:p-6 space-y-4">
          <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">Activity timeline</h3>

          <form onSubmit={submitActivity} className="p-3 rounded-lg bg-[var(--surface-muted)] space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={activityForm.type}
                onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                className="input-minimal px-2 py-1.5 rounded-md text-xs shrink-0"
              >
                {ACTIVITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.value}</option>)}
              </select>
              <input
                value={activityForm.title}
                onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                placeholder="What happened?"
                className="input-minimal flex-1 px-2.5 py-1.5 rounded-md text-xs"
              />
              <button type="submit" disabled={postingActivity} className="btn-primary p-2 rounded-md shrink-0 disabled:opacity-50">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              value={activityForm.description}
              onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
              placeholder="Details (optional)"
              rows={2}
              className="input-minimal w-full px-2.5 py-1.5 rounded-md text-xs resize-none"
            />
          </form>

          <div className="space-y-3">
            {(!lead.activities || lead.activities.length === 0) && (
              <p className="text-xs text-[var(--muted-foreground)] text-center py-6">No activity logged yet.</p>
            )}
            {lead.activities?.map((a: any) => {
              const meta = ACTIVITY_TYPES.find((t) => t.value === a.type);
              const Icon = meta?.icon || StickyNote;
              return (
                <div key={a.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pb-3 border-b border-[var(--border)] last:border-b-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[var(--foreground)]">{a.title}</p>
                      <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">{new Date(a.createdAt).toLocaleString()}</span>
                    </div>
                    {a.description && <p className="text-xs text-[var(--muted-foreground)] mt-0.5 whitespace-pre-wrap">{a.description}</p>}
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-1">by {a.createdBy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showFieldsManager && (
        <CustomFieldsManager
          fields={customFields}
          onClose={() => setShowFieldsManager(false)}
          onRefresh={fetchCustomFields}
        />
      )}
    </div>
  );
}
