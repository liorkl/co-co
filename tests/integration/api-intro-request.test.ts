import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  getTestPrismaClient,
  resetDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from "../helpers/db";

const hasDatabaseUrl = Boolean(process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL);
const describeIfDatabaseConfigured = hasDatabaseUrl ? describe : describe.skip;

const prismaHolder: { prisma: PrismaClient | null } = { prisma: null };
const authMock = vi.fn();
const limitMock = vi.fn();

vi.mock("@/lib/db", () => ({
  get prisma() {
    if (!prismaHolder.prisma) {
      throw new Error("Prisma client requested before test database setup.");
    }
    return prismaHolder.prisma;
  },
}));

vi.mock("@/auth", () => ({
  auth: () => authMock(),
}));

vi.mock("@/lib/rateLimit", () => ({
  limit: (key: string, kind?: "auth" | "api") => limitMock(key, kind),
}));

describeIfDatabaseConfigured("API /api/intro/request", () => {
  let postHandler: typeof import("@/app/api/intro/request/route").POST;
  let getHandler: typeof import("@/app/api/intro/request/route").GET;
  let patchHandler: typeof import("@/app/api/intro/request/route").PATCH;

  beforeAll(async () => {
    const { prisma } = await setupTestDatabase();
    prismaHolder.prisma = prisma;
    const module = await import("@/app/api/intro/request/route");
    postHandler = module.POST;
    getHandler = module.GET;
    patchHandler = module.PATCH;
  }, 60000);

  afterEach(async () => {
    authMock.mockReset();
    limitMock.mockReset();
    await resetDatabase();
  });

  afterAll(async () => {
    prismaHolder.prisma = null;
    await teardownTestDatabase();
  });

  describe("POST /api/intro/request", () => {
    it("returns 401 when unauthenticated", async () => {
      authMock.mockResolvedValue(null);
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/intro/request", {
        method: "POST",
        body: JSON.stringify({ targetId: "some-id" }),
      });

      const response = await postHandler(request);
      expect(response.status).toBe(401);
    });

    it("returns 429 when rate limit is exceeded", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: false });

      const request = new Request("http://localhost/api/intro/request", {
        method: "POST",
        body: JSON.stringify({ targetId: "some-id" }),
      });

      const response = await postHandler(request);
      expect(response.status).toBe(429);
    });

    it("returns 400 for invalid JSON", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/intro/request", {
        method: "POST",
        body: "not valid json",
      });

      const response = await postHandler(request);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid JSON" });
    });

    it("returns 400 when targetId is missing", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/intro/request", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await postHandler(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid request data");
    });

    it("returns 400 when rating is out of range", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });
      const target = await prisma.user.create({ data: { email: "target@example.com", role: "CTO" } });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/intro/request", {
        method: "POST",
        body: JSON.stringify({ targetId: target.id, rating: 10 }), // Out of 1-5 range
      });

      const response = await postHandler(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid request data");
    });

    it("returns 400 when rating is not an integer", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });
      const target = await prisma.user.create({ data: { email: "target@example.com", role: "CTO" } });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/intro/request", {
        method: "POST",
        body: JSON.stringify({ targetId: target.id, rating: 3.5 }),
      });

      const response = await postHandler(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid request data");
    });

    it("returns 400 when feedback exceeds max length", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });
      const target = await prisma.user.create({ data: { email: "target@example.com", role: "CTO" } });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/intro/request", {
        method: "POST",
        body: JSON.stringify({
          targetId: target.id,
          feedback: "a".repeat(2500), // Exceeds 2000 char limit
        }),
      });

      const response = await postHandler(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid request data");
    });

    it("creates intro request with valid data", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });
      const target = await prisma.user.create({ data: { email: "target@example.com", role: "CTO" } });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/intro/request", {
        method: "POST",
        body: JSON.stringify({
          targetId: target.id,
          feedback: "Great profile!",
          rating: 5,
        }),
      });

      const response = await postHandler(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.request.status).toBe("PENDING");

      // Verify in database
      const introRequest = await prisma.introRequest.findFirst({
        where: { requesterId: user.id, targetId: target.id },
      });
      expect(introRequest).not.toBeNull();
      expect(introRequest?.feedback).toBe("Great profile!");
      expect(introRequest?.rating).toBe(5);
    });

    it("returns 404 when target user does not exist", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/intro/request", {
        method: "POST",
        body: JSON.stringify({ targetId: "nonexistent-id" }),
      });

      const response = await postHandler(request);
      expect(response.status).toBe(404);
    });

    it("returns 400 when requesting intro to self", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/intro/request", {
        method: "POST",
        body: JSON.stringify({ targetId: user.id }),
      });

      const response = await postHandler(request);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Cannot request intro to yourself" });
    });

    it("returns 409 when duplicate request exists", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });
      const target = await prisma.user.create({ data: { email: "target@example.com", role: "CTO" } });

      // Create existing request
      await prisma.introRequest.create({
        data: { requesterId: user.id, targetId: target.id, status: "PENDING" },
      });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/intro/request", {
        method: "POST",
        body: JSON.stringify({ targetId: target.id }),
      });

      const response = await postHandler(request);
      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.error).toBe("Request already exists");
    });
  });

  describe("PATCH /api/intro/request", () => {
    it("returns 400 for invalid JSON", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/intro/request", {
        method: "PATCH",
        body: "not valid json",
      });

      const response = await patchHandler(request);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid JSON" });
    });

    it("returns 400 when rating is invalid", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });
      const target = await prisma.user.create({ data: { email: "target@example.com", role: "CTO" } });

      await prisma.introRequest.create({
        data: { requesterId: user.id, targetId: target.id, status: "PENDING" },
      });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/intro/request", {
        method: "PATCH",
        body: JSON.stringify({ targetId: target.id, rating: 0 }), // Out of 1-5 range
      });

      const response = await patchHandler(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid request data");
    });

    it("updates feedback and rating with valid data", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });
      const target = await prisma.user.create({ data: { email: "target@example.com", role: "CTO" } });

      await prisma.introRequest.create({
        data: { requesterId: user.id, targetId: target.id, status: "PENDING" },
      });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/intro/request", {
        method: "PATCH",
        body: JSON.stringify({ targetId: target.id, feedback: "Updated feedback", rating: 4 }),
      });

      const response = await patchHandler(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.request.feedback).toBe("Updated feedback");
      expect(body.request.rating).toBe(4);
    });
  });

  describe("GET /api/intro/request", () => {
    it("returns 401 when unauthenticated", async () => {
      authMock.mockResolvedValue(null);

      const response = await getHandler();
      expect(response.status).toBe(401);
    });

    it("returns requests for authenticated user", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });
      const target = await prisma.user.create({ data: { email: "target@example.com", role: "CTO" } });

      await prisma.introRequest.create({
        data: { requesterId: user.id, targetId: target.id, status: "PENDING" },
      });

      authMock.mockResolvedValue({ userId: user.id });

      const response = await getHandler();
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.requests).toHaveLength(1);
      expect(body.currentUserId).toBe(user.id);
    });
  });
});
