'use client';

import React from 'react';
import { BookOpen, FileText, Search } from 'lucide-react';

export default function KnowledgePage() {
  const articles = [
    {
      title: 'Client Onboarding SOP & Checklist',
      category: 'SOP',
      author: 'Prince Khimani',
      summary: '1. Receive signed proposal & retainer payment.\n2. Create Client record in Workstation CRM.\n3. Setup Slack & Drive.',
    },
    {
      title: 'Mutant Technologies Brand & Design Guidelines',
      category: 'Guide',
      author: 'Prince Khimani',
      summary: 'Primary Accent: #FC6203 (Mutant Orange). Dark Slate Surface: #0B0F17. Card Surface: #131B2E.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#fc6203]" />
            <span>Internal Knowledge Base & SOPs</span>
          </h2>
          <p className="text-xs text-[#94a3b8]">Standard operating procedures, proposal templates, and documentation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((art) => (
          <div key={art.title} className="p-6 rounded-2xl glass-card border border-[#1e293b] space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#fc6203]/20 text-[#fc6203]">
                  {art.category}
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">{art.title}</h3>
              </div>
            </div>
            <p className="text-xs text-[#94a3b8] font-mono whitespace-pre-wrap">{art.summary}</p>
            <p className="text-[10px] text-[#64748b] pt-2 border-t border-[#1e293b]">Author: {art.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
