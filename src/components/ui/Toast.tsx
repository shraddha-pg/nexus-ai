'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
}

const ICONS: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
};

const STYLES: Record<ToastType, string> = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    error: 'bg-red-50 border-red-200 text-red-600',
    info: 'bg-violet-50 border-violet-200 text-violet-600',
};

const ICON_STYLES: Record<ToastType, string> = {
    success: 'bg-emerald-100 text-emerald-600',
    error: 'bg-red-100 text-red-500',
    info: 'bg-violet-100 text-violet-500',
};

function Toast({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Animate in
        requestAnimationFrame(() => setVisible(true));
        // Animate out before removing
        const out = setTimeout(() => setVisible(false), 2700);
        const remove = setTimeout(onRemove, 3000);
        return () => { clearTimeout(out); clearTimeout(remove); };
    }, []);

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm transition-all duration-300 ${STYLES[toast.type]} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            style={{ minWidth: 240, maxWidth: 320 }}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${ICON_STYLES[toast.type]}`}>
                {ICONS[toast.type]}
            </span>
            <p className="text-sm font-medium">{toast.message}</p>
        </div>
    );
}

// Global toast store
type Listener = (toasts: ToastMessage[]) => void;
let toasts: ToastMessage[] = [];
let listeners: Listener[] = [];
let nextId = 0;

const notify = (listeners: Listener[], toasts: ToastMessage[]) =>
    listeners.forEach(l => l([...toasts]));

export const toast = {
    success: (message: string) => {
        toasts = [...toasts, { id: nextId++, message, type: 'success' }];
        notify(listeners, toasts);
    },
    error: (message: string) => {
        toasts = [...toasts, { id: nextId++, message, type: 'error' }];
        notify(listeners, toasts);
    },
    info: (message: string) => {
        toasts = [...toasts, { id: nextId++, message, type: 'info' }];
        notify(listeners, toasts);
    },
};

export function ToastContainer() {
    const [list, setList] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const listener = (t: ToastMessage[]) => setList(t);
        listeners.push(listener);
        return () => { listeners = listeners.filter(l => l !== listener); };
    }, []);

    const remove = (id: number) => {
        toasts = toasts.filter(t => t.id !== id);
        notify(listeners, toasts);
    };

    if (!list.length) return null;

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2 items-end">
            {list.map(t => (
                <Toast key={t.id} toast={t} onRemove={() => remove(t.id)} />
            ))}
        </div>
    );
}
