import { describe, expect, it, beforeEach, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  embedding: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import { findMatchesFor } from "@/lib/match";

function toBuffer(values: number[]) {
  return Buffer.from(new Float32Array(values).buffer);
}

describe("findMatchesFor", () => {
  const { embedding } = prismaMock;

  beforeEach(() => {
    embedding.findFirst.mockReset();
    embedding.findMany.mockReset();
  });

  it("returns an empty list when the user does not have an embedding", async () => {
    embedding.findFirst.mockResolvedValue(null);

    const matches = await findMatchesFor("user-1", "CEO");

    expect(matches).toEqual([]);
    expect(embedding.findMany).not.toHaveBeenCalled();
  });

  it("returns sorted matches limited to 20 users from the counterpart role", async () => {
    embedding.findFirst.mockResolvedValue({
      userId: "user-1",
      source: "summary",
      role: "CEO",
      vector: toBuffer([1, 0]),
    });

    embedding.findMany.mockResolvedValue(
      Array.from({ length: 25 }).map((_, index) => ({
        userId: `user-${index + 2}`,
        source: "summary",
        role: "CTO",
        vector: toBuffer([1, index]),
      }))
    );

    const matches = await findMatchesFor("user-1", "CEO");

    expect(embedding.findMany).toHaveBeenCalledWith({
      where: { role: "CTO", source: "summary" },
    });
    expect(matches).toHaveLength(20);
    expect(matches[0]?.userId).toBe("user-2");
    expect(matches[matches.length - 1]?.userId).toBe("user-21");
    for (let i = 0; i < matches.length - 1; i++) {
      expect(matches[i].score).toBeGreaterThanOrEqual(matches[i + 1].score);
    }
  });
});


