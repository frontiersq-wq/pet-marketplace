# Pet Marketplace

A two-sided pet marketplace and services platform. See [CLAUDE.md](./CLAUDE.md) for the
full project brief and phase plan.

**Status: Phase 1, Chunk 1 complete** — site shell (header/footer) and homepage.
Remaining Phase 1 chunks — listings, breed pages, services, lead form, blog, admin —
are not built yet.

## Stack

| Concern  | Choice |
|----------|--------|
| Framework | Next.js 16 (App Router, Turbopack) + TypeScript strict |
| Styling   | Tailwind CSS v4 |
| Database  | SQLite via Prisma 7 (Postgres in Phase 4) |
| Auth      | Auth.js v5 (credentials, bcrypt) with CUSTOMER / PROVIDER / ADMIN roles |

## Requirements

- Node.js 20.9+ (built and tested on 24.15)
- No database server to install — SQLite is a file at `prisma/dev.db`

## Getting started

```bash
npm install
cp .env.example .env     # then set AUTH_SECRET (see below)
npm run setup            # migrate + generate client + seed
npm run dev
```

Open <http://localhost:3000>.

Generate a value for `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Seeded sign-in accounts

All three share the password `password123` (development only).

| Email                  | Role     |
|------------------------|----------|
| `customer@example.com` | CUSTOMER |
| `provider@example.com` | PROVIDER |
| `admin@example.com`    | ADMIN    |

There is no sign-in **page** yet — `pages.signIn` points at `/login`, which Phase 1
builds. Until then the Auth.js API routes work directly at `/api/auth/*`.

## Scripts

| Command | Does |
|---------|------|
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create and apply a migration after a schema edit |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:seed` | Re-run the seed (idempotent — upserts, never duplicates) |
| `npm run db:studio` | Browse the database in Prisma Studio |
| `npm run db:reset` | Drop, re-migrate and re-seed (destructive — see note below) |

## Layout

```
prisma/
  schema.prisma          data model (10 models + enums)
  seed.ts                cities, breeds, listings, one user per role
  migrations/            committed migration history
  dev.db                 SQLite file (gitignored)
src/
  app/
    page.tsx             Phase 0 placeholder homepage
    layout.tsx           root layout + site metadata
    api/auth/[...nextauth]/route.ts
  lib/
    prisma.ts            Prisma client singleton + SQLite driver adapter
    auth.ts              Auth.js config, credentials provider, role helpers
    json-fields.ts       encode/decode for JSON-text columns
  types/next-auth.d.ts   adds `role` to Session and JWT
  generated/prisma/      generated client (gitignored)
prisma7.config.ts        Prisma 7 config — holds the datasource URL
```

## UI conventions

Established in Phase 1 Chunk 1. Later chunks should follow these so the site stays
consistent.

| Concern | Convention |
|---|---|
| Colors | `brand-*` (teal) for structure, links and primary buttons. `accent-*` (amber) **only** for the single highest-intent action on a screen — currently "Enquire". Everything else is `neutral-*`. Defined in `src/app/globals.css` under `@theme`. |
| Width | Wrap every section's contents in `<Container>` (`max-w-6xl` + responsive padding). Never set page padding ad hoc. |
| Section rhythm | `py-16 sm:py-20`. Alternate plain white and `bg-neutral-50` bands to separate sections. |
| Cards | `rounded-xl border border-neutral-200 bg-white`, `hover:shadow-md`. |
| Buttons | Use `ButtonLink` or `buttonClass()` from `src/components/ui/button.tsx`. Variants: `primary`, `accent`, `outline`, `ghost`. Don't hand-roll button classes. |
| Headings | Page `h1` is `text-4xl sm:text-5xl font-bold`; section `h2` is `text-2xl sm:text-3xl font-bold`. |
| Focus | Handled globally in `globals.css`. Don't add per-component focus rings. |
| Icons | Inline SVG, no icon dependency. |
| Server/Client | Server Components by default. `"use client"` only for genuine interactivity — right now `mobile-nav.tsx` is the only one. |

Shared building blocks already available: `Container`, `ButtonLink`/`buttonClass`,
`ListingCard`, plus `src/lib/site.ts` (nav, brand, contact), `src/lib/format.ts`
(prices, ages, enum labels) and `src/lib/service-categories.ts`.

Styling is **light-mode only** for now — a half-finished dark mode spread across six
chunks is worse than none. Revisit once the public pages exist.

## Things worth knowing

**Prisma 7 is not Prisma 6.** The datasource URL lives in `prisma7.config.ts`, not in
`schema.prisma`. The generator is `prisma-client` (not `prisma-client-js`) and emits
TypeScript to `src/generated/prisma`, so `npm run db:generate` must run after any
schema change and after a fresh clone. SQL access requires a **driver adapter** —
here `@prisma/adapter-better-sqlite3`, wired up in `src/lib/prisma.ts`.

**SQLite shapes the schema.** Enums, `Json` and `Decimal` all work. Scalar lists
(`String[]`) do not, so `images`, `areas`, `coverage`, `tags` and `traits` are TEXT
columns holding JSON, read and written through `src/lib/json-fields.ts`. They are
typed `String` rather than `Json` because Prisma emits an unquoted `DEFAULT {}` for
Json defaults on SQLite, which SQLite rejects. Phase 4 converts them to native
Postgres types — `json-fields.ts` is the only place that has to change.

**Sessions are JWT, not database.** Auth.js cannot issue a database session for the
credentials provider. The `Session` table exists for the OAuth providers Phase 2 adds.

**The homepage is statically prerendered.** Its counts are captured at build time, so
they can go stale after a reseed. Phase 1 replaces it with properly rendered pages.

**`db:reset` is the one script not exercised.** Prisma 7 refuses `migrate reset` when
it detects an AI agent invoked it, and it is destructive, so it was left unrun. Every
other script here has been executed. Run it yourself when you first need it.

**Prisma installed agent skills.** `npx prisma init` added `.agents/skills/` (with
`.claude/skills/` symlinked to it) and `skills-lock.json`. They are reference docs for
coding agents, not application code. Remove with:
`rm -rf .agents .claude/skills skills-lock.json`
