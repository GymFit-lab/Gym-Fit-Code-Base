# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GymFit marketing/landing site (package `gymfit-landing`): Next.js 15 App Router, React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui ("new-york" style, Radix primitives), framer-motion, next-themes, React Hook Form + Zod. Use **pnpm** (lockfile is `pnpm-lock.yaml`; native-build approvals live in `pnpm-workspace.yaml` under `allowBuilds`). Don't use `npm install` — it fails with ERESOLVE against the pnpm-managed `node_modules`.

**Routing:** `app/layout.tsx` sets fonts, `ThemeProvider` and `RevealObserver`. Two route groups: `app/(marketing)/` (layout adds `Navbar` + `Footer` + `<main>`) holds the home page, auth and info pages; `app/(app)/` (layout requires a session via `getCurrentUser()` and renders `components/dashboard/app-shell.tsx`) holds `/dashboard`. `app/not-found.tsx` renders the navbar/footer itself. The home page is `app/(marketing)/page.tsx`, composed of section components in `components/landing/` (nav links like `/#pricing` are in-page anchors, not routes). Legal and company routes are thin wrappers around `components/placeholder-page.tsx` fed by `content/pages.ts`. `/login`, `/signup` and `/dashboard` are covered under Auth and Dashboard below. `PLACEHOLDERS.md` is referenced by `content/landing.ts` but does not exist. There is no test setup.

## Commands

```bash
pnpm install
pnpm dev            # next dev --turbopack
pnpm build
pnpm lint           # eslint . (next/core-web-vitals + next/typescript + prettier)
pnpm typecheck      # tsc --noEmit
pnpm format         # prettier --write . (with prettier-plugin-tailwindcss)
pnpm format:check
```

Env: copy `.env.example` → `.env.local`; `NEXT_PUBLIC_SITE_URL` feeds metadata, sitemap, robots and JSON-LD (`lib/site-config.ts`). Auth needs `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and optionally `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`.

Note: on this machine pnpm 12 is blocked by Device Guard; installs were done with `npx pnpm@10` (`onlyBuiltDependencies` in `pnpm-workspace.yaml` mirrors `allowBuilds` for pnpm 10). Dev server: `node node_modules/next/dist/bin/next dev --turbopack`.

Database: `pnpm db:migrate` (prisma migrate dev), `pnpm db:push`, `pnpm db:studio`. `postinstall` runs `prisma generate`.

## Architecture

- **Content is data, components only render.** `content/landing.ts` is the single source of truth for every user-facing string, price, plan limit, FAQ and testimonial on the landing page (with exported types per section, e.g. `SectionCopy`, `Plan`, `Feature`). `content/pages.ts` holds copy for placeholder routes (legal, company); each has `indexable: false` until real content replaces it. Don't hard-code copy in components — add it to these files.
  - `SectionCopy.highlight` must be a substring of `title` (rendered in brand colour).
  - Templates use `{key}` tokens filled via `fill()` in `lib/utils.ts`.
  - Anything marked `placeholder: true` or `// PLACEHOLDER` must be replaced with real data before launch.
