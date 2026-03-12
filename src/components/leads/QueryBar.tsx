'use client';

import { useAtom } from 'jotai';
import { useState } from 'react';
import { queryAtom, leadsAtom } from '@/store/leadsStore';
import { MOCK_LEADS } from '@/lib/mockData';
import { Lead } from '@/types/lead';

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

            if (!res.ok) throw new Error('Network response was not ok');

            const text = await res.text(); // safer than .json()
            if (!text) throw new Error('Empty response');

            const data = JSON.parse(text);
            const filter = data.filter ?? {};

            let filtered = [...MOCK_LEADS];

            if (filter.city) filtered = filtered.filter(l => l.city.toLowerCase() === filter.city.toLowerCase());
            if (filter.status) filtered = filtered.filter(l => l.status.toLowerCase() === filter.status.toLowerCase());
            if (filter.label) filtered = filtered.filter(l => l.label?.toLowerCase() === filter.label.toLowerCase());
            if (filter.last_contacted_min) filtered = filtered.filter(l => l.last_contacted >= filter.last_contacted_min);

            setLeads(filtered);
            setResultText(`Found ${filtered.length} leads`);
        } catch (err) {
            console.error(err);
            setResultText('Something went wrong. Try again.');
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
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-2xl blur-xl opacity-50" />
                <div className="relative bg-[#0f1117] border border-white/10 rounded-2xl p-1 flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 text-violet-400">
                        <span className="text-lg">🤖</span>
                    </div>
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder='Try: "Show hot leads from Pune" or "Leads not contacted in 7 days"'
                        className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none py-3"
                    />
                    {resultText && (
                        <span className="text-xs text-zinc-500 font-mono whitespace-nowrap px-2">
                            {resultText}
                        </span>
                    )}
                    {query && (
                        <button
                            onClick={handleReset}
                            className="px-3 py-2 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                        >
                            Reset
                        </button>
                    )}
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-50"
                    >
                        {loading ? 'Thinking...' : 'Search →'}
                    </button>
                </div>
            </div>

            {/* Suggestion chips */}
            <div className="flex gap-2 mt-3 flex-wrap">
                {SUGGESTIONS.map(s => (
                    <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-zinc-400 border border-white/8 hover:bg-white/10 hover:text-zinc-200 transition-all"
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
}