'use client';

import { useAtom } from 'jotai';
import { leadsAtom, selectedLeadsAtom, activeLeadAtom, isAnalyzingAtom } from '@/store/leadsStore';
import { Lead } from '@/types/lead';

const STATUS_STYLES: Record<string, string> = {
    New: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    Contacted: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    Qualified: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    Lost: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

const SCORE_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
    Hot: { bg: 'bg-rose-500/20', text: 'text-rose-300', dot: 'bg-rose-400' },
    Warm: { bg: 'bg-amber-500/20', text: 'text-amber-300', dot: 'bg-amber-400' },
    Cold: { bg: 'bg-sky-500/20', text: 'text-sky-300', dot: 'bg-sky-400' },
};

function ScoreBadge({ score, label }: { score: number | null; label: string | null }) {
    if (!label) return <span className="text-zinc-600 text-xs font-mono">—</span>;
    const cfg = SCORE_CONFIG[label];
    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
            {label}
            {score !== null && <span className="opacity-60 font-mono">·{score}</span>}
        </div>
    );
}

export default function LeadTable() {
    const [leads, setLeads] = useAtom(leadsAtom);
    const [selected, setSelected] = useAtom(selectedLeadsAtom);
    const [, setActiveLead] = useAtom(activeLeadAtom);
    const [isAnalyzing, setIsAnalyzing] = useAtom(isAnalyzingAtom);

    const toggleSelect = (id: string) =>
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const toggleAll = () =>
        setSelected(selected.length === leads.length ? [] : leads.map(l => l.id));

    const handleBatchAnalyze = async () => {
        if (!selected.length) return;
        setIsAnalyzing(true);

        const selectedLeads = leads.filter(l => selected.includes(l.id));

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'score', payload: { leads: selectedLeads } }),
            });

            const data = await res.json();

            setLeads(prev => prev.map(lead => {
                const updated = data.scores?.find((s: { id: string }) => s.id === lead.id);
                return updated ? { ...lead, label: updated.label, score: updated.score } : lead;
            }));

            setSelected([]);
        } catch (err) {
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div>
            {/* Batch Action Bar */}
            {selected.length > 0 && (
                <div className="mb-4 flex items-center gap-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                    <span className="text-sm text-violet-300 font-medium">
                        {selected.length} lead{selected.length > 1 ? 's' : ''} selected
                    </span>
                    <button
                        onClick={handleBatchAnalyze}
                        disabled={isAnalyzing}
                        className="ml-auto px-4 py-2 rounded-lg bg-violet-500/30 text-violet-200 text-sm font-semibold border border-violet-500/40 hover:bg-violet-500/40 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isAnalyzing ? (
                            <>
                                <span className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                                Running AI Analysis...
                            </>
                        ) : '🤖 Run AI Analysis on Selected'}
                    </button>
                    <button
                        onClick={() => setSelected([])}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-[#0c0e14] border border-white/8 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/8">
                            <th className="p-4 w-10">
                                <input
                                    type="checkbox"
                                    checked={selected.length === leads.length && leads.length > 0}
                                    onChange={toggleAll}
                                    className="w-4 h-4 rounded border-zinc-700 accent-violet-500 cursor-pointer"
                                />
                            </th>
                            {['Lead', 'City', 'Status', 'AI Score', 'Last Contact', ''].map(h => (
                                <th key={h} className="p-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map(lead => (
                            <tr
                                key={lead.id}
                                className={`border-b border-white/5 transition-colors cursor-pointer hover:bg-white/[0.02] ${selected.includes(lead.id) ? 'bg-violet-500/5' : ''}`}
                            >
                                <td className="p-4" onClick={e => { e.stopPropagation(); toggleSelect(lead.id); }}>
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(lead.id)}
                                        onChange={() => toggleSelect(lead.id)}
                                        className="w-4 h-4 rounded border-zinc-700 accent-violet-500 cursor-pointer"
                                    />
                                </td>
                                <td className="p-4" onClick={() => setActiveLead(lead)}>
                                    <p className="text-sm font-semibold text-white">{lead.name}</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">{lead.company}</p>
                                </td>
                                <td className="p-4" onClick={() => setActiveLead(lead)}>
                                    <span className="text-sm text-zinc-300">{lead.city}</span>
                                </td>
                                <td className="p-4" onClick={() => setActiveLead(lead)}>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[lead.status]}`}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="p-4" onClick={() => setActiveLead(lead)}>
                                    <ScoreBadge score={lead.score} label={lead.label} />
                                </td>
                                <td className="p-4" onClick={() => setActiveLead(lead)}>
                                    <span className={`text-xs font-mono ${lead.last_contacted > 7 ? 'text-red-400' : lead.last_contacted > 3 ? 'text-amber-400' : 'text-zinc-400'}`}>
                                        {lead.last_contacted === 0 ? 'Today' : `${lead.last_contacted}d ago`}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => setActiveLead(lead)}
                                        className="text-xs text-zinc-600 hover:text-violet-400 transition-colors font-mono"
                                    >
                                        View →
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {leads.length === 0 && (
                    <div className="py-16 text-center">
                        <p className="text-zinc-600 text-sm">No leads match your query.</p>
                    </div>
                )}
            </div>
        </div>
    );
}