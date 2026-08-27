'use client';

import React, { useEffect, useState } from 'react';
import { UserCheck, Plus, X, Ban, CheckCircle2 } from 'lucide-react';
import { AccessGuard } from '@/components/AccessGuard';

const ROLES = [
  'Owner',
  'Sales Manager',
  'Sales Executive',
  'Marketing Manager',
  'Marketing Executive',
  'Marketing',
  'Project Manager',
  'Developer',
  'Designer',
  'HR',
  'Finance',
  'Accountant',
];

function EmployeesContent() {
  const [team, setTeam] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Developer', department: '' });

  const fetchTeam = () => {
    fetch('/api/employees')
      .then((res) => res.json())
      .then((data) => {
        if (data.employees) setTeam(data.employees);
      });
  };

  useEffect(() => {
    fetchTeam();
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setIsOwner(data?.user?.role === 'Owner'))
      .catch(() => {});
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to add team member');
      return;
    }
    setForm({ name: '', email: '', password: '', role: 'Developer', department: '' });
    setShowAdd(false);
    fetchTeam();
  };

  const toggleStatus = async (member: any) => {
    const nextStatus = member.status === 'Active' ? 'Inactive' : 'Active';
    setTeam((prev) => prev.map((m) => (m.id === member.id ? { ...m, status: nextStatus } : m)));
    await fetch(`/api/employees/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
  };

  return (
    <div className="space-y-5 max-w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <UserCheck className="w-4.5 h-4.5 text-[var(--primary)]" />
            <span>Team & access</span>
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">Team members can log in, track time, and manage their own tasks. You see everything.</p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add team member</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.map((m) => (
          <div key={m.id} className="card p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center font-semibold text-[var(--primary)] text-xs shrink-0">
                {m.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">{m.name}</h3>
                <p className="text-xs text-[var(--primary)] font-medium truncate">{m.role}</p>
                <p className="text-[11px] text-[var(--muted-foreground)] truncate">{m.department || m.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`badge px-2 py-0.5 text-[10px] ${m.status === 'Active' ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--surface-muted)] text-[var(--muted-foreground)]'}`}>
                {m.status}
              </span>
              {isOwner && (
                <button
                  onClick={() => toggleStatus(m)}
                  title={m.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                  className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
                >
                  {m.status === 'Active' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white border border-[var(--border)] shadow-xl p-5 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 p-1 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Add team member</h3>
            {error && <div className="p-2.5 mb-3 rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] text-xs">{error}</div>}
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                required
                type="text"
                placeholder="Full name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-minimal w-full px-3 py-2 rounded-lg text-xs"
              />
              <input
                required
                type="email"
                placeholder="Email address *"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-minimal w-full px-3 py-2 rounded-lg text-xs"
              />
              <input
                required
                type="password"
                placeholder="Initial password *"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-minimal w-full px-3 py-2 rounded-lg text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="input-minimal px-3 py-2 rounded-lg text-xs"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Department"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="input-minimal px-3 py-2 rounded-lg text-xs"
                />
              </div>
              <button type="submit" className="btn-primary w-full py-2 rounded-lg text-xs font-semibold">
                Create account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <AccessGuard path="/employees">
      <EmployeesContent />
    </AccessGuard>
  );
}
