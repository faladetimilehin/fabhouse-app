import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await dbConnect();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user) return null;

        // SECURITY: Require email verification before allowing login
        // Skip in local dev when RESEND_API_KEY is not set (emails go to console)
        const emailVerificationRequired = !!process.env.RESEND_API_KEY;
        if (emailVerificationRequired && !user.isEmailVerified) {
          throw new Error("Please verify your email before signing in. Check your inbox for a verification link.");
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        if (user.isSuspended) {
          throw new Error("Your account has been suspended. Contact support if you think this is a mistake.");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          planTier: user.planTier,
          countryCode: user.countryCode ?? "NG",
        } as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        await dbConnect();
        const existing = await User.findOne({ email: user.email.toLowerCase() });
        if (!existing) {
          await User.create({
            name: user.name ?? "Google User",
            email: user.email.toLowerCase(),
            passwordHash: `oauth:google:${user.id ?? "unknown"}`, // not a real hash — OAuth users never use credentials login
            role: "buyer",
            isEmailVerified: true,
            consentedToTermsAt: new Date(),
            planTier: "free",
            countryCode: "NG",
          });
        } else if (existing.isSuspended) {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user && account?.provider !== "google") {
        token.role = (user as any).role;
        token.planTier = (user as any).planTier;
        token.countryCode = (user as any).countryCode ?? "NG";
        token.id = (user as any).id;
      }
      // OAuth profile IDs belong to Google; use Fabhouse's database user ID.
      if (account?.provider === "google") {
        await dbConnect();
        const dbUser = await User.findOne({ email: token.email ?? "" }).lean() as any;
        if (dbUser) {
          token.role = dbUser.role;
          token.planTier = dbUser.planTier;
          token.countryCode = dbUser.countryCode ?? "NG";
          token.id = dbUser._id.toString();
        }
      }
      if (trigger === "update" && token.id) {
        await dbConnect();
        const dbUser = await User.findById(token.id).select("countryCode").lean() as any;
        if (dbUser) token.countryCode = dbUser.countryCode ?? "NG";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).planTier = token.planTier;
        (session.user as any).countryCode = token.countryCode ?? "NG";
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
