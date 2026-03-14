'use client';

import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { leadsAtom, activeLeadAtom } from '@/store/leadsStore';
import { Lead, LeadStatus } from '@/types/lead';
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

const HEADER_COLORS = [
    'bg-violet-50',
    'bg-blue-50',
    'bg-emerald-50',
    'bg-rose-50',
    'bg-amber-50',
    'bg-indigo-50',
];

const SCORE_EXPLANATION = 'AI score is calculated based on engagement level, response time, lead source, and notes sentiment. 80+ = high priority.';

interface AiScore { label: string; reason: string; score: number; }
interface BestTime { when: string; reason: string; }

export default function LeadDetailPanel({ lead, onClose }: { lead: Lead; onClose: () => void }) {
    const [, setLeads] = useAtom(leadsAtom);
    const [, setActiveLead] = useAtom(activeLeadAtom);

    const [emailDraft, setEmailDraft] = useState('');
    const [drafting, setDrafting] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiScore, setAiScore] = useState<AiScore | null>(null);
    const [copied, setCopied] = useState(false);
    const [selectedTone, setSelectedTone] = useState<string>('Friendly');
    const [showScoreInfo, setShowScoreInfo] = useState(false);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState('');
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [bestTime, setBestTime] = useState<BestTime | null>(null);
    const [bestTimeLoading, setBestTimeLoading] = useState(false);
    const [editingNotes, setEditingNotes] = useState(false);
    const [notesValue, setNotesValue] = useState(lead.notes);

    // Lock background scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Auto-load summary
    useEffect(() => {
        setSummaryLoading(true);
        setSummary('');
        fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'summary', payload: { lead } }),
        })
            .then(r => r.json())
            .then(d => setSummary(d.summary || ''))
            .catch(() => setSummary(''))
            .finally(() => setSummaryLoading(false));
    }, [lead.id]);

    const updateStatus = (status: LeadStatus) => {
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status } : l));
        setActiveLead({ ...lead, status });
        toast.success(`Status updated to ${status}`);
    };

    const handleBestTime = async () => {
        setBestTimeLoading(true);
        setBestTime(null);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'best_time', payload: { lead } }),
            });
            if (res.status === 401) { toast.error('Invalid API key.'); return; }
            const data = await res.json();
            setBestTime(data.best_time ?? null);
        } catch { toast.error('Failed to fetch best time.'); }
        finally { setBestTimeLoading(false); }
    };

    const getHeaderGradient = (id: string) => {
        const num = id.replace(/\D/g, '');
        const index = parseInt(num) % HEADER_COLORS.length;
        return HEADER_COLORS[index];
    };
    const handleDraftEmail = async () => {
        setDrafting(true);
        setEmailDraft('');
        setError('');
        try {
            let strategy = null;
            try {
                const stratRes = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'reply_suggestion', payload: { lead } }),
                });
                const stratData = await stratRes.json();
                strategy = stratData.reply_suggestion ?? null;
            } catch { }

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'email', payload: { lead, strategy: { ...strategy, tone: selectedTone } } }),
            });
            if (res.status === 401) { toast.error('Invalid API key.'); setDrafting(false); return; }
            if (!res.ok) throw new Error('Network error');
            const data = await res.json();
            const email = data.email || 'Could not generate email.';
            let i = 0;
            const interval = setInterval(() => {
                setEmailDraft(email.slice(0, i));
                i += 4;
                if (i > email.length) {
                    setEmailDraft(email);
                    clearInterval(interval);
                    setDrafting(false);
                    toast.success('Email draft ready!');
                }
            }, 16);
        } catch {
            toast.error('Failed to generate email. Please try again.');
            setDrafting(false);
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setAiScore(null);
        setError('');
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'score', payload: { leads: [lead] } }),
            });
            if (res.status === 401) { toast.error('Invalid API key.'); return; }
            const data = await res.json();
            if (data.scores?.[0]) { setAiScore(data.scores[0]); toast.success('AI score analysis complete!'); }
        } catch { toast.error('AI analysis failed. Please try again.'); }
        finally { setAnalyzing(false); }
    };

    const copyEmail = () => {
        navigator.clipboard.writeText(emailDraft);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Email copied to clipboard!');
    };

    const scoreLabel = aiScore?.label ?? lead.label;
    const scoreCfg = scoreLabel ? SCORE_CONFIG[scoreLabel] : null;

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <div className="w-full md:w-[480px] bg-white border-l border-zinc-200 flex flex-col overflow-hidden shadow-xl">

                {/* Header */}
                <div className={`px-6 pt-5 pb-4 border-b border-zinc-100 bg-gradient-to-br ${getHeaderGradient(lead.id)}`}>
                    <div className="flex items-start justify-between mb-3">
                        <p className="text-[11px] text-zinc-400 font-mono tracking-widest">{lead.id}</p>
                        <button onClick={onClose} className="text-zinc-300 hover:text-zinc-500 transition-colors text-lg leading-none">✕</button>
                    </div>
                    <h2 className="text-xl font-bold text-zinc-800 mb-0.5">{lead.name}</h2>
                    <p className="text-sm text-zinc-400">{lead.company} · {lead.city}</p>

                    {/* Email + Source chips */}
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <a
                            href={`mailto:${lead.email}`}
                            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 bg-white border border-zinc-200 rounded-full px-2.5 py-1 hover:border-violet-300 hover:text-violet-600 transition-colors"
                        >
                            <span>✉</span> {lead.email}
                        </a>
                        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 bg-white border border-zinc-200 rounded-full px-2.5 py-1">
                            <span>◎</span> {lead.source}
                        </span>
                    </div>

                    {/* AI Summary */}
                    {summaryLoading ? (
                        <div className="flex items-center gap-2 mt-3">
                            <span className="w-3 h-3 border-2 border-violet-300 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-zinc-400">Analyzing...</span>
                        </div>
                    ) : summary ? (
                        <p className="text-xs text-violet-500 font-medium mt-3 leading-relaxed">{summary}</p>
                    ) : null}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                            <p className="text-sm text-red-500">{error}</p>
                        </div>
                    )}

                    {/* Status + Score row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={lead.status}
                            onChange={e => updateStatus(e.target.value as LeadStatus)}
                            className={`text-xs px-3 py-1.5 rounded-full font-semibold border cursor-pointer outline-none ${STATUS_STYLES[lead.status]}`}
                        >
                            {(['New', 'Contacted', 'Qualified', 'Lost'] as LeadStatus[]).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        {scoreCfg && (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-zinc-200 ${scoreCfg.bg} ${scoreCfg.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${scoreCfg.dot} animate-pulse`} />
                                {scoreLabel}
                                {(aiScore?.score ?? lead.score) !== null && (
                                    <span className="opacity-50 font-mono ml-0.5">{aiScore?.score ?? lead.score}</span>
                                )}
                            </div>
                        )}
                        <div className="flex-1 flex justify-end items-center gap-2">
                            <div className="relative flex-1 flex justify-end items-center gap-3">
                                <button onClick={() => setShowScoreInfo(v => !v)} className="text-[11px] text-zinc-300 hover:text-zinc-500 transition-colors">
                                    ⓘ
                                </button>
                                {showScoreInfo && (
                                    <div className="absolute right-0 top-5 w-60 bg-white border border-zinc-200 rounded-xl p-3 shadow-lg z-10">
                                        <p className="text-xs text-zinc-500 leading-relaxed">{SCORE_EXPLANATION}</p>
                                    </div>
                                )}
                            </div>
                            <span className="text-xs text-zinc-400">
                                {lead.last_contacted === 0 ? 'Today' : `Last contact ${lead.last_contacted}d ago`}
                            </span>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="rounded-xl p-4 border border-zinc-100 bg-zinc-50/60">
                        <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Notes</p>
                            {!editingNotes ? (
                                <button onClick={() => setEditingNotes(true)} className="text-[11px] text-zinc-400 hover:text-violet-500 transition-colors">
                                    Edit
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingNotes(false)} className="text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={() => {
                                        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, notes: notesValue } : l));
                                        setActiveLead({ ...lead, notes: notesValue });
                                        setEditingNotes(false);
                                        toast.success('Notes saved!');
                                    }} className="text-[11px] text-violet-500 font-semibold hover:text-violet-700 transition-colors">
                                        Save
                                    </button>
                                </div>
                            )}
                        </div>
                        {editingNotes ? (
                            <textarea
                                value={notesValue}
                                onChange={e => setNotesValue(e.target.value)}
                                autoFocus
                                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 leading-relaxed resize-none outline-none focus:border-violet-300 transition-colors"
                                rows={4}
                            />
                        ) : (
                            <p className="text-sm text-zinc-600 leading-relaxed">{notesValue}</p>
                        )}
                    </div>

                    {/* Best Time Result */}
                    {bestTime && (
                        <div className="rounded-xl p-4 border border-emerald-100 border-l-4 border-l-emerald-400 bg-emerald-50/50">
                            <p className="text-[10px] text-emerald-600 uppercase tracking-widest mb-1.5 font-mono">Best Time to Contact</p>
                            <p className="text-sm font-bold text-zinc-800">{bestTime.when}</p>
                            <p className="text-xs text-zinc-500 mt-1">{bestTime.reason}</p>
                        </div>
                    )}

                    {/* AI Score Result */}
                    {aiScore && (
                        <div className="rounded-xl p-4 border border-violet-100 border-l-4 border-l-violet-400 bg-violet-50/50">
                            <p className="text-[10px] text-violet-500 uppercase tracking-widest mb-1.5 font-mono">AI Analysis</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-sm font-bold text-zinc-800">{aiScore.label}</p>
                                <span className="text-xs text-zinc-400 font-mono">{aiScore.score} / 100</span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">{aiScore.reason}</p>
                        </div>
                    )}

                    {/* Email Draft */}
                    {(emailDraft || drafting) && (
                        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 bg-zinc-50/80">
                                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Email Draft</p>
                                {!drafting && <span className="text-[11px] text-emerald-500 font-medium">Ready to edit</span>}
                            </div>
                            <textarea
                                value={emailDraft}
                                onChange={e => setEmailDraft(e.target.value)}
                                className="w-full px-4 py-3 text-sm text-zinc-700 leading-relaxed resize-none outline-none"
                                style={{ minHeight: '160px', fontFamily: 'inherit' }}
                                rows={Math.max(8, emailDraft.split('\n').length + 1)}
                            />
                            {!drafting && (
                                <div className="px-4 pb-3">
                                    <button onClick={copyEmail} className="w-full py-2 rounded-lg bg-zinc-800 text-white text-xs font-semibold hover:bg-zinc-700 transition-colors">
                                        {copied ? 'Copied!' : 'Copy to clipboard'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/40 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={handleAnalyze} disabled={analyzing}
                            className="py-2.5 rounded-lg text-xs font-semibold bg-white border border-zinc-200 text-zinc-600 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-all disabled:opacity-40">
                            {analyzing ? 'Analyzing...' : 'Run AI Score'}
                        </button>
                        <button onClick={handleBestTime} disabled={bestTimeLoading}
                            className="py-2.5 rounded-lg text-xs font-semibold bg-white border border-zinc-200 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all disabled:opacity-40">
                            {bestTimeLoading ? 'Thinking...' : 'Best Time to Contact'}
                        </button>
                    </div>
                    <div className="flex gap-1.5">
                        {(['Neutral', 'Friendly', 'Formal', 'Urgent'] as const).map(tone => (
                            <button
                                key={tone}
                                onClick={() => setSelectedTone(tone)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    selectedTone === tone
                                        ? 'bg-zinc-800 text-white'
                                        : 'bg-white text-zinc-400 border border-zinc-200 hover:text-zinc-600'
                                }`}
                            >
                                {tone}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleDraftEmail} disabled={drafting}
                        className="w-full py-2.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-all disabled:opacity-40">
                        {drafting ? 'Drafting...' : `Draft Email - ${selectedTone}`}
                    </button>
                </div>

            </div>
        </div>
    );
}
