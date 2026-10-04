import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ListingCard } from "@/components/listing-card";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ListingStatus, PriceUnit } from "@/generated/prisma/enums";
import { formatPrice } from "@/lib/format";
import { parseStringArray } from "@/lib/json-fields";
import { listingCardSelect, toListingCardData } from "@/lib/listings";
import { SERVICE_CATEGORIES } from "@/lib/service-categories";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

const PRICE_UNIT_LABEL: Record<PriceUnit, string> = {
  [PriceUnit.PER_SESSION]: "/ session",
  [PriceUnit.PER_HOUR]: "/ hr",
  [PriceUnit.PER_DAY]: "/ day",
  [PriceUnit.PER_MONTH]: "/ month",
  [PriceUnit.FIXED]: "",
};

const getProvider = cache((slug: string) =>
  prisma.providerProfile.findUnique({
    where: { slug },
    select: {
      slug: true,
      businessName: true,
      type: true,
      bio: true,
      phone: true,
      whatsapp: true,
      areas: true,
      verified: true,
      ratingAvg: true,
      ratingCount: true,
      userId: true,
      city: { select: { name: true, state: true } },
      services: {
        where: { isActive: true },
        select: {
          slug: true,
          title: true,
          category: true,
          description: true,
          priceFrom: true,
          priceUnit: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  }),
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getProvider(slug);
  if (!provider) return { title: "Provider not found" };

  const title = provider.businessName;
  const description =
    provider.bio?.slice(0, 300) ??
    `View services from ${provider.businessName} on PetHaven.`;
  const canonical = `/providers/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title: `${title} | PetHaven`, description, url: canonical },
  };
}

export default async function ProviderPage({ params }: PageProps) {
  const { slug } = await params;
  const provider = await getProvider(slug);
  if (!provider) notFound();

  const areas = parseStringArray(provider.areas);

  const listings = await prisma.listing.findMany({
    where: {
      status: ListingStatus.ACTIVE,
      ownerId: provider.userId,
    },
    select: listingCardSelect,
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: 6,
  });

  const enquiryHref = `/enquire?provider=${slug}`;

  const typeLabel = provider.type.charAt(0) + provider.type.slice(1).toLowerCase();

  const firstServiceCategory = provider.services[0]
    ? SERVICE_CATEGORIES.find((c) => c.category === provider.services[0].category)
    : undefined;

  return (
    <>
      <Container className="py-16 sm:py-20">
        <Breadcrumbs
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Services", href: "/services" },
            ...(firstServiceCategory
              ? [{ label: firstServiceCategory.label, href: `/services/${firstServiceCategory.slug}` }]
              : []),
            { label: provider.businessName, href: `/providers/${provider.slug}` },
          ]}
        />

        <div className="mt-6 flex flex-wrap items-start gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
                {typeLabel}
              </span>
              {provider.verified && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
                  Verified provider
                </span>
              )}
            </div>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              {provider.businessName}
            </h1>

            {provider.city && (
              <p className="mt-2 text-neutral-600">
                {provider.city.name}, {provider.city.state}
                {areas.length > 0 && (
                  <span className="text-neutral-500">
                    {" "}
                    &middot; serves {areas.join(", ")}
                  </span>
                )}
              </p>
            )}

            {provider.ratingCount > 0 && (
              <p className="mt-2 text-sm text-neutral-600">
                <span className="font-semibold text-neutral-900">
                  {provider.ratingAvg.toFixed(1)}
                </span>
                {" "}
                &middot; {provider.ratingCount}{" "}
                {provider.ratingCount === 1 ? "review" : "reviews"}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ButtonLink href={enquiryHref} variant="accent">
              Enquire now
            </ButtonLink>
          </div>
        </div>

        {provider.bio && (
          <section className="mt-10 max-w-3xl" aria-labelledby="bio-heading">
            <h2
              id="bio-heading"
              className="text-xl font-bold text-neutral-900"
            >
              About
            </h2>
            <p className="mt-3 leading-7 text-neutral-700">{provider.bio}</p>
          </section>
        )}

        {provider.verified && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="mt-0.5 text-emerald-700">
              <VerifiedIcon />
            </span>
            <p className="text-sm text-emerald-900">
              PetHaven has verified this provider. We checked their credentials
              and visited their premises before approving their listing.
            </p>
          </div>
        )}

        {provider.services.length > 0 && (
          <section className="mt-12" aria-labelledby="services-heading">
            <h2
              id="services-heading"
              className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl"
            >
              Services offered
            </h2>
            <div className="mt-6 flex flex-col gap-4">
              {provider.services.map((service) => {
                const catMeta = SERVICE_CATEGORIES.find(
                  (c) => c.category === service.category,
                );
                const priceLabel = service.priceFrom
                  ? `${formatPrice(service.priceFrom)} ${PRICE_UNIT_LABEL[service.priceUnit]}`
                  : "Price on request";

                return (
                  <div
                    key={service.slug}
                    className="rounded-xl border border-neutral-200 bg-white p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        {catMeta && (
                          <Link
                            href={`/services/${catMeta.slug}`}
                            className="text-xs font-medium text-brand-700 hover:text-brand-800"
                          >
                            {catMeta.label}
                          </Link>
                        )}
                        <h3 className="mt-0.5 font-semibold text-neutral-900">
                          {service.title}
                        </h3>
                      </div>
                      <p className="shrink-0 font-semibold text-brand-700">
                        {priceLabel}
                      </p>
                    </div>
                    {service.description && (
                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        {service.description}
                      </p>
                    )}
                    <ButtonLink
                      href={enquiryHref}
                      variant="accent"
                      size="sm"
                      className="mt-4"
                    >
                      Enquire about this service
                    </ButtonLink>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </Container>

      {listings.length > 0 && (
        <section className="border-t border-neutral-200 bg-neutral-50">
          <Container className="py-12 sm:py-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                  Active listings
                </h2>
                <p className="mt-2 text-neutral-600">
                  Pets currently listed by {provider.businessName}.
                </p>
              </div>
              <Link
                href={`/pets`}
                className="text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                View all pets &rarr;
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

function VerifiedIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
