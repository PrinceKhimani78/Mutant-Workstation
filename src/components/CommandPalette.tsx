'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LayoutDashboard, Users, Briefcase, FolderKanban, CheckSquare, BookOpen, DollarSign, X, ArrowRight } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { name: 'CRM & sales pipeline', href: '/crm', icon: Users, category: 'Navigation' },
    { name: 'Client records', href: '/clients', icon: Briefcase, category: 'Navigation' },
    { name: 'Projects & milestones', href: '/projects', icon: FolderKanban, category: 'Navigation' },
    { name: 'Task manager', href: '/tasks', icon: CheckSquare, category: 'Navigation' },
    { name: 'Knowledge base', href: '/knowledge', icon: BookOpen, category: 'Navigation' },
    { name: 'Finance & invoices', href: '/finance', icon: DollarSign, category: 'Navigation' },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const navigateTo = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-20 sm:pt-24 px-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white border border-[var(--border)] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-[var(--border)] gap-3">
          <Search className="w-4 h-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Workstation…"
            className="w-full bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command Options */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-0.5">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.name}
                  onClick={() => navigateTo(cmd.href)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors group text-left"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[var(--primary)]" />
                    <span>{cmd.name}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-[var(--muted-foreground)]">No matching commands found.</div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[var(--surface-muted)] border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
          <span>Type to filter</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-[var(--border)]">ESC</kbd>
        </div>
      </div>
    </div>
  );
}
