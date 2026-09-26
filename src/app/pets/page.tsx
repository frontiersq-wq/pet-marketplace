import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { ListingCard } from "@/components/listing-card";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  ListingPurpose,
  ListingStatus,
  Species,
} from "@/generated/prisma/enums";
import { listingCardSelect, toListingCardData } from "@/lib/listings";
import { formatPurpose, titleCaseEnum } from "@/lib/format";
import { prisma } from "@/lib/prisma";

// Filters and pagination come from the URL, so each result page is rendered
// against current inventory on the server rather than served from a stale cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pets for sale and adoption in India",
  description:
    "Browse active puppies, kittens and other pets for sale, adoption or mating from breeders and shelters across India.",
  openGraph: {
    title: "Pets for sale and adoption in India | PetHaven",
    description:
      "Browse active puppies, kittens and other pets for sale, adoption or mating from breeders and shelters across India.",
  },
};

const PAGE_SIZE = 12;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function enumValue<T extends Record<string, string>>(
  values: T,
  value: string | undefined,
): T[keyof T] | undefined {
  if (!value) return undefined;
  return Object.values(values).find((item) => item === value) as T[keyof T] | undefined;
}

function positivePage(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function priceValue(value: string | undefined): number | undefined {
  if (!value || !/^\d+(?:\.\d+)?$/.test(value)) return undefined;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
}

type AppliedFilters = {
  species?: string;
  breed?: string;
  city?: string;
  purpose?: string;
  minPrice?: string;
  maxPrice?: string;
};

function pageHref(filters: AppliedFilters, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
  return `/pets?${params.toString()}`;
}

export default async function PetsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const requestedSpecies = enumValue(Species, firstValue(params.species));
  const requestedPurpose = enumValue(ListingPurpose, firstValue(params.purpose));
  const breedSlug = firstValue(params.breed);
  const citySlug = firstValue(params.city);
  const minPriceText = firstValue(params.minPrice);
  const maxPriceText = firstValue(params.maxPrice);
  const minPrice = priceValue(minPriceText);
  const maxPrice = priceValue(maxPriceText);
  const invalidPriceRange =
    minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice;

  const where = {
    status: ListingStatus.ACTIVE,
    ...(requestedSpecies ? { species: requestedSpecies } : {}),
    ...(requestedPurpose ? { purpose: requestedPurpose } : {}),
    ...(breedSlug ? { breed: { is: { slug: breedSlug } } } : {}),
    ...(citySlug ? { city: { is: { slug: citySlug } } } : {}),
    ...(!invalidPriceRange && (minPrice !== undefined || maxPrice !== undefined)
      ? {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  const [totalCount, breeds, cities] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.breed.findMany({
      select: { slug: true, name: true, species: true },
      orderBy: [{ species: "asc" }, { name: "asc" }],
    }),
    prisma.city.findMany({
      select: { slug: true, name: true, state: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const requestedPage = positivePage(firstValue(params.page));
  const currentPage = Math.min(requestedPage, totalPages);
  const listings = await prisma.listing.findMany({
    where,
    select: listingCardSelect,
    orderBy: [
      { featured: "desc" },
      { publishedAt: "desc" },
      { slug: "asc" },
    ],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const filters: AppliedFilters = {
    ...(requestedSpecies ? { species: requestedSpecies } : {}),
    ...(breedSlug ? { breed: breedSlug } : {}),
    ...(citySlug ? { city: citySlug } : {}),
    ...(requestedPurpose ? { purpose: requestedPurpose } : {}),
    ...(minPrice !== undefined ? { minPrice: minPriceText } : {}),
    ...(maxPrice !== undefined ? { maxPrice: maxPriceText } : {}),
  };
  const hasFilters = Object.keys(filters).length > 0;
  const speciesValues = Object.values(Species);
  const purposeValues = Object.values(ListingPurpose);

  return (
    <Container className="py-16 sm:py-20">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          Find your companion
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          Pets for sale and adoption
        </h1>
        <p className="mt-4 text-lg text-neutral-600">
          Browse active listings from breeders and shelters. Filter by the pet,
          location and budget that work for you.
        </p>
      </header>

      <form
        action="/pets"
        method="get"
        className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6"
        aria-label="Filter pets"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FilterSelect id="species" label="Species" value={requestedSpecies}>
            <option value="">All species</option>
            {speciesValues.map((species) => (
              <option key={species} value={species}>
                {titleCaseEnum(species)}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect id="breed" label="Breed" value={breedSlug}>
            <option value="">All breeds</option>
            {breeds.map((breed) => (
              <option key={breed.slug} value={breed.slug}>
                {breed.name} · {titleCaseEnum(breed.species)}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect id="city" label="City" value={citySlug}>
            <option value="">All cities</option>
            {cities.map((city) => (
              <option key={city.slug} value={city.slug}>
                {city.name}, {city.state}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect id="purpose" label="Listing type" value={requestedPurpose}>
            <option value="">All listing types</option>
            {purposeValues.map((purpose) => (
              <option key={purpose} value={purpose}>
                {formatPurpose(purpose)}
              </option>
            ))}
          </FilterSelect>

          <div>
            <span className="block text-sm font-medium text-neutral-800">Price range (₹)</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <label className="sr-only" htmlFor="minPrice">Minimum price</label>
              <input
                id="minPrice"
                name="minPrice"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="Min"
                defaultValue={minPriceText}
                className="h-11 min-w-0 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
              />
              <label className="sr-only" htmlFor="maxPrice">Maximum price</label>
              <input
                id="maxPrice"
                name="maxPrice"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="Max"
                defaultValue={maxPriceText}
                className="h-11 min-w-0 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className={buttonClass("primary")}
          >
            Apply filters
          </button>
          {hasFilters && (
            <Link
              href="/pets"
              className="inline-flex h-11 items-center text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              Clear all
            </Link>
          )}
        </div>
      </form>

      <section className="mt-12" aria-labelledby="pets-results-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="pets-results-heading"
              className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl"
            >
              Available pets
            </h2>
            <p className="mt-2 text-sm text-neutral-600" aria-live="polite">
              {totalCount} {totalCount === 1 ? "pet" : "pets"} found
            </p>
          </div>
          {hasFilters && (
            <Link href="/pets" className="text-sm font-medium text-brand-700 hover:text-brand-800">
              Clear filters
            </Link>
          )}
        </div>

        {invalidPriceRange && (
          <p className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-neutral-800" role="alert">
            Minimum price must be less than or equal to maximum price.
          </p>
        )}

        {listings.length > 0 ? (
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.slug}
                listing={toListingCardData(listing)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
            <h3 className="text-lg font-semibold text-neutral-900">
              No pets match these filters
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Try a different combination or clear your filters to see all available pets.
            </p>
            <ButtonLink href="/pets" className="mt-5">
              Clear all filters
            </ButtonLink>
          </div>
        )}

        {totalPages > 1 && (
          <nav
            className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-5"
            aria-label="Pet listing pages"
          >
            {currentPage > 1 ? (
              <Link
                href={pageHref(filters, currentPage - 1)}
                rel="prev"
                className="text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <p className="text-sm text-neutral-600">
              Page {currentPage} of {totalPages}
            </p>
            {currentPage < totalPages ? (
              <Link
                href={pageHref(filters, currentPage + 1)}
                rel="next"
                className="text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                Next →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>
    </Container>
  );
}

function FilterSelect({
  id,
  label,
  value,
  children,
}: {
  id: string;
  label: string;
  value: string | undefined;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-800">
        {label}
      </label>
      <select
        id={id}
        name={id}
        defaultValue={value ?? ""}
        className="mt-1.5 h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
      >
        {children}
      </select>
    </div>
  );
}