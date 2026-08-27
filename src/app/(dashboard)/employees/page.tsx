'use client';

import React, { useEffect, useState } from 'react';
import { UserCheck, Plus, X, Ban, CheckCircle2, Pencil, Key, Trash2, ShieldAlert } from 'lucide-react';
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

const inputClass = 'input-minimal w-full px-3 py-2 rounded-lg text-xs';
const labelClass = 'block text-[10px] font-semibold text-[var(--muted-foreground)] mb-1';

function EmployeesContent() {
  const [team, setTeam] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [resetPassMember, setResetPassMember] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Developer', department: '' });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'Developer',
    department: '',
    status: 'Active',
    password: '',
  });

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
      .then((data) => {
        if (data?.user) {
          setIsOwner(data.user.role === 'Owner');
          setCurrentUserId(data.user.id);
        }
      })
      .catch(() => {});
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
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
    } catch (err: any) {
      setError(err.message || 'Error creating member');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (m: any) => {
    setEditingMember(m);
    setError('');
    setEditForm({
      name: m.name,
      email: m.email,
      role: m.role,
      department: m.department || '',
      status: m.status || 'Active',
      password: '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${editingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update team member');
        return;
      }
      setEditingMember(null);
      fetchTeam();
    } catch (err: any) {
      setError(err.message || 'Error updating member');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassMember || !newPassword.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${resetPassMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }
      alert(`Password updated successfully for ${resetPassMember.name}`);
      setResetPassMember(null);
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (member: any) => {
    if (member.id === currentUserId) {
      alert("You cannot delete your own active owner account.");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${member.name} (${member.role})?`)) return;

    setTeam((prev) => prev.filter((m) => m.id !== member.id));
    await fetch(`/api/employees/${member.id}`, { method: 'DELETE' });
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
    fetchTeam();
  };

  return (
    <div className="space-y-5 max-w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <UserCheck className="w-4.5 h-4.5 text-[var(--primary)]" />
            <span>Team & access</span>
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">Manage team members, assign role permissions, update credentials, and control access.</p>
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
              <div className="w-9 h-9 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center font-bold text-[var(--primary)] text-xs shrink-0">
                {m.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--foreground)] truncate">{m.name}</h3>
                  {m.role === 'Owner' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Owner
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--primary)] font-semibold truncate">{m.role}</p>
                <p className="text-[11px] text-[var(--muted-foreground)] truncate">{m.email} {m.department ? `· ${m.department}` : ''}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`badge px-2 py-0.5 text-[10px] ${m.status === 'Active' ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--surface-muted)] text-[var(--muted-foreground)]'}`}>
                {m.status}
              </span>

              {/* Owner Actions */}
              {isOwner && (
                <div className="flex items-center gap-1 border-l border-[var(--border)] pl-1.5 ml-1">
                  {/* Edit Role & Details */}
                  <button
                    onClick={() => startEdit(m)}
                    title="Edit profile & role"
                    className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--surface-muted)] transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Reset Password */}
                  <button
                    onClick={() => {
                      setResetPassMember(m);
                      setNewPassword('');
                      setError('');
                    }}
                    title="Reset password"
                    className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>

                  {/* Toggle Active Status */}
                  <button
                    onClick={() => toggleStatus(m)}
                    title={m.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                    className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] transition-colors"
                  >
                    {m.status === 'Active' ? <Ban className="w-3.5 h-3.5 text-zinc-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />}
                  </button>

                  {/* Delete Account */}
                  {m.id !== currentUserId && (
                    <button
                      onClick={() => handleDeleteMember(m)}
                      title="Delete user account"
                      className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Team Member Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white border border-[var(--border)] shadow-xl p-5 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 p-1 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-4 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[var(--primary)]" /> Add team member
            </h3>
            {error && <div className="p-2.5 mb-3 rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] text-xs">{error}</div>}
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Het Patel"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Work Email *</label>
                <input
                  required
                  type="email"
                  placeholder="het@mutanttechnologies.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Initial Password *</label>
                <input
                  required
                  type="password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Role Permission *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className={inputClass}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Department</label>
                  <input
                    type="text"
                    placeholder="Marketing / Engineering"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2 rounded-lg text-xs font-semibold disabled:opacity-50">
                {loading ? 'Creating…' : 'Create account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member & Role Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setEditingMember(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white border border-[var(--border)] shadow-xl p-5 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setEditingMember(null)} className="absolute top-4 right-4 p-1 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-4 flex items-center gap-1.5">
              <Pencil className="w-4 h-4 text-[var(--primary)]" /> Edit employee profile & role
            </h3>
            {error && <div className="p-2.5 mb-3 rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] text-xs">{error}</div>}
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  required
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Work Email</label>
                <input
                  required
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Assigned Role *</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className={inputClass}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Department</label>
                <input
                  type="text"
                  placeholder="Marketing / Sales / Engineering"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>New Password (Optional reset)</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep existing"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">
                  {loading ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPassMember && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setResetPassMember(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white border border-[var(--border)] shadow-xl p-5 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setResetPassMember(null)} className="absolute top-4 right-4 p-1 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-1.5 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-500" /> Reset password
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">
              Enter a new password for <strong className="text-[var(--foreground)]">{resetPassMember.name}</strong> ({resetPassMember.email}).
            </p>
            {error && <div className="p-2.5 mb-3 rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] text-xs">{error}</div>}

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className={labelClass}>New Password *</label>
                <input
                  required
                  type="password"
                  placeholder="Enter new password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setResetPassMember(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading || !newPassword.trim()} className="btn-primary px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </div>
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
