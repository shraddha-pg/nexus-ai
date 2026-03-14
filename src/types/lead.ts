export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Lost';
export type LeadLabel = 'Hot' | 'Warm' | 'Cold' | null;
export type LeadSource = 'LinkedIn' | 'Referral' | 'Website' | 'Cold Outreach' | 'Event';

export interface Lead {
  id: string;
  name: string;
  company: string;
  city: string;
  status: LeadStatus;
  score: number | null;
  label: LeadLabel;
  notes: string;
  last_contacted: number;
  email: string;
  source: LeadSource;
}
