import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("AI helpers", () => {
  it("returns empty strings when OpenAI API key is not present", async () => {
    const { summarizeProfile, buildMatchRationale } = await import("@/lib/ai");

    await expect(
      summarizeProfile({ role: "CEO", structured: { headline: "CTO wanted" }, freeText: "Details" })
    ).resolves.toBe("");

    await expect(buildMatchRationale("Summary A", "Summary B")).resolves.toBe("");
  });

  it("delegates to OpenAI chat completions when configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");

    const summaryMock = vi.fn().mockResolvedValue({
      choices: [{ message: { content: "Short summary" } }],
    });

    const rationaleMock = vi.fn().mockResolvedValue({
      choices: [{ message: { content: "• Point A\n• Point B" } }],
    });

    const createMock = vi.fn()
      .mockImplementationOnce(summaryMock)
      .mockImplementationOnce(rationaleMock);

    class OpenAIMock {
      chat = {
        completions: {
          create: createMock,
        },
      };
    }

    vi.doMock("openai", () => ({ default: OpenAIMock }));

    const { summarizeProfile, buildMatchRationale } = await import("@/lib/ai");

    await expect(
      summarizeProfile({ role: "CTO", structured: { skills: ["TypeScript"] }, freeText: "Great engineer" })
    ).resolves.toBe("Short summary");

    await expect(buildMatchRationale("CEO summary", "CTO summary")).resolves.toBe("• Point A\n• Point B");

    expect(summaryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a concise recruiter summarizer." },
          expect.objectContaining({ role: "user", content: expect.stringContaining("Summarize this CTO") }),
        ],
        temperature: 0.2,
      })
    );

    expect(rationaleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Explain the match succinctly in 3 bullet points." },
          { role: "user", content: "CEO: CEO summary\nCTO: CTO summary" },
        ],
        temperature: 0.2,
      })
    );
  });
});


