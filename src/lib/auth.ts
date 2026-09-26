import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  // Credentials sign-in requires JWT sessions — Auth.js cannot issue a database
  // session for a provider it did not redirect through. OAuth providers added
  // in Phase 2 will still persist their accounts via the Prisma adapter.
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            passwordHash: true,
          },
        });

        // OAuth-only users have no password hash. Compare against a dummy hash
        // anyway so a missing account and a wrong password take the same time.
        const hash = user?.passwordHash ?? bcrypt.hashSync("", 10);
        const passwordMatches = await bcrypt.compare(password, hash);

        if (!user?.passwordHash || !passwordMatches) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    // Roles drive every access check from Phase 2 onward, so carry them on the
    // token rather than re-querying the database on each request.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});

/** True when the signed-in user holds any of the given roles. */
export async function hasRole(...roles: Role[]): Promise<boolean> {
  const session = await auth();
  const role = session?.user?.role;
  return role !== undefined && roles.includes(role);
}
