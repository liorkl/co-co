---
name: prisma-patterns
description: Prisma + pgvector patterns for FounderFinder — schema, upserts, embeddings, migrations
tools: Read, Edit, Write, Bash
---

# Prisma Patterns

## Schema location
`prisma/schema.prisma` — PostgreSQL with pgvector extension (1536-dim vectors).

## Key Models

| Model | Purpose |
|---|---|
| `User` | Core user — has `role` (CEO/CTO) and `onboarded` flag |
| `Profile` | Shared profile data (name, location, timezone, availability) |
| `Startup` | CEO-specific data (stage, domain, equity/salary offer) |
| `TechBackground` | CTO-specific data (stack, experience, domains) |
| `InterviewResponse` | Raw interview submissions (structured JSON + freeText) |
| `ProfileSummary` | AI-generated summary text from interview |
| `Embedding` | Vector stored as `Bytes` — 1536-dim (text-embedding-3-small) |
| `Match` | Pre-computed CEO↔CTO match score + reasons JSON |
| `IntroRequest` | Intro request between matched users (PENDING/APPROVED/REJECTED/COMPLETED) |

## Upsert Pattern

Profile, Startup, and TechBackground are one-per-user — always use upsert:

```typescript
await prisma.profile.upsert({
  where: { userId },
  create: { userId, name: "..." },
  update: { name: "..." },
});
```

## Embedding Pipeline

Never call OpenAI embedding API directly from a route. Always go through `lib/embeddings.ts`:

```typescript
import { upsertEmbedding } from "@/lib/embeddings";
await upsertEmbedding(userId, summaryText);
```

## Migration Workflow

```bash
npm run prisma:generate  # Always run first after schema changes
npm run prisma:migrate   # Create and apply migration (dev only)
```

Never run `tsc` or build before regenerating the client — it will fail with type errors.

## Migration Safety Rules

- Never drop a column or table directly — rename or soft-delete first
- Never use raw SQL in application code — use Prisma client methods
- Always run `prisma:generate` in CI before `tsc`
- `seed.ts` is for development data only — never run against production

## Dev Database URL (for type-checking without a real DB)

```
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
```
