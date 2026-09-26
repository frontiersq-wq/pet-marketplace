import { ServiceCategory } from "@/generated/prisma/enums";

// Display metadata for every ServiceCategory in the schema. Keyed by the enum so
// adding a category to Prisma surfaces a TypeScript error here until it has copy
// and a route. The service pages themselves are built in a later chunk.
export type ServiceCategoryMeta = {
  category: ServiceCategory;
  slug: string;
  label: string;
  description: string;
};

export const SERVICE_CATEGORIES: ServiceCategoryMeta[] = [
  {
    category: ServiceCategory.GROOMING,
    slug: "grooming",
    label: "Grooming",
    description: "Baths, haircuts, nail trims and de-shedding — at a salon or your doorstep.",
  },
  {
    category: ServiceCategory.BOARDING,
    slug: "boarding",
    label: "Boarding",
    description: "Home boarding and day care for when you travel, with daily updates.",
  },
  {
    category: ServiceCategory.WALKING,
    slug: "walking",
    label: "Dog walking",
    description: "Reliable daily walkers in your neighbourhood, booked by the week.",
  },
  {
    category: ServiceCategory.TRAINING,
    slug: "training",
    label: "Training",
    description: "Obedience, puppy basics and behaviour correction from certified trainers.",
  },
  {
    category: ServiceCategory.VETERINARY,
    slug: "veterinary",
    label: "Veterinary",
    description: "Vaccinations, health checks and home vet visits from licensed clinics.",
  },
  {
    category: ServiceCategory.SITTING,
    slug: "sitting",
    label: "Pet sitting",
    description: "Sitters who come to you, so your pet stays in its own home.",
  },
];
