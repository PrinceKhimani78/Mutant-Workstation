'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const ROLE_ALLOWED_NAV: Record<string, string[]> = {
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

export function AccessGuard({ path, children }: { path: string; children: React.ReactNode }) {
  const router = useRouter();
  const [access, setAccess] = useState<'checking' | 'granted' | 'denied'>('checking');
  const [role, setRole] = useState<string>('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        const userRole = data?.user?.role || 'Guest';
        setRole(userRole);
        const allowed = ROLE_ALLOWED_NAV[userRole] || [];

        if (userRole === 'Owner' || allowed.includes('ALL') || allowed.some((p) => path.startsWith(p))) {
          setAccess('granted');
        } else {
          setAccess('denied');
        }
      })
      .catch(() => setAccess('denied'));
  }, [path]);

  if (access === 'checking') return null;

  if (access === 'denied') {
    return (
      <div className="max-w-md mx-auto mt-20 card p-8 text-center space-y-4 shadow-xl border border-[var(--border)]">
        <div className="w-12 h-12 rounded-full bg-[var(--danger-soft)] text-[var(--danger)] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-[var(--foreground)]">Access Restricted</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Your role (<strong className="text-[var(--foreground)]">{role}</strong>) is not authorized to access this section ({path}).
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-primary inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
