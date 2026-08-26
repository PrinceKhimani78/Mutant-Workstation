'use client';

import React, { useState } from 'react';
import { X, Users, Briefcase, FolderKanban, CheckSquare, DollarSign, Plus } from 'lucide-react';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export function QuickCreateModal({ isOpen, onClose, onRefresh }: QuickCreateModalProps) {
  const [tab, setTab] = useState<'lead' | 'client' | 'project' | 'task'>('lead');
  const [loading, setLoading] = useState(false);

  // Form states
  const [leadData, setLeadData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    source: 'Upwork Profile 1 Prince',
    budget: '',
  });

  const [clientData, setClientData] = useState({
    company: '',
    contactPerson: '',
    email: '',
    phone: '',
    retainerValue: '',
  });

  const [projectData, setProjectData] = useState({
    name: '',
    clientId: '',
    budget: '',
    priority: 'High',
  });

  const [taskData, setTaskData] = useState({
    title: '',
    projectId: '',
    priority: 'High',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (tab === 'lead') {
        await fetch('/api/crm/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData),
        });
      } else if (tab === 'client') {
        await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientData),
        });
      } else if (tab === 'project') {
        await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData),
        });
      } else if (tab === 'task') {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
      }

      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#131b2e] border border-[#1e293b] shadow-2xl p-6 relative">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg text-[#64748b] hover:text-white hover:bg-[#1e293b]">
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#fc6203]" />
          <span>Quick Create Workstation Record</span>
        </h3>

        {/* Tab Selection */}
        <div className="flex gap-2 p-1 rounded-xl bg-[#0b0f17] border border-[#1e293b] mb-6">
          {[
            { id: 'lead', label: 'Lead', icon: Users },
            { id: 'client', label: 'Client', icon: Briefcase },
            { id: 'project', label: 'Project', icon: FolderKanban },
            { id: 'task', label: 'Task', icon: CheckSquare },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  active ? 'bg-[#fc6203] text-white shadow-md' : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'lead' && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-[#94a3b8] mb-1">Contact Name *</label>
                <input
                  required
                  type="text"
                  value={leadData.name}
                  onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                  placeholder="e.g. Michael Scott"
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-xs text-white focus:outline-none focus:border-[#fc6203]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#94a3b8] mb-1">Company Name *</label>
                <input
                  required
                  type="text"
                  value={leadData.company}
                  onChange={(e) => setLeadData({ ...leadData, company: e.target.value })}
                  placeholder="e.g. Dunder Mifflin Tech"
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-xs text-white focus:outline-none focus:border-[#fc6203]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#94a3b8] mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    value={leadData.email}
                    onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                    placeholder="michael@dundermifflin.com"
                    className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-xs text-white focus:outline-none focus:border-[#fc6203]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#94a3b8] mb-1">Lead Source *</label>
                  <select
                    value={leadData.source}
                    onChange={(e) => setLeadData({ ...leadData, source: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-xs text-white focus:outline-none focus:border-[#fc6203]"
                  >
                    <option value="Upwork Profile 1 Prince">Upwork Profile 1 Prince</option>
                    <option value="Upwork Profile 2 Het">Upwork Profile 2 Het</option>
                    <option value="Upwork Profile 3 Aman">Upwork Profile 3 Aman</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Cold Email">Cold Email</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#94a3b8] mb-1">Estimated Budget ($)</label>
                <input
                  type="number"
                  value={leadData.budget}
                  onChange={(e) => setLeadData({ ...leadData, budget: e.target.value })}
                  placeholder="25000"
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-xs text-white focus:outline-none focus:border-[#fc6203]"
                />
              </div>
            </>
          )}

          {tab === 'client' && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-[#94a3b8] mb-1">Company Name *</label>
                <input
                  required
                  type="text"
                  value={clientData.company}
                  onChange={(e) => setClientData({ ...clientData, company: e.target.value })}
                  placeholder="Acme Global Inc"
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-xs text-white focus:outline-none focus:border-[#fc6203]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#94a3b8] mb-1">Primary Contact Person</label>
                <input
                  type="text"
                  value={clientData.contactPerson}
                  onChange={(e) => setClientData({ ...clientData, contactPerson: e.target.value })}
                  placeholder="Sarah Jenkins"
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-xs text-white focus:outline-none focus:border-[#fc6203]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#94a3b8] mb-1">Billing Email *</label>
                <input
                  required
                  type="email"
                  value={clientData.email}
                  onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                  placeholder="billing@acmeglobal.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-xs text-white focus:outline-none focus:border-[#fc6203]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#94a3b8] mb-1">Monthly Retainer Value ($)</label>
                <input
                  type="number"
                  value={clientData.retainerValue}
                  onChange={(e) => setClientData({ ...clientData, retainerValue: e.target.value })}
                  placeholder="12500"
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-xs text-white focus:outline-none focus:border-[#fc6203]"
                />
              </div>
            </>
          )}

          {tab === 'project' && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-[#94a3b8] mb-1">Project Name *</label>
                <input
                  required
                  type="text"
                  value={projectData.name}
                  onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                  placeholder="Next.js Platform Redesign"
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-xs text-white focus:outline-none focus:border-[#fc6203]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#94a3b8] mb-1">Project Budget ($)</label>
                <input
                  type="number"
                  value={projectData.budget}
                  onChange={(e) => setProjectData({ ...projectData, budget: e.target.value })}
                  placeholder="15000"
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-xs text-white focus:outline-none focus:border-[#fc6203]"
                />
              </div>
            </>
          )}

          {tab === 'task' && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-[#94a3b8] mb-1">Task Title *</label>
                <input
                  required
                  type="text"
                  value={taskData.title}
                  onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                  placeholder="Build JWT Permission Middleware"
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-xs text-white focus:outline-none focus:border-[#fc6203]"
                />
              </div>
            </>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94a3b8] hover:text-white hover:bg-[#1e293b]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#fc6203] hover:bg-[#e05300] text-white text-xs font-semibold shadow-[0_4px_15px_rgba(252,98,3,0.3)] disabled:opacity-50"
            >
              {loading ? 'Creating...' : `Create ${tab.toUpperCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
