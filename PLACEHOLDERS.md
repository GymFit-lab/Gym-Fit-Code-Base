# Placeholders to replace before launch

Everything below is a stand-in. Search the repo for `PLACEHOLDER` and `placeholder: true` to find
the exact lines; this list is the human-readable checklist.

## Landing page — `content/landing.ts`

| What                                            | Where                                              | Notes                                                                                                                                  |
| ----------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| "Average setup time: 5 min" stat                | `statsContent.items` (`placeholder: true`)         | Shows a visible `*` footnote until replaced. Use a measured median from real onboarding.                                               |
| All 3 testimonials                              | `testimonialsContent.items` (`placeholder: true`)  | Each shows a "Placeholder" badge. Use real, consented quotes and set `placeholder: false`.                                             |
| Pricing — prices and plan limits                | `pricingContent.plans`                             | Proposals only. Confirm INR/USD prices and client/trainer/branch limits with the business.                                             |
| FAQ answers                                     | `faqContent.items`                                 | Verify every factual claim: encryption & backups, payment methods (UPI/card/net banking), support channels, import help, refund terms. |
| Social links                                    | `footerContent.socials` (`href: "#"`)              | Replace with real profile URLs (and adjust labels/icons).                                                                              |
| Dashboard mockup / role mockups / bento visuals | `dashboardMockup`, `roleMockups`, `featureVisuals` | Fictional sample data, clearly badged "Sample data". Fine to keep — just never present it as real customer data.                       |

## Site config — `lib/site-config.ts`

| What                                          | Notes                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `contactEmail` (`hello@gymfit.example.com`)   | Real support address. Also used in JSON-LD.                                               |
| `url` fallback (`https://gymfit.example.com`) | Set `NEXT_PUBLIC_SITE_URL` in Vercel; it feeds metadata, OG, sitemap, robots and JSON-LD. |

## Placeholder routes — `content/pages.ts`

All have `indexable: false` (excluded from the sitemap) and show a "Placeholder page" notice.
Replace the body with real content, then set `indexable: true`.

- **Legal:** `/privacy`, `/terms`, `/refund-policy` — must be reviewed by a qualified legal professional.
- **Company / resources:** `/about`, `/contact`, `/help`, `/blog`

## Backend stubs

| What                        | Where                                                | Notes                                                                   |
| --------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| Demo-request form           | `app/actions/demo.ts`                                | Validates and `console.info`s only. Wire to email/CRM.                  |
| Sign-up                     | `/signup`                                            | Shows "coming soon" while `AUTH_MODE=demo`.                             |
| Demo login **Admin / 1234** | `lib/demo-auth.ts`, `AUTH_MODE`                      | Temporary. Switch to `AUTH_MODE=better-auth` before launch.             |
| Dashboard data              | `lib/dashboard/mock-data.ts`, `lib/gym/mock-data.ts` | Dummy data until the API exists — see `CLAUDE.md` for how to retire it. |
| FITVA demo gym + logins     | `database/04_seed/01_demo_gym.sql`                   | Fake gym, staff (`*@fitvademo.in`) and clients. Never seed production.  |
