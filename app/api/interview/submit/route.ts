import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { summarizeProfile } from "@/lib/ai";
import { upsertEmbedding } from "@/lib/embeddings";
import { limit } from "@/lib/rateLimit";
import { z } from "zod";

const MAX_FIELD_LENGTH = 5000;

const InterviewSubmitSchema = z.object({
  role: z.enum(["CEO", "CTO"]),
  structured: z.record(z.string().max(MAX_FIELD_LENGTH)).refine(
    (obj) => Object.keys(obj).length <= 50,
    { message: "Too many fields in structured data" }
  ),
  freeText: z.string().max(10000).optional().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session as any).userId as string;
  // Rate limit by user ID
  const res = await limit(`interview:${userId}`, "api");
  if (!res.success) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = InterviewSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { role, structured, freeText: rawFreeText } = parsed.data;
  const freeText = rawFreeText ?? undefined; // Convert null to undefined for type compatibility

  // Save interview
  await prisma.interviewResponse.create({
    data: { userId, role, structured, freeText },
  });

  // Upsert basic profile.
  if (structured?.name || structured?.location) {
    await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        name: structured.name ?? "",
        location: structured.location ?? null,
      },
      update: {
        name: structured.name ?? undefined,
        location: structured.location ?? undefined,
      },
    });
  }

  if (role === "CEO") {
    await prisma.startup.upsert({
      where: { userId },
      create: {
        userId,
        stage: structured.stage ?? null,
        domain: structured.domain ?? null,
        description: structured.description ?? null,
        equity_offer: structured.equity_offer ?? null,
        salary_offer: structured.salary_offer ?? null,
      },
      update: {
        stage: structured.stage ?? undefined,
        domain: structured.domain ?? undefined,
        description: structured.description ?? undefined,
        equity_offer: structured.equity_offer ?? undefined,
        salary_offer: structured.salary_offer ?? undefined,
      },
    });
  } else if (role === "CTO") {
    await prisma.techBackground.upsert({
      where: { userId },
      create: {
        userId,
        primary_stack: structured.primary_stack ?? null,
        years_experience: structured.years_experience ? Number(structured.years_experience) : null,
        domains: structured.domains ?? null,
        track_record: structured.track_record ?? null,
      },
      update: {
        primary_stack: structured.primary_stack ?? undefined,
        years_experience: structured.years_experience ? Number(structured.years_experience) : undefined,
        domains: structured.domains ?? undefined,
        track_record: structured.track_record ?? undefined,
      },
    });
  }

  // AI summarize and embedding
  const summary = await summarizeProfile({ role, structured, freeText });
  await prisma.profileSummary.upsert({
    where: { userId },
    create: { userId, ai_summary_text: summary },
    update: { ai_summary_text: summary },
  });
  await upsertEmbedding(userId, role, summary, "summary");

  await prisma.user.update({ where: { id: userId }, data: { onboarded: true } });

  return NextResponse.json({ ok: true });
}


