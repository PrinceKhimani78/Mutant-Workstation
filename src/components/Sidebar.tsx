'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
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
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
  onOpenAI: () => void;
}

export function Sidebar({ user, onOpenAI }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'CRM & Leads', href: '/crm', icon: Users },
    { name: 'Clients', href: '/clients', icon: Briefcase },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Employees', href: '/employees', icon: UserCheck },
    { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
    { name: 'Finance & Invoices', href: '/finance', icon: DollarSign },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-[#0b0f17] border-r border-[#1e293b] flex flex-col justify-between z-40 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 flex items-center justify-between border-b border-[#1e293b]/60">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-[#fc6203]/40 shadow-[0_0_15px_rgba(252,98,3,0.3)] group-hover:scale-105 transition-transform bg-[#131b2e] flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Mutant Logo"
                width={36}
                height={36}
                className="object-contain p-1"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">MUTANT</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-[#fc6203]/20 text-[#fc6203] border border-[#fc6203]/30">OS</span>
              </div>
              <p className="text-[10px] text-[#94a3b8] tracking-widest font-mono uppercase">Workstation</p>
            </div>
          </Link>
        </div>

        {/* AI Quick Button */}
        <div className="px-3 pt-4 pb-2">
          <button
            onClick={onOpenAI}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl glass-card bg-gradient-to-r from-[#fc6203]/10 to-transparent border border-[#fc6203]/30 text-[#fc6203] hover:text-white hover:border-[#fc6203] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-md bg-[#fc6203] text-white">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold tracking-wide">AI Assistant</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-[#fc6203] group-hover:rotate-12 transition-transform" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 py-2 space-y-1">
          <p className="px-3 py-1 text-[10px] font-semibold text-[#64748b] tracking-wider uppercase">Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#fc6203] text-white font-semibold shadow-[0_4px_20px_rgba(252,98,3,0.35)]'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#131b2e]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#64748b]'}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-[#1e293b]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#131b2e]/70 border border-[#1e293b]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#fc6203]/20 border border-[#fc6203]/40 flex items-center justify-center text-[#fc6203] font-bold text-xs shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'MT'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Prince Khimani'}</p>
              <p className="text-[10px] text-[#fc6203] font-mono font-medium truncate">{user?.role || 'Owner'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-[#64748b] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
