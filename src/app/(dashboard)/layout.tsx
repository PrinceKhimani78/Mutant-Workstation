'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { CommandPalette } from '@/components/CommandPalette';
import { AIAssistantDrawer } from '@/components/AIAssistantDrawer';
import { QuickCreateModal } from '@/components/QuickCreateModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f17] text-white flex">
      {/* Sidebar */}
      <Sidebar user={currentUser} onOpenAI={() => setAiOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header
          title="Mutant Workstation OS"
          onOpenCommand={() => setCommandOpen(true)}
          onOpenQuickCreate={() => setQuickCreateOpen(true)}
        />

        <main className="p-6 flex-1">{children}</main>
      </div>

      {/* Overlays */}
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />
      <AIAssistantDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} />
      <QuickCreateModal isOpen={quickCreateOpen} onClose={() => setQuickCreateOpen(false)} />
    </div>
  );
}
