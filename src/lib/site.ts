// Single source of truth for site-wide copy, navigation and contact details.
// Header, footer, metadata and later chunks all read from here so there is one
// place to change the brand.

export const site = {
  name: "PetHaven",
  tagline: "Find your next family member",
  description:
    "Browse pets for sale, adoption and mating from verified breeders, and book trusted grooming, training, walking, sitting and veterinary services near you.",
  // Placeholder contact details — swap for real ones before launch.
  phone: "+91 90000 00000",
  email: "hello@pethaven.example",
  whatsapp: "+919000000000",
  address: "Indiranagar, Bengaluru, Karnataka 560038",
} as const;

/** Primary navigation. These routes are built in later Phase 1 chunks. */
export const mainNav = [
  { href: "/pets", label: "Pets" },
  { href: "/breeds", label: "Breeds" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Blog" },
] as const;

export const footerNav = {
  Company: [
    { href: "/about", label: "About us" },
    { href: "/contact", label: "Contact" },
    { href: "/blog", label: "Blog" },
    { href: "/enquire", label: "Enquire" },
  ],
  Services: [
    { href: "/services/grooming", label: "Grooming" },
    { href: "/services/boarding", label: "Boarding" },
    { href: "/services/training", label: "Training" },
    { href: "/services/veterinary", label: "Veterinary" },
  ],
  Social: [
    { href: "https://instagram.com", label: "Instagram", external: true },
    { href: "https://facebook.com", label: "Facebook", external: true },
    { href: "https://youtube.com", label: "YouTube", external: true },
  ],
} as const;
