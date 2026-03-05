---
name: api-conventions
description: API route patterns for FounderFinder — auth, rate limiting, Zod validation, error responses
tools: Read, Edit, Write
---

# API Route Conventions

## Location
`app/api/` — Next.js App Router, all handlers in `route.ts` files.
See `app/api/CLAUDE.md` for the full route index.

## Required Pattern (every mutation route — POST/PATCH/DELETE)

```typescript
// 1. Auth check
const session = await auth();
if (!session || !(session as any).userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const userId = (session as any).userId as string;

// 2. Rate limit (before any DB/AI work)
const res = await limit(`<action>:${userId}`, "api");
if (!res.success) {
  return NextResponse.json({ error: "Rate limit" }, { status: 429 });
}

// 3. Zod validation (before any business logic)
const parsed = MySchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
}
```

## Key Imports

```typescript
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { summarizeProfile, buildMatchRationale } from "@/lib/ai";
import { upsertEmbedding } from "@/lib/embeddings";
import { limit } from "@/lib/rateLimit";
import { z } from "zod";
```

## Error Response Rules

- Always use generic messages — never leak DB errors, stack traces, or internal details
- Format: `{ error: "..." }` — no other top-level keys on error responses
- Status codes: 400 bad input, 401 unauth, 403 forbidden, 429 rate limit, 500 server error

## Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/interview/submit` | POST | Submit onboarding interview → AI summary → embedding |
| `/api/match/preview` | POST | Compute top-5 matches with AI rationale |
| `/api/intro/request` | POST | Send intro request to a match |
| `/api/user/role` | GET/POST | Read or update user role |
| `/api/test/signin` | POST | Dev/test auth — guarded by `NODE_ENV` check |

## Test Endpoint Guard

`/api/test/` routes MUST check `NODE_ENV === "development" || NODE_ENV === "test"` and return 403 otherwise. Never remove this guard.
