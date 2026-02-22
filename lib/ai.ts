import OpenAI from "openai";

const openAIApiKey = process.env.OPENAI_API_KEY;
const client = openAIApiKey ? new OpenAI({ apiKey: openAIApiKey }) : null;
const useMockOpenAI = process.env.MOCK_OPENAI === "true";

/**
 * Generate a mock profile summary for testing
 */
function generateMockSummary(input: { role: "CEO" | "CTO"; structured: any; freeText?: string }): string {
  const name = input.structured?.name || input.structured?.full_name || "Professional";
  const location = input.structured?.location || "Remote";

  if (input.role === "CEO") {
    const industry = input.structured?.industry || input.structured?.startup_industry || "Technology";
    const stage = input.structured?.stage || input.structured?.startup_stage || "Early-stage";
    return `${name} is a ${stage} CEO based in ${location}, building in the ${industry} space. ${input.freeText ? `Additional context: ${input.freeText.slice(0, 100)}` : "Seeking a technical co-founder to complement their business expertise."}`;
  } else {
    const stack = input.structured?.primary_stack || input.structured?.tech_stack || "Full-stack";
    const experience = input.structured?.years_experience || "5+";
    return `${name} is a ${stack} engineer with ${experience} years of experience, based in ${location}. ${input.freeText ? `Additional context: ${input.freeText.slice(0, 100)}` : "Looking for an exciting startup opportunity with equity."}`;
  }
}

export async function summarizeProfile(input: {
  role: "CEO" | "CTO";
  structured: any;
  freeText?: string;
}): Promise<string> {
  // Use mock mode for testing
  if (useMockOpenAI) {
    console.log("🧪 MOCK_OPENAI enabled; returning mock summary.");
    return generateMockSummary(input);
  }

  const content = `Summarize this ${input.role} for matching: JSON=${JSON.stringify(
    input.structured
  )} NOTE=${input.freeText ?? ""}`;
  try {
    if (!client) {
      console.warn("🧪 OPENAI_API_KEY not configured; returning mock summary.");
      return generateMockSummary(input);
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
  } catch (error) {
    console.warn("🧪 OpenAI API error; falling back to mock summary.", error);
    return generateMockSummary(input);
  }
}

/**
 * Generate a mock match rationale for testing
 */
function generateMockRationale(): string {
  return `• Both share a passion for building innovative products
• Complementary skill sets: business expertise meets technical depth
• Aligned on startup stage and growth ambitions`;
}

export async function buildMatchRationale(ceoSummary: string, ctoSummary: string): Promise<string> {
  // Use mock mode for testing
  if (useMockOpenAI) {
    console.log("🧪 MOCK_OPENAI enabled; returning mock rationale.");
    return generateMockRationale();
  }

  try {
    if (!client) {
      console.warn("🧪 OPENAI_API_KEY not configured; returning mock rationale.");
      return generateMockRationale();
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
  } catch (error) {
    console.warn("🧪 OpenAI API error; falling back to mock rationale.", error);
    return generateMockRationale();
  }
}


