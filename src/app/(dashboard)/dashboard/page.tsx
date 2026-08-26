'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Users,
  Briefcase,
  FolderKanban,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  Plus,
  Sparkles,
  Bot,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    mrr: 21000,
    activeClients: 2,
    activeProjects: 2,
    pipelineValue: 118000,
    tasksToday: 3,
    loggedHoursToday: 6.5,
  });

  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/crm/leads')
      .then((res) => res.json())
      .then((data) => {
        if (data.leads) setLeads(data.leads);
      });

    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) setProjects(data.projects);
      });

    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => {
        if (data.tasks) setTasks(data.tasks);
      });
  }, []);

  const chartData = [
    { month: 'May', revenue: 12000, pipeline: 45000 },
    { month: 'Jun', revenue: 14500, pipeline: 60000 },
    { month: 'Jul', revenue: 18000, pipeline: 85000 },
    { month: 'Aug', revenue: 21000, pipeline: 118000 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl glass-card bg-gradient-to-r from-[#131b2e] via-[#131b2e] to-[#fc6203]/20 border border-[#fc6203]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#fc6203]/20 text-[#fc6203] text-xs font-mono font-bold border border-[#fc6203]/30">
              OPERATING SYSTEM ACTIVE
            </span>
            <span className="text-xs text-[#94a3b8]">Mutant Technologies Internal OS</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1.5 tracking-tight">
            Welcome to Mutant Workstation
          </h2>
          <p className="text-xs text-[#94a3b8] mt-0.5 max-w-xl">
            Real-time control center for agency revenue, CRM pipeline, active client deliverables, and team productivity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#0b0f17]/70 border border-[#1e293b] text-right">
            <p className="text-[10px] text-[#64748b] font-mono uppercase">Monthly Retainer MRR</p>
            <p className="text-lg font-black text-[#fc6203]">${stats.mrr.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-card border border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between text-[#94a3b8]">
            <span className="text-xs font-semibold">Active Sales Pipeline</span>
            <div className="p-2 rounded-xl bg-[#fc6203]/10 text-[#fc6203]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">${stats.pipelineValue.toLocaleString()}</div>
          <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> +24.5% vs last month
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between text-[#94a3b8]">
            <span className="text-xs font-semibold">Active Retainer Clients</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{stats.activeClients} Clients</div>
          <p className="text-[11px] text-[#94a3b8] font-mono">100% Retainer Renewal Rate</p>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between text-[#94a3b8]">
            <span className="text-xs font-semibold">Active Projects</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{projects.length} Projects</div>
          <p className="text-[11px] text-emerald-400 font-mono">2 On Track for Deadline</p>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between text-[#94a3b8]">
            <span className="text-xs font-semibold">Time Logged Today</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{stats.loggedHoursToday} hrs</div>
          <p className="text-[11px] text-[#94a3b8] font-mono">Billable Team Hours</p>
        </div>
      </div>

      {/* Main Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Pipeline Growth Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-card border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Agency Revenue & Pipeline Growth</h3>
              <p className="text-[11px] text-[#94a3b8]">MRR vs Sales Pipeline Progression ($USD)</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#0b0f17] border border-[#1e293b] text-[#fc6203]">
              2026 Q3
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPipeline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fc6203" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#fc6203" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#131b2e', borderColor: '#fc6203', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="pipeline" stroke="#fc6203" strokeWidth={3} fillOpacity={1} fill="url(#colorPipeline)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources & Upwork Profiles */}
        <div className="p-6 rounded-2xl glass-card border border-[#1e293b] space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Lead Sources & Channels</span>
            <Users className="w-4 h-4 text-[#fc6203]" />
          </h3>
          <p className="text-[11px] text-[#94a3b8]">Live lead volume across agency channels</p>

          <div className="space-y-3 pt-2">
            {[
              { name: 'Upwork Profile 1 Prince', count: 3, percentage: '40%', color: 'bg-[#fc6203]' },
              { name: 'Upwork Profile 2 Het', count: 2, percentage: '25%', color: 'bg-blue-500' },
              { name: 'Upwork Profile 3 Aman', count: 1, percentage: '15%', color: 'bg-purple-500' },
              { name: 'LinkedIn & Inbound', count: 2, percentage: '20%', color: 'bg-emerald-500' },
            ].map((src) => (
              <div key={src.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-white">{src.name}</span>
                  <span className="text-[#94a3b8] font-mono">{src.count} Leads</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#0b0f17] overflow-hidden">
                  <div className={`h-full ${src.color}`} style={{ width: src.percentage }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active CRM Leads & Active Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent CRM Deals */}
        <div className="p-6 rounded-2xl glass-card border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Active CRM Deals</h3>
            <span className="text-xs text-[#fc6203] font-semibold cursor-pointer">View All Pipeline →</span>
          </div>

          <div className="space-y-2">
            {leads.slice(0, 4).map((lead) => (
              <div
                key={lead.id}
                className="p-3.5 rounded-xl bg-[#0b0f17]/70 border border-[#1e293b] hover:border-[#fc6203]/40 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-white">{lead.company}</p>
                  <p className="text-[11px] text-[#94a3b8]">
                    {lead.name} • <span className="font-mono text-[#fc6203]">{lead.source}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fc6203]/20 text-[#fc6203] border border-[#fc6203]/30">
                    {lead.status}
                  </span>
                  <p className="text-xs font-bold text-white font-mono mt-1">${lead.budget?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Tasks Checklist */}
        <div className="p-6 rounded-2xl glass-card border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Workstation Task Checklist</h3>
            <span className="text-xs text-[#94a3b8] font-mono">{tasks.length} Priority Items</span>
          </div>

          <div className="space-y-2">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl bg-[#0b0f17]/70 border border-[#1e293b] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    className={`w-4 h-4 ${t.status === 'Completed' ? 'text-emerald-400' : 'text-[#64748b]'}`}
                  />
                  <div>
                    <p className={`text-xs font-semibold ${t.status === 'Completed' ? 'line-through text-[#64748b]' : 'text-white'}`}>
                      {t.title}
                    </p>
                    <p className="text-[10px] text-[#94a3b8]">Assigned to {t.assignee?.name || 'Team'}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                    t.priority === 'Urgent' ? 'bg-red-500/20 text-red-400' : 'bg-[#1e293b] text-[#94a3b8]'
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
