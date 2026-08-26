'use client';

import React, { useEffect, useState } from 'react';
import { Briefcase, Mail, Phone, Calendar, DollarSign, ExternalLink } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/clients')
      .then((res) => res.json())
      .then((data) => {
        if (data.clients) setClients(data.clients);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Briefcase className="w-5 h-5 text-[#fc6203]" />
            <span>Retainer Clients Directory</span>
          </h2>
          <p className="text-xs text-[#94a3b8]">Complete record of active client retainers, contracts, and assigned PMs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clients.map((client) => (
          <div key={client.id} className="p-6 rounded-2xl glass-card border border-[#1e293b] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{client.company}</h3>
                <p className="text-xs text-[#94a3b8]">Contact: {client.contactPerson}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {client.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#1e293b] text-xs">
              <div>
                <p className="text-[#64748b] font-mono uppercase text-[10px]">Monthly Retainer</p>
                <p className="text-base font-extrabold text-[#fc6203] font-mono">${client.retainerValue.toLocaleString()}/mo</p>
              </div>
              <div>
                <p className="text-[#64748b] font-mono uppercase text-[10px]">Renewal Date</p>
                <p className="text-sm font-semibold text-white font-mono">
                  {client.renewalDate ? new Date(client.renewalDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-[#94a3b8]">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#fc6203]" />
                <span>{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#fc6203]" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
