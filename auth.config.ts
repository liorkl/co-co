import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthConfig } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";

import { prisma } from "@/lib/db";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER || "smtp://resend:resend@smtp.resend.com:587",
      from: process.env.EMAIL_FROM || "FounderFinder <onboarding@resend.dev>",
      maxAge: 24 * 60 * 60,
      sendVerificationRequest: async ({ url, identifier }) => {
        try {
          let from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

          if (!from.includes("<")) {
            from = `FounderFinder <${from}>`;
          }

          const existingUser = await prisma.user.findUnique({
            where: { email: identifier },
          });
          const isNewUser = !existingUser;

          const emailSubject = isNewUser
            ? "Welcome to FounderFinder - Complete your sign up"
            : "Your sign-in link for FounderFinder";

          const emailContent = isNewUser
            ? `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to FounderFinder!</h2>
                <p>Thanks for signing up. Click the button below to create your account and get started finding your perfect cofounder match.</p>
                <div style="margin: 30px 0;">
                  <a href="${url}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Complete Sign Up</a>
                </div>
                <p style="color: #666; font-size: 14px;">This link will expire in 24 hours. If you didn't sign up, you can safely ignore this email.</p>
              </div>
            `
            : `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Sign in to FounderFinder</h2>
                <p>Click the button below to sign in to your account.</p>
                <div style="margin: 30px 0;">
                  <a href="${url}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Sign In</a>
                </div>
                <p style="color: #666; font-size: 14px;">This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.</p>
              </div>
            `;

          console.log("📧 Attempting to send email:", {
            to: identifier,
            isNewUser,
            hasApiKey: !!process.env.RESEND_API_KEY,
          });

          if (!resend) {
            console.warn("📪 RESEND_API_KEY not configured; skipping email send (likely running in CI or local test).");
            return;
          }

          const result = await resend.emails.send({
            from,
            to: identifier,
            subject: emailSubject,
            html: emailContent,
          });

          console.log("✅ Email sent successfully:", result.data?.id ? `ID: ${result.data.id}` : "No ID returned");
        } catch (error: any) {
          console.error("❌ Error sending email:", error);
          if (error?.message) {
            console.error("Error message:", error.message);
          }
          throw new Error(`Failed to send email: ${error?.message || "Unknown error"}`);
        }
      },
    }),
  ],
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log("🔐 signIn event triggered:", {
        userEmail: user?.email,
        accountProvider: account?.provider,
        isNewUser,
      });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log("🔐 signIn callback triggered:", {
        userEmail: user?.email,
        accountProvider: account?.provider,
        userId: user?.id,
      });

      const userEmail = user?.email;
      if (!userEmail) {
        console.error("❌ No email found in signIn callback");
        return false;
      }

      try {
        const existing = await prisma.user.findUnique({ where: { email: userEmail } });
        if (!existing) {
          console.log("👤 Creating new user:", userEmail);
          await prisma.user.create({ data: { email: userEmail, role: "CEO" as const } });
        } else {
          console.log("✅ User already exists:", userEmail);
        }
        return true;
      } catch (error) {
        console.error("❌ Error in signIn callback:", error);
        return true;
      }
    },
    async redirect({ url, baseUrl }) {
      console.log("🔀 Redirect callback:", { url, baseUrl });
      return baseUrl;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        const userRecord = await prisma.user.findUnique({ where: { email: token.email as string } });
        if (userRecord) {
          (session as any).userId = userRecord.id;
          (session as any).role = userRecord.role;
          (session as any).onboarded = userRecord.onboarded;
        }
      }
      return session;
    },
    async jwt({ token }) {
      return token;
    },
  },
  session: { strategy: "jwt" },
  secret: (() => {
    if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXTAUTH_SECRET must be set in production");
    }
    return "local-dev-secret-not-for-production";
  })(),
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
};

