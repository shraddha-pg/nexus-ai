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
      const { lead } = payload;
      if (!lead) return NextResponse.json({ email: "" }, { status: 400 });

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
Last contacted: ${lead.last_contacted} days ago`,
      });

      return NextResponse.json({ email: text });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (err) {
    console.error("API route error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
