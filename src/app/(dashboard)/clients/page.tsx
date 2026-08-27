'use client';

import React, { useEffect, useState } from 'react';
import { Briefcase, Mail, Phone, Pencil, Plus, Clock, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { ClientProgressModal } from '@/components/crm/ClientProgressModal';
import { AccessGuard } from '@/components/AccessGuard';

const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', INR: '₹' };

const SOURCE_OPTIONS = [
  'Upwork Profile 1 Prince',
  'Upwork Profile 2 Het',
  'Upwork Profile 3 Aman',
  'B2B Partner',
  'Referral',
  'LinkedIn',
  'Direct',
  'Cold Email',
  'Website',
  'Other',
];

const inputClass = 'input-minimal w-full px-2 py-1.5 rounded-md text-xs';

function getWorkWeekDays(offsetWeeks = 0) {
  const now = new Date();
  const currentDay = now.getDay();
  const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMon + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);

  const days = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const label = `${dayNames[i]} ${d.getDate()}`;
    days.push({ dayName: dayNames[i], dateStr, label, dateObj: d });
  }

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatShort = (dt: Date) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekLabel = `${formatShort(monday)} – ${formatShort(sunday)}, ${sunday.getFullYear()}`;

  return { monday, sunday, days, weekLabel };
}

