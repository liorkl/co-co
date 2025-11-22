import { NextRequest, NextResponse } from "next/server";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/**
 * Server-side analytics tracking endpoint
 * Can be called from client components to track events server-side
 */
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    
    // Validate event structure
    if (!event || typeof event !== "object" || !event.type) {
      return NextResponse.json(
        { error: "Invalid event: missing 'type' field" },
        { status: 400 }
      );
    }
    
    // Basic type validation
    const validTypes = ["page_view", "cta_click", "signup_start", "onboarding_step", "match_view", "intro_request"];
    if (!validTypes.includes(event.type)) {
      return NextResponse.json(
        { error: `Invalid event type: ${event.type}` },
        { status: 400 }
      );
    }
    
    // Type-specific validation
    if (event.type === "page_view" && typeof event.path !== "string") {
      return NextResponse.json(
        { error: "Invalid event: 'page_view' requires 'path' string" },
        { status: 400 }
      );
    }
    
    if (event.type === "cta_click" && typeof event.cta !== "string") {
      return NextResponse.json(
        { error: "Invalid event: 'cta_click' requires 'cta' string" },
        { status: 400 }
      );
    }
    
    track(event as AnalyticsEvent);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}


