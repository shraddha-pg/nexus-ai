'use client';

import { useState } from 'react';
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

interface AiScore {
    label: string;
    reason: string;
    score: number;
}

export default function LeadDetailPanel({ lead, onClose }: { lead: Lead; onClose: () => void }) {
    const [emailDraft, setEmailDraft] = useState('');
    const [drafting, setDrafting] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiScore, setAiScore] = useState<AiScore | null>(null);

    const handleDraftEmail = async () => {
        setDrafting(true);
        setEmailDraft('');
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'email', payload: { lead } }),
            });

            if (!res.ok) throw new Error('Network response was not ok');

            const text = await res.text();
            if (!text) throw new Error('Empty response');

            const data = JSON.parse(text);
            const email = data.email || 'Could not generate email.';

            let i = 0;
            const interval = setInterval(() => {
                setEmailDraft(email.slice(0, i));
                i += 4;
                if (i > email.length) {
                    setEmailDraft(email);
                    clearInterval(interval);
                    setDrafting(false);
                }
            }, 16);
        } catch (err) {
            console.error(err);
            setEmailDraft('Failed to generate email. Please try again.');
            setDrafting(false);
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setAiScore(null);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'score', payload: { leads: [lead] } }),
            });
            const data = await res.json();
            if (data.scores?.[0]) setAiScore(data.scores[0]);
        } catch (err) {
            console.error(err);
        } finally {
            setAnalyzing(false);
        }
    };

    const scoreLabel = aiScore?.label ?? lead.label;
    const scoreCfg = scoreLabel ? SCORE_CONFIG[scoreLabel] : null;

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="w-[480px] bg-[#0f1117] border-l border-white/10 flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-start justify-between">
                    <div>
                        <p className="text-xs text-zinc-500 font-mono mb-1">{lead.id}</p>
                        <h2 className="text-xl font-bold text-white">{lead.name}</h2>
                        <p className="text-sm text-zinc-400 mt-0.5">{lead.company} · {lead.city}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Status Row */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[lead.status]}`}>
                            {lead.status}
                        </span>
                        {scoreCfg && (
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${scoreCfg.bg} ${scoreCfg.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${scoreCfg.dot} animate-pulse`} />
                                {scoreLabel}
                                {(aiScore?.score ?? lead.score) !== null && (
                                    <span className="opacity-60 font-mono">·{aiScore?.score ?? lead.score}</span>
                                )}
                            </div>
                        )}
                        <span className="text-xs text-zinc-500 ml-auto">
                            {lead.last_contacted === 0 ? 'Contacted today' : `Last contact ${lead.last_contacted}d ago`}
                        </span>
                    </div>

                    {/* Notes */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/8">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2 font-mono">Notes</p>
                        <p className="text-sm text-zinc-300 leading-relaxed">{lead.notes}</p>
                    </div>

                    {/* AI Score Result */}
                    {aiScore && (
                        <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-xl p-4 border border-violet-500/20">
                            <p className="text-xs text-violet-400 uppercase tracking-widest mb-2 font-mono">AI Analysis</p>
                            <p className="text-lg font-bold text-white mb-1">
                                {aiScore.label} <span className="text-zinc-400 font-mono text-sm">·{aiScore.score}</span>
                            </p>
                            <p className="text-sm text-zinc-400">{aiScore.reason}</p>
                        </div>
                    )}

                    {/* Email Draft */}
                    {(emailDraft || drafting) && (
                        <div className="bg-white/5 rounded-xl p-4 border border-white/8">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">AI Email Draft</p>
                                {!drafting && <span className="text-xs text-emerald-400 font-mono">✓ Ready to edit</span>}
                            </div>
                            <textarea
                                value={emailDraft}
                                onChange={e => setEmailDraft(e.target.value)}
                                className="w-full bg-transparent text-sm text-zinc-300 leading-relaxed resize-none outline-none min-h-[200px] font-mono"
                            />
                            {!drafting && (
                                <button className="mt-3 w-full py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm font-semibold border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors">
                                    Send Email ↗
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-white/10 space-y-2">
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="w-full py-2.5 rounded-xl bg-violet-500/20 text-violet-300 text-sm font-semibold border border-violet-500/30 hover:bg-violet-500/30 transition-all disabled:opacity-50"
                    >
                        {analyzing ? '🤖 Analyzing...' : '🤖 Run AI Score Analysis'}
                    </button>
                    <button
                        onClick={handleDraftEmail}
                        disabled={drafting}
                        className="w-full py-2.5 rounded-xl bg-white/5 text-zinc-300 text-sm font-semibold border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                        {drafting ? '✍️ Drafting...' : '✍️ Draft Follow-up Email'}
                    </button>
                </div>
            </div>
        </div>
    );
}