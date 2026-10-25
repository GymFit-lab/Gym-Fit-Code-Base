# FITVA — marketing site

Landing page and pre-launch app shell for **FITVA**, gym management software for gym owners
(clients, memberships & renewals, attendance, progress, trainers, plans, reminders, reports).

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui (Radix) ·
Framer Motion · next-themes · React Hook Form + Zod · pnpm · Vercel.

## Setup

```bash
pnpm install
cp .env.example .env.local   # then fill in values
pnpm dev                     # http://localhost:3000
```

Only `NEXT_PUBLIC_SITE_URL` matters for the landing page (metadata, OG image, sitemap, robots,
JSON-LD). The database and auth variables are for `/login`, `/signup` and `/dashboard` — see
comments in `.env.example`. By default `AUTH_MODE=demo` (login **Admin / 1234**, no database).

> Use pnpm, not `npm install` (it fails against the pnpm-managed `node_modules`).

## Scripts

| Script                                      | What it does                                                 |
| ------------------------------------------- | ------------------------------------------------------------ |
| `pnpm dev`                                  | Dev server (Turbopack)                                       |
| `pnpm build` / `pnpm start`                 | Production build / serve it                                  |
| `pnpm lint`                                 | ESLint (`next/core-web-vitals`, `next/typescript`, Prettier) |
| `pnpm typecheck`                            | `tsc --noEmit`                                               |
| `pnpm format` / `pnpm format:check`         | Prettier (with Tailwind class sorting)                       |
| `pnpm db:migrate` / `db:push` / `db:studio` | Prisma (only needed for real auth)                           |

`pnpm build` needs network access to Google Fonts (`next/font` downloads and self-hosts them).

## Project structure

```
app/
  (marketing)/        page.tsx (home), layout.tsx (navbar + footer), login, signup, legal & company pages
  (app)/dashboard/    signed-in app (mock data for now)
  actions/demo.ts     Server Action for the "Book a demo" form
  opengraph-image.tsx, sitemap.ts, robots.ts, icon.svg
components/
  landing/            one component per page section (hero, stats, features, pricing, …)
  graphics/           PlateRings, PlateMark, EcgLine, PulseDivider, ChalkGrain, DashboardMockup, PlateLoader
  ui/                 shadcn/ui primitives
content/
  landing.ts          ALL landing-page copy, pricing, plan limits, FAQ, testimonials, stats
  pages.ts            copy for placeholder routes (privacy, terms, …)
lib/                  site-config, utils, formatters, JSON-LD, Zod schemas
```

## Editing content

Components only render; **every string, price and list lives in `content/landing.ts`**.

- **Copy / features / FAQ / testimonials / stats:** edit the matching export
  (`heroContent`, `featuresContent`, `faqContent`, `testimonialsContent`, `statsContent`, …).
  In section headings, `highlight` must be a substring of `title` (it renders in lime).
- **Prices:** `pricingContent.plans[].prices` — `monthly` is the per-month price,
  `yearly` is the total billed once a year. Yearly savings % are calculated automatically.
- **Plan limits:** `pricingContent.plans[].limits` (`clients`, `trainers`, `branches`;
  `null` = unlimited).
- **Currency:** set `pricingContent.currency` (`"INR"` or `"USD"`). To add one, extend
  `CurrencyCode`, add a locale to `currencyLocales` and a price for every plan.
- **Highlighted plan:** `highlighted: true` on one plan.
- **Placeholders:** anything with `placeholder: true` shows a visible badge/footnote.
  See [`PLACEHOLDERS.md`](PLACEHOLDERS.md) for the full pre-launch checklist.

Brand name, SEO title/description, contact email and raw colours (for the OG image) are in
`lib/site-config.ts`.

## Changing theme colours

All colours are CSS variables at the top of `app/globals.css`:

- `:root, .dark` — dark theme (default); `.light` — light theme (applied by next-themes).
- Components use tokens only (`bg-bg`, `bg-surface`, `text-fg`, `text-muted`, `bg-primary`,
  `text-primary-ink`, `bg-accent`, `text-accent-ink`, …).
- **Contrast rule:** `--primary` (lime) and `--accent` (ember) are _fill_ colours. Coloured text
  uses `--primary-ink` / `--accent-ink`, which are darker in the light theme
  (`#4D7A00` / `#C2410C`) to pass WCAG AA. Text on lime/ember fills uses the fixed `iron` ink.
- Also update `siteConfig.colors` in `lib/site-config.ts` so the OG image matches.

## Design notes ("Iron & Pulse")

- **Heartbeat line** (`EcgLine`, path in `lib/ecg.ts`) draws in under the hero, forms the
  How-it-Works timeline and runs faintly across section seams (`PulseDivider`).
- **Weight plates** (`PlateRings`) rotate with page scroll via CSS scroll-driven animation
  (no JS); `PlateMark` is the logo mark, list bullet and timeline node; `PlateLoader` is the
  loading state.
- **Rep counters**, the **kinetic headline** and **magnetic CTAs** use Framer Motion and switch
  off under `prefers-reduced-motion`. All motion is decorative: the page is fully readable with
  JavaScript disabled (scroll reveals only hide content once JS has loaded).
- **Power-cut dividers** are `clip-path` diagonals (`.cut-bg`); **chalk grain** is an SVG noise
  overlay (`ChalkGrain`).

## Deploying

Deploy to Vercel with `NEXT_PUBLIC_SITE_URL` set. The home page and info pages are statically
prerendered; `/login`, `/signup` and `/dashboard` are dynamic.

## Licenses

Fonts and libraries are listed with their licenses in [`public/CREDITS.md`](public/CREDITS.md).
All graphics are original and built in code.
