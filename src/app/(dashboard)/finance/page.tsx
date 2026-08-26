'use client';

import React from 'react';
import { DollarSign, FileText, TrendingUp, CheckCircle, Clock } from 'lucide-react';

export default function FinancePage() {
  const invoices = [
    { number: 'INV-2026-001', client: 'Acme Global Ventures', amount: 12500, status: 'Paid', date: '2026-08-01' },
    { number: 'INV-2026-002', client: 'Apex Health Systems', amount: 8500, status: 'Sent', date: '2026-08-20' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <DollarSign className="w-5 h-5 text-[#fc6203]" />
            <span>Finance & Invoicing Engine</span>
          </h2>
          <p className="text-xs text-[#94a3b8]">Invoices, recurring payments, MRR, profitability, and financial reports.</p>
        </div>
      </div>

      {/* Finance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-card border border-[#1e293b]">
          <p className="text-xs font-semibold text-[#94a3b8]">Monthly Recurring Revenue (MRR)</p>
          <p className="text-2xl font-extrabold text-[#fc6203] mt-1">$21,000 / mo</p>
        </div>
        <div className="p-5 rounded-2xl glass-card border border-[#1e293b]">
          <p className="text-xs font-semibold text-[#94a3b8]">Paid Invoices (Aug)</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">$12,500</p>
        </div>
        <div className="p-5 rounded-2xl glass-card border border-[#1e293b]">
          <p className="text-xs font-semibold text-[#94a3b8]">Pending Outstanding Invoices</p>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">$8,500</p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="rounded-2xl glass-card border border-[#1e293b] p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Recent Invoices</h3>
        <div className="space-y-2">
          {invoices.map((inv) => (
            <div key={inv.number} className="p-4 rounded-xl bg-[#0b0f17]/70 border border-[#1e293b] flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{inv.number}</p>
                <p className="text-xs text-[#94a3b8]">{inv.client} • Issued {inv.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold font-mono text-white">${inv.amount.toLocaleString()}</span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold ${inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
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
