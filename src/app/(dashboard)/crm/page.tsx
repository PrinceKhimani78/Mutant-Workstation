'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Kanban,
  Table as TableIcon,
  Filter,
  DollarSign,
  Briefcase,
  ChevronRight,
  TrendingUp,
  MoreVertical,
  CheckCircle2,
} from 'lucide-react';

const STATUSES = ['New', 'Contacted', 'Discovery', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

export default function CRMPage() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const fetchLeads = () => {
    fetch('/api/crm/leads')
      .then((res) => res.json())
      .then((data) => {
        if (data.leads) setLeads(data.leads);
      });
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    await fetch(`/api/crm/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    fetchLeads();
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase());
    const matchesSource = selectedSource ? lead.source === selectedSource : true;
    return matchesSearch && matchesSource;
  });

  const totalValue = filteredLeads.reduce((acc, l) => acc + (l.budget || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#fc6203]" />
            <span>CRM Sales Pipeline</span>
          </h2>
          <p className="text-xs text-[#94a3b8]">Track every lead, deal value, Upwork source, and client status.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#131b2e] border border-[#1e293b]">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'kanban' ? 'bg-[#fc6203] text-white shadow-md' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'table' ? 'bg-[#fc6203] text-white shadow-md' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="p-4 rounded-2xl glass-card border border-[#1e293b] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter leads by company, name, email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#fc6203]"
            />
          </div>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-xs text-[#cbd5e1] focus:outline-none focus:border-[#fc6203]"
          >
            <option value="">All Sources</option>
            <option value="Upwork Profile 1 Prince">Upwork Profile 1 Prince</option>
            <option value="Upwork Profile 2 Het">Upwork Profile 2 Het</option>
            <option value="Upwork Profile 3 Aman">Upwork Profile 3 Aman</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Cold Email">Cold Email</option>
            <option value="Website">Website</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-[#94a3b8]">
            Filtered: <strong className="text-white">{filteredLeads.length} Leads</strong>
          </span>
          <span className="text-[#fc6203] font-bold">
            Total Pipeline: ${totalValue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* View Content */}
      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => {
            const statusLeads = filteredLeads.filter((l) => l.status === status);
            const statusTotal = statusLeads.reduce((acc, l) => acc + (l.budget || 0), 0);

            return (
              <div key={status} className="flex flex-col rounded-2xl bg-[#0b0f17]/90 border border-[#1e293b] min-w-[240px] max-h-[75vh]">
                {/* Column Header */}
                <div className="p-3 border-b border-[#1e293b] flex items-center justify-between bg-[#131b2e]/60 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{status}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1e293b] text-[#fc6203]">
                      {statusLeads.length}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748b]">${statusTotal.toLocaleString()}</span>
                </div>

                {/* Cards Container */}
                <div className="p-2 space-y-2 overflow-y-auto flex-1">
                  {statusLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="p-3 rounded-xl bg-[#131b2e] border border-[#1e293b] hover:border-[#fc6203]/50 transition-all cursor-pointer shadow-sm space-y-2"
                    >
                      <div>
                        <p className="text-xs font-extrabold text-white">{lead.company}</p>
                        <p className="text-[11px] text-[#94a3b8]">{lead.name}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#1e293b]/50 text-[10px]">
                        <span className="font-mono text-[#fc6203] font-semibold">{lead.source}</span>
                        <span className="font-mono font-bold text-white">${lead.budget?.toLocaleString()}</span>
                      </div>

                      {/* Move status dropdown */}
                      <select
                        value={lead.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(lead.id, e.target.value);
                        }}
                        className="w-full mt-1 px-2 py-1 rounded bg-[#0b0f17] border border-[#1e293b] text-[10px] text-[#cbd5e1] focus:outline-none focus:border-[#fc6203]"
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            Move to {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl glass-card border border-[#1e293b] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#131b2e]/80 text-[#94a3b8] font-mono uppercase text-[10px]">
                  <th className="p-4">Company & Contact</th>
                  <th className="p-4">Lead Source</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Budget</th>
                  <th className="p-4">Probability</th>
                  <th className="p-4">Assigned Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#131b2e]/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white">{lead.company}</p>
                      <p className="text-[11px] text-[#94a3b8]">{lead.name} • {lead.email}</p>
                    </td>
                    <td className="p-4 font-mono text-[#fc6203] font-medium">{lead.source}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-[#fc6203]/20 text-[#fc6203] border border-[#fc6203]/30">
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-white">${lead.budget?.toLocaleString()}</td>
                    <td className="p-4 font-mono text-[#cbd5e1]">{lead.probability}%</td>
                    <td className="p-4 text-[#94a3b8]">{lead.assignedSalesperson?.name || 'Prince Khimani'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
