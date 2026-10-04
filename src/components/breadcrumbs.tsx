import Link from "next/link";

export type Crumb = { label: string; href: string };

/**
 * Renders visual breadcrumbs and injects BreadcrumbList JSON-LD.
 * Always pass Home as the first crumb and the current page as the last.
 */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const base = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.label,
      item: `${base}${crumb.href}`,
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-1.5 text-sm text-neutral-500">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-x-1.5">
                {i > 0 && (
                  <span aria-hidden="true" className="text-neutral-300">
                    /
                  </span>
                )}
                {isLast ? (
                  <span
                    aria-current="page"
                    className="max-w-[14rem] truncate font-medium text-neutral-900 sm:max-w-xs"
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="transition-colors hover:text-brand-700"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </>
  );
}
