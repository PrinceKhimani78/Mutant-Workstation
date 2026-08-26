'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';

export default function KnowledgePage() {
  const articles = [
    {
      title: 'Client Onboarding SOP & Checklist',
      category: 'SOP',
      author: 'Prince Khimani',
      summary: '1. Receive signed proposal & retainer payment.\n2. Create client record in Workstation CRM.\n3. Set up Slack & Drive.',
    },
    {
      title: 'Mutant Technologies Brand & Design Guidelines',
      category: 'Guide',
      author: 'Prince Khimani',
      summary: 'Primary accent: #FC6203 (Mutant Orange). Keep surfaces light, minimal, and consistent.',
    },
  ];

  return (
    <div className="space-y-5 max-w-full">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
          <BookOpen className="w-4.5 h-4.5 text-[var(--primary)]" />
          <span>Knowledge base & SOPs</span>
        </h2>
        <p className="text-xs text-[var(--muted-foreground)]">Standard operating procedures, templates, and documentation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((art) => (
          <div key={art.title} className="card p-5 space-y-3">
            <div>
              <span className="badge px-2 py-0.5 text-[10px] bg-[var(--primary-soft)] text-[var(--primary)]">
                {art.category}
              </span>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mt-2">{art.title}</h3>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] whitespace-pre-wrap leading-relaxed">{art.summary}</p>
            <p className="text-[11px] text-[var(--muted-foreground)] pt-2 border-t border-[var(--border)]">By {art.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
