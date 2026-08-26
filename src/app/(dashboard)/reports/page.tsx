'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-[#fc6203]" />
            <span>Reports & Analytics</span>
          </h2>
          <p className="text-xs text-[#94a3b8]">Sales velocity, lead conversion rate, employee utilization, and client profitability.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl glass-card border border-[#1e293b] space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#fc6203]" />
            <span>Sales Conversion Velocity</span>
          </h3>
          <p className="text-xs text-[#94a3b8]">Upwork & Inbound deals average close time: <strong className="text-white font-mono">14 days</strong></p>
          <div className="pt-2 text-2xl font-extrabold text-[#fc6203]">68% Win Rate</div>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-[#1e293b] space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Team Billable Utilization</span>
          </h3>
          <p className="text-xs text-[#94a3b8]">Average engineering & design hours logged: <strong className="text-white font-mono">38.5 hrs/week</strong></p>
          <div className="pt-2 text-2xl font-extrabold text-emerald-400">92% Billable Ratio</div>
        </div>
      </div>
    </div>
  );
}
