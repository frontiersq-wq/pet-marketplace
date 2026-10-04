import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PostCard, formatCategory, type PostCardData } from "@/components/post-card";
import { ContentStatus } from "@/generated/prisma/enums";
import { parseStringArray } from "@/lib/json-fields";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

type PageProps = { params: Promise<{ slug: string }> };

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

const getPost = cache((slug: string) =>
  prisma.blogPost.findFirst({
    where: { slug, status: ContentStatus.PUBLISHED },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      body: true,
      category: true,
      coverImage: true,
      tags: true,
      publishedAt: true,
      readMinutes: true,
      seoTitle: true,
      seoDescription: true,
      author: { select: { name: true } },
    },
  }),
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article not found" };

  const title = post.seoTitle ?? post.title;
  const description =
    post.seoDescription ?? post.excerpt ?? post.body.slice(0, 200);
  const canonical = `/blog/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | PetHaven`,
      description,
      url: canonical,
      type: "article",
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const tags = parseStringArray(post.tags);

  const related = await prisma.blogPost.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      slug: { not: slug },
      category: post.category,
    },
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
    take: 3,
  });

  const paragraphs = post.body.split(/\n\n+/).filter(Boolean);

  return (
    <>
      <Container className="py-12 sm:py-16">
        <Link
          href="/blog"
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          &larr; All articles
        </Link>

        <div className="mt-6 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/blog/category/${post.category}`}
              className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 hover:bg-brand-100"
            >
              {formatCategory(post.category)}
            </Link>
            {post.readMinutes && (
              <span className="text-sm text-neutral-500">
                {post.readMinutes} min read
              </span>
            )}
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-lg leading-8 text-neutral-600">
              {post.excerpt}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
            {post.author?.name && (
              <span>By {post.author.name}</span>
            )}
            {post.publishedAt && (
              <span>{formatDate(post.publishedAt)}</span>
            )}
          </div>
        </div>

        {post.coverImage && (
          <div className="mt-8 overflow-hidden rounded-2xl bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full object-cover"
              style={{ maxHeight: "480px" }}
            />
          </div>
        )}

        <div className="mt-10 max-w-3xl">
          {paragraphs.map((para, i) => (
            <p key={i} className="mt-5 leading-8 text-neutral-700 first:mt-0">
              {para}
            </p>
          ))}

          {tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm text-neutral-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 max-w-3xl rounded-2xl bg-brand-700 px-6 py-8 sm:px-10">
          <h2 className="text-xl font-bold text-white">
            Ready to find a pet or book a service?
          </h2>
          <p className="mt-2 text-brand-100">
            Tell us your breed, city and budget. We will match you with
            verified breeders and follow up on WhatsApp.
          </p>
          <ButtonLink href="/enquire" variant="accent" className="mt-5">
            Start an enquiry
          </ButtonLink>
        </div>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-neutral-200 bg-neutral-50">
          <Container className="py-12 sm:py-16">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              More from {formatCategory(post.category)}
            </h2>
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <PostCard key={r.slug} post={r as PostCardData} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
