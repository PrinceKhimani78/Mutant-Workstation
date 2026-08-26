'use client';

import React from 'react';
import { UserCheck, Shield, Award, Calendar } from 'lucide-react';

export default function EmployeesPage() {
  const team = [
    { name: 'Prince Khimani', role: 'Owner / Chief Architect', dept: 'Executive', status: 'Active', joining: '2022' },
    { name: 'Het Patel', role: 'Sales Manager', dept: 'Sales', status: 'Active', joining: '2023' },
    { name: 'Aman Sharma', role: 'Project Manager', dept: 'Operations', status: 'Active', joining: '2023' },
    { name: 'Senior Developer', role: 'Full Stack Engineer', dept: 'Engineering', status: 'Active', joining: '2024' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-[#fc6203]" />
            <span>Employee & HR Directory</span>
          </h2>
          <p className="text-xs text-[#94a3b8]">Workload management, leave balance, and team roles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.map((m) => (
          <div key={m.name} className="p-5 rounded-2xl glass-card border border-[#1e293b] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#fc6203]/20 border border-[#fc6203]/40 flex items-center justify-center font-extrabold text-[#fc6203] text-sm">
                {m.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{m.name}</h3>
                <p className="text-xs text-[#fc6203] font-mono font-medium">{m.role}</p>
                <p className="text-[10px] text-[#64748b] font-mono">Department: {m.dept}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {m.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
