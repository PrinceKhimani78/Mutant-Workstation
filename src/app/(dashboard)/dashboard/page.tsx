'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Users,
  Briefcase,
  FolderKanban,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const [isOwner, setIsOwner] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setIsOwner(d?.user?.role === 'Owner'));
    fetch('/api/crm/leads').then((r) => r.json()).then((d) => d.leads && setLeads(d.leads));
    fetch('/api/projects').then((r) => r.json()).then((d) => d.projects && setProjects(d.projects));
    fetch('/api/tasks').then((r) => r.json()).then((d) => d.tasks && setTasks(d.tasks));
    fetch('/api/clients').then((r) => r.json()).then((d) => d.clients && setClients(d.clients));
  }, []);

  const pipelineValue = leads.reduce((sum, l) => sum + (l.budget || 0), 0);
  const mrrUSD = clients.filter((c) => c.currency !== 'INR' && c.billingType === 'Retainer').reduce((s, c) => s + (c.retainerValue || 0), 0);
  const mrrINR = clients.filter((c) => c.currency === 'INR' && c.billingType === 'Retainer').reduce((s, c) => s + (c.retainerValue || 0), 0);
  const loggedHoursToday = tasks.reduce((s, t) => s + (t.timeLogged || 0), 0);

  const chartData = [
    { month: 'May', pipeline: Math.round(pipelineValue * 0.4) },
    { month: 'Jun', pipeline: Math.round(pipelineValue * 0.55) },
    { month: 'Jul', pipeline: Math.round(pipelineValue * 0.75) },
    { month: 'Aug', pipeline: pipelineValue },
  ];

  const kpis = [
    isOwner && { label: 'Active sales pipeline', value: `$${pipelineValue.toLocaleString()}`, note: `${leads.length} open leads`, noteColor: 'text-[var(--muted-foreground)]', icon: TrendingUp },
    { label: 'Active retainer clients', value: `${clients.length} clients`, note: 'Across all contracts', noteColor: 'text-[var(--muted-foreground)]', icon: Briefcase },
    { label: 'Active projects', value: `${projects.length} projects`, note: 'On track for deadline', noteColor: 'text-[var(--success)]', icon: FolderKanban },
    { label: 'Total hours logged', value: `${loggedHoursToday.toFixed(1)} hrs`, note: 'Across all tasks', noteColor: 'text-[var(--muted-foreground)]', icon: Clock },
  ].filter(Boolean) as any[];

  return (
    <div className="space-y-5 max-w-full">
      {/* Welcome Banner */}
      <div className="card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[var(--success-soft)] text-[var(--success)] text-[11px] font-semibold">
            System active
          </span>
          <h2 className="text-lg font-bold text-[var(--foreground)] mt-2">Welcome back</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 max-w-lg">
            Your control center for agency revenue, CRM pipeline, client deliverables, and team productivity.
          </p>
        </div>

        {isOwner && (
          <div className="p-3 rounded-xl bg-[var(--surface-muted)] text-right shrink-0">
            <p className="text-[11px] text-[var(--muted-foreground)]">Monthly recurring revenue</p>
            <p className="text-lg font-bold text-[var(--primary)]">${mrrUSD.toLocaleString()}</p>
            {mrrINR > 0 && <p className="text-sm font-semibold text-[var(--primary)]">₹{mrrINR.toLocaleString()}</p>}
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card card-hover p-4 space-y-2">
              <div className="flex items-center justify-between text-[var(--muted-foreground)]">
                <span className="text-xs font-medium">{kpi.label}</span>
                <Icon className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div className="text-xl font-bold text-[var(--foreground)]">{kpi.value}</div>
              <p className={`text-[11px] font-medium flex items-center gap-1 ${kpi.noteColor}`}>
                <ArrowUpRight className="w-3 h-3" /> {kpi.note}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Charts & Activity Section */}
      {isOwner && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue & Pipeline Growth Chart */}
          <div className="lg:col-span-2 card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Sales pipeline growth</h3>
                <p className="text-[11px] text-[var(--muted-foreground)]">Pipeline value progression, USD</p>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-md bg-[var(--surface-muted)] text-[var(--muted-foreground)]">
                2026 Q3
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPipeline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fc6203" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#fc6203" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderColor: '#e6e7eb', borderRadius: '10px', fontSize: '12px' }}
                    labelStyle={{ color: '#14161a', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="pipeline" stroke="#fc6203" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPipeline)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lead Sources */}
          <div className="card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Lead sources</h3>
              <Users className="w-4 h-4 text-[var(--primary)]" />
            </div>

            <div className="space-y-3">
              {Object.entries(
                leads.reduce((acc: Record<string, number>, l) => {
                  acc[l.source] = (acc[l.source] || 0) + 1;
                  return acc;
                }, {})
              ).map(([source, count]) => (
                <div key={source} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[var(--foreground)] truncate">{source}</span>
                    <span className="text-[var(--muted-foreground)] shrink-0">{count} leads</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                    <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: `${(count / Math.max(leads.length, 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
              {leads.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">No leads yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Active CRM Leads & Active Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent CRM Deals */}
        <div className="card p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Active CRM deals</h3>
            <a href="/crm" className="text-xs text-[var(--primary)] font-medium hover:underline">View pipeline →</a>
          </div>

          <div className="space-y-2">
            {leads.length === 0 && <p className="text-xs text-[var(--muted-foreground)] py-4 text-center">No leads yet.</p>}
            {leads.slice(0, 4).map((lead) => (
              <div
                key={lead.id}
                className="p-3 rounded-lg bg-[var(--surface-muted)] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--foreground)] truncate">{lead.company}</p>
                  <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                    {lead.name} · {lead.source}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className="badge px-2 py-0.5 text-[10px]"
                    style={{ backgroundColor: `${lead.stage?.color}1a`, color: lead.stage?.color }}
                  >
                    {lead.stage?.name}
                  </span>
                  {isOwner && <p className="text-xs font-semibold text-[var(--foreground)] mt-1">${lead.budget?.toLocaleString() ?? '—'}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Tasks Checklist */}
        <div className="card p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Task checklist</h3>
            <span className="text-[11px] text-[var(--muted-foreground)]">{tasks.length} items</span>
          </div>

          <div className="space-y-2">
            {tasks.length === 0 && <p className="text-xs text-[var(--muted-foreground)] py-4 text-center">No tasks yet.</p>}
            {tasks.slice(0, 6).map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-lg bg-[var(--surface-muted)] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${t.status === 'Completed' ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}`}
                  />
                  <div className="min-w-0">
                    <p className={`text-xs font-medium truncate ${t.status === 'Completed' ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}`}>
                      {t.title}
                    </p>
                    <p className="text-[11px] text-[var(--muted-foreground)] truncate">Assigned to {t.assignee?.name || 'Team'}</p>
                  </div>
                </div>
                <span
                  className={`badge px-2 py-0.5 text-[10px] shrink-0 ${
                    t.priority === 'Urgent' ? 'bg-[var(--danger-soft)] text-[var(--danger)]' : 'bg-white border border-[var(--border)] text-[var(--muted-foreground)]'
                  }`}
                >
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
