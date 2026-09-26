import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  Gender,
  ListingPurpose,
  ListingStatus,
  PriceUnit,
  ProviderType,
  Role,
  ServiceCategory,
  Species,
} from "../src/generated/prisma/enums";
import {
  serializeStringArray,
  serializeTraits,
  type BreedTraits,
} from "../src/lib/json-fields";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

// Everything below is upserted on a natural key, so the seed is idempotent:
// re-running it refreshes the sample data instead of duplicating it.

const CITIES = [
  { slug: "bengaluru", name: "Bengaluru", state: "Karnataka", latitude: 12.9716, longitude: 77.5946 },
  { slug: "mumbai", name: "Mumbai", state: "Maharashtra", latitude: 19.076, longitude: 72.8777 },
  { slug: "delhi", name: "Delhi", state: "Delhi", latitude: 28.6139, longitude: 77.209 },
  { slug: "hyderabad", name: "Hyderabad", state: "Telangana", latitude: 17.385, longitude: 78.4867 },
];

const BREEDS: Array<{
  slug: string;
  name: string;
  species: Species;
  summary: string;
  origin: string;
  traits: BreedTraits;
}> = [
  {
    slug: "labrador-retriever",
    name: "Labrador Retriever",
    species: Species.DOG,
    summary:
      "Friendly, outgoing and eager to please — the Labrador is consistently India's most popular family dog.",
    origin: "Canada",
    traits: {
      size: "LARGE",
      lifespanYears: [10, 12],
      weightKg: [25, 36],
      temperament: ["Friendly", "Outgoing", "Gentle"],
      grooming: 2,
      exercise: 5,
      shedding: 4,
      trainability: 5,
      goodWithKids: true,
      goodWithPets: true,
      apartmentFriendly: false,
    },
  },
  {
    slug: "german-shepherd",
    name: "German Shepherd",
    species: Species.DOG,
    summary:
      "Confident, courageous and highly trainable, the German Shepherd is a working dog that thrives on a job to do.",
    origin: "Germany",
    traits: {
      size: "LARGE",
      lifespanYears: [9, 13],
      weightKg: [22, 40],
      temperament: ["Loyal", "Confident", "Alert"],
      grooming: 3,
      exercise: 5,
      shedding: 5,
      trainability: 5,
      goodWithKids: true,
      goodWithPets: false,
      apartmentFriendly: false,
    },
  },
  {
    slug: "indian-pariah-dog",
    name: "Indian Pariah Dog",
    species: Species.DOG,
    summary:
      "A hardy, low-maintenance native breed that is naturally healthy, highly adaptable and ideal for first-time adopters.",
    origin: "India",
    traits: {
      size: "MEDIUM",
      lifespanYears: [13, 16],
      weightKg: [15, 25],
      temperament: ["Alert", "Adaptable", "Independent"],
      grooming: 1,
      exercise: 4,
      shedding: 2,
      trainability: 4,
      goodWithKids: true,
      goodWithPets: true,
      apartmentFriendly: true,
    },
  },
  {
    slug: "persian-cat",
    name: "Persian",
    species: Species.CAT,
    summary:
      "Quiet, affectionate and famously long-coated — Persians suit calm indoor homes that can commit to daily grooming.",
    origin: "Iran",
    traits: {
      size: "MEDIUM",
      lifespanYears: [12, 17],
      weightKg: [3, 6],
      temperament: ["Calm", "Affectionate", "Quiet"],
      grooming: 5,
      exercise: 2,
      shedding: 4,
      trainability: 3,
      goodWithKids: true,
      goodWithPets: true,
      apartmentFriendly: true,
    },
  },
  {
    slug: "bengal-cat",
    name: "Bengal",
    species: Species.CAT,
    summary:
      "Athletic and strikingly spotted, the Bengal is a highly active cat that needs climbing space and daily play.",
    origin: "United States",
    traits: {
      size: "MEDIUM",
      lifespanYears: [12, 16],
      weightKg: [4, 7],
      temperament: ["Energetic", "Curious", "Vocal"],
      grooming: 2,
      exercise: 5,
      shedding: 2,
      trainability: 4,
      goodWithKids: true,
      goodWithPets: true,
      apartmentFriendly: true,
    },
  },
];

