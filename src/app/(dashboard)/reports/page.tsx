'use client';

import React from 'react';
import { BarChart3, TrendingUp, Clock } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-5 max-w-full">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
          <BarChart3 className="w-4.5 h-4.5 text-[var(--primary)]" />
          <span>Reports & analytics</span>
        </h2>
        <p className="text-xs text-[var(--muted-foreground)]">Sales velocity, conversion rate, and team utilization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
            <span>Sales conversion velocity</span>
          </h3>
          <p className="text-xs text-[var(--muted-foreground)]">Average close time: <strong className="text-[var(--foreground)]">14 days</strong></p>
          <div className="pt-1 text-2xl font-bold text-[var(--primary)]">68% win rate</div>
        </div>

        <div className="card p-5 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--success)]" />
            <span>Team billable utilization</span>
          </h3>
          <p className="text-xs text-[var(--muted-foreground)]">Average hours logged: <strong className="text-[var(--foreground)]">38.5 hrs/week</strong></p>
          <div className="pt-1 text-2xl font-bold text-[var(--success)]">92% billable</div>
        </div>
      </div>
    </div>
  );
}
