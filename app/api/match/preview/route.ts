import { auth } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { findMatchesFor } from "@/lib/match";
import { prisma } from "@/lib/db";
import { buildMatchRationale } from "@/lib/ai";
import { limit } from "@/lib/rateLimit";

export async function POST() {
  const session = await auth();
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session as any).userId as string;
  // Rate limit by user ID
  const res = await limit(`match:${userId}`, "api");
  if (!res.success) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }
  const role = (session as any).role as "CEO" | "CTO";
  const matches = await findMatchesFor(userId, role);

  // Attach rationale (brief) using summaries
  const mySummary = await prisma.profileSummary.findUnique({ where: { userId } });
  const enriched = await Promise.all(
    matches.slice(0, 5).map(async (m) => {
      const otherSummary = await prisma.profileSummary.findUnique({ where: { userId: m.userId } });
      const rationale = await buildMatchRationale(mySummary?.ai_summary_text ?? "", otherSummary?.ai_summary_text ?? "");
      return { ...m, rationale };
    })
  );

  return NextResponse.json({ matches: enriched });
}


