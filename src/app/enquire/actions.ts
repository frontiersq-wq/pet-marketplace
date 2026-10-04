"use server";

import { LeadStatus, Species } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type LeadFormValues = {
  purpose: string;
  species: string;
  breedSlug: string;
  citySlug: string;
  budgetMin: string;
  budgetMax: string;
  requirement: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  listingSlug: string;
};

export type LeadResult = { ok: true } | { ok: false; error: string };

export async function createLead(data: LeadFormValues): Promise<LeadResult> {
  const name = data.name.trim();
  const phone = data.phone.trim();

  if (!name) return { ok: false, error: "Please enter your name." };
  if (!phone) return { ok: false, error: "Please enter your phone number." };
  if (!/^[+\d][\d\s\-]{7,14}$/.test(phone)) {
    return { ok: false, error: "Please enter a valid phone number (e.g. 98765 43210)." };
  }

  try {
    const [breed, city, listing] = await Promise.all([
      data.breedSlug
        ? prisma.breed.findUnique({
            where: { slug: data.breedSlug },
            select: { id: true },
          })
        : Promise.resolve(null),
      data.citySlug
        ? prisma.city.findUnique({
            where: { slug: data.citySlug },
            select: { id: true, name: true, state: true },
          })
        : Promise.resolve(null),
      data.listingSlug
        ? prisma.listing.findUnique({
            where: { slug: data.listingSlug },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    const species =
      Object.values(Species).find((s) => s === data.species) ?? undefined;

    const budgetMin = data.budgetMin ? parseFloat(data.budgetMin) : undefined;
    const budgetMax = data.budgetMax ? parseFloat(data.budgetMax) : undefined;

    await prisma.lead.create({
      data: {
        name,
        phone,
        email: data.email.trim() || undefined,
        species,
        breedId: breed?.id ?? undefined,
        cityId: city?.id ?? undefined,
        cityName: city?.name ?? undefined,
        stateName: city?.state ?? undefined,
        requirement: data.requirement.trim() || undefined,
        budgetMin: Number.isFinite(budgetMin) ? budgetMin : undefined,
        budgetMax: Number.isFinite(budgetMax) ? budgetMax : undefined,
        message: data.message.trim() || undefined,
        listingId: listing?.id ?? undefined,
        source: data.purpose ? `enquiry-form:${data.purpose}` : "enquiry-form",
        status: LeadStatus.NEW,
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("createLead error:", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
