import { NextRequest, NextResponse } from "next/server";
import { track } from "@/lib/analytics";

/**
 * Server-side analytics tracking endpoint
 * Can be called from client components to track events server-side
 */
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    track(event);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}

