'use client';

import { useAtom } from 'jotai';
import { leadsAtom, selectedLeadsAtom, activeLeadAtom, isAnalyzingAtom, searchAtom, sortFieldAtom, sortDirAtom, SortField } from '@/store/leadsStore';
import { Lead } from '@/types/lead';
import { toast } from '@/components/ui/Toast';

const STATUS_STYLES: Record<string, string> = {
    New: 'bg-blue-50 text-blue-600 border border-blue-200',
    Contacted: 'bg-amber-50 text-amber-600 border border-amber-200',
    Qualified: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    Lost: 'bg-red-50 text-red-500 border border-red-200',
};

const SCORE_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
    Hot: { bg: 'bg-rose-50', text: 'text-rose-500', dot: 'bg-rose-400' },
    Warm: { bg: 'bg-amber-50', text: 'text-amber-500', dot: 'bg-amber-400' },
    Cold: { bg: 'bg-sky-50', text: 'text-sky-500', dot: 'bg-sky-400' },
};

function ScoreBadge({ score, label }: { score: number | null; label: string | null }) {
    if (!label) return <span className="text-zinc-300 text-xs font-mono">—</span>;
    const cfg = SCORE_CONFIG[label];
    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-zinc-200 ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
            {label}
            {score !== null && <span className="opacity-50 font-mono">· {score}</span>}
        </div>
    );
}

function SortIcon({ field, active, dir }: { field: string; active: boolean; dir: 'asc' | 'desc' }) {
    if (!active) return <span className="text-zinc-300 ml-1">↕</span>;
    return <span className="text-violet-500 ml-1">{dir === 'asc' ? '↑' : '↓'}</span>;
}

export default function LeadTable() {
    const [leads, setLeads] = useAtom(leadsAtom);
    const [selected, setSelected] = useAtom(selectedLeadsAtom);
    const [, setActiveLead] = useAtom(activeLeadAtom);
    const [isAnalyzing, setIsAnalyzing] = useAtom(isAnalyzingAtom);
    const [search, setSearch] = useAtom(searchAtom);
    const [sortField, setSortField] = useAtom(sortFieldAtom);
    const [sortDir, setSortDir] = useAtom(sortDirAtom);

    const toggleSelect = (id: string) =>
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const toggleAll = () =>
        setSelected(selected.length === filtered.length ? [] : filtered.map(l => l.id));

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

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
            toast.success('AI scores updated!');
        } catch (err) {
            console.error(err);
            toast.error('AI analysis failed. Try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Filter by search
    const filtered = leads.filter(l => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q);
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
        if (!sortField) return 0;
        let valA: any, valB: any;
        if (sortField === 'name') { valA = a.name; valB = b.name; }
        if (sortField === 'last_contacted') { valA = a.last_contacted; valB = b.last_contacted; }
        if (sortField === 'score') { valA = a.score ?? -1; valB = b.score ?? -1; }
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const sortableHeader = (label: string, field: SortField) => (
        <th
            className="p-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-zinc-600 transition-colors select-none"
            onClick={() => handleSort(field)}
        >
            {label}<SortIcon field={field!} active={sortField === field} dir={sortDir} />
        </th>
    );

    return (
        <div>
            {/* Search bar */}
            <div className="mb-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 text-sm">🔍</span>
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or company..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-700 placeholder-zinc-300 outline-none focus:border-violet-300 transition-colors"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 text-xs">
                        ✕
                    </button>
                )}
            </div>

            {/* Batch Action Bar */}
            {selected.length > 0 && (
                <div className="mb-3 flex items-center gap-3 p-3 bg-violet-50 border border-violet-200 rounded-xl">
                    <span className="text-sm text-violet-600 font-medium">
                        {selected.length} lead{selected.length > 1 ? 's' : ''} selected
                    </span>
                    <button
                        onClick={handleBatchAnalyze}
                        disabled={isAnalyzing}
                        className="ml-auto px-4 py-2 rounded-lg bg-violet-100 text-violet-700 text-sm font-semibold border border-violet-200 hover:bg-violet-200 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isAnalyzing ? (
                            <><span className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />Running AI Analysis...</>
                        ) : '🤖 Run AI Analysis on Selected'}
                    </button>
                    <button onClick={() => setSelected([])} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">Cancel</button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">

                {/* Mobile — Card View */}
                <div className="block md:hidden divide-y divide-zinc-100">
                    {sorted.map(lead => (
                        <div key={lead.id} onClick={() => setActiveLead(lead)}
                            className="px-4 py-3 flex items-center justify-between active:bg-zinc-50 cursor-pointer">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-semibold text-zinc-800 truncate">{lead.name}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_STYLES[lead.status]}`}>
                                        {lead.status}
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-400">{lead.company} · {lead.city}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                {lead.label && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border border-zinc-200 ${SCORE_CONFIG[lead.label].bg} ${SCORE_CONFIG[lead.label].text}`}>
                                        {lead.label}
                                    </span>
                                )}
                                <span className="text-zinc-300 text-sm">›</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop — Table View */}
                <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[640px]">
                    <thead>
                        <tr className="border-b border-zinc-100">
                            <th className="p-4 w-10">
                                <input
                                    type="checkbox"
                                    checked={selected.length === sorted.length && sorted.length > 0}
                                    onChange={toggleAll}
                                    className="w-4 h-4 rounded border-zinc-300 accent-violet-500 cursor-pointer"
                                />
                            </th>
                            {sortableHeader('Lead', 'name')}
                            <th className="p-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-widest">City</th>
                            <th className="p-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-widest">Status</th>
                            {sortableHeader('AI Score', 'score')}
                            {sortableHeader('Last Contact', 'last_contacted')}
                            <th className="p-4" />
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map(lead => (
                            <tr key={lead.id} className={`border-b border-zinc-50 transition-colors cursor-pointer hover:bg-zinc-50/80 ${selected.includes(lead.id) ? 'bg-violet-50/50' : ''}`}>
                                <td className="p-4" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(lead.id)}
                                        onChange={() => toggleSelect(lead.id)}
                                        className="w-4 h-4 rounded border-zinc-300 accent-violet-500 cursor-pointer block"
                                    />
                                </td>
                                <td className="p-4" onClick={() => setActiveLead(lead)}>
                                    <p className="text-sm font-semibold text-zinc-800">{lead.name}</p>
                                    <p className="text-xs text-zinc-400 mt-0.5">{lead.company}</p>
                                </td>
                                <td className="p-4" onClick={() => setActiveLead(lead)}>
                                    <span className="text-sm text-zinc-500">{lead.city}</span>
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
                                    <span className={`text-xs font-mono ${lead.last_contacted > 7 ? 'text-red-400' : lead.last_contacted > 3 ? 'text-amber-500' : 'text-zinc-400'}`}>
                                        {lead.last_contacted === 0 ? 'Today' : `${lead.last_contacted}d ago`}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button onClick={() => setActiveLead(lead)} className="text-xs text-zinc-300 hover:text-violet-500 transition-colors font-mono">
                                        View →
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>

                {sorted.length === 0 && (
                    <div className="py-16 text-center">
                        <p className="text-zinc-400 text-sm">{search ? `No leads found for "${search}"` : 'No leads match your query.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
