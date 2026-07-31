// NextAuth (Auth.js v5) configuration. SERVER ONLY.
//
// Strategy: JWT sessions with a Credentials provider (email + password).
// A database session strategy is not available with Credentials, and a JWT
// keeps us to the seven models in the schema — no Account/Session tables.
//
// The JWT carries the user id and role so the UI can render quickly, but it is
// a *cache*, not the source of truth: a token stays valid until it expires, so
// a ban or role change would not show up. Everything that actually matters
// re-reads the user from the database in src/lib/dal.ts.
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { equalizeFailedLoginTiming, verifyPassword } from "@/lib/passwords";
import { loginSchema } from "@/lib/validation";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  // Local development over plain http.
  trustHost: true,
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);

        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            passwordHash: true,
            isBanned: true,
          },
        });

        if (!user) {
          // Spend the same time as a real check so timing can't reveal
          // whether this email is registered.
          await equalizeFailedLoginTiming(password);
          return null;
        }

        const passwordMatches = await verifyPassword(password, user.passwordHash);

        if (!passwordMatches) return null;

        // Banned users simply cannot sign in. Returning null (rather than a
        // distinct error) keeps the failure message uniform.
        if (user.isBanned) return null;

        // Whatever is returned here lands in the `user` argument of jwt().
        // Note it never includes passwordHash.
        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Runs on sign-in (with `user`) and on every subsequent token read.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    // Shapes what `auth()` and `useSession()` expose.
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },
});
