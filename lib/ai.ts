import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function summarizeProfile(input: {
  role: "CEO" | "CTO";
  structured: any;
  freeText?: string;
}): Promise<string> {
  const content = `Summarize this ${input.role} for matching: JSON=${JSON.stringify(
    input.structured
  )} NOTE=${input.freeText ?? ""}`;
  try {
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


