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

  // Attach rationale and profile information
  const mySummary = await prisma.profileSummary.findUnique({ where: { userId } });
  const enriched = await Promise.all(
    matches.slice(0, 5).map(async (m) => {
      const otherSummary = await prisma.profileSummary.findUnique({ where: { userId: m.userId } });
      const rationale = await buildMatchRationale(mySummary?.ai_summary_text ?? "", otherSummary?.ai_summary_text ?? "");
      
      // Get profile information
      const otherUser = await prisma.user.findUnique({
        where: { id: m.userId },
        include: {
          profile: true,
          startup: true,
          techBackground: true,
        }
      });

      return {
        ...m,
        rationale,
        name: otherUser?.profile?.name || otherUser?.name || "Anonymous",
        location: otherUser?.profile?.location,
        timezone: otherUser?.profile?.timezone,
        availability: otherUser?.profile?.availability,
        commitment: otherUser?.profile?.commitment,
        // CEO-specific
        startup: otherUser?.startup ? {
          stage: otherUser.startup.stage,
          domain: otherUser.startup.domain,
          description: otherUser.startup.description,
          funding: otherUser.startup.funding,
          equity_offer: otherUser.startup.equity_offer,
          salary_offer: otherUser.startup.salary_offer,
        } : null,
        // CTO-specific
        techBackground: otherUser?.techBackground ? {
          primary_stack: otherUser.techBackground.primary_stack,
          years_experience: otherUser.techBackground.years_experience,
          domains: otherUser.techBackground.domains,
          track_record: otherUser.techBackground.track_record,
        } : null,
      };
    })
  );

  return NextResponse.json({ matches: enriched });
}


