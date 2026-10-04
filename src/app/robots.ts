import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const b = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/login", "/api/"],
      },
    ],
    sitemap: `${b}/sitemap.xml`,
  };
}
