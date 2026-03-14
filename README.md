# Nexus AI - CRM Dashboard

An AI-powered CRM dashboard that replaces traditional dropdown filters with natural language queries and provides intelligent lead insights using LLM APIs.

Built as a portfolio project to demonstrate AI integration in real-world enterprise frontend applications.

**Live Demo:** [nexus-ai.vercel.app](https://nexus-ai.vercel.app)  
**Tech Stack:** Next.js · TypeScript · Tailwind CSS · Jotai · Groq API

---

## Features

### Natural Language Query Bar
Type queries like *"show me hot leads from Delhi contacted this week"* - the AI parses intent and filters the table instantly. No dropdowns, no manual filters.

### Lead Detail Panel
Click any lead to open a full detail panel with:
- **AI Summary** - auto-generated one-line lead insight on open
- **Status Update** - change lead status (New → Contacted → Qualified → Lost) with instant table sync via Jotai
- **Notes Editing** - edit and save lead notes directly in the panel
- **Email + Source** - contact info and lead source visible at a glance

### AI-Powered Actions
- **Run AI Score** - scores the lead Hot / Warm / Cold with a 0–100 score and reasoning
- **Best Time to Contact** - AI recommends optimal outreach timing based on lead context
- **Draft Email** - generates a personalized follow-up email with tone control (Neutral / Friendly / Formal / Urgent); uses reply strategy internally for better output

### Table Features
- **Search** - filter leads by name or company in real time
- **Sort** - click column headers to sort by Lead name, AI Score, or Last Contact
- **Batch AI Analysis** - select multiple leads and run AI scoring in one call
- **Color-coded badges** - status and score labels with visual hierarchy

### UX Details
- Toast notifications for all actions (success, error, info)
- Background scroll lock when panel is open
- Per-lead consistent header color based on lead ID

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Jotai |
| AI / LLM | Groq API - llama-3.3-70b-versatile |
| Deployment | Vercel |

---

## Getting Started

```bash
git clone https://github.com/shraddha-pg/nexus-ai
cd nexus-ai
npm install
```

Create a `.env.local` file:
```
GROQ_API_KEY=your_groq_api_key_here
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Get a free Groq API key at [console.groq.com](https://console.groq.com).

---

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts     # Groq API proxy - filter, score, email, summary, best_time
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── leads/
│   │   ├── LeadDetailPanel.tsx   # Full lead panel with all AI features
│   │   ├── LeadTable.tsx         # Table with search, sort, batch actions
│   │   └── QueryBar.tsx          # Natural language filter bar
│   └── ui/
│       └── Toast.tsx             # Global toast notification system
├── lib/mockData.ts
├── store/leadsStore.ts           # Jotai atoms
└── types/lead.ts
```

---

## AI API Routes

| Type | Description |
|---|---|
| `filter` | Natural language → JSON filter object |
| `score` | Batch lead scoring with label + reason |
| `email` | Personalized email draft with tone + strategy |
| `summary` | One-line lead summary (auto on panel open) |
| `best_time` | Optimal contact timing with reasoning |
| `reply_suggestion` | Tone and approach suggestion (used internally by email) |

---

## Author

**Shraddha Gaikwad** - Frontend Engineer  
[LinkedIn](https://www.linkedin.com/in/shraddha-3010/)
