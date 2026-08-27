'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, ShieldAlert, Plus, CheckCircle2, Trash2, X, Clock, FileText } from 'lucide-react';

const SYMBOL: Record<string, string> = { USD: '$', INR: '₹' };
const inputClass = 'input-minimal w-full px-3 py-2 rounded-lg text-xs';
const labelClass = 'block text-[11px] font-medium text-[var(--muted-foreground)] mb-1';

export default function FinancePage() {
  const router = useRouter();
  const [access, setAccess] = useState<'checking' | 'granted' | 'denied'>('checking');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    clientId: '',
    invoiceNumber: '',
    currency: 'USD',
    amount: '',
    status: 'Sent',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const fetchInvoices = () => {
    fetch('/api/invoices')
      .then((res) => res.json())
      .then((data) => {
        if (data.invoices) setInvoices(data.invoices);
      });
  };

  const fetchClients = () => {
    fetch('/api/clients')
      .then((res) => res.json())
      .then((data) => {
        if (data.clients) setClients(data.clients);
      });
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.role === 'Owner') {
          setAccess('granted');
          fetchInvoices();
          fetchClients();
        } else {
          setAccess('denied');
        }
      })
      .catch(() => setAccess('denied'));
  }, []);

  if (access === 'checking') return null;

  if (access === 'denied') {
    return (
      <div className="max-w-lg mx-auto mt-16 card p-8 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-[var(--muted-foreground)] mx-auto" />
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Owner access only</h2>
        <p className="text-xs text-[var(--muted-foreground)]">Revenue and invoicing figures are only visible to the account owner.</p>
        <button onClick={() => router.push('/dashboard')} className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold">
          Back to dashboard
        </button>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.clientId) {
      setError('Please select a client for this invoice');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create invoice');
        return;
      }

      setShowCreate(false);
      setForm({
        clientId: '',
        invoiceNumber: '',
        currency: 'USD',
        amount: '',
        status: 'Sent',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      fetchInvoices();
    } catch (err: any) {
      setError(err.message || 'Error creating invoice');
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (id: string) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: 'Paid' } : inv)));
    await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Paid' }),
    });
    fetchInvoices();
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv)));
    await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchInvoices();
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    fetchInvoices();
  };

  const byCurrency = (currency: string, status?: string) =>
    invoices
      .filter((i) => i.currency === currency && (!status || i.status === status))
      .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-5 max-w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <DollarSign className="w-4.5 h-4.5 text-[var(--primary)]" />
            <span>Finance & invoicing</span>
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">Invoices, MRR, and profitability — visible only to you.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create invoice</span>
        </button>
      </div>

      {/* Finance Stats — split by currency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Paid this period</p>
          <p className="text-xl font-bold text-[var(--success)] mt-1">${byCurrency('USD', 'Paid').toLocaleString()}</p>
          <p className="text-sm font-semibold text-[var(--success)]">₹{byCurrency('INR', 'Paid').toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Outstanding (Sent / Unpaid)</p>
          <p className="text-xl font-bold text-[var(--warning)] mt-1">
            ${(byCurrency('USD', 'Sent') + byCurrency('USD', 'Draft')).toLocaleString()}
          </p>
          <p className="text-sm font-semibold text-[var(--warning)]">
            ₹{(byCurrency('INR', 'Sent') + byCurrency('INR', 'Draft')).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="card p-5 sm:p-6 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Recent invoices</h3>

        {invoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl">
            <FileText className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p>No invoices created yet. Click "+ Create invoice" to add your first invoice.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => {
              const isPaid = inv.status === 'Paid';
              const sym = SYMBOL[inv.currency] || '$';

              return (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-lg bg-[var(--surface-muted)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{inv.invoiceNumber}</p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">
                      {inv.client?.company || 'Client'} · Issued {new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-[var(--foreground)] mr-1">
                      {sym}{inv.amount.toLocaleString()}
                    </span>

                    {/* Status Select */}
                    <select
                      value={inv.status}
                      onChange={(e) => updateStatus(inv.id, e.target.value)}
                      className={`px-2 py-0.5 rounded text-xs font-semibold focus:outline-none ${
                        isPaid
                          ? 'bg-[var(--success-soft)] text-[var(--success)]'
                          : inv.status === 'Sent'
                          ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                          : 'bg-[var(--surface-muted)] text-[var(--muted-foreground)]'
                      }`}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Sent">Sent</option>
                      <option value="Draft">Draft</option>
                      <option value="Overdue">Overdue</option>
                    </select>

                    {/* Quick Mark as Paid Button */}
                    {!isPaid && (
                      <button
                        onClick={() => markAsPaid(inv.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--success-soft)] text-[var(--success)] hover:bg-[var(--success)] hover:text-white transition-colors text-[11px] font-semibold"
                        title="Mark invoice as Paid"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Mark paid
                      </button>
                    )}

                    {/* Delete Invoice Button */}
                    <button
                      onClick={() => deleteInvoice(inv.id)}
                      className="p-1 rounded text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                      title="Delete invoice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-xl bg-white border border-[var(--border)] shadow-xl p-5 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 p-1 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[var(--primary)]" />
              <span>Create invoice</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              {error && <div className="p-2.5 rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] text-xs">{error}</div>}

              <div>
                <label className={labelClass}>Select Client *</label>
                <select
                  required
                  value={form.clientId}
                  onChange={(e) => {
                    const selected = clients.find((c) => c.id === e.target.value);
                    setForm({
                      ...form,
                      clientId: e.target.value,
                      currency: selected?.currency || form.currency,
                    });
                  }}
                  className={inputClass}
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company} ({c.contactPerson || c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Invoice Number</label>
                  <input
                    type="text"
                    placeholder="Auto (INV-2026-001)"
                    value={form.invoiceNumber}
                    onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Currency *</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className={inputClass}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Amount *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="12500"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Initial Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Issue Date</label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {loading ? 'Creating…' : 'Create invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
