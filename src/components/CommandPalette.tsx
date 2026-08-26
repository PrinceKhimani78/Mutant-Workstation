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
    { name: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { name: 'CRM Sales Leads Pipeline', href: '/crm', icon: Users, category: 'Navigation' },
    { name: 'Client Records & Retainers', href: '/clients', icon: Briefcase, category: 'Navigation' },
    { name: 'Projects & Milestone Board', href: '/projects', icon: FolderKanban, category: 'Navigation' },
    { name: 'Task Manager & Checklist', href: '/tasks', icon: CheckSquare, category: 'Navigation' },
    { name: 'Knowledge Base SOPs', href: '/knowledge', icon: BookOpen, category: 'Navigation' },
    { name: 'Finance & Invoices', href: '/finance', icon: DollarSign, category: 'Navigation' },
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-[#131b2e] border border-[#fc6203]/40 shadow-[0_0_50px_rgba(252,98,3,0.15)] overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-[#1e293b] gap-3">
          <Search className="w-4 h-4 text-[#fc6203]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search Workstation..."
            className="w-full bg-transparent text-sm text-white placeholder-[#64748b] focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-[#64748b] hover:text-white hover:bg-[#1e293b]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command Options */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          <div className="px-3 py-1 text-[10px] font-mono text-[#64748b] uppercase tracking-wider">Available Commands</div>
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.name}
                  onClick={() => navigateTo(cmd.href)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-[#cbd5e1] hover:text-white hover:bg-[#1e293b] transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#fc6203]" />
                    <span>{cmd.name}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#64748b] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-[#94a3b8]">No matching commands found.</div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[#0b0f17]/60 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-[#64748b] font-mono">
          <span>Navigate with arrows or type to filter</span>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-[#1e293b] text-[#94a3b8]">ESC</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
}
