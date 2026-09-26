import { prisma } from "@/lib/prisma";

// Phase 0 placeholder. Phase 1 replaces this with the real SEO homepage.
// It reads from the database so `npm run dev` proves the whole stack works:
// schema -> migration -> seed -> Prisma client -> Server Component.
export default async function Home() {
  const [cities, breeds, listings, users] = await Promise.all([
    prisma.city.count(),
    prisma.breed.count(),
    prisma.listing.count(),
    prisma.user.count(),
  ]);

  const counts = [
    { label: "Cities", value: cities },
    { label: "Breeds", value: breeds },
    { label: "Listings", value: listings },
    { label: "Users", value: users },
  ];

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Pet Marketplace</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Phase 0 complete — database, auth and seed data are wired up.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts.map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-sm text-neutral-500">
        Next up: Phase 1 — public SEO pages for listings, breeds, services and the blog.
      </p>
    </main>
  );
}
