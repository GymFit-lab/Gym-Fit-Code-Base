/**
 * Site-wide configuration: brand, SEO defaults and URLs.
 * Page copy lives in /content — this file is for metadata and infrastructure.
 */
export const siteConfig = {
  name: "FITVA",
  /** Brand tagline from the FITVA logo. */
  tagline: "Fitness for a better you",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://fitva.example.com").replace(/\/$/, ""),
  title: "FITVA — Gym Management Software for Gym Owners",
  shortTitle: "Run your gym. Not spreadsheets.",
  description:
    "FITVA is gym management software for gym owners. Manage clients, memberships & renewals, attendance, progress tracking, trainers, workout & diet plans, payment reminders and reports — in one place.",
  ogAlt: "FITVA — Fitness for a better you. Gym management software for gym owners.",
  locale: "en_IN",
  keywords: [
    "gym management software",
    "gym membership software",
    "gym CRM",
    "gym attendance app",
    "fitness studio software",
    "gym software India",
    "personal trainer software",
  ],
  // PLACEHOLDER: replace with the real support address before launch.
  contactEmail: "hello@fitva.example.com",
  /** Text engraved around the decorative weight-plate graphic. */
  plateLabel: "FITVA · 20 KG · FITNESS FOR A BETTER YOU · 20 KG · ",
  colors: {
    iron: "#0B0B0D",
    chalk: "#F6F5F2",
    lime: "#C6FF3D",
    ember: "#FF5A1F",
    muted: "#8A8A93",
  },
} as const;
