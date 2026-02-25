# Prisma / Database

PostgreSQL with the **pgvector** extension for vector similarity search.

## After Any Schema Change

```bash
npm run prisma:generate  # Regenerate Prisma client (always run first)
npm run prisma:migrate   # Create and apply migration (dev)
```

Never run `tsc` or build before regenerating the client — it will fail with type errors.

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

Profile, Startup, and TechBackground use `upsert` (one record per user):

```typescript
await prisma.profile.upsert({
  where: { userId },
  create: { userId, name: "..." },
  update: { name: "..." },
});
```

## Migration Safety Rules

- Never drop a column or table directly — always use a migration with a rename or soft-delete first
- Never use raw SQL in application code — use Prisma client methods
- Always run `prisma:generate` in CI before `tsc` (see `package.json` scripts)
- `seed.ts` is for development data only — never run against production

## Dev Database URL

```
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
```

Use this for type-checking and client generation when no real DB is available.
