import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { prisma } from "@/lib/prisma";
import { SERVICE_CATEGORIES } from "@/lib/service-categories";
import { ServiceCategory } from "@/generated/prisma/enums";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pet services — grooming, boarding, training and more",
  description:
    "Book verified groomers, dog walkers, trainers, boarders, pet sitters and vets near you. Trusted providers across Bengaluru, Mumbai, Delhi and Hyderabad.",
  openGraph: {
    title: "Pet services — grooming, boarding, training and more | PetHaven",
    description:
      "Book verified groomers, dog walkers, trainers, boarders, pet sitters and vets near you.",
  },
};

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Choose a service",
    body: "Pick from grooming, boarding, walking, training, vet or sitting — then filter by your city.",
  },
  {
    step: "2",
    title: "See verified providers",
    body: "Every provider has been checked by our team. Ratings and reviews are from real customers.",
  },
  {
    step: "3",
    title: "Send an enquiry",
    body: "Tell us what you need and we will connect you on WhatsApp to agree a slot.",
  },
];

export default async function ServicesPage() {
  const categoryCounts = await prisma.service.groupBy({
    by: ["category"],
    where: { isActive: true },
    _count: { _all: true },
  });

  const countByCategory: Partial<Record<ServiceCategory, number>> =
    Object.fromEntries(
      categoryCounts.map((c) => [c.category, c._count._all]),
    );

  return (
    <>
      <section className="border-b border-neutral-200 bg-gradient-to-b from-brand-50 to-white">
        <Container className="py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              Trusted pet care
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              Every service your pet needs
            </h1>
            <p className="mt-5 text-lg text-neutral-600">
              Verified groomers, walkers, trainers, boarders, sitters and vets
              — all in one place. Browse by category and filter to your city.
            </p>
            <ButtonLink href="/enquire" variant="accent" size="lg" className="mt-8">
              Tell us what you need
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-16 sm:py-20">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Browse by service
          </h2>
          <p className="mt-2 text-neutral-600">
            Select a category to see available providers in your area.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_CATEGORIES.map((cat) => {
              const count = countByCategory[cat.category] ?? 0;
              return (
                <Link
                  key={cat.slug}
                  href={`/services/${cat.slug}`}
                  className="group rounded-xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <h3 className="font-semibold text-neutral-900 group-hover:text-brand-700">
                    {cat.label}
                  </h3>
                  <p className="mt-1.5 text-sm text-neutral-600">
                    {cat.description}
                  </p>
                  <p className="mt-4 text-sm font-medium text-brand-700">
                    {count > 0
                      ? `${count} ${count === 1 ? "provider" : "providers"} available`
                      : "Coming soon"}
                    {" "}
                    &rarr;
                  </p>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50">
        <Container className="py-16 sm:py-20">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            How it works
          </h2>
          <p className="mt-2 text-neutral-600">
            From discovery to booking in three steps.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
