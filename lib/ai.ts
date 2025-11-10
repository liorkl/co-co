import OpenAI from "openai";

const openAIApiKey = process.env.OPENAI_API_KEY;
const client = openAIApiKey ? new OpenAI({ apiKey: openAIApiKey }) : null;

export async function summarizeProfile(input: {
  role: "CEO" | "CTO";
  structured: any;
  freeText?: string;
}): Promise<string> {
  const content = `Summarize this ${input.role} for matching: JSON=${JSON.stringify(
    input.structured
  )} NOTE=${input.freeText ?? ""}`;
  try {
    if (!client) {
      console.warn("🧪 OPENAI_API_KEY not configured; returning empty summary.");
      return "";
    }
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a concise recruiter summarizer." },
        { role: "user", content },
      ],
      temperature: 0.2,
    });
    return completion.choices[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}

export async function buildMatchRationale(ceoSummary: string, ctoSummary: string): Promise<string> {
  try {
    if (!client) {
      console.warn("🧪 OPENAI_API_KEY not configured; skipping match rationale generation.");
      return "";
    }
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Explain the match succinctly in 3 bullet points." },
        { role: "user", content: `CEO: ${ceoSummary}\nCTO: ${ctoSummary}` },
      ],
      temperature: 0.2,
    });
    return completion.choices[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}


