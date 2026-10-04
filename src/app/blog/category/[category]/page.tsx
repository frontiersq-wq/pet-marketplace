import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PostCard, formatCategory, type PostCardData } from "@/components/post-card";
import { ContentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

type PageProps = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const label = formatCategory(category);
  const canonical = `/blog/category/${category}`;

  return {
    title: `${label} — pet care articles`,
    description: `Browse all PetHaven articles in the ${label} category. Tips, guides and expert advice for pet owners across India.`,
    alternates: { canonical },
    openGraph: {
      title: `${label} | PetHaven Blog`,
      description: `Browse all PetHaven articles in the ${label} category.`,
      url: canonical,
    },
  };
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { category } = await params;

  const [posts, categoryRows] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: ContentStatus.PUBLISHED, category },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        coverImage: true,
        publishedAt: true,
        readMinutes: true,
      },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.blogPost.findMany({
      where: { status: ContentStatus.PUBLISHED },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  // 404 if this category slug has no published posts (prevents guessable empty pages)
  if (posts.length === 0) {
    const categoryExists = categoryRows.some((r) => r.category === category);
    if (!categoryExists) notFound();
  }

  const allCategories = categoryRows.map((r) => r.category);
  const label = formatCategory(category);

  return (
    <>
      <section className="border-b border-neutral-200 bg-gradient-to-b from-brand-50 to-white">
        <Container className="py-12 sm:py-16">
          <Breadcrumbs
            crumbs={[
              { label: "Home", href: "/" },
              { label: "Blog", href: "/blog" },
              { label, href: `/blog/category/${category}` },
            ]}
          />
          <div className="mt-6 max-w-2xl">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
              {label}
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              {label} articles
            </h1>
            <p className="mt-4 text-lg text-neutral-600">
              {posts.length} {posts.length === 1 ? "article" : "articles"} in
              this category.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        {allCategories.length > 1 && (
          <nav className="mb-8 flex flex-wrap gap-2" aria-label="All categories">
            <Link
              href="/blog"
              className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
            >
              All articles
            </Link>
            {allCategories.map((cat) => (
              <Link
                key={cat}
                href={`/blog/category/${cat}`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  cat === category
                    ? "bg-brand-700 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
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
              No articles in this category yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">
              Check back soon, or browse all our articles.
            </p>
            <ButtonLink href="/blog" variant="primary" className="mt-6">
              All articles
            </ButtonLink>
          </div>
        )}
      </Container>
    </>
  );
}
