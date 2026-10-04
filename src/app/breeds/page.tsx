import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { ListingStatus, Species } from "@/generated/prisma/enums";
import { parseTraits } from "@/lib/json-fields";
import { prisma } from "@/lib/prisma";
import { titleCaseEnum } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dog and cat breed guide",
  description:
    "Browse breed profiles for dogs, cats and other pets. Compare temperament, grooming needs and exercise requirements to find your ideal companion.",
  openGraph: {
    title: "Dog and cat breed guide | PetHaven",
    description:
      "Browse breed profiles for dogs, cats and other pets. Compare temperament, grooming needs and exercise requirements to find your ideal companion.",
  },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BreedsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const speciesParam = firstValue(params.species);
  const requestedSpecies = Object.values(Species).find((s) => s === speciesParam);

  const breeds = await prisma.breed.findMany({
    where: requestedSpecies ? { species: requestedSpecies } : undefined,
    select: {
      slug: true,
      name: true,
      species: true,
      origin: true,
      summary: true,
      traits: true,
      _count: {
        select: { listings: { where: { status: ListingStatus.ACTIVE } } },
      },
    },
    orderBy: [{ species: "asc" }, { name: "asc" }],
  });

  const speciesValues = Object.values(Species);

  return (
    <Container className="py-16 sm:py-20">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          Breed guide
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          Find the right breed for you
        </h1>
        <p className="mt-4 text-lg text-neutral-600">
          Compare temperament, grooming needs and exercise requirements before you commit.
        </p>
      </header>

      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Filter by species">
        <Link
          href="/breeds"
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            !requestedSpecies
              ? "bg-brand-700 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          All breeds
        </Link>
        {speciesValues.map((species) => (
          <Link
            key={species}
            href={`/breeds?species=${species}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              requestedSpecies === species
                ? "bg-brand-700 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {titleCaseEnum(species)}
          </Link>
        ))}
      </nav>

      {breeds.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {breeds.map((breed) => {
            const traits = parseTraits(breed.traits);
            const listingCount = breed._count.listings;
            return (
              <Link
                key={breed.slug}
                href={`/breeds/${breed.slug}`}
                className="group rounded-xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold text-neutral-900 group-hover:text-brand-700">
                    {breed.name}
                  </h2>
                  <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                    {titleCaseEnum(breed.species)}
                  </span>
                </div>

                {breed.origin && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Origin: {breed.origin}
                  </p>
                )}

                {breed.summary && (
                  <p className="mt-2.5 line-clamp-3 text-sm leading-6 text-neutral-600">
                    {breed.summary}
                  </p>
                )}

                {traits.size && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <TraitBadge label={titleCaseEnum(traits.size)} />
                    {traits.goodWithKids && <TraitBadge label="Good with kids" />}
                    {traits.apartmentFriendly && (
                      <TraitBadge label="Apartment friendly" />
                    )}
                  </div>
                )}

                {listingCount > 0 && (
                  <p className="mt-3 text-xs font-medium text-brand-700">
                    {listingCount} active{" "}
                    {listingCount === 1 ? "listing" : "listings"} &rarr;
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
          <h3 className="font-semibold text-neutral-900">No breeds found</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Try a different species filter or browse all breeds.
          </p>
          <Link
            href="/breeds"
            className="mt-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Show all breeds
          </Link>
        </div>
      )}
    </Container>
  );
}

function TraitBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
      {label}
    </span>
  );
}
