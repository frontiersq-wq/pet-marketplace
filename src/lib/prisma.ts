import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 requires a driver adapter for SQL databases.
// Phase 4: switched from better-sqlite3 (SQLite) to pg (PostgreSQL/Neon).
function createPrismaClient() {
  const adapter = new PrismaPg(process.env.DATABASE_URL!);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// `next dev` re-evaluates modules on every hot-reload; the global cache
// prevents opening a new connection pool on each reload.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
