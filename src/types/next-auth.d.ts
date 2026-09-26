import type { DefaultSession } from "next-auth";
// Imported so TypeScript resolves the subpath before augmenting it below.
// Without this the `next-auth/jwt` augmentation is silently ignored and
// `token.role` falls back to `unknown` in the session callback.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { JWT } from "next-auth/jwt";

import type { Role } from "@/generated/prisma/enums";

// Teaches Auth.js about the `role` column so `session.user.role` is typed
// everywhere instead of being widened to `any`.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
