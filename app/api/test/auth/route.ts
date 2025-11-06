import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encode } from "next-auth/jwt";
import { randomBytes } from "crypto";

/**
 * Direct authentication endpoint for test users
 * Usage: GET /api/test/auth?email=sarah.chen@test.founderfinder.com
 * This bypasses email verification and directly creates a session
 */
export async function GET(request: Request) {
  // Only allow in development
  const isProduction = process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test";
  if (isProduction) {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Email parameter required" },
      { status: 400 }
    );
  }

  // Check if it's a test user
  if (!email.includes("@test.founderfinder.com")) {
    return NextResponse.json(
      { error: "Only test users allowed (@test.founderfinder.com)" },
      { status: 403 }
    );
  }

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error("NEXTAUTH_SECRET not set");
    }

    // Create a JWT token using NextAuth's encode function
    // NextAuth v5 expects the token to match what the JWT callback returns
    const now = Math.floor(Date.now() / 1000);
    
    // The token should match what NextAuth's JWT callback would create
    // Based on the JWT callback in route.ts, it just returns the token as-is
    const tokenPayload = {
      email: user.email,
      sub: user.id,
      name: user.name,
      picture: user.image,
      iat: now,
      exp: now + (30 * 24 * 60 * 60), // 30 days
      jti: randomBytes(16).toString("hex"), // JWT ID
    };
    
    const token = await encode({
      token: tokenPayload,
      secret: secret,
      salt: "authjs.session-token", // NextAuth v5 uses this salt for session tokens
    });
    
    console.log("🔐 Created test session token for:", user.email);

    // Create a redirect response with the session cookie
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const redirectUrl = new URL("/", baseUrl);
    
    // Create response with redirect
    const response = NextResponse.redirect(redirectUrl);
    
    // Set the NextAuth session cookie
    // NextAuth v5 uses "authjs.session-token" in development
    const isProduction = process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test";
    const cookieName = isProduction 
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";
    
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    
    // Also set the legacy cookie name for compatibility
    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error("Error creating test auth:", error);
    console.error("Error details:", error.stack);
    return NextResponse.json(
      { 
        error: error.message || "Failed to create session",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

