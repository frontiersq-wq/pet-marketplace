import type { Prisma } from "@/generated/prisma/client";
import type { ListingCardData } from "@/components/listing-card";
import { parseStringArray } from "@/lib/json-fields";

export const listingCardSelect = {
  slug: true,
  title: true,
  purpose: true,
  gender: true,
  ageMonths: true,
  price: true,
  images: true,
  breed: { select: { name: true } },
  city: { select: { name: true } },
} satisfies Prisma.ListingSelect;

export type ListingCardRecord = Prisma.ListingGetPayload<{
  select: typeof listingCardSelect;
}>;

export function toListingCardData(listing: ListingCardRecord): ListingCardData {
  return {
    slug: listing.slug,
    title: listing.title,
    purpose: listing.purpose,
    gender: listing.gender,
    ageMonths: listing.ageMonths,
    price: listing.price,
    images: parseStringArray(listing.images),
    breedName: listing.breed?.name ?? null,
    cityName: listing.city.name,
  };
}