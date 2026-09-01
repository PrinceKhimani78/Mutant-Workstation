'use client';

import React, { useState } from 'react';
import { X, Users, Briefcase, FolderKanban, CheckSquare, Plus } from 'lucide-react';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const inputClass = 'input-minimal w-full px-3 py-2 rounded-lg text-xs';
const labelClass = 'block text-[11px] font-medium text-[var(--muted-foreground)] mb-1';

export function QuickCreateModal({ isOpen, onClose, onRefresh }: QuickCreateModalProps) {
  const [tab, setTab] = useState<'lead' | 'client' | 'project' | 'task'>('lead');
  const [loading, setLoading] = useState(false);

  const [leadData, setLeadData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    linkedin: '',
    source: 'LinkedIn',
    estimateType: 'Fixed',
    budget: '',
    hourlyRate: '',
    estimatedWeeklyHours: '',
    contacts: [{ name: '', designation: '', linkedin: '', email: '', phone: '' }],
  });

  const [clientData, setClientData] = useState({
    company: '',
    contactPerson: '',
    email: '',
    phone: '',
    source: '',
    currency: 'USD',
    billingType: 'Retainer',
    retainerValue: '',
    hourlyRate: '',
    weeklyHourLimit: '',
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
      let res: Response;
      if (tab === 'lead') {
        res = await fetch('/api/crm/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData),
        });
      } else if (tab === 'client') {
        res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientData),
        });
      } else if (tab === 'project') {
        res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData),
        });
      } else {
        res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || `Failed to create ${tab}`);
        return;
      }

      if (onRefresh) onRefresh();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white border border-[var(--border)] shadow-xl p-5 sm:p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[var(--primary)]" />
          <span>Quick create</span>
        </h3>

        {/* Tab Selection */}
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface-muted)] mb-6">
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
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  active ? 'bg-white text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'
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
                <label className={labelClass}>Company name (optional)</label>
                <input
                  type="text"
                  value={leadData.company}
                  onChange={(e) => setLeadData({ ...leadData, company: e.target.value })}
                  placeholder="e.g. Acme Corporation"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Company LinkedIn URL (optional)</label>
                <input
                  type="text"
                  value={leadData.linkedin}
                  onChange={(e) => setLeadData({ ...leadData, linkedin: e.target.value })}
                  placeholder="e.g. linkedin.com/company/acme"
                  className={inputClass}
                />
              </div>

              {/* Decision Makers List */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[var(--foreground)]">
                    Decision Makers / Contact Persons (1, 2, 3+)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setLeadData({
                        ...leadData,
                        contacts: [
                          ...leadData.contacts,
                          { name: '', designation: '', linkedin: '', email: '', phone: '' },
                        ],
                      })
                    }
                    className="text-[11px] text-[var(--primary)] font-medium hover:underline"
                  >
                    + Add Person
                  </button>
                </div>

                {leadData.contacts.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] space-y-1.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => {
                          const copy = [...leadData.contacts];
                          copy[i] = { ...copy[i], name: e.target.value };
                          setLeadData({ ...leadData, contacts: copy });
                        }}
                        placeholder={`Person ${i + 1} Name`}
                        className="input-minimal px-2 py-1.5 rounded-md text-xs bg-white"
                      />
                      <input
                        type="text"
                        value={c.designation || ''}
                        onChange={(e) => {
                          const copy = [...leadData.contacts];
                          copy[i] = { ...copy[i], designation: e.target.value };
                          setLeadData({ ...leadData, contacts: copy });
                        }}
                        placeholder="Title (e.g. CEO, CTO)"
                        className="input-minimal px-2 py-1.5 rounded-md text-xs bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={c.linkedin || ''}
                        onChange={(e) => {
                          const copy = [...leadData.contacts];
                          copy[i] = { ...copy[i], linkedin: e.target.value };
                          setLeadData({ ...leadData, contacts: copy });
                        }}
                        placeholder="LinkedIn Profile URL"
                        className="input-minimal px-2 py-1.5 rounded-md text-xs bg-white"
                      />
                      <input
                        type="email"
                        value={c.email || ''}
                        onChange={(e) => {
                          const copy = [...leadData.contacts];
                          copy[i] = { ...copy[i], email: e.target.value };
                          setLeadData({ ...leadData, contacts: copy });
                        }}
                        placeholder="Email"
                        className="input-minimal px-2 py-1.5 rounded-md text-xs bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
                <div>
                  <label className={labelClass}>Lead source</label>
                  <select
                    value={leadData.source}
                    onChange={(e) => setLeadData({ ...leadData, source: e.target.value })}
                    className={inputClass}
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Upwork Profile 1 Prince">Upwork · Prince</option>
                    <option value="Upwork Profile 2 Het">Upwork · Het</option>
                    <option value="Upwork Profile 3 Aman">Upwork · Aman</option>
                    <option value="Cold Email">Cold Email</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Estimate type</label>
                <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface-muted)]">
                  {['Fixed', 'Hourly'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLeadData({ ...leadData, estimateType: t })}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        leadData.estimateType === t ? 'bg-white text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'
                      }`}
                    >
                      {t === 'Fixed' ? 'Fixed budget' : 'Hourly (Upwork)'}
                    </button>
                  ))}
                </div>
              </div>
              {leadData.estimateType === 'Fixed' ? (
                <div>
                  <label className={labelClass}>Estimated budget ($)</label>
                  <input
                    type="number"
                    value={leadData.budget}
                    onChange={(e) => setLeadData({ ...leadData, budget: e.target.value })}
                    placeholder="25000"
                    className={inputClass}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Hourly rate ($)</label>
                    <input
                      type="number"
                      value={leadData.hourlyRate}
                      onChange={(e) => setLeadData({ ...leadData, hourlyRate: e.target.value })}
                      placeholder="15"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Hours per week</label>
                    <input
                      type="number"
                      value={leadData.estimatedWeeklyHours}
                      onChange={(e) => setLeadData({ ...leadData, estimatedWeeklyHours: e.target.value })}
                      placeholder="20"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'client' && (
            <>
              <div>
                <label className={labelClass}>Company name *</label>
                <input
                  required
                  type="text"
                  value={clientData.company}
                  onChange={(e) => setClientData({ ...clientData, company: e.target.value })}
                  placeholder="Acme Global Inc"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Primary contact person</label>
                <input
                  type="text"
                  value={clientData.contactPerson}
                  onChange={(e) => setClientData({ ...clientData, contactPerson: e.target.value })}
                  placeholder="Sarah Jenkins"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Billing email *</label>
                <input
                  required
                  type="email"
                  value={clientData.email}
                  onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                  placeholder="billing@acmeglobal.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Source</label>
                <select
                  value={clientData.source}
                  onChange={(e) => setClientData({ ...clientData, source: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Where did this client come from?</option>
                  <option value="Upwork Profile 1 Prince">Upwork Profile 1 Prince</option>
                  <option value="Upwork Profile 2 Het">Upwork Profile 2 Het</option>
                  <option value="Upwork Profile 3 Aman">Upwork Profile 3 Aman</option>
                  <option value="B2B Partner">B2B Partner</option>
                  <option value="Referral">Referral</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Direct">Direct</option>
                  <option value="Cold Email">Cold Email</option>
                  <option value="Website">Website</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Currency</label>
                  <select
                    value={clientData.currency}
                    onChange={(e) => setClientData({ ...clientData, currency: e.target.value })}
                    className={inputClass}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Billing type</label>
                  <select
                    value={clientData.billingType}
                    onChange={(e) => setClientData({ ...clientData, billingType: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Retainer">Retainer</option>
                    <option value="Hourly">Hourly (Upwork)</option>
                  </select>
                </div>
              </div>
              {clientData.billingType === 'Retainer' ? (
                <div>
                  <label className={labelClass}>Monthly retainer value</label>
                  <input
                    type="number"
                    value={clientData.retainerValue}
                    onChange={(e) => setClientData({ ...clientData, retainerValue: e.target.value })}
                    placeholder="12500"
                    className={inputClass}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Hourly rate</label>
                    <input
                      type="number"
                      value={clientData.hourlyRate}
                      onChange={(e) => setClientData({ ...clientData, hourlyRate: e.target.value })}
                      placeholder="45"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Weekly hour cap</label>
                    <input
                      type="number"
                      value={clientData.weeklyHourLimit}
                      onChange={(e) => setClientData({ ...clientData, weeklyHourLimit: e.target.value })}
                      placeholder="20"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'project' && (
            <>
              <div>
                <label className={labelClass}>Project name *</label>
                <input
                  required
                  type="text"
                  value={projectData.name}
                  onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                  placeholder="Next.js platform redesign"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Project budget ($)</label>
                <input
                  type="number"
                  value={projectData.budget}
                  onChange={(e) => setProjectData({ ...projectData, budget: e.target.value })}
                  placeholder="15000"
                  className={inputClass}
                />
              </div>
            </>
          )}

          {tab === 'task' && (
            <>
              <div>
                <label className={labelClass}>Task title *</label>
                <input
                  required
                  type="text"
                  value={taskData.title}
                  onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                  placeholder="Build JWT permission middleware"
                  className={inputClass}
                />
              </div>
            </>
          )}

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating…' : `Create ${tab}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
