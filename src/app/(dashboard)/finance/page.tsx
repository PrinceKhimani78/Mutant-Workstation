'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, ShieldAlert } from 'lucide-react';

const invoices = [
  { number: 'INV-2026-001', client: 'Acme Global Ventures', amount: 12500, currency: 'USD', status: 'Paid', date: '2026-08-01' },
  { number: 'INV-2026-002', client: 'Apex Health Systems', amount: 8500, currency: 'USD', status: 'Sent', date: '2026-08-20' },
  { number: 'INV-2026-003', client: 'Nexus Logistics India', amount: 480000, currency: 'INR', status: 'Paid', date: '2026-08-15' },
];

const SYMBOL: Record<string, string> = { USD: '$', INR: '₹' };

export default function FinancePage() {
  const router = useRouter();
  const [access, setAccess] = useState<'checking' | 'granted' | 'denied'>('checking');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.role === 'Owner') setAccess('granted');
        else setAccess('denied');
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

  const byCurrency = (currency: string, status?: string) =>
    invoices
      .filter((i) => i.currency === currency && (!status || i.status === status))
      .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-5 max-w-full">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
          <DollarSign className="w-4.5 h-4.5 text-[var(--primary)]" />
          <span>Finance & invoicing</span>
        </h2>
        <p className="text-xs text-[var(--muted-foreground)]">Invoices, MRR, and profitability — visible only to you.</p>
      </div>

      {/* Finance Stats — split by currency, no conversion */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Paid this period</p>
          <p className="text-xl font-bold text-[var(--success)] mt-1">${byCurrency('USD', 'Paid').toLocaleString()}</p>
          <p className="text-sm font-semibold text-[var(--success)]">₹{byCurrency('INR', 'Paid').toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Outstanding</p>
          <p className="text-xl font-bold text-[var(--warning)] mt-1">${byCurrency('USD', 'Sent').toLocaleString()}</p>
          <p className="text-sm font-semibold text-[var(--warning)]">₹{byCurrency('INR', 'Sent').toLocaleString()}</p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="card p-5 sm:p-6 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Recent invoices</h3>
        <div className="space-y-2">
          {invoices.map((inv) => (
            <div key={inv.number} className="p-3.5 rounded-lg bg-[var(--surface-muted)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)]">{inv.number}</p>
                <p className="text-xs text-[var(--muted-foreground)] truncate">{inv.client} · Issued {inv.date}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-[var(--foreground)]">{SYMBOL[inv.currency]}{inv.amount.toLocaleString()}</span>
                <span className={`badge px-2.5 py-0.5 text-xs ${inv.status === 'Paid' ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--warning-soft)] text-[var(--warning)]'}`}>
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
