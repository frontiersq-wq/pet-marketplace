import type { Metadata } from "next";
import Link from "next/link";

import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ListingStatus } from "@/generated/prisma/enums";
import { parseStringArray } from "@/lib/json-fields";
import { prisma } from "@/lib/prisma";
import { SERVICE_CATEGORIES } from "@/lib/service-categories";
import { site } from "@/lib/site";

// Statically prerendered and refreshed hourly. The homepage is the most-crawled
// page on the site, so it should be served as cached HTML rather than rendered
// per request — but listings change, so it cannot be cached forever.
export const revalidate = 3600;

const HOME_TITLE = `${site.name} — Buy, adopt and care for pets in India`;
const HOME_DESCRIPTION =
  "Browse puppies, kittens and pets for sale, adoption and mating from verified breeders across India. Book grooming, boarding, training, walking and vet services near you.";

export const metadata: Metadata = {
  // `absolute` overrides the layout's "%s | PetHaven" template.
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  // Without these, og:* would inherit the layout defaults and disagree with the
  // <title> above — shared links would show different copy from search results.
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "/",
  },
};

const FEATURED_LIMIT = 6;

async function getFeaturedListings(): Promise<ListingCardData[]> {
  const listings = await prisma.listing.findMany({
    where: { status: ListingStatus.ACTIVE },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: FEATURED_LIMIT,
    select: {
      slug: true,
      title: true,
      purpose: true,
      gender: true,
      ageMonths: true,
      price: true,
      images: true,
      breed: { select: { name: true } },
      city: { select: { name: true } },
    },
  });

  return listings.map((listing) => ({
    slug: listing.slug,
    title: listing.title,
    purpose: listing.purpose,
    gender: listing.gender,
    ageMonths: listing.ageMonths,
    price: listing.price,
    images: parseStringArray(listing.images),
    breedName: listing.breed?.name ?? null,
    cityName: listing.city.name,
  }));
}

const BASE = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  url: BASE,
  potentialAction: {
    "@type": "SearchAction",
    target: `${BASE}/pets?species={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default async function HomePage() {
  const featured = await getFeaturedListings();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Hero />
      <FeaturedPets listings={featured} />
      <BrowseByService />
      <WhyChooseUs />
    </>
  );
}

function Hero() {
  return (
    <section className="border-b border-neutral-200 bg-gradient-to-b from-brand-50 to-white">
      <Container className="py-16 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            Verified breeders &middot; Trusted services
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Find your next family member
          </h1>

          <p className="mt-5 text-lg text-neutral-600">
            Puppies, kittens and pets for sale, adoption and mating — from breeders we
            verify ourselves. Plus grooming, boarding, training and vet care, booked in
            a few taps.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/pets" size="lg">
              Browse pets
            </ButtonLink>
            <ButtonLink href="/enquire" variant="outline" size="lg">
              Tell us what you need
            </ButtonLink>
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            {[
              { label: "Verified breeders", value: "Vet-checked" },
              { label: "Cities covered", value: "4+" },
              { label: "Services", value: "6 categories" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-sm text-neutral-500">{stat.label}</dt>
                <dd className="text-lg font-semibold text-neutral-900">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}

function SectionHeading({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 text-neutral-600">{description}</p>
      </div>

      {href && linkLabel && (
        <Link href={href} className="text-sm font-medium text-brand-700 hover:text-brand-800">
          {linkLabel} &rarr;
        </Link>
      )}
    </div>
  );
}

function FeaturedPets({ listings }: { listings: ListingCardData[] }) {
  return (
    <section>
      <Container className="py-16 sm:py-20">
        <SectionHeading
          title="Featured pets"
          description="Recently listed by breeders and shelters we have verified."
          href="/pets"
          linkLabel="View all pets"
        />

        {listings.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.slug} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
            <h3 className="font-semibold text-neutral-900">No pets listed just yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">
              We are onboarding breeders in your area right now. Tell us what you are
              looking for and we will reach out as soon as we have a match.
            </p>
            <ButtonLink href="/enquire" variant="accent" className="mt-6">
              Tell us what you need
            </ButtonLink>
          </div>
        )}
      </Container>
    </section>
  );
}

function BrowseByService() {
  return (
    <section className="border-y border-neutral-200 bg-neutral-50">
      <Container className="py-16 sm:py-20">
        <SectionHeading
          title="Browse by service"
          description="Vetted professionals for everything your pet needs after they come home."
          href="/services"
          linkLabel="All services"
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_CATEGORIES.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group rounded-xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <h3 className="font-semibold text-neutral-900 group-hover:text-brand-700">
                {service.label}
              </h3>
              <p className="mt-1.5 text-sm text-neutral-600">{service.description}</p>
              <span className="mt-3 inline-block text-sm font-medium text-brand-700">
                Find {service.label.toLowerCase()} &rarr;
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

const TRUST_POINTS = [
  {
    title: "Every breeder is verified",
    body: "We check registration papers, visit premises and confirm the parents are on site before a listing goes live.",
  },
  {
    title: "Health records up front",
    body: "Vaccination and deworming status is on every listing, so you know exactly what has been done before you enquire.",
  },
  {
    title: "Adoption sits alongside sales",
    body: "Indies and rescues are listed next to pedigree pets, never buried. Adopting is always free.",
  },
  {
    title: "One place for aftercare",
    body: "The same platform books grooming, boarding, training and vet visits, so you are not starting from scratch.",
  },
];

function WhyChooseUs() {
  return (
    <section>
      <Container className="py-16 sm:py-20">
        <SectionHeading
          title={`Why families choose ${site.name}`}
          description="Buying or adopting a pet is a fifteen-year decision. We try to treat it that way."
        />

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {TRUST_POINTS.map((point) => (
            <div key={point.title} className="flex gap-4">
              <CheckIcon />
              <div>
                <h3 className="font-semibold text-neutral-900">{point.title}</h3>
                <p className="mt-1 text-sm text-neutral-600">{point.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-brand-700 px-6 py-10 text-center sm:px-12">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Not sure where to start?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-50">
            Tell us the breed, city and budget you have in mind. We will match you with
            verified breeders and get back to you on WhatsApp.
          </p>
          <ButtonLink href="/enquire" variant="accent" size="lg" className="mt-7">
            Start an enquiry
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

function CheckIcon() {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"
      aria-hidden="true"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </span>
  );
}
