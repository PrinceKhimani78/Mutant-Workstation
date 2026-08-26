'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight } from 'lucide-react';

const DEMO_ROLES = [
  { email: 'prince@mutanttechnologies.com', name: 'Prince Khimani', role: 'Owner' },
  { email: 'het@mutanttechnologies.com', name: 'Het Patel', role: 'Sales Manager' },
  { email: 'aman@mutanttechnologies.com', name: 'Aman Sharma', role: 'Project Manager' },
  { email: 'dev@mutanttechnologies.com', name: 'Senior Dev', role: 'Developer' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('prince@mutanttechnologies.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Mutant Technologies"
            width={220}
            height={36}
            priority
            className="object-contain mx-auto mb-3"
          />
          <p className="text-xs text-[var(--muted-foreground)]">
            <span className="font-semibold text-[var(--primary)]">Workstation</span> · Internal operating system
          </p>
        </div>

        {/* Login Form */}
        <div className="card p-6 sm:p-7 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">Work email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-minimal w-full px-3.5 py-2.5 rounded-lg text-sm transition-colors"
                placeholder="you@mutanttechnologies.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-minimal w-full px-3.5 py-2.5 rounded-lg text-sm transition-colors"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? 'Signing in…' : 'Sign in'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Role Shortcuts */}
          <div className="mt-6 pt-5 border-t border-[var(--border)]">
            <p className="text-[11px] text-[var(--muted-foreground)] mb-2.5">Demo accounts (password: password123)</p>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_ROLES.map((r) => (
                <button
                  key={r.email}
                  type="button"
                  onClick={() => setDemoRole(r.email)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                    email === r.email
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {r.name.split(' ')[0]} · {r.role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-[var(--muted-foreground)] flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>Private internal OS · Encrypted session & role-based access</span>
        </div>
      </div>
    </div>
  );
}
