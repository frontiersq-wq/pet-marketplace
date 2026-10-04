import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PostCard, formatCategory, type PostCardData } from "@/components/post-card";
import { ContentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pet care blog — guides, tips and breed information",
  description:
    "Expert articles on choosing a breed, caring for your pet, and getting the most from grooming, training and vet services across India.",
  openGraph: {
    title: "Pet care blog | PetHaven",
    description:
      "Expert articles on choosing a breed, caring for your pet, and getting the most from grooming, training and vet services across India.",
  },
};

const PAGE_SIZE = 9;

const postSelect = {
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  coverImage: true,
  publishedAt: true,
  readMinutes: true,
} as const;

export default async function BlogPage() {
  const [posts, categoryRows] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: ContentStatus.PUBLISHED },
      select: postSelect,
      orderBy: { publishedAt: "desc" },
      take: PAGE_SIZE,
    }),
    prisma.blogPost.findMany({
      where: { status: ContentStatus.PUBLISHED },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  const categories = categoryRows.map((r) => r.category);

  return (
    <>
      <section className="border-b border-neutral-200 bg-gradient-to-b from-brand-50 to-white">
        <Container className="py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              Pet care blog
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              Guides, tips and breed information
            </h1>
            <p className="mt-5 text-lg text-neutral-600">
              Everything you need to make good decisions for your pet — from
              choosing a breed to grooming, training and vet care.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        {categories.length > 1 && (
          <nav
            className="mb-8 flex flex-wrap gap-2"
            aria-label="Browse by category"
          >
            <Link
              href="/blog"
              className="rounded-full bg-brand-700 px-4 py-2 text-sm font-medium text-white"
            >
              All articles
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/blog/category/${cat}`}
                className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
              >
                {formatCategory(cat)}
              </Link>
            ))}
          </nav>
        )}

        {posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post as PostCardData} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center">
            <h2 className="font-semibold text-neutral-900">
              No articles yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">
              We are working on guides and breed information. Check back soon,
              or send an enquiry and our team can answer your question directly.
            </p>
            <ButtonLink href="/enquire" variant="accent" className="mt-6">
              Ask us directly
            </ButtonLink>
          </div>
        )}
      </Container>
    </>
  );
}
