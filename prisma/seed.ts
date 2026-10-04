import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  ContentStatus,
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

  // --- Blog posts ----------------------------------------------------------
  const BLOG_POSTS = [
    {
      slug: "how-to-choose-the-right-dog-breed",
      title: "How to choose the right dog breed for your family",
      category: "guides",
      excerpt:
        "From apartment size to activity level, the right breed is one that matches your actual lifestyle — not the one you imagine having.",
      readMinutes: 5,
      tags: serializeStringArray(["dogs", "breeds", "first-time owner"]),
      seoTitle: "How to choose the right dog breed for your family — PetHaven Guide",
      seoDescription:
        "A practical guide to matching your lifestyle, home size and schedule with the right dog breed before you buy or adopt.",
      body: `Choosing a dog breed is one of the most important decisions a pet owner makes — and one of the most misunderstood. Most people pick a breed based on looks or popularity. A few years later they are struggling with a high-energy working dog in a two-bedroom apartment, or a giant breed that costs more in food than a family member.

The first question is not "which breed do I like?" It is "which breed fits how I actually live?"

Start with your home. Dogs over 25 kg need outdoor space to decompress. Labradors, German Shepherds and Golden Retrievers can live in apartments but need two brisk walks a day — minimum. Smaller breeds like Beagles and Cocker Spaniels adapt better to flats, though Beagles are vocal and Cocker Spaniels need regular grooming.

Next, be honest about your schedule. Working 10-hour days? A breed that bonds intensely — like a Siberian Husky or Border Collie — will develop separation anxiety and become destructive. A more independent breed, or a calm adult rescue dog, is a better match.

Think about your household. Families with young children do well with Labradors, Golden Retrievers and Beagles — all naturally patient and forgiving of small-child chaos. German Shepherds and Rottweilers can also be excellent family dogs, but they need early socialisation and consistent training.

Budget matters more than people admit. A large breed eating quality kibble, plus grooming, vet visits and boarding, adds up to ₹3,000–₹8,000 a month. Toy breeds cost less to feed and board, but often have more health issues and higher vet bills.

Finally, consider lifespan and commitment. A Labrador lives 10–12 years. A small breed like a Lhasa Apso can reach 15–18. Adopting is always an option — adult dogs from rescues are calmer, health-checked and often already trained.

If you are unsure, use our enquiry form to tell us about your lifestyle. We match you with breeders who know their breed well enough to tell you honestly whether it is right for you.`,
    },
    {
      slug: "5-things-to-verify-before-buying-a-puppy",
      title: "5 things to verify before buying a puppy from a breeder",
      category: "tips",
      excerpt:
        "A reputable breeder will welcome every one of these questions. One who avoids them is giving you the answer you need.",
      readMinutes: 4,
      tags: serializeStringArray(["buying guide", "breeders", "puppies", "tips"]),
      seoTitle: "5 things to check before buying a puppy — PetHaven",
      seoDescription:
        "What to ask, what to check and what to walk away from when buying a puppy from a breeder in India.",
      body: `Buying a puppy is exciting. It is also the easiest moment to make a decision you regret for the next 12 years. Here are five things to verify before you hand over any money.

1. See both parents in person. A breeder who cannot show you the mother — not just a photo — is a red flag. The mother tells you the puppy's likely temperament, size and health. If the father is not on site, ask for health records and photos. Never accept "the parents are not available right now."

2. Check vaccination and deworming records. Puppies should have their first vaccination (typically DHPPiL) between 6–8 weeks, and deworming at 2, 4 and 6 weeks. Ask to see the actual vet certificate, not a handwritten note. A breeder who cannot produce this is cutting corners on your puppy's health.

3. Visit the premises, not a parking lot. Reputable breeders invite you to their home or kennel. Puppies raised in a clean, stimulating environment are better socialised. If the breeder insists on meeting at a neutral location "for convenience," decline. You need to see where the puppy was raised.

4. Ask about genetic health testing. For certain breeds — Labradors, German Shepherds, Golden Retrievers — responsible breeders screen for hip dysplasia, elbow dysplasia and hereditary eye conditions. Ask what tests were done on the parents. Not every breeder does this, but the good ones do.

5. Get a written agreement. A proper sale should include the puppy's details, the agreed price, what vaccinations and deworming have been done, and an understanding about what happens if a health issue appears in the first few weeks. Reputable breeders stand behind their puppies.

If a breeder on PetHaven is verified, our team has visited their premises and reviewed their records before approving the listing. You can still ask all these questions — but you will know someone else already asked them first.`,
    },
    {
      slug: "labrador-retriever-first-year-guide",
      title: "Labrador Retriever — what to expect in the first year",
      category: "breed-guides",
      excerpt:
        "Labs are joyful, intelligent and famously food-motivated. Year one sets the foundation for the next decade.",
      readMinutes: 6,
      tags: serializeStringArray(["labrador", "dogs", "puppy care", "training"]),
      seoTitle: "Labrador Retriever puppy — first year guide | PetHaven",
      seoDescription:
        "What to expect in your Labrador puppy's first year: feeding, training, vaccinations, socialisation and common health issues.",
      body: `Labradors are consistently the most popular dog breed in India, and for good reason. They are friendly, trainable, good with children and adaptable to most households. They are also enthusiastic chewers, powerful pullers on a lead and extremely skilled at emptying your kitchen bin if left unsupervised.

Here is what the first year actually looks like.

Weeks 8–12: The adjustment period. Your puppy is leaving its litter for the first time and everything is new. Expect some crying at night — a warm hot water bottle wrapped in a blanket and a ticking clock near the sleeping area helps. Start crate training from day one. Labs are food-motivated and respond well to positive reinforcement; start teaching "sit" and "come" immediately.

Vaccinations in this period: your vet will typically recommend DHPPiL at 8 weeks, a booster at 12 weeks, and the rabies vaccine at 16 weeks. Keep your puppy away from public spaces and unknown dogs until two weeks after the final puppy vaccination.

Months 3–6: The rapid growth phase. Labs grow fast. Your 4 kg puppy can be 20 kg by 6 months. Do not over-exercise during this period — growing joints are vulnerable. Two 15-minute walks a day is enough at this age. Free play in a safe space is fine.

Start socialisation as soon as vaccination is complete. Expose your puppy to traffic, children, other dogs, strangers, umbrellas, motorbikes and anything else that might otherwise become a fear trigger later.

Months 6–12: Adolescence. Labs hit adolescence around 6–8 months and may suddenly appear to "forget" their training. This is normal. Stay consistent, keep training sessions short (5–10 minutes), and never punish — a confused Lab becomes anxious, and an anxious Lab becomes a destructive one.

Neutering is typically recommended between 12–18 months for Labs. Speak to your vet about the right timing for your dog's size and lifestyle.

Common health issues to watch for: Labs are prone to ear infections (check weekly and clean gently), obesity (measure their food — a free-fed Lab will overeat), and hip dysplasia as they age. Annual vet check-ups are non-negotiable.

By their first birthday you will have a confident, loving companion with a good foundation in basic obedience. The next decade will thank you for the work you put in now.`,
    },
    {
      slug: "bringing-a-new-pet-home-first-48-hours",
      title: "Bringing a new pet home: the first 48 hours",
      category: "care",
      excerpt:
        "What you do in the first two days shapes how your pet settles into your home for months to come.",
      readMinutes: 4,
      tags: serializeStringArray(["new pet", "settling in", "cats", "dogs", "care"]),
      seoTitle: "Bringing a new pet home — what to do in the first 48 hours | PetHaven",
      seoDescription:
        "A practical guide to the first two days with a new puppy, kitten or rescue pet — what to do, what to avoid and how to set them up for success.",
      body: `The first 48 hours with a new pet are the most important — and the most exhausting. Here is how to give them the best possible start.

Before they arrive. Set up a dedicated space: a crate or a quiet corner with bedding, water and food bowls. For puppies, puppy-proof one room first — tape down cables, remove anything chewable, block off spaces they can get stuck in. For kittens, a small room is better than the whole house; too much space is overwhelming.

The first hour. Let your pet explore at their own pace. Resist the urge to show them off to everyone immediately. Keep visitors to a minimum. Get down to their level rather than looming over them. Speak quietly. Let them come to you.

The first night. Puppies will cry. This is normal. They have left their mother and siblings and everything familiar. A crate next to your bed (where they can hear and smell you) is kinder than isolation in another room. Kittens are often easier — once they have found a hiding spot they are comfortable with, they tend to settle.

Day 2: Establish routine immediately. Meals at the same time. Walks at the same time (puppies). Play and rest on a predictable schedule. Pets are far more anxious when they cannot predict what comes next.

Vet visit within the first week. Even if the breeder provided health records, book a new-owner vet check. Your vet will review the records, check for anything missed, and give you personalised advice on food, vaccinations and parasite prevention.

What to avoid. Do not overwhelm them with too many people too soon. Do not scold accidents in the house — they are not being naughty, they are confused. Do not change their food abruptly; if you are switching brands, mix the new food with the old over 7–10 days.

The first 48 hours pass quickly. By the end of the first week, most pets have found their rhythm. Give them space, keep things consistent, and the bond will follow naturally.`,
    },
  ];

  for (const post of BLOG_POSTS) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: { body: post.body, excerpt: post.excerpt },
      create: {
        ...post,
        authorId: admin.id,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`  blog posts: ${BLOG_POSTS.length}`);

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
