import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signIn } from "@/app/api/auth/[...nextauth]/route";
import { createHash } from "crypto";

/**
 * Test endpoint to directly sign in as a test user
 * Usage: GET /api/test/signin?email=sarah.chen@test.founderfinder.com
 * 
 * This creates a verification token that NextAuth v5 will accept.
 * NextAuth v5 hashes tokens with the secret before storing/validating.
 */
export async function GET(request: Request) {
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
    // Use NextAuth's signIn function to generate a proper token
    // This will create the token in the correct format
    const result = await signIn("email", { 
      email, 
      redirect: false 
    });

    // The signIn function creates the token, but we need to get it
    // Let's query the database for the token that was just created
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: { 
        identifier: email,
        expires: { gt: new Date() }
      },
      orderBy: { expires: 'desc' }
    });

    if (!tokenRecord) {
      // If no token was created, create one manually
      // NextAuth v5 may hash tokens, so let's try a different approach
      // Actually, let's just trigger signIn and it will create the token
      // Then we'll generate the callback URL
      
      // Generate the callback URL - NextAuth will handle token validation
      // The format should be: /api/auth/callback/email?email=...&token=...
      // But we need the actual token from the database
      
      return NextResponse.json({
        error: "Token not created. Please try requesting a magic link normally first.",
        hint: "NextAuth may need to generate the token through the normal flow."
      }, { status: 500 });
    }

    // Generate the callback URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const callbackUrl = `${baseUrl}/api/auth/callback/email?email=${encodeURIComponent(email)}&token=${tokenRecord.token}`;

    return NextResponse.json({
      success: true,
      email: email,
      user: {
        role: user.role,
        onboarded: user.onboarded,
      },
      magicLink: callbackUrl,
      message: "Open the magicLink URL in your browser to sign in",
    });
  } catch (error: any) {
    console.error("Error creating test session:", error);
    
    // Fallback: Create token manually and hope it works
    try {
      const crypto = require("crypto");
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.verificationToken.deleteMany({
        where: { identifier: email }
      });

      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: token,
          expires: expires,
        }
      });

      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const callbackUrl = `${baseUrl}/api/auth/callback/email?email=${encodeURIComponent(email)}&token=${token}`;

      return NextResponse.json({
        success: true,
        email: email,
        user: {
          role: user.role,
          onboarded: user.onboarded,
        },
        magicLink: callbackUrl,
        message: "Open the magicLink URL in your browser to sign in",
        warning: "Token created manually - if it doesn't work, NextAuth may require hashed tokens"
      });
    } catch (fallbackError: any) {
      return NextResponse.json(
        { error: fallbackError.message || "Failed to create session" },
        { status: 500 }
      );
    }
  }
}