function UpworkWeeklyLogger({ client, sym, isOwner, onSaved, onClose }: any) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [dailyHours, setDailyHours] = useState<Record<string, string>>({});
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const { days, weekLabel } = getWorkWeekDays(weekOffset);

  const totalHours = Object.values(dailyHours).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const weeklyRevenue = totalHours * (client.hourlyRate || 0);

  const handleSaveWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = days
      .map((d) => ({
        hours: parseFloat(dailyHours[d.dateStr] || '0'),
        date: d.dateStr,
        description: description.trim() || 'Upwork weekly work log',
      }))
      .filter((item) => item.hours > 0);

    if (payload.length === 0) {
      alert('Please enter hours for at least one day of the work week.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to save weekly hours');
        return;
      }

      setDailyHours({});
      setDescription('');
      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error saving hours');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] space-y-3">
      {/* Upwork Work Week Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">Upwork Work Week</span>
          <span className="text-xs font-semibold text-[var(--foreground)]">({weekLabel})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-zinc-800 border border-[var(--border)] hover:bg-[var(--surface-muted)]"
          >
            ← Prev Week
          </button>
          {weekOffset !== 0 && (
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--primary)] text-white"
            >
              This Week
            </button>
          )}
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-zinc-800 border border-[var(--border)] hover:bg-[var(--surface-muted)]"
          >
            Next Week →
          </button>
        </div>
      </div>

      {/* 7-Day Daily Hours Grid */}
      <form onSubmit={handleSaveWeek} className="space-y-3">
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => (
            <div key={d.dateStr} className="flex flex-col items-center">
              <span className="text-[10px] font-medium text-[var(--muted-foreground)] mb-1">{d.label}</span>
              <input
                type="number"
                step="0.25"
                min="0"
                max="24"
                placeholder="0"
                value={dailyHours[d.dateStr] || ''}
                onChange={(e) => setDailyHours({ ...dailyHours, [d.dateStr]: e.target.value })}
                className="w-full text-center px-1 py-1 rounded border border-[var(--border)] text-xs font-semibold bg-white dark:bg-zinc-900 focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          ))}
        </div>

        {/* Weekly Summary & Memo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-[var(--border)]">
          <div className="text-xs space-y-0.5">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)] font-medium">Logged this week:</span>
              <span className="font-bold text-[var(--foreground)]">{totalHours.toFixed(1)} hrs</span>
            </div>
            {client.weeklyHourLimit && (
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--muted-foreground)]">Weekly Cap:</span>
                <span className={totalHours > client.weeklyHourLimit ? 'text-red-500 font-bold' : 'text-[var(--muted-foreground)]'}>
                  {totalHours.toFixed(1)} / {client.weeklyHourLimit} hrs
                </span>
              </div>
            )}
            {isOwner && client.hourlyRate && (
              <div className="flex justify-between pt-0.5 border-t border-[var(--border)] text-[11px]">
                <span className="text-[var(--muted-foreground)]">Week Earnings:</span>
                <span className="font-bold text-[var(--primary)]">{sym}{weeklyRevenue.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <input
              type="text"
              placeholder="Work memo / Upwork memo (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-2 py-1 rounded text-xs border border-[var(--border)] bg-white dark:bg-zinc-900"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 text-[11px] font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || totalHours === 0}
                className="btn-primary px-3 py-1 text-[11px] font-semibold rounded disabled:opacity-50"
              >
                {saving ? 'Saving Week…' : `Save ${totalHours.toFixed(1)} hrs`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function ClientsContent() {
  const [clients, setClients] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [loggingHoursFor, setLoggingHoursFor] = useState<string | null>(null);
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [progressFor, setProgressFor] = useState<any | null>(null);

  const fetchClients = () => {
    fetch('/api/clients')
      .then((res) => res.json())
      .then((data) => {
        if (data.clients) setClients(data.clients);
      });
  };

  useEffect(() => {
    fetchClients();
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setIsOwner(data?.user?.role === 'Owner'))
      .catch(() => {});
  }, []);

  const startEdit = (client: any) => {
    setEditingId(client.id);
    setEditForm({
      company: client.company,
      contactPerson: client.contactPerson || '',
      email: client.email,
      phone: client.phone || '',
      source: client.source || '',
      currency: client.currency || 'USD',
      billingType: client.billingType || 'Retainer',
      retainerValue: client.retainerValue || 0,
      hourlyRate: client.hourlyRate || '',
      weeklyHourLimit: client.weeklyHourLimit || '',
    });
  };

  const saveEdit = async (id: string) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Failed to save client');
      return;
    }
    setEditingId(null);
    fetchClients();
  };

  const loadHistory = (clientId: string) => {
    fetch(`/api/clients/${clientId}/hours`)
      .then((res) => res.json())
      .then((data) => data.logs && setHistory(data.logs));
  };

  const toggleHistory = (clientId: string) => {
    if (historyFor === clientId) {
      setHistoryFor(null);
    } else {
      setHistoryFor(clientId);
      loadHistory(clientId);
    }
  };

  return (
    <div className="space-y-5 max-w-full">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
          <Briefcase className="w-4.5 h-4.5 text-[var(--primary)]" />
          <span>Retainer clients</span>
        </h2>
        <p className="text-xs text-[var(--muted-foreground)]">Active client contracts, billing terms, and assigned PMs.</p>
      </div>

      {clients.length === 0 && (
        <div className="card p-10 text-center text-sm text-[var(--muted-foreground)]">No clients yet.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clients.map((client) => {
          const sym = CURRENCY_SYMBOL[client.currency] || '$';
          const isEditing = editingId === client.id;
          const isLoggingHours = loggingHoursFor === client.id;
          const isHistoryOpen = historyFor === client.id;
          const weeklyProgress = client.weeklyHourLimit
            ? Math.min(100, ((client.hoursThisWeek || 0) / client.weeklyHourLimit) * 100)
            : 0;

          return (
            <div key={client.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">{client.company}</h3>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">Contact: {client.contactPerson}</p>
                  {client.source && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-[var(--surface-muted)] text-[var(--muted-foreground)]">
                      {client.source}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="badge px-2.5 py-1 text-xs bg-[var(--success-soft)] text-[var(--success)]">
                    {client.status}
                  </span>
                  <button
                    onClick={() => (isEditing ? setEditingId(null) : startEdit(client))}
                    className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
                    title="Edit client"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2.5 p-3 rounded-lg bg-[var(--surface-muted)]">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} placeholder="Company name" className={inputClass} />
                    <input value={editForm.contactPerson} onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })} placeholder="Contact person" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Billing email" className={inputClass} />
                    <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone" className={inputClass} />
                  </div>
                  <select value={editForm.source} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} className={inputClass}>
                    <option value="">Source — where did this client come from?</option>
                    {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>

                  {isOwner && (
                    <>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]">
                        <select value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} className={inputClass}>
                          <option value="USD">USD ($)</option>
                          <option value="INR">INR (₹)</option>
                        </select>
                        <select value={editForm.billingType} onChange={(e) => setEditForm({ ...editForm, billingType: e.target.value })} className={inputClass}>
                          <option value="Retainer">Retainer</option>
                          <option value="Hourly">Hourly (Upwork / B2B)</option>
                        </select>
                      </div>
                      {editForm.billingType === 'Retainer' ? (
                        <input type="number" value={editForm.retainerValue} onChange={(e) => setEditForm({ ...editForm, retainerValue: e.target.value })} placeholder="Monthly retainer" className={inputClass} />
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <input type="number" value={editForm.hourlyRate} onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })} placeholder="Hourly rate" className={inputClass} />
                          <input type="number" value={editForm.weeklyHourLimit} onChange={(e) => setEditForm({ ...editForm, weeklyHourLimit: e.target.value })} placeholder="Weekly hr cap" className={inputClass} />
                        </div>
                      )}
                    </>
                  )}

                  <button onClick={() => saveEdit(client.id)} className="btn-primary w-full py-1.5 rounded-md text-xs font-semibold">
                    Save
                  </button>
                </div>
              ) : (
                <div className="py-3 border-y border-[var(--border)] text-xs space-y-2.5">
                  {client.billingType === 'Hourly' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted-foreground)]">Contract</span>
                        <span className="font-medium text-[var(--foreground)]">
                          {isOwner && client.hourlyRate ? `${sym}${client.hourlyRate}/hr · ` : ''}Hourly
                        </span>
                      </div>
                      {client.weeklyHourLimit ? (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[var(--muted-foreground)]">This week</span>
                            <span className="font-medium text-[var(--foreground)]">
                              {(client.hoursThisWeek || 0).toFixed(1)} / {client.weeklyHourLimit} hrs
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                            <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: `${weeklyProgress}%` }} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-[var(--muted-foreground)]">This week</span>
                          <span className="font-medium text-[var(--foreground)]">{(client.hoursThisWeek || 0).toFixed(1)} hrs</span>
                        </div>
                      )}
                      {isOwner && client.hourlyRate && (
                        <div className="flex justify-between pt-1">
                          <span className="text-[var(--muted-foreground)]">Revenue this week</span>
                          <span className="font-bold text-[var(--primary)]">
                            {sym}{((client.hoursThisWeek || 0) * client.hourlyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setLoggingHoursFor(isLoggingHours ? null : client.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-[var(--border-strong)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)] text-[11px] font-medium"
                        >
                          <Plus className="w-3 h-3" /> Log hours (Upwork week)
                        </button>
                        <button
                          onClick={() => toggleHistory(client.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-[11px] font-medium"
                        >
                          <Clock className="w-3 h-3" /> History {isHistoryOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => setProgressFor(client)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-[11px] font-medium"
                        >
                          <TrendingUp className="w-3 h-3" /> Progress
                        </button>
                      </div>

                      {isLoggingHours && (
                        <UpworkWeeklyLogger
                          client={client}
                          sym={sym}
                          isOwner={isOwner}
                          onSaved={() => {
                            fetchClients();
                            if (historyFor === client.id) loadHistory(client.id);
                          }}
                          onClose={() => setLoggingHoursFor(null)}
                        />
                      )}

                      {isHistoryOpen && (
                        <div className="space-y-1.5 pt-1">
                          {history.length === 0 && <p className="text-[11px] text-[var(--muted-foreground)]">No hours logged yet.</p>}
                          {history.map((h) => (
                            <div key={h.id} className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                              <span>{new Date(h.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {h.user?.name}{h.description ? ` · ${h.description}` : ''}</span>
                              <span className="font-medium text-[var(--foreground)] shrink-0">{h.hours} hrs</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    isOwner && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[var(--muted-foreground)] uppercase text-[10px]">Monthly retainer</p>
                          <p className="text-sm font-bold text-[var(--primary)]">{sym}{client.retainerValue.toLocaleString()}/mo</p>
                        </div>
                        <div>
                          <p className="text-[var(--muted-foreground)] uppercase text-[10px]">Renewal date</p>
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {client.renewalDate ? new Date(client.renewalDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              <div className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {progressFor && <ClientProgressModal client={progressFor} onClose={() => setProgressFor(null)} />}
    </div>
  );
}

export default function ClientsPage() {
  return (
    <AccessGuard path="/clients">
      <ClientsContent />
    </AccessGuard>
  );
}
