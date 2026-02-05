import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

/**
 * Test endpoint to directly sign in as a test user
 * Usage: GET /api/test/signin?email=sarah.chen@test.founderfinder.com
 *
 * This creates a verification token that NextAuth v5 will accept.
 * NextAuth v5 hashes tokens with the secret before storing/validating.
 *
 * SECURITY: Only available in development/test environments or when ALLOW_TEST_AUTH is set.
 * Note: NODE_ENV is overridden by Next.js production builds, so CI uses ALLOW_TEST_AUTH=true.
 */
export async function GET(request: Request) {
  // Only allow in development, test, or when explicitly enabled for CI
  const env = process.env.NODE_ENV;
  const allowTestAuth = process.env.ALLOW_TEST_AUTH === "true";
  if (env !== "development" && env !== "test" && !allowTestAuth) {
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

  const token = randomBytes(32).toString("hex");
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "local-dev-secret";
  const hashedToken = secret
    ? createHash("sha256").update(`${token}${secret}`).digest("hex")
    : token;
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashedToken,
      expires,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const callbackUrl = `${baseUrl}/api/auth/callback/email?email=${encodeURIComponent(
    email
  )}&token=${token}`;

  return NextResponse.json({
    success: true,
    email,
    user: {
      role: user.role,
      onboarded: user.onboarded,
    },
    magicLink: callbackUrl,
    message: "Open the magicLink URL in your browser to sign in",
  });
}

