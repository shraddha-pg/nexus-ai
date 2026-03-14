'use client';

import { useAtom } from 'jotai';
import { activeLeadAtom } from '@/store/leadsStore';
import { leadsAtom } from '@/store/leadsStore';
import { MOCK_LEADS } from '@/lib/mockData';
import QueryBar from '@/components/leads/QueryBar';
import LeadTable from '@/components/leads/LeadTable';
import LeadDetailPanel from '@/components/leads/LeadDetailPanel';

const STATS = (leads: typeof MOCK_LEADS) => [
  { label: 'Total Leads', value: MOCK_LEADS.length, color: 'text-zinc-800' },
  { label: 'Hot Leads', value: leads.filter(l => l.label === 'Hot').length, color: 'text-rose-500' },
  { label: 'Qualified', value: leads.filter(l => l.status === 'Qualified').length, color: 'text-emerald-600' },
  { label: 'Needs Follow-up', value: leads.filter(l => l.last_contacted > 7).length, color: 'text-amber-600' },
];

export default function Home() {
  const [activeLead, setActiveLead] = useAtom(activeLeadAtom);
  const [leads] = useAtom(leadsAtom);

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-zinc-800 font-sans">

      {/* Nav */}
      <nav className="border-b border-zinc-200 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-40 bg-[#f7f5f2]/90 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white">
            N
          </div>
          <span className="font-bold text-zinc-800 text-lg tracking-tight">Nexus AI</span>
          <span className="text-xs text-zinc-400 font-mono ml-1">CRM</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-zinc-400">{leads.length} leads</span>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-xs font-bold text-white">
            S
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-800 mb-1">Lead Pipeline</h1>
          <p className="text-zinc-400 text-sm">Ask anything. Your AI assistant will handle the rest.</p>
        </div>

        {/* Stats — 2 cols on mobile, 4 on desktop */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS(leads).map(stat => (
            <div key={stat.label} className="bg-white border border-zinc-200 rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* AI Query Bar */}
        <QueryBar />

        {/* Lead Table */}
        <LeadTable />
      </main>

      {activeLead && (
        <LeadDetailPanel
          lead={activeLead}
          onClose={() => setActiveLead(null)}
        />
      )}
    </div>
  );
}
