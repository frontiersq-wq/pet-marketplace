import { cache } from "react";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ListingCard } from "@/components/listing-card";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ListingStatus } from "@/generated/prisma/enums";
import { parseTraits } from "@/lib/json-fields";
import { listingCardSelect, toListingCardData } from "@/lib/listings";
import { titleCaseEnum } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

const getBreed = cache((slug: string) =>
  prisma.breed.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      species: true,
      origin: true,
      summary: true,
      description: true,
      traits: true,
      seoTitle: true,
      seoDescription: true,
    },
  }),
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const breed = await getBreed(slug);
  if (!breed) return { title: "Breed not found" };

  const title = breed.seoTitle ?? `${breed.name} — temperament, care and price guide`;
  const description =
    breed.seoDescription ?? breed.summary ?? `Learn about the ${breed.name} breed.`;
  const canonical = `/breeds/${breed.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title: `${title} | PetHaven`, description, url: canonical },
  };
}

export default async function BreedDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const breed = await getBreed(slug);
  if (!breed) notFound();

  const traits = parseTraits(breed.traits);

  const listings = await prisma.listing.findMany({
    where: { status: ListingStatus.ACTIVE, breed: { is: { slug } } },
    select: listingCardSelect,
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { slug: "asc" }],
    take: 6,
  });

  return (
    <>
      <Container className="py-16 sm:py-20">
        <Breadcrumbs
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Breeds", href: "/breeds" },
            { label: breed.name, href: `/breeds/${breed.slug}` },
          ]}
        />

        <div className="mt-6 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
              {titleCaseEnum(breed.species)}
            </span>
            {breed.origin && (
              <span className="text-sm text-neutral-500">
                Origin: {breed.origin}
              </span>
            )}
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            {breed.name}
          </h1>

          {breed.summary && (
            <p className="mt-4 text-lg leading-8 text-neutral-600">
              {breed.summary}
            </p>
          )}
        </div>

        {Object.keys(traits).length > 0 && (
          <section className="mt-12" aria-labelledby="traits-heading">
            <h2
              id="traits-heading"
              className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl"
            >
              Breed characteristics
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {traits.size && (
                <TraitCard label="Size">
                  <p className="text-xl font-semibold text-neutral-900">
                    {titleCaseEnum(traits.size)}
                  </p>
                  {traits.weightKg && (
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {traits.weightKg[0]}–{traits.weightKg[1]} kg
                    </p>
                  )}
                </TraitCard>
              )}

              {traits.lifespanYears && (
                <TraitCard label="Lifespan">
                  <p className="text-xl font-semibold text-neutral-900">
                    {traits.lifespanYears[0]}–{traits.lifespanYears[1]} years
                  </p>
                </TraitCard>
              )}

              {traits.temperament && traits.temperament.length > 0 && (
                <TraitCard label="Temperament">
                  <div className="flex flex-wrap gap-1.5">
                    {traits.temperament.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-sm text-neutral-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </TraitCard>
              )}

              {traits.grooming !== undefined && (
                <TraitCard label="Grooming needs">
                  <ScoreBar score={traits.grooming} />
                </TraitCard>
              )}

              {traits.exercise !== undefined && (
                <TraitCard label="Exercise needs">
                  <ScoreBar score={traits.exercise} />
                </TraitCard>
              )}

              {traits.shedding !== undefined && (
                <TraitCard label="Shedding">
                  <ScoreBar score={traits.shedding} />
                </TraitCard>
              )}

              {traits.trainability !== undefined && (
                <TraitCard label="Trainability">
                  <ScoreBar score={traits.trainability} />
                </TraitCard>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <YesNoBadge label="Good with kids" value={traits.goodWithKids} />
              <YesNoBadge
                label="Good with other pets"
                value={traits.goodWithPets}
              />
              <YesNoBadge
                label="Apartment friendly"
                value={traits.apartmentFriendly}
              />
            </div>
          </section>
        )}

        {breed.description && (
          <section
            className="mt-12 max-w-3xl"
            aria-labelledby="description-heading"
          >
            <h2
              id="description-heading"
              className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl"
            >
              About the {breed.name}
            </h2>
            <p className="mt-4 whitespace-pre-line leading-7 text-neutral-700">
              {breed.description}
            </p>
          </section>
        )}

        <div className="mt-12 rounded-2xl bg-brand-700 px-6 py-8 sm:px-10">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Looking for a {breed.name}?
          </h2>
          <p className="mt-2 text-brand-100">
            Tell us your city and budget. We will match you with verified breeders
            and follow up on WhatsApp.
          </p>
          <ButtonLink
            href={`/enquire?breed=${breed.slug}`}
            variant="accent"
            className="mt-5"
          >
            Start an enquiry
          </ButtonLink>
        </div>
      </Container>

      {listings.length > 0 && (
        <section className="border-t border-neutral-200 bg-neutral-50">
          <Container className="py-12 sm:py-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                  {breed.name} listings
                </h2>
                <p className="mt-2 text-neutral-600">
                  Active listings from verified breeders.
                </p>
              </div>
              <Link
                href={`/pets?breed=${breed.slug}`}
                className="text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                View all listings &rarr;
              </Link>
            </div>
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.slug}
                  listing={toListingCardData(listing)}
                />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

function TraitCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const clamped = Math.min(5, Math.max(1, Math.round(score)));
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex gap-1"
        role="img"
        aria-label={`${clamped} out of 5`}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`h-2.5 w-6 rounded-full ${
              i < clamped ? "bg-brand-500" : "bg-neutral-200"
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-neutral-500">{clamped}/5</span>
    </div>
  );
}

function YesNoBadge({
  label,
  value,
}: {
  label: string;
  value: boolean | undefined;
}) {
  if (value === undefined) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${
        value
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-neutral-200 bg-neutral-50 text-neutral-600"
      }`}
    >
      <span aria-hidden="true">{value ? "✓" : "✗"}</span>
      {label}
    </span>
  );
}
