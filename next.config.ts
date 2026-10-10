import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg is a native Node.js module — mark it external so Next.js does not
  // try to bundle it and instead requires it from node_modules at runtime.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
