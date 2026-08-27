'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Kanban,
  Table as TableIcon,
  Ghost,
  Trash2,
} from 'lucide-react';
import { PipelineBoard } from '@/components/crm/PipelineBoard';
import { formatEstimate } from '@/lib/leadEstimate';
import { AccessGuard } from '@/components/AccessGuard';

const CRM_WRITE_ROLES = ['Owner', 'Sales Manager', 'Sales Executive', 'Marketing Manager', 'Marketing Executive'];

function CRMContent() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [leads, setLeads] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [hideGhosted, setHideGhosted] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [canManageStages, setCanManageStages] = useState(false);
  const [reassignFor, setReassignFor] = useState<any | null>(null);
  const [reassignTarget, setReassignTarget] = useState('');

  const fetchLeads = () => {
    fetch('/api/crm/leads')
      .then((res) => res.json())
      .then((data) => {
        if (data.leads) setLeads(data.leads);
      });
  };

  const fetchStages = () => {
    fetch('/api/crm/stages')
      .then((res) => res.json())
      .then((data) => {
        if (data.stages) setStages(data.stages);
      });
  };

  useEffect(() => {
    fetchLeads();
    fetchStages();
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setIsOwner(data?.user?.role === 'Owner');
        setCanManageStages(CRM_WRITE_ROLES.includes(data?.user?.role));
      })
      .catch(() => {});
  }, []);

  const handleStageChange = async (leadId: string, newStageId: string) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stageId: newStageId } : l)));
    await fetch(`/api/crm/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageId: newStageId }),
    });
    fetchLeads();
  };

  const toggleGhosted = async (lead: any) => {
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, isGhosted: !l.isGhosted } : l)));
    await fetch(`/api/crm/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isGhosted: !lead.isGhosted }),
    });
    fetchLeads();
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm("Remove this lead from the pipeline? This can't be undone.")) return;
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    await fetch(`/api/crm/leads/${leadId}`, { method: 'DELETE' });
    fetchLeads();
  };

  const createStage = async (form: { name: string; color: string }) => {
    await fetch('/api/crm/stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    fetchStages();
  };

  const updateStage = async (id: string, form: { name: string; color: string }) => {
    await fetch(`/api/crm/stages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    fetchStages();
  };

  const reorderStages = async (orderedIds: string[]) => {
    setStages((prev) => orderedIds.map((id) => prev.find((s) => s.id === id)).filter(Boolean));
    await fetch('/api/crm/stages/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    });
  };

  const requestDeleteStage = async (stage: any) => {
    const res = await fetch(`/api/crm/stages/${stage.id}`, { method: 'DELETE' });
    if (res.status === 409) {
      setReassignFor(stage);
      setReassignTarget(stages.find((s) => s.id !== stage.id)?.id || '');
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Failed to delete stage');
      return;
    }
    fetchStages();
    fetchLeads();
  };

  const confirmReassignDelete = async () => {
    if (!reassignFor || !reassignTarget) return;
    await fetch(`/api/crm/stages/${reassignFor.id}?reassignToId=${reassignTarget}`, { method: 'DELETE' });
    setReassignFor(null);
    fetchStages();
    fetchLeads();
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase());
    const matchesSource = selectedSource ? lead.source === selectedSource : true;
    const matchesGhosted = hideGhosted ? !lead.isGhosted : true;
    return matchesSearch && matchesSource && matchesGhosted;
  });

  const totalValue = filteredLeads.reduce((acc, l) => acc + (l.budget || 0), 0);

  return (
    <div className="space-y-5 max-w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-[var(--primary)]" />
            <span>CRM sales pipeline</span>
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">Drag leads between stages, or drag a column header to reorder the pipeline.</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center p-1 rounded-lg bg-[var(--surface-muted)] w-fit">
          <button
            onClick={() => setView('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === 'kanban' ? 'bg-white text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === 'table' ? 'bg-white text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="card p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px] flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by company, name, email…"
              className="input-minimal w-full pl-9 pr-3 py-2 rounded-lg text-xs"
            />
          </div>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="input-minimal px-2.5 py-2 rounded-lg text-xs"
          >
            <option value="">All sources</option>
            <option value="Upwork Profile 1 Prince">Upwork · Prince</option>
            <option value="Upwork Profile 2 Het">Upwork · Het</option>
            <option value="Upwork Profile 3 Aman">Upwork · Aman</option>
            <option value="Bruntwork">Bruntwork</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Cold Email">Cold Email</option>
            <option value="Website">Website</option>
          </select>

          <button
            onClick={() => setHideGhosted((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
              hideGhosted ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]' : 'border-[var(--border)] text-[var(--muted-foreground)]'
            }`}
          >
            <Ghost className="w-3.5 h-3.5" />
            Hide ghosted
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs shrink-0">
          <span className="text-[var(--muted-foreground)]">
            <strong className="text-[var(--foreground)] font-semibold">{filteredLeads.length}</strong> leads
          </span>
          {isOwner && (
            <span className="text-[var(--primary)] font-semibold">
              ${totalValue.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* View Content */}
      {view === 'kanban' ? (
        stages.length > 0 && (
          <PipelineBoard
            stages={stages}
            leads={filteredLeads}
            isOwner={isOwner}
            canManageStages={canManageStages}
            onStageChange={handleStageChange}
            onToggleGhosted={toggleGhosted}
            onDeleteLead={deleteLead}
            onReorderStages={reorderStages}
            onCreateStage={createStage}
            onUpdateStage={updateStage}
            onRequestDeleteStage={requestDeleteStage}
          />
        )
      ) : (
        /* Table View */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-foreground)] uppercase text-[10px]">
                  <th className="p-3.5 font-semibold">Company & contact</th>
                  <th className="p-3.5 font-semibold">Tags</th>
                  <th className="p-3.5 font-semibold">Source</th>
                  <th className="p-3.5 font-semibold">Stage</th>
                  {isOwner && <th className="p-3.5 font-semibold">Budget</th>}
                  <th className="p-3.5 font-semibold">Assigned</th>
                  <th className="p-3.5 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className={`hover:bg-[var(--surface-muted)] transition-colors ${lead.isGhosted ? 'opacity-60' : ''}`}>
                    <td className="p-3.5">
                      <Link href={`/crm/${lead.id}`} className="hover:underline">
                        <p className="font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                          {lead.company}
                          {lead.isGhosted && <Ghost className="w-3 h-3 text-[var(--muted-foreground)]" />}
                        </p>
                      </Link>
                      <p className="text-[11px] text-[var(--muted-foreground)]">{lead.name} · {lead.email}</p>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {lead.tags?.map((t: any) => (
                          <span key={t.id} className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: `${t.color}1a`, color: t.color }}>
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-[var(--muted-foreground)]">{lead.source}</td>
                    <td className="p-3.5">
                      <span
                        className="badge px-2 py-0.5 text-[10px]"
                        style={{ backgroundColor: `${lead.stage?.color}1a`, color: lead.stage?.color }}
                      >
                        {lead.stage?.name}
                      </span>
                    </td>
                    {isOwner && <td className="p-3.5 font-semibold text-[var(--foreground)]">{formatEstimate(lead)}</td>}
                    <td className="p-3.5 text-[var(--muted-foreground)]">{lead.assignedSalesperson?.name || '—'}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => toggleGhosted(lead)}
                          title={lead.isGhosted ? 'Mark as active' : 'Mark as ghosted'}
                          className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
                        >
                          <Ghost className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          title="Delete lead"
                          className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[var(--muted-foreground)]">No leads match your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reassign-then-delete stage dialog */}
      {reassignFor && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setReassignFor(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white border border-[var(--border)] shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1.5">"{reassignFor.name}" still has leads</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">Move them to another stage before deleting this one.</p>
            <select
              value={reassignTarget}
              onChange={(e) => setReassignTarget(e.target.value)}
              className="input-minimal w-full px-3 py-2 rounded-lg text-xs mb-4"
            >
              {stages.filter((s) => s.id !== reassignFor.id).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setReassignFor(null)} className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
                Cancel
              </button>
              <button onClick={confirmReassignDelete} className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--danger)] text-white hover:opacity-90">
                Move leads & delete stage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CRMPage() {
  return (
    <AccessGuard path="/crm">
      <CRMContent />
    </AccessGuard>
  );
}
