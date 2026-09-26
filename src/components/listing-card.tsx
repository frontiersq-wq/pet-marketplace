import Link from "next/link";

import type { Gender, ListingPurpose } from "@/generated/prisma/enums";
import { formatAge, formatPrice, formatPurpose, titleCaseEnum } from "@/lib/format";

export type ListingCardData = {
  slug: string;
  title: string;
  purpose: ListingPurpose;
  gender: Gender;
  ageMonths: number | null;
  price: { toString(): string } | null;
  images: string[];
  breedName: string | null;
  cityName: string;
};

/**
 * Shared card for any listing grid. The pets index and city pages in later
 * chunks render the same component, so keep it presentational.
 */
export function ListingCard({ listing }: { listing: ListingCardData }) {
  const age = formatAge(listing.ageMonths);
  const cover = listing.images[0];

  return (
    <article className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      <Link href={`/pets/${listing.slug}`} className="block">
        <div className="relative aspect-[4/3] bg-neutral-100">
          {cover ? (
            // Listing photos are user-uploaded and not yet on a known host, so
            // next/image optimisation is deferred to the upload chunk.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={listing.title} className="h-full w-full object-cover" />
          ) : (
            <PhotoPlaceholder />
          )}

          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm">
            {formatPurpose(listing.purpose)}
          </span>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-1 font-semibold text-neutral-900 group-hover:text-brand-700">
            {listing.title}
          </h3>

          <p className="mt-1 line-clamp-1 text-sm text-neutral-600">
            {listing.breedName ?? "Mixed breed"} &middot; {listing.cityName}
          </p>

          <p className="mt-1 text-sm text-neutral-500">
            {[titleCaseEnum(listing.gender), age].filter(Boolean).join(" · ")}
          </p>

          <p className="mt-3 font-semibold text-brand-700">
            {formatPrice(listing.price, listing.purpose)}
          </p>
        </div>
      </Link>
    </article>
  );
}

function PhotoPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center text-neutral-300">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="7" cy="8" r="2.2" />
        <circle cx="12" cy="6" r="2.2" />
        <circle cx="17" cy="8" r="2.2" />
        <circle cx="19" cy="13" r="2" />
        <path d="M12 11c2.6 0 5 2.2 5 4.6 0 1.9-1.5 3.1-3.5 3.1-.9 0-1.1-.3-1.5-.3s-.6.3-1.5.3c-2 0-3.5-1.2-3.5-3.1C7 13.2 9.4 11 12 11Z" />
      </svg>
    </div>
  );
}
