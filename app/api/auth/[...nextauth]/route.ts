import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Resend } from "resend";
import { prisma } from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Don't override default pages - let NextAuth handle redirects naturally
  // pages: {
  //   signIn: '/auth/signin',
  //   error: '/auth/error',
  // },
  providers: [
    EmailProvider({
      // Server config required by NextAuth v5 (even with custom sendVerificationRequest)
      // Format: smtp://user:pass@host:port
      server: process.env.EMAIL_SERVER || "smtp://resend:resend@smtp.resend.com:587",
      from: process.env.EMAIL_FROM || "FounderFinder <onboarding@resend.dev>",
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      sendVerificationRequest: async ({ url, identifier, provider }) => {
        try {
          // Support both "Name <email>" and "email" formats
          let from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
          
          // If EMAIL_FROM doesn't have angle brackets, add a default name
          if (!from.includes("<")) {
            from = `FounderFinder <${from}>`;
          }
          
          // Check if user exists to customize email content
          const existingUser = await prisma.user.findUnique({ 
            where: { email: identifier } 
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
            from,
            to: identifier,
            isNewUser,
            url: url.substring(0, 100) + "...",
            hasApiKey: !!process.env.RESEND_API_KEY,
            apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10),
            nextAuthUrl: process.env.NEXTAUTH_URL
          });
          
          const result = await resend.emails.send({
            from,
            to: identifier,
            subject: emailSubject,
            html: emailContent
          });
          
          console.log("✅ Email sent successfully! Result:", JSON.stringify(result, null, 2));
          if (result.data?.id) {
            console.log("📬 Email ID:", result.data.id);
          }
          console.log("🔗 Magic link URL:", url);
        } catch (error: any) {
          console.error("❌ Error sending email:", error);
          // Log more details if available
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
        isNewUser
      });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log("🔐 signIn callback triggered:", {
        userEmail: user?.email,
        accountProvider: account?.provider,
        userId: user?.id
      });
      
      // Ensure user exists in app DB with correct role
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
        // Don't block sign-in if DB operation fails - adapter already created the user
        return true;
      }
    },
    async redirect({ url, baseUrl }) {
      console.log("🔀 Redirect callback:", { url, baseUrl });
      
      // After successful email verification, always redirect to home page
      // The home page will check auth status and redirect to onboarding/matches
      // This ensures users go through the proper flow after sign-in
      return baseUrl;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        const u = await prisma.user.findUnique({ where: { email: token.email as string } });
        if (u) {
          (session as any).userId = u.id;
          (session as any).role = u.role;
          (session as any).onboarded = u.onboarded;
        }
      }
      return session;
    },
    async jwt({ token }) {
      return token;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  trustHost: true, // Required for NextAuth v5 to work properly
});

export const { GET, POST } = handlers;


