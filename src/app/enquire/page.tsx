import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { EnquiryForm } from "./enquiry-form";
import type { LeadFormValues } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Enquire — tell us what you need",
  description:
    "Tell us the breed, city and budget you have in mind. We will match you with verified breeders and pet service providers and get back to you on WhatsApp.",
  openGraph: {
    title: "Enquire | PetHaven",
    description:
      "Tell us the breed, city and budget you have in mind. We will match you with verified breeders and get back to you on WhatsApp.",
  },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function EnquirePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const breedSlug = firstValue(params.breed) ?? "";
  const citySlug = firstValue(params.city) ?? "";
  const listingSlug = firstValue(params.listing) ?? "";
  const serviceSlug = firstValue(params.service) ?? "";
  const providerSlug = firstValue(params.provider) ?? "";

  const [breeds, cities, listing] = await Promise.all([
    prisma.breed.findMany({
      select: { slug: true, name: true, species: true },
      orderBy: [{ species: "asc" }, { name: "asc" }],
    }),
    prisma.city.findMany({
      select: { slug: true, name: true, state: true },
      orderBy: { name: "asc" },
    }),
    listingSlug
      ? prisma.listing.findUnique({
          where: { slug: listingSlug },
          select: { title: true },
        })
      : Promise.resolve(null),
  ]);

  const initial: Partial<LeadFormValues> = {
    breedSlug,
    citySlug,
    listingSlug,
    ...(serviceSlug ? { purpose: "service" } : {}),
    ...(providerSlug ? { purpose: "service" } : {}),
  };

  return (
    <>
      <section className="border-b border-neutral-200 bg-gradient-to-b from-brand-50 to-white">
        <Container className="py-12 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              Free, no obligation
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              Tell us what you need
            </h1>
            <p className="mt-4 text-lg text-neutral-600">
              Fill in a few details and we will match you with verified breeders
              or service providers. We follow up on WhatsApp — usually within
              24 hours.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,2fr)]">
          <aside className="lg:py-2">
            <h2 className="font-semibold text-neutral-900">
              Why enquire with us?
            </h2>
            <ul className="mt-4 flex flex-col gap-4">
              {WHY_POINTS.map((point) => (
                <li key={point.title} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <MiniCheckIcon />
                  </span>
                  <div>
                    <span className="font-medium text-neutral-900">
                      {point.title}
                    </span>
                    <span className="text-neutral-600"> — {point.body}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-900">
                Prefer to call?
              </p>
              <a
                href={`tel:${site.phone.replace(/\s/g, "")}`}
                className="mt-1 block text-brand-700 hover:text-brand-800"
              >
                {site.phone}
              </a>
              <a
                href={`https://wa.me/${site.whatsapp}`}
                className="mt-0.5 block text-sm text-neutral-600 hover:text-brand-700"
              >
                WhatsApp us directly
              </a>
            </div>
          </aside>

          <div>
            <EnquiryForm
              breeds={breeds}
              cities={cities}
              listingTitle={listing?.title ?? null}
              initial={initial}
            />
          </div>
        </div>
      </Container>
    </>
  );
}

const WHY_POINTS = [
  {
    title: "No spam",
    body: "We only share your details with providers who can genuinely help.",
  },
  {
    title: "Verified matches",
    body: "Every breeder and provider we recommend has been checked by our team.",
  },
  {
    title: "Fast reply",
    body: "We respond on WhatsApp, usually within 24 hours.",
  },
  {
    title: "Free service",
    body: "Enquiries are free. You only pay when you decide to proceed.",
  },
];

function MiniCheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