async function main() {
  console.log("Seeding database…");

  // --- Cities -------------------------------------------------------------
  const cities = new Map<string, string>();
  for (const city of CITIES) {
    const record = await prisma.city.upsert({
      where: { slug: city.slug },
      update: { name: city.name, state: city.state },
      create: {
        ...city,
        seoBlurb: `Browse pets and pet services available in ${city.name}, ${city.state}.`,
      },
    });
    cities.set(city.slug, record.id);
  }
  console.log(`  cities:   ${cities.size}`);

  // --- Breeds -------------------------------------------------------------
  const breeds = new Map<string, string>();
  for (const breed of BREEDS) {
    const record = await prisma.breed.upsert({
      where: { slug: breed.slug },
      update: { traits: serializeTraits(breed.traits), summary: breed.summary },
      create: {
        slug: breed.slug,
        name: breed.name,
        species: breed.species,
        summary: breed.summary,
        origin: breed.origin,
        traits: serializeTraits(breed.traits),
        images: serializeStringArray([]),
        seoTitle: `${breed.name} — temperament, price and care guide`,
        seoDescription: breed.summary,
      },
    });
    breeds.set(breed.slug, record.id);
  }
  console.log(`  breeds:   ${breeds.size}`);

  // --- Users (one per role) ----------------------------------------------
  // Shared development password. Never ship this to a real environment.
  const passwordHash = await bcrypt.hash("password123", 10);

  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: { role: Role.CUSTOMER, passwordHash },
    create: {
      email: "customer@example.com",
      name: "Priya Customer",
      phone: "+91 90000 00001",
      role: Role.CUSTOMER,
      passwordHash,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { role: Role.ADMIN, passwordHash },
    create: {
      email: "admin@example.com",
      name: "Site Admin",
      phone: "+91 90000 00002",
      role: Role.ADMIN,
      passwordHash,
    },
  });

  const providerUser = await prisma.user.upsert({
    where: { email: "provider@example.com" },
    update: { role: Role.PROVIDER, passwordHash },
    create: {
      email: "provider@example.com",
      name: "Happy Tails Kennel",
      phone: "+91 90000 00003",
      role: Role.PROVIDER,
      passwordHash,
    },
  });
  console.log("  users:    3 (customer, provider, admin)");

  // --- Provider profile + services ---------------------------------------
  const breederProfile = await prisma.providerProfile.upsert({
    where: { userId: providerUser.id },
    update: { verified: true },
    create: {
      userId: providerUser.id,
      type: ProviderType.BREEDER,
      businessName: "Happy Tails Kennel",
      slug: "happy-tails-kennel",
      bio: "KCI-registered kennel in Bengaluru breeding Labradors and German Shepherds since 2014.",
      phone: "+91 90000 00003",
      whatsapp: "+91 90000 00003",
      cityId: cities.get("bengaluru")!,
      areas: serializeStringArray(["Indiranagar", "Koramangala", "HSR Layout"]),
      verified: true,
      verifiedAt: new Date(),
    },
  });

  const services = [
    {
      slug: "happy-tails-grooming-bengaluru",
      title: "Full-service dog grooming at home",
      category: ServiceCategory.GROOMING,
      description:
        "Bath, blow-dry, nail trim, ear cleaning and a breed-appropriate haircut, done at your doorstep.",
      priceFrom: 899,
      priceUnit: PriceUnit.PER_SESSION,
    },
    {
      slug: "happy-tails-boarding-bengaluru",
      title: "Home boarding for dogs",
      category: ServiceCategory.BOARDING,
      description:
        "Your dog stays in a real home, not a cage, with two walks a day and daily photo updates.",
      priceFrom: 750,
      priceUnit: PriceUnit.PER_DAY,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: { isActive: true },
      create: {
        ...service,
        providerId: breederProfile.id,
        cityId: cities.get("bengaluru")!,
        coverage: serializeStringArray(["Indiranagar", "Koramangala", "HSR Layout"]),
        images: serializeStringArray([]),
      },
    });
  }
  console.log(`  services: ${services.length}`);

  // --- Listings -----------------------------------------------------------
  const listings = [
    {
      slug: "labrador-retriever-puppy-bengaluru",
      title: "Labrador Retriever puppies — KCI registered",
      purpose: ListingPurpose.SALE,
      species: Species.DOG,
      breedSlug: "labrador-retriever",
      citySlug: "bengaluru",
      ageMonths: 2,
      gender: Gender.MALE,
      price: 25000,
      description:
        "Home-raised Labrador puppies, first vaccination and deworming done, both parents available for viewing.",
      vaccinated: true,
      dewormed: true,
      kciCertified: true,
      featured: true,
    },
    {
      slug: "german-shepherd-puppy-mumbai",
      title: "German Shepherd double-coat puppies",
      purpose: ListingPurpose.SALE,
      species: Species.DOG,
      breedSlug: "german-shepherd",
      citySlug: "mumbai",
      ageMonths: 3,
      gender: Gender.FEMALE,
      price: 30000,
      description:
        "Show-quality double-coat German Shepherd puppies from an imported bloodline.",
      vaccinated: true,
      dewormed: true,
      kciCertified: true,
      featured: false,
    },
    {
      slug: "indie-puppy-adoption-bengaluru",
      title: "Indie puppies looking for a home — free adoption",
      purpose: ListingPurpose.ADOPTION,
      species: Species.DOG,
      breedSlug: "indian-pariah-dog",
      citySlug: "bengaluru",
      ageMonths: 4,
      gender: Gender.UNKNOWN,
      // Null price renders as "price on request" / free.
      price: null,
      description:
        "Three rescued indie puppies, vaccinated and dewormed, looking for loving homes. Adoption is free.",
      vaccinated: true,
      dewormed: true,
      kciCertified: false,
      featured: true,
    },
    {
      slug: "persian-kitten-delhi",
      title: "Persian kittens — doll face, triple coat",
      purpose: ListingPurpose.SALE,
      species: Species.CAT,
      breedSlug: "persian-cat",
      citySlug: "delhi",
      ageMonths: 3,
      gender: Gender.FEMALE,
      price: 18000,
      description: "Hand-raised doll-face Persian kittens, litter trained and vet checked.",
      vaccinated: true,
      dewormed: true,
      kciCertified: false,
      featured: false,
    },
    {
      slug: "bengal-cat-mating-hyderabad",
      title: "Bengal stud available for mating",
      purpose: ListingPurpose.MATING,
      species: Species.CAT,
      breedSlug: "bengal-cat",
      citySlug: "hyderabad",
      ageMonths: 30,
      gender: Gender.MALE,
      price: null,
      description:
        "Proven Bengal stud with excellent rosette markings. Health tested, documents available.",
      vaccinated: true,
      dewormed: true,
      kciCertified: false,
      featured: false,
    },
  ];

  for (const { breedSlug, citySlug, ...listing } of listings) {
    await prisma.listing.upsert({
      where: { slug: listing.slug },
      update: { status: ListingStatus.ACTIVE },
      create: {
        ...listing,
        breedId: breeds.get(breedSlug)!,
        cityId: cities.get(citySlug)!,
        ownerId: providerUser.id,
        status: ListingStatus.ACTIVE,
        publishedAt: new Date(),
        images: serializeStringArray([]),
      },
    });
  }
  console.log(`  listings: ${listings.length}`);

  console.log("\nSeed complete. Sign in with any of:");
  console.log(`  ${customer.email} / password123  (CUSTOMER)`);
  console.log(`  ${providerUser.email} / password123  (PROVIDER)`);
  console.log(`  ${admin.email} / password123  (ADMIN)`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
