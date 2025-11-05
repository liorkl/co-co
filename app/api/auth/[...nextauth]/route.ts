import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";
import { prisma } from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    EmailProvider({
      sendVerificationRequest: async ({ url, identifier }) => {
        const from = process.env.EMAIL_FROM ?? "no-reply@example.com";
        await resend.emails.send({
          from,
          to: identifier,
          subject: "Your sign-in link for FounderFinder",
          html: `<p>Click to sign in:</p><p><a href="${url}">Sign in</a></p>`
        });
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Ensure user exists in app DB
      const email = user.email!;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        await prisma.user.create({ data: { email, role: "CEO" as const } });
      }
      return true;
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
});

export const { GET, POST } = handlers;


