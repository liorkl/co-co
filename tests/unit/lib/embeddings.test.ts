import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaCreateMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    embedding: {
      create: prismaCreateMock,
    },
  },
}));

const ORIGINAL_ENV = { ...process.env };

function restoreEnv() {
  process.env = { ...ORIGINAL_ENV };
}

async function loadModuleWithOpenAI({
  apiKey = "test-key",
  embeddingVector = [0.1, 0.2, 0.3],
}: {
  apiKey?: string | null;
  embeddingVector?: number[];
} = {}) {
  await vi.resetModules();
  prismaCreateMock.mockReset();

  restoreEnv();
  if (apiKey) {
    process.env.OPENAI_API_KEY = apiKey;
  } else {
    delete process.env.OPENAI_API_KEY;
  }

  const createMock = vi.fn().mockResolvedValue({
    data: [{ embedding: embeddingVector }],
  });
  const ctorMock = vi.fn();

  vi.doMock("openai", () => ({
    default: class MockOpenAI {
      embeddings = { create: createMock };
      constructor(config: { apiKey: string }) {
        ctorMock(config);
      }
    },
  }));

  const mod = await import("@/lib/embeddings");
  return { ...mod, createMock, ctorMock };
}

describe("embed", () => {
  beforeEach(async () => {
    await vi.resetModules();
    prismaCreateMock.mockReset();
    restoreEnv();
  });

  it("returns mock embedding when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { embed } = await import("@/lib/embeddings");
    const result = await embed("hello world");

    expect(result).toBeInstanceOf(Uint8Array);
    // Mock embedding returns 1536-dimensional vector (1536 * 4 bytes = 6144 bytes)
    expect(result.byteLength).toBe(1536 * 4);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("OPENAI_API_KEY not configured; returning mock embedding.")
    );
  });

  it("generates embeddings when API key present", async () => {
    const { embed, createMock, ctorMock } = await loadModuleWithOpenAI({
      apiKey: "present",
      embeddingVector: [0.25, -0.5],
    });

    const result = await embed("generate embedding");

    expect(ctorMock).toHaveBeenCalledWith({ apiKey: "present" });
    expect(createMock).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      input: "generate embedding",
    });
    expect(result).toBeInstanceOf(Uint8Array);
    // Float32Array of length 2 -> 8 bytes backing buffer
    expect(result.byteLength).toBe(8);
  });
});

describe("upsertEmbedding", () => {
  beforeEach(async () => {
    await vi.resetModules();
    prismaCreateMock.mockReset();
    restoreEnv();
  });

  it("uses mock embedding when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { upsertEmbedding } = await import("@/lib/embeddings");

    await upsertEmbedding("user-1", "CEO", "text", "summary");

    // Now creates embedding with mock data instead of skipping
    expect(prismaCreateMock).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        role: "CEO",
        source: "summary",
        vector: expect.any(Buffer),
      },
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("OPENAI_API_KEY not configured; returning mock embedding.")
    );
  });

  it("skips upsert when embedding result is empty", async () => {
    const { upsertEmbedding, createMock } = await loadModuleWithOpenAI({
      embeddingVector: [],
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await upsertEmbedding("user-2", "CTO", "text", "summary");

    expect(createMock).toHaveBeenCalled();
    expect(prismaCreateMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Embedding generation returned empty result")
    );
  });

  it("writes embedding to prisma when generation succeeds", async () => {
    const { upsertEmbedding, createMock } = await loadModuleWithOpenAI({
      embeddingVector: [0.1, 0.2, 0.3],
    });

    await upsertEmbedding("user-3", "CEO", "profile summary", "summary");

    expect(createMock).toHaveBeenCalled();
    expect(prismaCreateMock).toHaveBeenCalledWith({
      data: {
        userId: "user-3",
        role: "CEO",
        source: "summary",
        vector: expect.any(Buffer),
      },
    });
    const bufferArg = (prismaCreateMock.mock.calls[0] as any)[0].data.vector as Buffer;
    const floatArray = new Float32Array(bufferArg.buffer, bufferArg.byteOffset, bufferArg.byteLength / 4);
    const parsed = Array.from(floatArray);
    expect(parsed[0]).toBeCloseTo(0.1, 6);
    expect(parsed[1]).toBeCloseTo(0.2, 6);
    expect(parsed[2]).toBeCloseTo(0.3, 6);
  });
});

afterAll(() => {
  restoreEnv();
});

