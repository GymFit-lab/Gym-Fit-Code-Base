# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GymFit marketing/landing site (package `gymfit-landing`): Next.js 15 App Router, React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui ("new-york" style, Radix primitives), framer-motion, next-themes, React Hook Form + Zod. Use **pnpm** (lockfile is `pnpm-lock.yaml`; native-build approvals live in `pnpm-workspace.yaml` under `allowBuilds`). Don't use `npm install` — it fails with ERESOLVE against the pnpm-managed `node_modules`.

**Routing:** `app/layout.tsx` wraps every page with fonts, `ThemeProvider`, `Navbar`, `Footer` and `RevealObserver`. The home page is `app/(marketing)/page.tsx`, composed of section components in `components/landing/` (nav links like `/#pricing` are in-page anchors, not routes). `login`, `signup`, legal and company routes are thin wrappers around `components/placeholder-page.tsx` fed by `content/pages.ts`. `PLACEHOLDERS.md` is referenced by `content/landing.ts` but does not exist. There is no test setup.

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

Env: copy `.env.example` → `.env.local`; `NEXT_PUBLIC_SITE_URL` feeds metadata, sitemap, robots and JSON-LD (`lib/site-config.ts`).

## Architecture

- **Content is data, components only render.** `content/landing.ts` is the single source of truth for every user-facing string, price, plan limit, FAQ and testimonial on the landing page (with exported types per section, e.g. `SectionCopy`, `Plan`, `Feature`). `content/pages.ts` holds copy for placeholder routes (auth, legal, company); each has `indexable: false` until real content replaces it. Don't hard-code copy in components — add it to these files.
  - `SectionCopy.highlight` must be a substring of `title` (rendered in brand colour).
  - Templates use `{key}` tokens filled via `fill()` in `lib/utils.ts`.
  - Anything marked `placeholder: true` or `// PLACEHOLDER` must be replaced with real data before launch.
- **`lib/site-config.ts`** — brand, SEO defaults, site URL, contact email, raw brand colours (for non-CSS contexts like OG images). Not for page copy.
- **Derived logic lives in `lib/`, built from content:** `json-ld.ts` (Organization + SoftwareApplication + FAQPage graph from `pricingContent`/`faqContent`), `format.ts` (`formatMoney` per `pricingContent.currency`/`currencyLocales`, yearly-saving %), `ecg.ts` (heartbeat SVG path shared by the on-page SVG and the OG image).
- **Demo form:** `lib/schemas/demo-form.ts` is the one Zod schema shared by the client form (React Hook Form) and the Server Action `submitDemoRequest` in `app/actions/demo.ts` (currently only logs — no CRM/email backend yet); error messages come from `finalCtaContent.form.errors`, member options from `memberRanges`. `DemoFormState` is the action's return shape.
- **Styling ("Iron & Pulse" design system) — `app/globals.css`:** theme colours are CSS variables; dark is the default (`:root`/`.dark`), `.light` is applied by next-themes. Components reference only tokens (`bg-bg`, `text-fg`, `bg-surface`, `bg-primary`, `text-primary-ink`, `text-accent-ink`, …). Contrast rule: `--primary` (lime) and `--accent` (ember) are **fill** colours; use `text-primary-ink` / `text-accent-ink` for coloured text. `iron`/`chalk` are fixed inks for text on lime/ember fills. Custom breakpoints: `xs` 360, `md` 768, `lg` 1024, `xl` 1440. Fonts come from CSS vars `--font-bebas` (display), `--font-manrope` (sans), `--font-jetbrains` (mono), expected to be set via `next/font` in the root layout.
- **Utilities (`lib/utils.ts`):** `cn` (clsx + tailwind-merge), `cssVars` for typed CSS custom properties, `revealDelay` for staggering `data-reveal` scroll animations, `svgId` to make `useId()` safe for SVG ids.
- **UI primitives:** `components/ui/` are shadcn/ui components; add more with the shadcn CLI (`components.json` aliases: `@/components`, `@/components/ui`, `@/lib`, `@/hooks`). Import alias `@/*` maps to the repo root.
- `next.config.ts` sets security headers on all routes and disables `x-powered-by`.

## Conventions

Prettier: double quotes, semicolons, trailing commas, print width 100; Tailwind classes are auto-sorted (also inside `cn()` / `cva()`). Target locale is `en_IN`, default currency INR.
