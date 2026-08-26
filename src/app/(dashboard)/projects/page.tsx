'use client';

import React, { useEffect, useState } from 'react';
import { FolderKanban } from 'lucide-react';

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
    <div className="space-y-5 max-w-full">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
          <FolderKanban className="w-4.5 h-4.5 text-[var(--primary)]" />
          <span>Projects & deliverables</span>
        </h2>
        <p className="text-xs text-[var(--muted-foreground)]">Live status, progress, and deadlines across agency projects.</p>
      </div>

      {projects.length === 0 && (
        <div className="card p-10 text-center text-sm text-[var(--muted-foreground)]">No projects yet.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((proj) => (
          <div key={proj.id} className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">{proj.name}</h3>
                <p className="text-xs text-[var(--muted-foreground)] truncate">Client: {proj.client?.company}</p>
              </div>
              <span className="badge px-2.5 py-1 text-xs bg-[var(--primary-soft)] text-[var(--primary)] shrink-0">
                {proj.priority}
              </span>
            </div>

            {proj.description && <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">{proj.description}</p>}

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">Completion</span>
                <span className="text-[var(--foreground)] font-semibold">{proj.progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                  style={{ width: `${proj.progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
              <span>Budget: ${proj.budget?.toLocaleString() ?? '—'}</span>
              <span>Deadline: {proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
