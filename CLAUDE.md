# Pet Marketplace — Project Brief

## What we're building
A two-sided pet marketplace and services platform (modeled on mrnmrspet.com):
connects pet buyers/parents with providers (breeders, groomers, trainers, walkers,
sitters, vets); lists pets for sale/adoption/mating; offers bookable services;
publishes SEO content (breed pages, blog).

## Principles
- The business runs on SEO: every public page MUST be server-rendered and crawlable.
- Open-source and free tools first; introduce premium tools only when a phase needs them.
- Ship the public SEO site (Phase 1) before the provider dashboard (Phase 2) or payments (Phase 3).
- Build one phase at a time and stop for review after each.

## Tech stack (open-source first)
- Next.js (App Router) + TypeScript
- Tailwind CSS for styling
- Prisma with SQLite for local dev (migrate to PostgreSQL later)
- Auth.js (NextAuth) with roles: CUSTOMER, PROVIDER, ADMIN
- Local folder storage for images for now (Cloudinary/S3 later)
- Text search via the database for now (Meilisearch later)

## Core data model
- User (role: CUSTOMER | PROVIDER | ADMIN)
- ProviderProfile (type: BREEDER|GROOMER|TRAINER|WALKER|SITTER|VET, verified, areas)
- Listing (purpose: SALE|ADOPTION|MATING, species, breedId, age, gender, price, cityId, images, status, ownerId)
- Breed (species, name, traits, images)
- Service (category, providerId, pricing, area)
- Booking (customerId, listingId|serviceId, status, schedule)
- Lead (state, city, requirement — from the multi-step inquiry form)
- Review (authorId, targetId, rating, body)
- BlogPost (category, slug, body, SEO fields)
- City

## Build phases
- Phase 0: scaffold + SQLite DB + auth + seed data
- Phase 1: public SEO site (listings, breed pages, services, lead form, blog, admin)
- Phase 2: provider signup + dashboard
- Phase 3: bookings + payments + notifications
- Phase 4: scale (managed DB, hosting, CDN, search)

## Conventions
- TypeScript strict mode
- Server Components by default; Client Components only when interactivity requires it
- All public content server-rendered for SEO
- Include seed data so the app runs immediately after setup
