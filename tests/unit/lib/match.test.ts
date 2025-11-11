import { describe, it, expect, beforeEach, vi } from "vitest";
import { findMatchesFor } from "@/lib/match";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => {
  const embedding = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  };
  return {
    prisma: {
      embedding,
    },
  };
});

type Embedding = {
  userId: string;
  role: "CEO" | "CTO";
  source: string;
  vector: Buffer;
};

const prismaEmbedding = prisma.embedding as unknown as {
  findFirst: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
};

function asBuffer(values: number[]): Buffer {
  const floatArray = new Float32Array(values);
  return Buffer.from(floatArray.buffer);
}

function createEmbedding(
  userId: string,
  role: "CEO" | "CTO",
  vector: number[]
): Embedding {
  return {
    userId,
    role,
    source: "summary",
    vector: asBuffer(vector),
  };
}

describe("findMatchesFor", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns empty list when no embedding exists for user", async () => {
    prismaEmbedding.findFirst.mockResolvedValue(null);

    const result = await findMatchesFor("user-1", "CEO");

    expect(result).toEqual([]);
    expect(prismaEmbedding.findMany).not.toHaveBeenCalled();
  });

  it("returns scored matches ordered by similarity and limited to 20", async () => {
    prismaEmbedding.findFirst.mockResolvedValue(
      createEmbedding("user-1", "CEO", [1, 0, 0])
    );

    const matches = Array.from({ length: 25 }).map((_, index) => {
      // vectors gradually less similar
      const scale = 1 - index * 0.02;
      return createEmbedding(
        `cto-${index}`,
        "CTO",
        [scale, Math.max(0, 1 - scale), 0]
      );
    });

    prismaEmbedding.findMany.mockResolvedValue(matches);

    const result = await findMatchesFor("user-1", "CEO");

    expect(prismaEmbedding.findMany).toHaveBeenCalledWith({
      where: { role: "CTO", source: "summary" },
    });
    expect(result).toHaveLength(20);
    // Ensure sorted descending by score
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
    }
    expect(result[0].userId).toBe("cto-0");
  });

  it("handles CTO role by searching for CEO counterparts", async () => {
    prismaEmbedding.findFirst.mockResolvedValue(
      createEmbedding("user-2", "CTO", [0, 1, 0])
    );

    const ceoEmbeddings = [
      createEmbedding("ceo-a", "CEO", [0, 1, 0]),
      createEmbedding("ceo-b", "CEO", [1, 0, 0]),
    ];
    prismaEmbedding.findMany.mockResolvedValue(ceoEmbeddings);

    const result = await findMatchesFor("user-2", "CTO");

    expect(prismaEmbedding.findMany).toHaveBeenCalledWith({
      where: { role: "CEO", source: "summary" },
    });
    expect(result).toHaveLength(2);
    expect(result[0].userId).toBe("ceo-a");
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });
});

