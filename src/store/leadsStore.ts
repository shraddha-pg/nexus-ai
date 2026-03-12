import { atom } from 'jotai';
import { Lead } from '@/types/lead';
import { MOCK_LEADS } from '@/lib/mockData';

export const leadsAtom = atom<Lead[]>(MOCK_LEADS);
export const selectedLeadsAtom = atom<string[]>([]);
export const activeLeadAtom = atom<Lead | null>(null);
export const queryAtom = atom<string>('');
export const isAnalyzingAtom = atom<boolean>(false);