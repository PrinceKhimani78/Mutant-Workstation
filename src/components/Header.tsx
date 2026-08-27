'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, Bell, Command, CheckCircle, AlertTriangle, Menu, UserCheck, DollarSign, Activity } from 'lucide-react';

interface HeaderProps {
  title: string;
  onOpenCommand: () => void;
  onOpenQuickCreate: () => void;
  onOpenSidebar: () => void;
}

export function Header({ title, onOpenCommand, onOpenQuickCreate, onOpenSidebar }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = () => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.length);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

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
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnreadCount(0);
            }}
            className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] transition-colors relative"
            title="Live Notifications Feed"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl bg-white border border-[var(--border)] shadow-xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)]">
                <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[var(--primary)]" />
                  Live Workstation Feed
                </span>
                <button
                  onClick={() => setNotifications([])}
                  className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--primary)] font-medium"
                >
                  Clear feed
                </button>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)] text-center py-4">No recent activity.</p>
                ) : (
                  notifications.map((n) => {
                    let Icon = CheckCircle;
                    let color = 'text-[var(--primary)]';

                    if (n.type === 'lead') {
                      Icon = UserCheck;
                      color = 'text-blue-600';
                    } else if (n.type === 'invoice') {
                      Icon = DollarSign;
                      color = 'text-emerald-600';
                    } else if (n.type === 'task') {
                      Icon = CheckCircle;
                      color = 'text-purple-600';
                    }

                    return (
                      <div key={n.id} className="p-2.5 rounded-lg hover:bg-[var(--surface-muted)] flex items-start gap-2.5 transition-colors">
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[var(--foreground)] truncate">{n.title}</p>
                          <p className="text-[11px] text-[var(--muted-foreground)] line-clamp-2 leading-tight mt-0.5">{n.text}</p>
                          <span className="text-[10px] text-[var(--muted-foreground)] opacity-75 mt-1 block">{n.time}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
