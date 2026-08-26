'use client';

import React, { useEffect, useState } from 'react';
import { FolderKanban, CheckCircle2, Clock, Calendar, AlertTriangle } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) setProjects(data.projects);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <FolderKanban className="w-5 h-5 text-[#fc6203]" />
            <span>Projects & Deliverables</span>
          </h2>
          <p className="text-xs text-[#94a3b8]">Live status, progress percentage, and deadlines across agency projects.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((proj) => (
          <div key={proj.id} className="p-6 rounded-2xl glass-card border border-[#1e293b] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{proj.name}</h3>
                <p className="text-xs text-[#94a3b8]">Client: {proj.client?.company}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fc6203]/20 text-[#fc6203] border border-[#fc6203]/30">
                {proj.priority} Priority
              </span>
            </div>

            <p className="text-xs text-[#cbd5e1]">{proj.description}</p>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#94a3b8]">Completion Progress</span>
                <span className="text-white font-bold">{proj.progress}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#0b0f17] overflow-hidden border border-[#1e293b]">
                <div
                  className="h-full bg-gradient-to-r from-[#fc6203] to-[#ff8c42] transition-all duration-500"
                  style={{ width: `${proj.progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#1e293b] text-xs font-mono text-[#94a3b8]">
              <span>Budget: ${proj.budget?.toLocaleString()}</span>
              <span>Deadline: {proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
