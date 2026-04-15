import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import { db } from "@/lib/utils/db";

// Helper to split name for OAuth providers
const splitName = (fullName?: string | null) => {
  if (!fullName) return { firstName: "", lastName: "" };
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
  };
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      client: { token_endpoint_auth_method: "client_secret_post" },
      authorization: { params: { scope: "openid profile email" } },
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName, // Added
          lastName: user.lastName, // Added
          name: user.name,
          image: user.image,
          role: user.role,
          isPasswordSet: user.isPasswordSet,
        } as any;
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (
        (account?.provider === "google" || account?.provider === "linkedin") &&
        profile?.email
      ) {
        const { firstName, lastName } = splitName(profile.name);

        const existingUser = await db.user.findUnique({
          where: { email: profile.email },
          include: { accounts: true },
        });

        if (!existingUser) {
          const newUser = await db.user.create({
            data: {
              email: profile.email,
              name: profile.name,
              firstName, // New Field
              lastName, // New Field
              image: (profile as any).picture || (profile as any).image,
              isPasswordSet: false,
              isActive: true,
              password: await bcrypt.hash(crypto.randomUUID(), 10),
              accounts: {
                create: {
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                },
              },
            },
          });
          (user as any).id = newUser.id;
          (user as any).role = newUser.role;
        } else {
          // Check if this specific account link exists
          const hasAccount = existingUser.accounts.some(
            (a) => a.provider === account.provider,
          );
          if (!hasAccount) {
            await db.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
              },
            });
          }
          (user as any).id = existingUser.id;
          (user as any).role = existingUser.role;
          (user as any).isPasswordSet = existingUser.isPasswordSet;
        }
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.isPasswordSet = (user as any).isPasswordSet;
        token.firstName = (user as any).firstName; // Added
        token.lastName = (user as any).lastName; // Added
      }

      if (trigger === "update" && session) {
        if (session.firstName) token.firstName = session.firstName;
        if (session.lastName) token.lastName = session.lastName;
        if (session.isPasswordSet !== undefined)
          token.isPasswordSet = session.isPasswordSet;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).isPasswordSet = token.isPasswordSet;
        (session.user as any).firstName = token.firstName; // Added
        (session.user as any).lastName = token.lastName; // Added
      }
      return session;
    },
  },
});
