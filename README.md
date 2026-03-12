# Nexus AI - CRM with Natural Language Querying

A CRM dashboard that replaces rigid dropdown filters with natural language queries - describe the leads you want in plain English and the UI updates instantly. Also drafts personalized outreach emails based on lead status and context.

---

## The Problem

Traditional CRMs force you to think in filters - dropdowns, date pickers, status checkboxes. You know what you want ("show me leads from last week who opened the email but didn't reply") but the UI makes you translate that into 5 separate inputs.

**Nexus AI lets you just say it.**

---

## Features

- **Natural language filtering** - type a query like "hot leads from Mumbai added this week", get filtered results instantly
- **AI email drafting** - generates personalized outreach based on lead name, status, and context
- **Live CRM dashboard** - lead table with status badges, scores, and activity timestamps
- **Streaming responses** - email drafts stream in token by token, no waiting
- **Responsive UI** - works across screen sizes

---

## Tech Stack

- **React.js + TypeScript** - frontend
- **Next.js** - framework + API routes
- **Groq API** - llama-3.3-70b-versatile (fast inference, free tier)
- **Jotai** - atomic state management
- **Tailwind CSS** - styling

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/nexus-ai.git
cd nexus-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add environment variables

Create a `.env.local` file in the root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Get a free key at [console.groq.com](https://console.groq.com) → API Keys → Create

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How It Works

```
User types natural language query
        ↓
Next.js API route → Groq API (llama-3.3-70b)
        ↓
LLM extracts filters (status, location, date range, score)
        ↓
Frontend filters lead table in real-time
        ↓
User clicks "Draft Email" on any lead
        ↓
Groq streams personalized email based on lead context
```

---

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push repo to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add `GROQ_API_KEY` in Environment Variables
4. Deploy

---

## Built By

**Shraddha Gaikwad** - Frontend Engineer  
[LinkedIn](https://www.linkedin.com/in/shraddha-3010/)
