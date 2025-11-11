import { beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function restoreEnv() {
  process.env = { ...ORIGINAL_ENV };
}

async function loadModule({
  apiKey = "test-key",
  responseText = "summary response",
  throwError = false,
}: {
  apiKey?: string | null;
  responseText?: string;
  throwError?: boolean;
} = {}) {
  await vi.resetModules();
  restoreEnv();

  if (apiKey) {
    process.env.OPENAI_API_KEY = apiKey;
  } else {
    delete process.env.OPENAI_API_KEY;
  }

  const createMock = vi.fn().mockImplementation(() => {
    if (throwError) {
      throw new Error("API failure");
    }
    return { choices: [{ message: { content: responseText } }] };
  });
  const ctorMock = vi.fn();

  vi.doMock("openai", () => ({
    default: class MockOpenAI {
      chat = {
        completions: {
          create: createMock,
        },
      };
      constructor(config: { apiKey: string }) {
        ctorMock(config);
      }
    },
  }));

  const mod = await import("@/lib/ai");
  return { ...mod, createMock, ctorMock };
}

describe("summarizeProfile", () => {
  beforeEach(async () => {
    await vi.resetModules();
    restoreEnv();
  });

  it("returns empty string when OPENAI_API_KEY missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { summarizeProfile } = await import("@/lib/ai");
    const result = await summarizeProfile({
      role: "CEO",
      structured: { name: "Alice" },
      freeText: "experienced",
    });

    expect(result).toBe("");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("OPENAI_API_KEY not configured; returning empty summary.")
    );
  });

  it("calls OpenAI with structured payload and returns content", async () => {
    const { summarizeProfile, createMock, ctorMock } = await loadModule({
      responseText: "Short summary",
    });

    const structured = { name: "Alice", skills: ["Product"] };
    const result = await summarizeProfile({
      role: "CEO",
      structured,
      freeText: "experienced operator",
    });

    expect(ctorMock).toHaveBeenCalledWith({ apiKey: "test-key" });
    expect(createMock).toHaveBeenCalledWith({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a concise recruiter summarizer." },
        {
          role: "user",
          content: expect.stringContaining('JSON={"name":"Alice","skills":["Product"]} NOTE=experienced operator'),
        },
      ],
      temperature: 0.2,
    });
    expect(result).toBe("Short summary");
  });

  it("returns empty string when OpenAI call throws", async () => {
    const { summarizeProfile } = await loadModule({
      throwError: true,
    });

    const result = await summarizeProfile({
      role: "CTO",
      structured: { name: "Bob" },
    });

    expect(result).toBe("");
  });
});

describe("buildMatchRationale", () => {
  beforeEach(async () => {
    await vi.resetModules();
    restoreEnv();
  });

  it("returns empty string when OPENAI_API_KEY missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { buildMatchRationale } = await import("@/lib/ai");
    const result = await buildMatchRationale("CEO summary", "CTO summary");

    expect(result).toBe("");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("OPENAI_API_KEY not configured; skipping match rationale generation.")
    );
  });

  it("calls OpenAI with both summaries and returns text", async () => {
    const { buildMatchRationale, createMock } = await loadModule({
      responseText: "• Point 1\n• Point 2",
    });

    const result = await buildMatchRationale("visionary leader", "builder");

    expect(createMock).toHaveBeenCalledWith({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Explain the match succinctly in 3 bullet points." },
        { role: "user", content: "CEO: visionary leader\nCTO: builder" },
      ],
      temperature: 0.2,
    });
    expect(result).toBe("• Point 1\n• Point 2");
  });

  it("returns empty string when OpenAI call fails", async () => {
    const { buildMatchRationale } = await loadModule({ throwError: true });

    const result = await buildMatchRationale("CEO", "CTO");

    expect(result).toBe("");
  });
});

afterAll(() => {
  restoreEnv();
});

