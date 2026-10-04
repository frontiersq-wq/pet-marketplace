import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PriceUnit } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { parseStringArray } from "@/lib/json-fields";
import { SERVICE_CATEGORIES } from "@/lib/service-categories";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const PRICE_UNIT_LABEL: Record<PriceUnit, string> = {
  [PriceUnit.PER_SESSION]: "/ session",
  [PriceUnit.PER_HOUR]: "/ hr",
  [PriceUnit.PER_DAY]: "/ day",
  [PriceUnit.PER_MONTH]: "/ month",
  [PriceUnit.FIXED]: "",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const meta = SERVICE_CATEGORIES.find((c) => c.slug === category);
  if (!meta) return { title: "Service not found" };

  const title = `${meta.label} services for pets`;
  const description = `Find verified ${meta.label.toLowerCase()} providers for your pet near you. ${meta.description}`;
  const canonical = `/services/${meta.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title: `${title} | PetHaven`, description, url: canonical },
  };
}

export default async function ServiceCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { category } = await params;
  const sp = await searchParams;
  const citySlug = firstValue(sp.city);

  const meta = SERVICE_CATEGORIES.find((c) => c.slug === category);
  if (!meta) notFound();

  const [services, cities] = await Promise.all([
    prisma.service.findMany({
      where: {
        category: meta.category,
        isActive: true,
        ...(citySlug ? { city: { is: { slug: citySlug } } } : {}),
      },
      select: {
        slug: true,
        title: true,
        description: true,
        priceFrom: true,
        priceUnit: true,
        coverage: true,
        provider: {
          select: {
            slug: true,
            businessName: true,
            verified: true,
            bio: true,
            areas: true,
            city: { select: { name: true, state: true } },
          },
        },
      },
      orderBy: [{ provider: { verified: "desc" } }, { priceFrom: "asc" }],
    }),
    prisma.city.findMany({
      select: { slug: true, name: true, state: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const enquiryHref = `/enquire?service=${meta.slug}${citySlug ? `&city=${citySlug}` : ""}`;

  return (
    <>
      <section className="border-b border-neutral-200 bg-gradient-to-b from-brand-50 to-white">
        <Container className="py-16 sm:py-20">
          <Link
            href="/services"
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            &larr; All services
          </Link>
          <div className="mt-6 max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              {meta.label} services
            </h1>
            <p className="mt-4 text-lg text-neutral-600">{meta.description}</p>
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Available providers
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              {services.length} {services.length === 1 ? "provider" : "providers"} found
            </p>
          </div>

          <form action={`/services/${meta.slug}`} method="get" className="flex items-center gap-2">
            <label htmlFor="city" className="text-sm font-medium text-neutral-800 whitespace-nowrap">
              Filter by city
            </label>
            <select
              id="city"
              name="city"
              defaultValue={citySlug ?? ""}
              className="h-10 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
            >
              <option value="">All cities</option>
              {cities.map((city) => (
                <option key={city.slug} value={city.slug}>
                  {city.name}, {city.state}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="h-10 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
            >
              Go
            </button>
            {citySlug && (
              <Link
                href={`/services/${meta.slug}`}
                className="text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                Clear
              </Link>
            )}
          </form>
        </div>

        {services.length > 0 ? (
          <div className="mt-8 flex flex-col gap-5">
            {services.map((service) => {
              const areas = parseStringArray(service.coverage);
              const priceLabel = service.priceFrom
                ? `${formatPrice(service.priceFrom)} ${PRICE_UNIT_LABEL[service.priceUnit]}`
                : "Price on request";

              return (
                <div
                  key={service.slug}
                  className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-neutral-900">
                          {service.title}
                        </h3>
                        {service.provider.verified && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-neutral-600">
                        by{" "}
                        <Link
                          href={`/providers/${service.provider.slug}`}
                          className="font-medium text-brand-700 hover:text-brand-800"
                        >
                          {service.provider.businessName}
                        </Link>
                        {service.provider.city && (
                          <span className="text-neutral-500">
                            {" "}
                            &middot; {service.provider.city.name}
                            {areas.length > 0 &&
                              `, ${areas.slice(0, 2).join(", ")}${areas.length > 2 ? " +more" : ""}`}
                          </span>
                        )}
                      </p>
                    </div>

                    <p className="shrink-0 text-lg font-semibold text-brand-700">
                      {priceLabel}
                    </p>
                  </div>

                  {service.description && (
                    <p className="mt-3 text-sm leading-6 text-neutral-600">
                      {service.description}
                    </p>
                  )}

                  {service.provider.bio && (
                    <p className="mt-2 text-sm text-neutral-500 line-clamp-2">
                      {service.provider.bio}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <ButtonLink
                      href={enquiryHref}
                      variant="accent"
                      size="sm"
                    >
                      Enquire
                    </ButtonLink>
                    <Link
                      href={`/providers/${service.provider.slug}`}
                      className="inline-flex h-9 items-center rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                    >
                      View provider
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
            <h3 className="font-semibold text-neutral-900">
              No {meta.label.toLowerCase()} providers found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">
              {citySlug
                ? "Try a different city, or clear the filter to see all providers."
                : "We are onboarding providers in your area. Send an enquiry and we will follow up."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {citySlug && (
                <Link
                  href={`/services/${meta.slug}`}
                  className="text-sm font-medium text-brand-700 hover:text-brand-800"
                >
                  Clear city filter
                </Link>
              )}
              <ButtonLink href={enquiryHref} variant="accent" size="sm">
                Send an enquiry
              </ButtonLink>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
