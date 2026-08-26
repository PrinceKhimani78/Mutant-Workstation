'use client';

import React, { useEffect, useState } from 'react';
import { CheckSquare, Clock, User, Plus } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => {
        if (data.tasks) setTasks(data.tasks);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-[#fc6203]" />
            <span>Task Manager & Time Logs</span>
          </h2>
          <p className="text-xs text-[#94a3b8]">Subtasks, recurring checklists, and billable time tracking.</p>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-4 rounded-2xl glass-card border border-[#1e293b] flex items-center justify-between hover:border-[#fc6203]/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={task.status === 'Completed'}
                readOnly
                className="w-4 h-4 rounded border-[#1e293b] text-[#fc6203] focus:ring-0"
              />
              <div>
                <p className={`text-sm font-bold ${task.status === 'Completed' ? 'line-through text-[#64748b]' : 'text-white'}`}>
                  {task.title}
                </p>
                <p className="text-xs text-[#94a3b8]">
                  Project: <span className="text-white font-semibold">{task.project?.name}</span> • Assigned to {task.assignee?.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-[#fc6203] font-semibold">{task.timeLogged} / {task.estimatedHours} hrs</span>
              <span className="px-2.5 py-1 rounded-full bg-[#1e293b] text-[#cbd5e1]">{task.priority}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
