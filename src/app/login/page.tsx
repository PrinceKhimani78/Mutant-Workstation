'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Shield, Sparkles, Key, ArrowRight, Lock } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0b0f17] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#fc6203]/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#fc6203]/15 blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#131b2e] border border-[#fc6203]/40 shadow-[0_0_30px_rgba(252,98,3,0.25)] mb-4">
            <Image src="/logo.png" alt="Mutant Technologies" width={48} height={48} priority className="object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            MUTANT <span className="text-[#fc6203]">WORKSTATION</span>
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1 font-mono">Single Internal Operating System for Mutant Technologies</p>
        </div>

        {/* Login Form Glass Card */}
        <div className="glass-panel p-8 rounded-3xl border border-[#1e293b] shadow-2xl relative">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-sm text-white focus:outline-none focus:border-[#fc6203] transition-colors"
                placeholder="prince@mutanttechnologies.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-sm text-white focus:outline-none focus:border-[#fc6203] transition-colors"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#fc6203] hover:bg-[#e05300] text-white text-sm font-bold shadow-[0_4px_25px_rgba(252,98,3,0.35)] transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workstation'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Seed Login Shortcuts for instant evaluation */}
          <div className="mt-8 pt-6 border-t border-[#1e293b]">
            <p className="text-[11px] font-mono text-[#64748b] mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3 h-3 text-[#fc6203]" /> Demo Role Shortcuts (Password: password123)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoRole('prince@mutanttechnologies.com')}
                className="p-2 rounded-xl bg-[#0b0f17] hover:bg-[#1e293b] border border-[#1e293b] text-left text-xs transition-colors"
              >
                <p className="font-bold text-white">Prince Khimani</p>
                <p className="text-[10px] text-[#fc6203] font-mono">Owner</p>
              </button>
              <button
                type="button"
                onClick={() => setDemoRole('het@mutanttechnologies.com')}
                className="p-2 rounded-xl bg-[#0b0f17] hover:bg-[#1e293b] border border-[#1e293b] text-left text-xs transition-colors"
              >
                <p className="font-bold text-white">Het Patel</p>
                <p className="text-[10px] text-blue-400 font-mono">Sales Manager</p>
              </button>
              <button
                type="button"
                onClick={() => setDemoRole('aman@mutanttechnologies.com')}
                className="p-2 rounded-xl bg-[#0b0f17] hover:bg-[#1e293b] border border-[#1e293b] text-left text-xs transition-colors"
              >
                <p className="font-bold text-white">Aman Sharma</p>
                <p className="text-[10px] text-emerald-400 font-mono">Project Manager</p>
              </button>
              <button
                type="button"
                onClick={() => setDemoRole('dev@mutanttechnologies.com')}
                className="p-2 rounded-xl bg-[#0b0f17] hover:bg-[#1e293b] border border-[#1e293b] text-left text-xs transition-colors"
              >
                <p className="font-bold text-white">Senior Dev</p>
                <p className="text-[10px] text-purple-400 font-mono">Developer</p>
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-[11px] text-[#64748b] flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#fc6203]" />
          <span>Private Internal OS • Encrypted JWT Session & RBAC Enforcement</span>
        </div>
      </div>
    </div>
  );
}
