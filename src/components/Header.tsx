'use client';

import React, { useState } from 'react';
import { Search, Plus, Bell, Command, CheckCircle, AlertTriangle, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  onOpenCommand: () => void;
  onOpenQuickCreate: () => void;
  onOpenSidebar: () => void;
}

export function Header({ title, onOpenCommand, onOpenQuickCreate, onOpenSidebar }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Lead status updated', text: 'Michael Scott moved to Proposal Sent', time: '10m ago', icon: CheckCircle, color: 'text-[var(--success)]' },
    { id: 2, title: 'Project milestone near', text: 'Acme SaaS Workstation Portal (65% done)', time: '1h ago', icon: AlertTriangle, color: 'text-[var(--warning)]' },
  ];

  return (
    <header className="h-16 border-b border-[var(--border)] bg-white/95 backdrop-blur sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] lg:hidden shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-[var(--foreground)] tracking-tight truncate">{title}</h1>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-2">
        {/* Command Search Launcher */}
        <button
          onClick={onOpenCommand}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)] transition-colors text-xs w-56 justify-between"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
          </div>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--surface-muted)] text-[10px] font-mono text-[var(--muted-foreground)]">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
        <button
          onClick={onOpenCommand}
          className="sm:hidden p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Quick Action Button */}
        <button
          onClick={onOpenQuickCreate}
          className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Quick Create</span>
        </button>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl bg-white border border-[var(--border)] shadow-lg p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)]">
                <span className="text-xs font-semibold text-[var(--foreground)]">Notifications</span>
                <span className="text-[11px] text-[var(--primary)] font-medium">2 new</span>
              </div>
              <div className="space-y-1.5">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="p-2.5 rounded-lg hover:bg-[var(--surface-muted)] flex items-start gap-2.5">
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${n.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--foreground)]">{n.title}</p>
                        <p className="text-[11px] text-[var(--muted-foreground)]">{n.text}</p>
                        <span className="text-[10px] text-[var(--muted-foreground)]">{n.time}</span>
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
