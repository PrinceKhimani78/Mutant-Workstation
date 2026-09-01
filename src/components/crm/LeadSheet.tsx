'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Mail,
  Phone,
  User,
  Plus,
  Trash2,
  ExternalLink,
  Edit2,
  Copy,
  Check,
  Download,
  Search,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Globe,
  Briefcase,
  Link2,
  X,
} from 'lucide-react';

function LinkedInIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

export interface DecisionMaker {
  id?: string;
  name: string;
  designation?: string;
  linkedin?: string;
  email?: string;
  phone?: string;
}

export function parseContacts(raw: any): DecisionMaker[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

interface LeadSheetProps {
  leads: any[];
  stages: any[];
  isOwner: boolean;
  onRefresh: () => void;
  onStageChange: (leadId: string, stageId: string) => void;
  onDeleteLead: (leadId: string) => void;
}

export function LeadSheet({
  leads,
  stages,
  isOwner,
  onRefresh,
  onStageChange,
  onDeleteLead,
}: LeadSheetProps) {
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Quick Add State
  const [company, setCompany] = useState('');
  const [companyLinkedin, setCompanyLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [stageId, setStageId] = useState(stages[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [contacts, setContacts] = useState<DecisionMaker[]>([
    { name: '', designation: '', linkedin: '', email: '', phone: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({
    company: '',
    linkedin: '',
    website: '',
    industry: '',
    stageId: '',
    notes: '',
    contacts: [],
  });

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const addContactSlot = () => {
    setContacts((prev) => [
      ...prev,
      { name: '', designation: '', linkedin: '', email: '', phone: '' },
    ]);
  };

  const updateContactSlot = (index: number, field: keyof DecisionMaker, value: string) => {
    setContacts((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeContactSlot = (index: number) => {
    if (contacts.length <= 1) {
      setContacts([{ name: '', designation: '', linkedin: '', email: '', phone: '' }]);
      return;
    }
    setContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Filter non-empty contacts
      const validContacts = contacts.filter(
        (c) => c.name.trim() || c.designation?.trim() || c.linkedin?.trim() || c.email?.trim() || c.phone?.trim()
      );

      const payload = {
        company: company.trim(),
        linkedin: companyLinkedin.trim(),
        website: website.trim(),
        industry: industry.trim(),
        stageId: stageId || stages[0]?.id || '',
        notes: notes.trim(),
        source: 'LinkedIn',
        contacts: validContacts,
      };

      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to add prospect');
        setIsSubmitting(false);
        return;
      }

      // Reset form
      setCompany('');
      setCompanyLinkedin('');
      setWebsite('');
      setIndustry('');
      setNotes('');
      setContacts([{ name: '', designation: '', linkedin: '', email: '', phone: '' }]);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error creating lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (lead: any) => {
    const parsed = parseContacts(lead.contacts);
    const initialContacts = parsed.length > 0
      ? parsed
      : [{ name: lead.name || '', designation: '', linkedin: '', email: lead.email || '', phone: lead.phone || '' }];

    setEditForm({
      id: lead.id,
      company: lead.company || '',
      linkedin: lead.linkedin || '',
      website: lead.website || '',
      industry: lead.industry || '',
      stageId: lead.stageId || '',
      notes: lead.notes || '',
      contacts: initialContacts,
    });
    setEditingLead(lead);
  };

  const saveEdit = async () => {
    if (!editingLead) return;

    const validContacts = editForm.contacts.filter(
      (c: DecisionMaker) => c.name?.trim() || c.designation?.trim() || c.linkedin?.trim() || c.email?.trim() || c.phone?.trim()
    );

    const payload = {
      company: editForm.company,
      linkedin: editForm.linkedin,
      website: editForm.website,
      industry: editForm.industry,
      stageId: editForm.stageId,
      notes: editForm.notes,
      contacts: validContacts,
      name: validContacts[0]?.name || editForm.company || 'Untitled Prospect',
      email: validContacts[0]?.email || '',
      phone: validContacts[0]?.phone || null,
    };

    const res = await fetch(`/api/crm/leads/${editingLead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setEditingLead(null);
      onRefresh();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to update lead');
    }
  };

  const addQuickDecisionMakerToLead = async (lead: any) => {
    const existing = parseContacts(lead.contacts);
    const newPerson: DecisionMaker = {
      name: prompt('Decision maker name:') || '',
      designation: prompt('Designation / Title (e.g. CEO, CTO):') || '',
      linkedin: prompt('LinkedIn Profile URL:') || '',
      email: prompt('Email:') || '',
      phone: prompt('Phone number:') || '',
    };

    if (!newPerson.name && !newPerson.designation && !newPerson.linkedin && !newPerson.email) {
      return;
    }

    const updatedContacts = [...existing, newPerson];

    await fetch(`/api/crm/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts: updatedContacts }),
    });

    onRefresh();
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;

    const headers = [
      'Company',
      'Company LinkedIn',
      'Website',
      'Industry',
      'Stage',
      'Contact 1 Name',
      'Contact 1 Title',
      'Contact 1 LinkedIn',
      'Contact 1 Email',
      'Contact 1 Phone',
      'Contact 2 Name',
      'Contact 2 Title',
      'Contact 2 LinkedIn',
      'Contact 2 Email',
      'Contact 2 Phone',
      'Contact 3 Name',
      'Contact 3 Title',
      'Contact 3 LinkedIn',
      'Contact 3 Email',
      'Contact 3 Phone',
      'Notes',
    ];

    const rows = leads.map((l) => {
      const c = parseContacts(l.contacts);
      const c1 = c[0] || {};
      const c2 = c[1] || {};
      const c3 = c[2] || {};

      return [
        `"${(l.company || '').replace(/"/g, '""')}"`,
        `"${(l.linkedin || '').replace(/"/g, '""')}"`,
        `"${(l.website || '').replace(/"/g, '""')}"`,
        `"${(l.industry || '').replace(/"/g, '""')}"`,
        `"${(l.stage?.name || '').replace(/"/g, '""')}"`,
        `"${(c1.name || l.name || '').replace(/"/g, '""')}"`,
        `"${(c1.designation || '').replace(/"/g, '""')}"`,
        `"${(c1.linkedin || '').replace(/"/g, '""')}"`,
        `"${(c1.email || l.email || '').replace(/"/g, '""')}"`,
        `"${(c1.phone || l.phone || '').replace(/"/g, '""')}"`,
        `"${(c2.name || '').replace(/"/g, '""')}"`,
        `"${(c2.designation || '').replace(/"/g, '""')}"`,
        `"${(c2.linkedin || '').replace(/"/g, '""')}"`,
        `"${(c2.email || '').replace(/"/g, '""')}"`,
        `"${(c2.phone || '').replace(/"/g, '""')}"`,
        `"${(c3.name || '').replace(/"/g, '""')}"`,
        `"${(c3.designation || '').replace(/"/g, '""')}"`,
        `"${(c3.linkedin || '').replace(/"/g, '""')}"`,
        `"${(c3.email || '').replace(/"/g, '""')}"`,
        `"${(c3.phone || '').replace(/"/g, '""')}"`,
        `"${(l.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LinkedIn_Prospect_Sheet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter((l) => {
    const cList = parseContacts(l.contacts);
    const contactsMatch = cList.some(
      (c) =>
        (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
        (c.designation && c.designation.toLowerCase().includes(search.toLowerCase())) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
    );

    const matchesSearch =
      (l.company && l.company.toLowerCase().includes(search.toLowerCase())) ||
      (l.name && l.name.toLowerCase().includes(search.toLowerCase())) ||
      (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
      (l.linkedin && l.linkedin.toLowerCase().includes(search.toLowerCase())) ||
      contactsMatch;

    const matchesStage = selectedStage ? l.stageId === selectedStage : true;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface-muted)] p-3.5 rounded-xl border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0077b5]/10 text-[#0077b5] flex items-center justify-center shrink-0">
            <LinkedInIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
              <span>LinkedIn Prospect Sheet & Pre-Contact Research</span>
              <span className="badge bg-[#0077b5]/15 text-[#0077b5] text-[10px] px-2 py-0.5 font-medium rounded-full">
                Multi-Contact Support
              </span>
            </h3>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Store companies and multiple decision makers (1, 2, 3+ contacts with titles, profile links & emails). All fields optional.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuickAdd((v) => !v)}
            className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 rounded-lg"
          >
            {showQuickAdd ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showQuickAdd ? 'Hide Quick Add' : 'Show Quick Add'}</span>
          </button>
          <button
            onClick={exportToCSV}
            className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 rounded-lg"
            title="Export full sheet to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Collapsible Quick Add Prospect Bar */}
      {showQuickAdd && (
        <form
          onSubmit={handleQuickAddSubmit}
          className="card p-4 space-y-3.5 border-2 border-[var(--primary)]/20 shadow-sm bg-[var(--surface)]"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)]">
              <Sparkles className="w-4 h-4 text-[var(--primary)]" />
              <span>Quick Add Prospect (All Fields Optional)</span>
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)]">
              Source defaults to LinkedIn · Add as many decision makers as you found
            </span>
          </div>

          {/* Company Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-1">Company Name</label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-[var(--muted-foreground)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="input-minimal w-full pl-8 pr-2.5 py-1.5 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-1">Company LinkedIn Link</label>
              <div className="relative">
                <LinkedInIcon className="w-3.5 h-3.5 text-[#0077b5] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={companyLinkedin}
                  onChange={(e) => setCompanyLinkedin(e.target.value)}
                  placeholder="linkedin.com/company/..."
                  className="input-minimal w-full pl-8 pr-2.5 py-1.5 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-1">Website</label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 text-[var(--muted-foreground)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="input-minimal w-full pl-8 pr-2.5 py-1.5 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-1">Pipeline Stage</label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="input-minimal w-full px-2.5 py-1.5 rounded-lg text-xs"
              >
                {stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Decision Makers Section */}
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>Decision Makers / Contact Persons ({contacts.length})</span>
              </span>
              <button
                type="button"
                onClick={addContactSlot}
                className="text-[11px] text-[var(--primary)] font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add 2nd or 3rd Contact</span>
              </button>
            </div>

            <div className="space-y-2">
              {contacts.map((contact, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 p-2.5 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] items-center relative"
                >
                  <div className="md:col-span-1">
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => updateContactSlot(idx, 'name', e.target.value)}
                      placeholder={`Person ${idx + 1} Name`}
                      className="input-minimal w-full px-2 py-1.5 rounded-md text-xs bg-white"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <input
                      type="text"
                      value={contact.designation || ''}
                      onChange={(e) => updateContactSlot(idx, 'designation', e.target.value)}
                      placeholder="Designation (e.g. CEO, CTO)"
                      className="input-minimal w-full px-2 py-1.5 rounded-md text-xs bg-white"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <input
                      type="text"
                      value={contact.linkedin || ''}
                      onChange={(e) => updateContactSlot(idx, 'linkedin', e.target.value)}
                      placeholder="LinkedIn Profile URL"
                      className="input-minimal w-full px-2 py-1.5 rounded-md text-xs bg-white"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <input
                      type="email"
                      value={contact.email || ''}
                      onChange={(e) => updateContactSlot(idx, 'email', e.target.value)}
                      placeholder="Email address"
                      className="input-minimal w-full px-2 py-1.5 rounded-md text-xs bg-white"
                    />
                  </div>

                  <div className="md:col-span-1 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={contact.phone || ''}
                      onChange={(e) => updateContactSlot(idx, 'phone', e.target.value)}
                      placeholder="Phone / WhatsApp"
                      className="input-minimal w-full px-2 py-1.5 rounded-md text-xs bg-white"
                    />
                    {contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContactSlot(idx)}
                        className="p-1 text-[var(--muted-foreground)] hover:text-[var(--danger)] shrink-0"
                        title="Remove contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Bar: Notes & Submit */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Quick notes / outreach angle / pitch notes (optional)…"
              className="input-minimal w-full sm:w-2/3 px-3 py-1.5 rounded-lg text-xs"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving to Sheet…' : 'Save to Sheet'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, decision maker name, designation (e.g. CEO), LinkedIn, email…"
              className="input-minimal w-full pl-8 pr-3 py-1.5 rounded-lg text-xs"
            />
          </div>

          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="input-minimal px-2.5 py-1.5 rounded-lg text-xs shrink-0"
          >
            <option value="">All Stages</option>
            {stages.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-[var(--muted-foreground)]">
          Showing <strong className="text-[var(--foreground)]">{filteredLeads.length}</strong> prospects
        </span>
      </div>

      {/* Spreadsheet Data Grid */}
      <div className="card overflow-hidden border border-[var(--border)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-foreground)] uppercase text-[10px] font-semibold tracking-wider">
                <th className="p-3 min-w-[200px]">Company & LinkedIn</th>
                <th className="p-3 min-w-[340px]">Decision Makers (1, 2, 3+)</th>
                <th className="p-3 min-w-[140px]">Stage</th>
                <th className="p-3 min-w-[180px]">Notes</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredLeads.map((lead) => {
                const leadContacts = parseContacts(lead.contacts);
                const hasContacts = leadContacts.length > 0;

                return (
                  <tr key={lead.id} className="hover:bg-[var(--surface-muted)]/50 transition-colors align-top">
                    {/* Company Column */}
                    <td className="p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/crm/${lead.id}`} className="font-bold text-xs text-[var(--foreground)] hover:underline">
                          {lead.company || lead.name || 'Untitled Company'}
                        </Link>
                        {lead.linkedin && (
                          <a
                            href={lead.linkedin.startsWith('http') ? lead.linkedin : `https://${lead.linkedin}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-[#0077b5]/10 text-[#0077b5] hover:bg-[#0077b5]/20 transition-colors"
                            title="Open Company LinkedIn"
                          >
                            <LinkedInIcon className="w-3 h-3" />
                          </a>
                        )}
                        {lead.website && (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-[var(--surface-muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                            title="Open Website"
                          >
                            <Globe className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      {lead.industry && (
                        <span className="badge bg-[var(--surface-muted)] text-[var(--muted-foreground)] text-[10px] px-1.5 py-0.5 rounded">
                          {lead.industry}
                        </span>
                      )}
                    </td>

                    {/* Decision Makers Column */}
                    <td className="p-3 space-y-2">
                      {hasContacts ? (
                        <div className="space-y-1.5">
                          {leadContacts.map((dm, dmIdx) => (
                            <div
                              key={dmIdx}
                              className="p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-[var(--foreground)]">
                                    {dm.name || `Decision Maker ${dmIdx + 1}`}
                                  </span>
                                  {dm.designation && (
                                    <span className="badge bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] px-1.5 py-0.2 rounded font-medium">
                                      {dm.designation}
                                    </span>
                                  )}
                                </div>

                                {dm.linkedin && (
                                  <a
                                    href={dm.linkedin.startsWith('http') ? dm.linkedin : `https://${dm.linkedin}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-[10px] font-medium text-[#0077b5] hover:underline"
                                  >
                                    <LinkedInIcon className="w-3 h-3" />
                                    <span>Profile</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>

                              {(dm.email || dm.phone) && (
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted-foreground)]">
                                  {dm.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="w-3 h-3 text-[var(--muted-foreground)]" />
                                      <a href={`mailto:${dm.email}`} className="hover:underline">
                                        {dm.email}
                                      </a>
                                      <button
                                        onClick={() => handleCopy(dm.email || '', `email-${lead.id}-${dmIdx}`)}
                                        className="p-0.5 hover:text-[var(--foreground)]"
                                        title="Copy email"
                                      >
                                        {copiedKey === `email-${lead.id}-${dmIdx}` ? (
                                          <Check className="w-2.5 h-2.5 text-emerald-500" />
                                        ) : (
                                          <Copy className="w-2.5 h-2.5" />
                                        )}
                                      </button>
                                    </div>
                                  )}

                                  {dm.phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-[var(--muted-foreground)]" />
                                      <span>{dm.phone}</span>
                                      <button
                                        onClick={() => handleCopy(dm.phone || '', `phone-${lead.id}-${dmIdx}`)}
                                        className="p-0.5 hover:text-[var(--foreground)]"
                                        title="Copy phone"
                                      >
                                        {copiedKey === `phone-${lead.id}-${dmIdx}` ? (
                                          <Check className="w-2.5 h-2.5 text-emerald-500" />
                                        ) : (
                                          <Copy className="w-2.5 h-2.5" />
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[var(--muted-foreground)] italic">
                          {lead.name ? `${lead.name} (${lead.email || 'No email'})` : 'No decision makers listed yet.'}
                        </div>
                      )}

                      <button
                        onClick={() => addQuickDecisionMakerToLead(lead)}
                        className="text-[10px] text-[var(--primary)] font-medium hover:underline flex items-center gap-1 pt-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Another Person</span>
                      </button>
                    </td>

                    {/* Stage Column */}
                    <td className="p-3">
                      <select
                        value={lead.stageId}
                        onChange={(e) => onStageChange(lead.id, e.target.value)}
                        className="input-minimal px-2 py-1 rounded-md text-[11px] font-medium"
                        style={{
                          backgroundColor: `${lead.stage?.color || '#2563eb'}14`,
                          color: lead.stage?.color || '#2563eb',
                          borderColor: `${lead.stage?.color || '#2563eb'}40`,
                        }}
                      >
                        {stages.map((st) => (
                          <option key={st.id} value={st.id} style={{ color: '#000', backgroundColor: '#fff' }}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Notes Column */}
                    <td className="p-3 text-[11px] text-[var(--muted-foreground)] max-w-[220px]">
                      <p className="line-clamp-3">{lead.notes || '—'}</p>
                    </td>

                    {/* Actions Column */}
                    <td className="p-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => startEdit(lead)}
                          className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors"
                          title="Edit prospect"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteLead(lead.id)}
                          className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
                          title="Delete from sheet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--muted-foreground)]">
                    No prospects found. Use the Quick Add bar above to save your first LinkedIn prospect!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Edit Lead Modal */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-2xl rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--primary)]" />
                <span>Edit Prospect & Decision Makers</span>
              </h3>
              <button onClick={() => setEditingLead(null)} className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1">Company Name</label>
                <input
                  type="text"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  className="input-minimal w-full px-3 py-2 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1">Company LinkedIn URL</label>
                <input
                  type="text"
                  value={editForm.linkedin}
                  onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                  className="input-minimal w-full px-3 py-2 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1">Website</label>
                <input
                  type="text"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="input-minimal w-full px-3 py-2 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1">Pipeline Stage</label>
                <select
                  value={editForm.stageId}
                  onChange={(e) => setEditForm({ ...editForm, stageId: e.target.value })}
                  className="input-minimal w-full px-3 py-2 rounded-lg text-xs"
                >
                  {stages.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Decision Makers List in Edit Modal */}
            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground)]">Decision Makers (Contact Persons)</span>
                <button
                  type="button"
                  onClick={() =>
                    setEditForm({
                      ...editForm,
                      contacts: [
                        ...editForm.contacts,
                        { name: '', designation: '', linkedin: '', email: '', phone: '' },
                      ],
                    })
                  }
                  className="text-xs text-[var(--primary)] font-medium hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Decision Maker</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {editForm.contacts.map((c: DecisionMaker, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[var(--foreground)]">Person #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm({
                            ...editForm,
                            contacts: editForm.contacts.filter((_: any, i: number) => i !== idx),
                          })
                        }
                        className="text-[11px] text-[var(--danger)] hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => {
                          const copy = [...editForm.contacts];
                          copy[idx] = { ...copy[idx], name: e.target.value };
                          setEditForm({ ...editForm, contacts: copy });
                        }}
                        placeholder="Full Name"
                        className="input-minimal w-full px-2.5 py-1.5 rounded-md text-xs bg-white"
                      />

                      <input
                        type="text"
                        value={c.designation || ''}
                        onChange={(e) => {
                          const copy = [...editForm.contacts];
                          copy[idx] = { ...copy[idx], designation: e.target.value };
                          setEditForm({ ...editForm, contacts: copy });
                        }}
                        placeholder="Designation / Title"
                        className="input-minimal w-full px-2.5 py-1.5 rounded-md text-xs bg-white"
                      />

                      <input
                        type="text"
                        value={c.linkedin || ''}
                        onChange={(e) => {
                          const copy = [...editForm.contacts];
                          copy[idx] = { ...copy[idx], linkedin: e.target.value };
                          setEditForm({ ...editForm, contacts: copy });
                        }}
                        placeholder="LinkedIn Profile URL"
                        className="input-minimal w-full px-2.5 py-1.5 rounded-md text-xs bg-white"
                      />

                      <input
                        type="email"
                        value={c.email || ''}
                        onChange={(e) => {
                          const copy = [...editForm.contacts];
                          copy[idx] = { ...copy[idx], email: e.target.value };
                          setEditForm({ ...editForm, contacts: copy });
                        }}
                        placeholder="Email"
                        className="input-minimal w-full px-2.5 py-1.5 rounded-md text-xs bg-white"
                      />

                      <input
                        type="text"
                        value={c.phone || ''}
                        onChange={(e) => {
                          const copy = [...editForm.contacts];
                          copy[idx] = { ...copy[idx], phone: e.target.value };
                          setEditForm({ ...editForm, contacts: copy });
                        }}
                        placeholder="Phone Number"
                        className="input-minimal w-full px-2.5 py-1.5 rounded-md text-xs bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1">Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                placeholder="Outreach notes, angles, or updates…"
                className="input-minimal w-full px-3 py-2 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setEditingLead(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="btn btn-primary px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
