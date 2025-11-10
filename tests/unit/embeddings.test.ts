import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("embeddings helpers", () => {
  it("returns empty bytes and skips persistence when OpenAI API key is missing", async () => {
    const prismaMock = {
      embedding: {
        create: vi.fn(),
      },
    };

    vi.doMock("@/lib/db", () => ({ prisma: prismaMock }));

    const { embed, upsertEmbedding } = await import("@/lib/embeddings");

    const bytes = await embed("Hello world");
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(0);

    await upsertEmbedding("user-1", "CEO", "Hello world", "summary");
    expect(prismaMock.embedding.create).not.toHaveBeenCalled();
  });

  it("stores generated embeddings when OpenAI API key is configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");

    const createMock = vi.fn().mockResolvedValue({
      data: [{ embedding: [0.5, 0.25] }],
    });

    class OpenAIMock {
      embeddings = { create: createMock };
    }

    vi.doMock("openai", () => ({ default: OpenAIMock }));

    const prismaMock = {
      embedding: {
        create: vi.fn(),
      },
    };

    vi.doMock("@/lib/db", () => ({ prisma: prismaMock }));

    const { embed, upsertEmbedding } = await import("@/lib/embeddings");

    const bytes = await embed("Generate me");
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);

    await upsertEmbedding("user-2", "CTO", "Generate me", "summary");

    expect(createMock).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      input: "Generate me",
    });

    expect(createMock).toHaveBeenCalledTimes(2);
    expect(prismaMock.embedding.create).toHaveBeenCalledTimes(1);
    const payload = prismaMock.embedding.create.mock.calls[0][0];
    expect(payload).toMatchObject({
      data: {
        userId: "user-2",
        role: "CTO",
        source: "summary",
      },
    });

    const storedBuffer = payload.data.vector as Buffer;
    const restored = new Float32Array(storedBuffer.buffer, storedBuffer.byteOffset, storedBuffer.byteLength / 4);
    expect(Array.from(restored)).toEqual([0.5, 0.25]);
  });
});


