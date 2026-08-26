'use client';

import React, { useState } from 'react';
import { Search, Plus, Bell, Command, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  title: string;
  onOpenCommand: () => void;
  onOpenQuickCreate: () => void;
}

export function Header({ title, onOpenCommand, onOpenQuickCreate }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const mockNotifications = [
    { id: 1, title: 'Lead Status Updated', text: 'Michael Scott moved to Proposal Sent', time: '10m ago', icon: CheckCircle, color: 'text-emerald-400' },
    { id: 2, title: 'Project Milestone Near', text: 'Acme SaaS Workstation Portal (65% done)', time: '1h ago', icon: AlertTriangle, color: 'text-[#fc6203]' },
  ];

  return (
    <header className="h-16 border-b border-[#1e293b] bg-[#0b0f17]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Title */}
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-3">
        {/* Raycast Command Search Launcher */}
        <button
          onClick={onOpenCommand}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#131b2e] border border-[#1e293b] text-[#94a3b8] hover:text-white hover:border-[#fc6203]/50 transition-all text-xs group w-64 justify-between"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#64748b] group-hover:text-[#fc6203]" />
            <span>Search Workstation...</span>
          </div>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#1e293b] text-[10px] font-mono text-[#94a3b8]">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>

        {/* Quick Action Button */}
        <button
          onClick={onOpenQuickCreate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#fc6203] hover:bg-[#e05300] text-white text-xs font-semibold shadow-[0_4px_15px_rgba(252,98,3,0.3)] transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Quick Create</span>
        </button>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-[#131b2e] border border-[#1e293b] text-[#94a3b8] hover:text-white hover:border-[#334155] transition-all relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#fc6203] animate-ping" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#fc6203]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#131b2e] border border-[#1e293b] shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b]">
                <span className="text-xs font-bold text-white">Notifications</span>
                <span className="text-[10px] font-mono text-[#fc6203]">2 New</span>
              </div>
              <div className="space-y-2">
                {mockNotifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="p-2.5 rounded-xl bg-[#0b0f17]/60 border border-[#1e293b] flex items-start gap-2.5">
                      <Icon className={`w-4 h-4 mt-0.5 ${n.color}`} />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-white">{n.title}</p>
                        <p className="text-[11px] text-[#94a3b8]">{n.text}</p>
                        <span className="text-[9px] font-mono text-[#64748b]">{n.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
