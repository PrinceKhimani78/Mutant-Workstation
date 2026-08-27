'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Contact,
  Briefcase,
  FolderKanban,
  CheckSquare,
  UserCheck,
  BookOpen,
  DollarSign,
  BarChart3,
  Bot,
  LogOut,
  Sparkles,
  X,
} from 'lucide-react';

const ROLE_ALLOWED_NAV: Record<string, string[]> = {
  Owner: ['ALL'],
  'Sales Manager': ['/dashboard', '/crm', '/contacts', '/clients', '/knowledge', '/reports'],
  'Sales Executive': ['/dashboard', '/crm', '/contacts', '/clients', '/knowledge'],
  'Marketing Manager': ['/dashboard', '/projects', '/tasks', '/knowledge', '/reports'],
  'Marketing Executive': ['/dashboard', '/projects', '/tasks', '/knowledge'],
  Marketing: ['/dashboard', '/projects', '/tasks', '/knowledge'],
  'Project Manager': ['/dashboard', '/projects', '/tasks', '/clients', '/knowledge'],
  Developer: ['/dashboard', '/projects', '/tasks', '/knowledge'],
  Designer: ['/dashboard', '/projects', '/tasks', '/knowledge'],
  HR: ['/dashboard', '/employees', '/knowledge'],
  Finance: ['/dashboard', '/finance', '/reports', '/knowledge'],
  Accountant: ['/dashboard', '/finance', '/knowledge'],
};

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
  onOpenAI: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ user, onOpenAI, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const role = user?.role || 'Owner';
  const allowedHrefs = ROLE_ALLOWED_NAV[role] || ROLE_ALLOWED_NAV['Owner'];

  const allNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'CRM & Leads', href: '/crm', icon: Users },
    { name: 'Contacts', href: '/contacts', icon: Contact },
    { name: 'Clients', href: '/clients', icon: Briefcase },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Employees', href: '/employees', icon: UserCheck },
    { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
    { name: 'Finance & Invoices', href: '/finance', icon: DollarSign },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  const navItems = allNavItems.filter(
    (item) => allowedHrefs.includes('ALL') || allowedHrefs.includes(item.href)
  );

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`w-64 h-screen fixed left-0 top-0 bg-white border-r border-[var(--border)] flex flex-col justify-between z-50 select-none
          transition-transform duration-200 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="min-h-0 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-4 flex items-center justify-between border-b border-[var(--border)]">
            <Link href="/dashboard" className="flex items-center gap-2 group min-w-0" onClick={onClose}>
              <Image
                src="/logo.png"
                alt="Mutant Technologies"
                width={140}
                height={23}
                className="object-contain shrink-0"
                priority
              />
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--primary-soft)] text-[var(--primary)] shrink-0">
                OS
              </span>
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* AI Quick Button */}
          <div className="px-3 pt-3 pb-1">
            <button
              onClick={onOpenAI}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-[var(--primary)] text-white">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold">AI Assistant</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-0.5">
            <p className="px-3 py-1.5 text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Menu</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-[var(--border)]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface-muted)]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] font-bold text-xs shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'MT'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-[var(--foreground)] truncate">{user?.name || 'Prince Khimani'}</p>
                <p className="text-[11px] text-[var(--muted-foreground)] truncate">{user?.role || 'Owner'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
