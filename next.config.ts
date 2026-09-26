import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native (.node) addon. Turbopack cannot bundle it, so it
  // has to be required at runtime from node_modules instead.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
