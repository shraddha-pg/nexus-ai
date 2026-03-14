import { NextRequest, NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { Lead } from "@/types/lead";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

const model = groq("llama-3.3-70b-versatile");

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    if (!body)
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 },
      );

    const { type, payload } = JSON.parse(body);

    // 1. Query Bar - Convert English to JSON filter
    if (type === "filter") {
      const { text } = await generateText({
        model,
        system: `You are a CRM Data Assistant. Convert user natural language into a JSON filter object.
Available Fields:
- city: string (Pune, Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Ahmedabad)
- status: 'New' | 'Contacted' | 'Qualified' | 'Lost'
- last_contacted_min: number (minimum days since last contact)
- label: 'Hot' | 'Warm' | 'Cold'

Output ONLY valid JSON, nothing else. No explanation, no markdown, no backticks.
Format: { "city"?: string, "status"?: string, "last_contacted_min"?: number, "label"?: string }

Examples:
"hot leads from Pune" → { "city": "Pune", "label": "Hot" }
"leads not contacted in 7 days" → { "last_contacted_min": 7 }
"new leads in Mumbai" → { "city": "Mumbai", "status": "New" }`,
        prompt: payload.query,
      });

      try {
        const clean = text.replace(/```json|```/g, "").trim();
        const filter = JSON.parse(clean);
        return NextResponse.json({ filter });
      } catch {
        return NextResponse.json({ filter: {} });
      }
    }

    // 2. Batch AI Scoring
    if (type === "score") {
      const { leads } = payload;
      const leadsText = leads
        .map(
          (l: Lead) =>
            `ID: ${l.id}, Name: ${l.name}, Status: ${l.status}, Notes: "${l.notes}"`,
        )
        .join("\n");

      const { text } = await generateText({
        model,
        system: `You are a sales intelligence AI. Analyze lead notes and return a JSON array of scores.
Output ONLY a valid JSON array, nothing else. No markdown, no backticks, no explanation.
Format: [{ "id": string, "label": "Hot"|"Warm"|"Cold", "score": number(0-100), "reason": string(max 10 words) }]`,
        prompt: `Score these leads:\n${leadsText}`,
      });

      try {
        const clean = text.replace(/```json|```/g, "").trim();
        const scores = JSON.parse(clean);
        return NextResponse.json({ scores });
      } catch {
        return NextResponse.json({ scores: [] });
      }
    }

    // 3. Email Drafting
    if (type === "email") {
      const { lead, strategy } = payload;
      if (!lead) return NextResponse.json({ email: "" }, { status: 400 });

      const strategyContext = strategy
        ? `\nTone to use: ${strategy.tone}\nApproach: ${strategy.suggestion}`
        : "";

      const { text } = await generateText({
        model,
        system: `You are a professional sales assistant. Write a short personalized follow-up email.
Keep it under 150 words. Be warm but professional.
Output ONLY the email text with subject line. No explanation, no markdown.`,
        prompt: `Write a follow-up email for:
Name: ${lead.name}
Company: ${lead.company}
City: ${lead.city}
Status: ${lead.status}
Notes: ${lead.notes}
Last contacted: ${lead.last_contacted} days ago${strategyContext}`,
      });

      return NextResponse.json({ email: text });
    }

    // 4. Lead Summary (auto on panel open)
    if (type === "summary") {
      const { lead } = payload;
      const { text } = await generateText({
        model,
        system: `You are a sales intelligence AI. Summarize a lead in ONE short sentence (max 12 words).
Be direct and actionable. No fluff. No punctuation at end.
Examples: "Ready to close - requested proposal and has budget approved"
         "Needs nurturing - interested but no urgency yet"
         "High risk of churn - no contact in 14 days"`,
        prompt: `Summarize this lead:
Name: ${lead.name}, Company: ${lead.company}
Status: ${lead.status}, Score: ${lead.label ?? 'Unknown'}
Notes: ${lead.notes}
Last contacted: ${lead.last_contacted} days ago`,
      });
      return NextResponse.json({ summary: text.trim() });
    }

    // 5. Best Time to Contact
    if (type === "best_time") {
      const { lead } = payload;
      const { text } = await generateText({
        model,
        system: `You are a sales coach AI. Suggest the best time to contact a lead.
Output ONLY a JSON object, no markdown, no explanation.
Format: { "when": string (e.g. "Today", "Tomorrow morning", "Within 3 days", "Next week"), "reason": string (max 12 words) }`,
        prompt: `When should we contact this lead?
Status: ${lead.status}
Last contacted: ${lead.last_contacted} days ago
Notes: ${lead.notes}
Score: ${lead.label ?? 'Unknown'}`,
      });
      try {
        const clean = text.replace(/```json|```/g, "").trim();
        const result = JSON.parse(clean);
        return NextResponse.json({ best_time: result });
      } catch {
        return NextResponse.json({ best_time: { when: "As soon as possible", reason: "Unable to analyze" } });
      }
    }

    // 6. Reply Suggestion
    if (type === "reply_suggestion") {
      const { lead } = payload;
      const { text } = await generateText({
        model,
        system: `You are a sales assistant. Suggest a short reply strategy for a lead.
Output ONLY a JSON object, no markdown, no explanation.
Format: { "tone": "Urgent"|"Friendly"|"Formal"|"Nurturing", "suggestion": string (2-3 sentences max, what to say in next outreach) }`,
        prompt: `What should I say to this lead next?
Name: ${lead.name}, Company: ${lead.company}
Status: ${lead.status}, Score: ${lead.label ?? 'Unknown'}
Notes: ${lead.notes}
Last contacted: ${lead.last_contacted} days ago`,
      });
      try {
        const clean = text.replace(/```json|```/g, "").trim();
        const result = JSON.parse(clean);
        return NextResponse.json({ reply_suggestion: result });
      } catch {
        return NextResponse.json({ reply_suggestion: { tone: "Friendly", suggestion: "Unable to generate suggestion." } });
      }
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (err: any) {
    console.error("API route error:", err);
    // Groq 401 - invalid API key
    if (err?.statusCode === 401 || err?.message?.includes("Invalid API Key")) {
      return NextResponse.json({ error: "INVALID_API_KEY" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
