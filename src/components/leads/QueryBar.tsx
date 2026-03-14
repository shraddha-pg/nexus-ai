'use client';

import { useAtom } from 'jotai';
import { useState } from 'react';
import { queryAtom, leadsAtom } from '@/store/leadsStore';
import { MOCK_LEADS } from '@/lib/mockData';
import { toast } from '@/components/ui/Toast';

const SUGGESTIONS = [
    'Show hot leads from Pune',
    'Leads not contacted in 7 days',
    'Show qualified leads',
    'Cold leads in Mumbai',
];

export default function QueryBar() {
    const [query, setQuery] = useAtom(queryAtom);
    const [, setLeads] = useAtom(leadsAtom);
    const [loading, setLoading] = useState(false);
    const [resultText, setResultText] = useState('');

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setResultText('');
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'filter', payload: { query } }),
            });
            if (res.status === 401) { toast.error('Invalid API key — check your GROQ_API_KEY.'); return; }
            if (!res.ok) throw new Error('Network error');
            const data = await res.json();
            const filter = data.filter ?? {};
            let filtered = [...MOCK_LEADS];
            if (filter.city) filtered = filtered.filter(l => l.city.toLowerCase() === filter.city.toLowerCase());
            if (filter.status) filtered = filtered.filter(l => l.status.toLowerCase() === filter.status.toLowerCase());
            if (filter.label) filtered = filtered.filter(l => l.label?.toLowerCase() === filter.label.toLowerCase());
            if (filter.last_contacted_min) filtered = filtered.filter(l => l.last_contacted >= filter.last_contacted_min);
            setLeads(filtered);
            setResultText(`Found ${filtered.length} leads`);
            toast.info(`Found ${filtered.length} leads`);
        } catch (err) {
            console.error(err);
            setResultText('Something went wrong. Try again.');
            toast.error('Query failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setQuery('');
        setLeads(MOCK_LEADS);
        setResultText('');
    };

    return (
        <div className="mb-6">
            {/* Input row — stacks on mobile */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 p-1">
                    <div className="flex items-center px-3 py-2 text-violet-400 flex-shrink-0">
                        <span className="text-lg">🤖</span>
                    </div>
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder='Try: "Show hot leads from Pune"'
                        className="flex-1 min-w-0 bg-transparent text-sm text-zinc-700 placeholder-zinc-300 outline-none py-3"
                    />
                    {query && (
                        <button onClick={handleReset} className="px-2 py-2 text-zinc-300 hover:text-zinc-500 text-xs transition-colors flex-shrink-0">
                            Reset
                        </button>
                    )}
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-50 flex-shrink-0"
                    >
                        {loading ? '...' : 'Search'}
                    </button>
                </div>
                {resultText && (
                    <div className="px-4 pb-2">
                        <span className="text-xs text-zinc-400 font-mono">{resultText}</span>
                    </div>
                )}
            </div>

            {/* Suggestion chips — scroll horizontally on mobile */}
            <div className="hidden md:flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                {SUGGESTIONS.map(s => (
                    <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="text-xs px-3 py-1.5 rounded-full bg-white text-zinc-500 border border-zinc-200 hover:border-violet-300 hover:text-violet-500 transition-all whitespace-nowrap flex-shrink-0"
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
}