- **`lib/site-config.ts`** — brand, SEO defaults, site URL, contact email, raw brand colours (for non-CSS contexts like OG images). Not for page copy.
- **Derived logic lives in `lib/`, built from content:** `json-ld.ts` (Organization + SoftwareApplication + FAQPage graph from `pricingContent`/`faqContent`), `format.ts` (`formatMoney` per `pricingContent.currency`/`currencyLocales`, yearly-saving %), `ecg.ts` (heartbeat SVG path shared by the on-page SVG and the OG image).
- **Demo form:** `lib/schemas/demo-form.ts` is the one Zod schema shared by the client form (React Hook Form) and the Server Action `submitDemoRequest` in `app/actions/demo.ts` (currently only logs — no CRM/email backend yet); error messages come from `finalCtaContent.form.errors`, member options from `memberRanges`. `DemoFormState` is the action's return shape.
- **Styling ("Iron & Pulse" design system) — `app/globals.css`:** theme colours are CSS variables; dark is the default (`:root`/`.dark`), `.light` is applied by next-themes. Components reference only tokens (`bg-bg`, `text-fg`, `bg-surface`, `bg-primary`, `text-primary-ink`, `text-accent-ink`, …). Contrast rule: `--primary` (lime) and `--accent` (ember) are **fill** colours; use `text-primary-ink` / `text-accent-ink` for coloured text. `iron`/`chalk` are fixed inks for text on lime/ember fills. Custom breakpoints: `xs` 360, `md` 768, `lg` 1024, `xl` 1440. Fonts come from CSS vars `--font-bebas` (display), `--font-manrope` (sans), `--font-jetbrains` (mono), expected to be set via `next/font` in the root layout.
- **Utilities (`lib/utils.ts`):** `cn` (clsx + tailwind-merge), `cssVars` for typed CSS custom properties, `revealDelay` for staggering `data-reveal` scroll animations, `svgId` to make `useId()` safe for SVG ids.
- **UI primitives:** `components/ui/` are shadcn/ui components; add more with the shadcn CLI (`components.json` aliases: `@/components`, `@/components/ui`, `@/lib`, `@/hooks`). Import alias `@/*` maps to the repo root.
- **Auth:** Better Auth (`lib/auth.ts` server instance, `lib/auth-client.ts` browser client, handler at `app/api/auth/[...all]/route.ts`) with email + password and Google OAuth. Google is enabled only when both Google env vars are set (`isGoogleAuthEnabled`), otherwise the button is hidden. Sessions are stored in Postgres via Prisma 7 (`prisma/schema.prisma`; `prisma-client` generator outputs to `lib/generated/prisma` (gitignored); `lib/db.ts` uses the `@prisma/adapter-pg` driver adapter; `prisma.config.ts` loads `.env.local`). Server pages check the session with `auth.api.getSession({ headers: await headers() })`. Copy is in `content/auth.ts`, Zod schemas in `lib/schemas/auth.ts` (password limits must match `lib/auth.ts`). Forms live in `components/auth/`.
- **Demo auth (TEMPORARY):** `AUTH_MODE` env (`lib/auth-mode.ts`) defaults to `"demo"` = hard-coded login **Admin / 1234** (`lib/demo-auth.ts`: HMAC-signed httpOnly cookie, secret = `BETTER_AUTH_SECRET` or a dev fallback), server actions in `app/actions/demo-auth.ts`, form `components/auth/demo-login-form.tsx`; sign-up shows a "coming soon" notice. `AUTH_MODE=better-auth` switches to real accounts. Always read the user via `getCurrentUser()` (`lib/session.ts`), never Better Auth / demo auth directly.
- **Dashboard data (mock until the API exists):** UI calls only `getDashboardData()` (`lib/dashboard/get-dashboard-data.ts`), typed by `DashboardData` in `lib/dashboard/types.ts` (the API contract). `DASHBOARD_DATA_SOURCE` env: `"mock"` (default, dynamic-imports `lib/dashboard/mock-data.ts`) or `"api"` (GET `{API_BASE_URL}/dashboard`). Never import mock data from components. To retire mocks: delete `mock-data.ts`, the mock branch and `DemoDataBanner`. Dashboard copy: `content/dashboard.ts`; formatting (en-IN, Asia/Kolkata): `lib/dashboard/format.ts`; components in `components/dashboard/` (charts are client components with hover/keyboard tooltips + sr-only tables).
- `next.config.ts` sets security headers on all routes and disables `x-powered-by`.

## Conventions

Prettier: double quotes, semicolons, trailing commas, print width 100; Tailwind classes are auto-sorted (also inside `cn()` / `cva()`). Target locale is `en_IN`, default currency INR.
