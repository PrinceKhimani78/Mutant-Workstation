'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { X, TrendingUp } from 'lucide-react';

interface ClientProgressModalProps {
  client: any;
  onClose: () => void;
}

function formatWeekLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatMonthLabel(ym: string) {
  const [year, month] = ym.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

export function ClientProgressModal({ client, onClose }: ClientProgressModalProps) {
  const [range, setRange] = useState<'weekly' | 'monthly'>('weekly');
  const [weekly, setWeekly] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clients/${client.id}/hours/summary`)
      .then((res) => res.json())
      .then((data) => {
        if (data.weekly) setWeekly(data.weekly);
        if (data.monthly) setMonthly(data.monthly);
        setLoading(false);
      });
  }, [client.id]);

  const data = range === 'weekly'
    ? weekly.map((w) => ({ label: formatWeekLabel(w.weekStart), hours: w.hours }))
    : monthly.map((m) => ({ label: formatMonthLabel(m.month), hours: m.hours }));

  const cap = range === 'weekly' ? client.weeklyHourLimit : client.weeklyHourLimit ? client.weeklyHourLimit * 4.33 : null;
  const totalInRange = data.reduce((sum, d) => sum + d.hours, 0);
  const avg = data.length ? totalInRange / data.length : 0;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl bg-white border border-[var(--border)] shadow-xl p-5 sm:p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--primary)]" /> {client.company} — hours progress
        </h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">
          Each {range === 'weekly' ? 'week' : 'month'} starts fresh — hours logged one period don't carry into the next.
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center p-1 rounded-lg bg-[var(--surface-muted)] w-fit">
            {(['weekly', 'monthly'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                  range === r ? 'bg-white text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[var(--muted-foreground)]">Avg per {range === 'weekly' ? 'week' : 'month'}</p>
            <p className="text-sm font-bold text-[var(--foreground)]">{avg.toFixed(1)} hrs</p>
          </div>
        </div>

        {loading ? (
          <div className="h-56 flex items-center justify-center text-xs text-[var(--muted-foreground)]">Loading…</div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} interval={range === 'weekly' ? 1 : 0} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e6e7eb', borderRadius: '10px', fontSize: '12px' }}
                  labelStyle={{ color: '#14161a', fontWeight: 600 }}
                  formatter={(value: any) => [`${value} hrs`, 'Logged']}
                />
                {cap ? <ReferenceLine y={cap} stroke="#dc2626" strokeDasharray="4 4" label={{ value: `Cap ${cap.toFixed(0)}h`, position: 'insideTopRight', fontSize: 10, fill: '#dc2626' }} /> : null}
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={cap && d.hours > cap ? '#dc2626' : '#fc6203'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
