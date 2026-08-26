'use client';

import React, { useEffect, useState } from 'react';
import { Briefcase, Mail, Phone, Pencil } from 'lucide-react';

const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', INR: '₹' };

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

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
      currency: client.currency || 'USD',
      billingType: client.billingType || 'Retainer',
      retainerValue: client.retainerValue || 0,
      hourlyRate: client.hourlyRate || '',
      weeklyHourLimit: client.weeklyHourLimit || '',
    });
  };

  const saveEdit = async (id: string) => {
    await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    fetchClients();
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
          const weeklyProgress = client.weeklyHourLimit
            ? Math.min(100, ((client.hoursThisWeek || 0) / client.weeklyHourLimit) * 100)
            : 0;

          return (
            <div key={client.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">{client.company}</h3>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">Contact: {client.contactPerson}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="badge px-2.5 py-1 text-xs bg-[var(--success-soft)] text-[var(--success)]">
                    {client.status}
                  </span>
                  {isOwner && (
                    <button
                      onClick={() => (isEditing ? setEditingId(null) : startEdit(client))}
                      className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
                      title="Edit billing"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {isOwner && isEditing ? (
                <div className="space-y-2.5 p-3 rounded-lg bg-[var(--surface-muted)]">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={editForm.currency}
                      onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                      className="input-minimal px-2 py-1.5 rounded-md text-xs"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                    <select
                      value={editForm.billingType}
                      onChange={(e) => setEditForm({ ...editForm, billingType: e.target.value })}
                      className="input-minimal px-2 py-1.5 rounded-md text-xs"
                    >
                      <option value="Retainer">Retainer</option>
                      <option value="Hourly">Hourly (Upwork)</option>
                    </select>
                  </div>
                  {editForm.billingType === 'Retainer' ? (
                    <input
                      type="number"
                      value={editForm.retainerValue}
                      onChange={(e) => setEditForm({ ...editForm, retainerValue: e.target.value })}
                      placeholder="Monthly retainer"
                      className="input-minimal w-full px-2 py-1.5 rounded-md text-xs"
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={editForm.hourlyRate}
                        onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })}
                        placeholder="Hourly rate"
                        className="input-minimal w-full px-2 py-1.5 rounded-md text-xs"
                      />
                      <input
                        type="number"
                        value={editForm.weeklyHourLimit}
                        onChange={(e) => setEditForm({ ...editForm, weeklyHourLimit: e.target.value })}
                        placeholder="Weekly hr cap"
                        className="input-minimal w-full px-2 py-1.5 rounded-md text-xs"
                      />
                    </div>
                  )}
                  <button
                    onClick={() => saveEdit(client.id)}
                    className="btn-primary w-full py-1.5 rounded-md text-xs font-semibold"
                  >
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
                          {isOwner && client.hourlyRate ? `${sym}${client.hourlyRate}/hr · ` : ''}Hourly (Upwork)
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
                      ) : null}
                      {isOwner && client.hourlyRate && (
                        <div className="flex justify-between pt-1">
                          <span className="text-[var(--muted-foreground)]">Revenue this week</span>
                          <span className="font-bold text-[var(--primary)]">
                            {sym}{((client.hoursThisWeek || 0) * client.hourlyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
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
    </div>
  );
}
