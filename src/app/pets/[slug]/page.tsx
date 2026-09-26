import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ListingCard } from "@/components/listing-card";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  ListingStatus,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { formatAge, formatPrice, formatPurpose, titleCaseEnum } from "@/lib/format";
import { listingCardSelect, toListingCardData } from "@/lib/listings";
import { parseStringArray } from "@/lib/json-fields";

// Listing details are rendered from the current database record on each request.
// React cache deduplicates the metadata and page lookup during that one render.
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const getActiveListing = cache((slug: string) =>
  prisma.listing.findFirst({
    where: { slug, status: ListingStatus.ACTIVE },
    select: {
      slug: true,
      title: true,
      purpose: true,
      species: true,
      gender: true,
      ageMonths: true,
      price: true,
      images: true,
      description: true,
      vaccinated: true,
      dewormed: true,
      kciCertified: true,
      breedId: true,
      cityId: true,
      breed: { select: { name: true, slug: true, species: true } },
      city: { select: { name: true, state: true } },
      owner: {
        select: {
          name: true,
          providerProfile: {
            select: {
              businessName: true,
              bio: true,
              verified: true,
            },
          },
        },
      },
    },
  }),
);

function listingDescription(description: string | null): string {
  if (!description?.trim()) {
    return "View pet details, health information and contact options on PetHaven.";
  }
  return description.trim().slice(0, 300);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getActiveListing(slug);
  if (!listing) {
    return {
      title: "Pet listing not found",
      description: "This pet listing is no longer available.",
    };
  }

  const description = listingDescription(listing.description);
  const title = listing.title;
  const canonical = `/pets/${listing.slug}`;
  const firstImage = parseStringArray(listing.images)[0];

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | PetHaven`,
      description,
      url: canonical,
      ...(firstImage ? { images: [firstImage] } : {}),
    },
  };
}

export default async function PetDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getActiveListing(slug);
  if (!listing) notFound();

  const images = parseStringArray(listing.images);
  const related = await prisma.listing.findMany({
    where: {
      status: ListingStatus.ACTIVE,
      slug: { not: listing.slug },
      OR: listing.breedId
        ? [{ breedId: listing.breedId }, { cityId: listing.cityId }]
        : [{ cityId: listing.cityId }],
    },
    select: listingCardSelect,
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { slug: "asc" }],
    take: 3,
  });

  const enquiryHref = `/enquire?listing=${encodeURIComponent(listing.slug)}`;
  const provider = listing.owner.providerProfile;
  const providerName = provider?.businessName ?? listing.owner.name ?? "PetHaven seller";

  return (
    <>
      <Container className="py-16 sm:py-20">
        <Link
          href="/pets"
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          ← Back to all pets
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <section aria-label="Pet photos">
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {images.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className={`relative overflow-hidden rounded-xl bg-neutral-100 ${
                      index === 0 ? "col-span-2 aspect-[4/3]" : "aspect-[4/3]"
                    }`}
                  >
                    {/* Photos may be served from user-uploaded URLs not registered with Next's image optimizer. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${listing.title}${index === 0 ? "" : ` photo ${index + 1}`}`}
                      loading={index === 0 ? "eager" : "lazy"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100 text-center text-neutral-500">
                <div>
                  <PhotoIcon />
                  <p className="mt-3 text-sm">Photos coming soon</p>
                </div>
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
                {formatPurpose(listing.purpose)}
              </span>
              {provider?.verified && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
                  Verified provider
                </span>
              )}
            </div>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              {listing.title}
            </h1>
            <p className="mt-3 text-neutral-600">
              {listing.breed?.name ?? titleCaseEnum(listing.species)}
              {" · "}
              {listing.city.name}, {listing.city.state}
            </p>

            <p className="mt-6 text-2xl font-bold text-brand-700">
              {formatPrice(listing.price, listing.purpose)}
            </p>

            <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="font-semibold text-neutral-900">Pet details</h2>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Detail label="Species" value={titleCaseEnum(listing.species)} />
                <Detail label="Breed" value={listing.breed?.name ?? "Mixed breed"} />
                <Detail label="Age" value={formatAge(listing.ageMonths) ?? "Not specified"} />
                <Detail label="Gender" value={titleCaseEnum(listing.gender)} />
                <Detail label="Location" value={`${listing.city.name}, ${listing.city.state}`} />
                <Detail label="Purpose" value={formatPurpose(listing.purpose)} />
              </dl>
            </div>

            <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="font-semibold text-neutral-900">Health records</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                <HealthStatus label="Vaccinated" available={listing.vaccinated} />
                <HealthStatus label="Dewormed" available={listing.dewormed} />
                <HealthStatus label="KCI certified" available={listing.kciCertified} />
              </ul>
            </div>

            <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
              <h2 className="font-semibold text-neutral-900">Listed by</h2>
              <p className="mt-1 text-neutral-700">{providerName}</p>
              {provider?.bio && (
                <p className="mt-2 text-sm leading-6 text-neutral-600">{provider.bio}</p>
              )}
              {provider?.verified && (
                <p className="mt-2 text-sm font-medium text-emerald-800">
                  PetHaven verified this provider.
                </p>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <ButtonLink href={enquiryHref} variant="accent" size="lg" className="sm:col-span-2">
                Enquire about this pet
              </ButtonLink>
              <Link href={enquiryHref} className={buttonClass("outline")}>
                Request a phone call
              </Link>
              <Link href={enquiryHref} className={buttonClass("outline")}>
                Message on WhatsApp
              </Link>
            </div>
            <p className="mt-3 text-xs leading-5 text-neutral-500">
              Contact options will be connected to the enquiry form.
            </p>
          </aside>
        </div>

        <section className="mt-12 max-w-3xl" aria-labelledby="description-heading">
          <h2 id="description-heading" className="text-2xl font-bold text-neutral-900">
            About this pet
          </h2>
          <p className="mt-4 whitespace-pre-line leading-7 text-neutral-700">
            {listing.description?.trim() || "More details about this pet will be added soon."}
          </p>
        </section>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-neutral-200 bg-neutral-50">
          <Container className="py-12 sm:py-16">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              More pets you may like
            </h2>
            <p className="mt-2 text-neutral-600">
              Other active listings from the same breed or city.
            </p>
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ListingCard
                  key={item.slug}
                  listing={toListingCardData(item)}
                />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-neutral-900">{value}</dd>
    </div>
  );
}

function HealthStatus({ label, available }: { label: string; available: boolean }) {
  return (
    <li
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
        available
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-neutral-200 bg-neutral-50 text-neutral-600"
      }`}
    >
      <span aria-hidden="true">{available ? "✓" : "—"}</span>
      <span>{label}: {available ? "Recorded" : "Not recorded"}</span>
    </li>
  );
}

function PhotoIcon() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="mx-auto text-neutral-300"
    >
      <circle cx="7" cy="8" r="2.2" />
      <circle cx="12" cy="6" r="2.2" />
      <circle cx="17" cy="8" r="2.2" />
      <circle cx="19" cy="13" r="2" />
      <path d="M12 11c2.6 0 5 2.2 5 4.6 0 1.9-1.5 3.1-3.5 3.1-.9 0-1.1-.3-1.5-.3s-.6.3-1.5.3c-2 0-3.5-1.2-3.5-3.1C7 13.2 9.4 11 12 11Z" />
    </svg>
  );
}