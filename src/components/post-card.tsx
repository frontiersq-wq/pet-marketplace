import Link from "next/link";

export type PostCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  coverImage: string | null;
  publishedAt: Date | string | null;
  readMinutes: number | null;
};

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatCategory(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="relative aspect-[16/9] bg-neutral-100">
          {post.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverImage}
              alt={post.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <BlogPlaceholder />
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/blog/category/${post.category}`}
            className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
          >
            {formatCategory(post.category)}
          </Link>
          {post.readMinutes && (
            <span className="text-xs text-neutral-500">
              {post.readMinutes} min read
            </span>
          )}
        </div>

        <Link href={`/blog/${post.slug}`} className="mt-3 flex-1">
          <h2 className="font-semibold leading-snug text-neutral-900 group-hover:text-brand-700">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-600">
              {post.excerpt}
            </p>
          )}
        </Link>

        {post.publishedAt && (
          <p className="mt-4 text-xs text-neutral-400">
            {formatDate(post.publishedAt)}
          </p>
        )}
      </div>
    </article>
  );
}

function BlogPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center text-neutral-300">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    </div>
  );
}
