import type { MetadataRoute } from "next";

import { ContentStatus, ListingStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { SERVICE_CATEGORIES } from "@/lib/service-categories";

function base(): string {
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const b = base();
  const now = new Date();

  const [listings, breeds, posts, categoryRows, providers] = await Promise.all([
    prisma.listing.findMany({
      where: { status: ListingStatus.ACTIVE },
      select: { slug: true, updatedAt: true },
    }),
    prisma.breed.findMany({
      select: { slug: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { status: ContentStatus.PUBLISHED },
      select: { slug: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { status: ContentStatus.PUBLISHED },
      select: { category: true },
      distinct: ["category"],
    }),
    prisma.providerProfile.findMany({
      where: { verified: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const blogCategories = categoryRows.map((r) => r.category);

  return [
    // Top-level pages
    { url: b, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${b}/pets`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${b}/breeds`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${b}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${b}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${b}/enquire`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },

    // Service category pages
    ...SERVICE_CATEGORIES.map((cat) => ({
      url: `${b}/services/${cat.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),

    // Active pet listings
    ...listings.map((l) => ({
      url: `${b}/pets/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),

    // Breed pages
    ...breeds.map((br) => ({
      url: `${b}/breeds/${br.slug}`,
      lastModified: br.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    // Blog posts
    ...posts.map((p) => ({
      url: `${b}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),

    // Blog category pages
    ...blogCategories.map((cat) => ({
      url: `${b}/blog/category/${cat}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),

    // Verified provider profiles
    ...providers.map((p) => ({
      url: `${b}/providers/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
