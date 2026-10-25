/**
 * FITVA landing page content — the single source of truth for the marketing page.
 *
 * Every user-facing string, list, price, plan limit, FAQ and testimonial lives here.
 * Components only render what this file provides.
 *
 * ⚠️ Anything marked `placeholder: true` or tagged `PLACEHOLDER` in a comment must be
 *    replaced with real, verified data before launch. See PLACEHOLDERS.md.
 */
import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  CalendarClock,
  Crown,
  DatabaseBackup,
  Dumbbell,
  Building2,
  Camera,
  Mail,
  MessageCircle,
  Play,
  Ruler,
  ScanLine,
  TrendingUp,
  User,
  UserCog,
  Users,
  MessagesSquare,
  UserPlus,
  Activity,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                Shared types                                */
/* -------------------------------------------------------------------------- */

export type NavLink = { label: string; href: string };
export type Tone = "primary" | "accent" | "muted";

/** Section headings: `highlight` must be a substring of `title`; it renders in the brand colour. */
export type SectionCopy = {
  eyebrow: string;
  title: string;
  highlight?: string;
  description?: string;
};

/* -------------------------------------------------------------------------- */
/*                                   Common                                   */
/* -------------------------------------------------------------------------- */

export const commonContent = {
  homeLabel: "FITVA — home",
  themeToggleLabel: "Toggle light and dark theme",
  skipLink: "Skip to content",
  loadingLabel: "Loading",
};

/* -------------------------------------------------------------------------- */
/*                                   Navbar                                   */
/* -------------------------------------------------------------------------- */

export const navContent: {
  ariaLabel: string;
  mobileNavLabel: string;
  links: NavLink[];
  login: NavLink;
  trial: NavLink;
  openMenu: string;
  closeMenu: string;
  menuTitle: string;
  stickyCta: NavLink & { note: string };
} = {
  ariaLabel: "Primary",
  mobileNavLabel: "Mobile",
  links: [
    { label: "Features", href: "/#features" },
    { label: "How it Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
  ],
  login: { label: "Log in", href: "/login" },
  trial: { label: "Start Free Trial", href: "/signup" },
  openMenu: "Open menu",
  closeMenu: "Close menu",
  menuTitle: "Site menu",
  stickyCta: { label: "Start Free Trial", href: "/signup", note: "14 days · no card needed" },
};

/* -------------------------------------------------------------------------- */
/*                                    Hero                                    */
/* -------------------------------------------------------------------------- */

export const heroContent: {
  kinetic: { prefix: string; words: string[]; srText: string };
  headline: { lead: string; punch: string };
  subtext: string;
  primaryCta: NavLink;
  secondaryCta: NavLink;
  trust: string[];
} = {
  kinetic: {
    prefix: "Track",
    words: ["Clients", "Progress", "Revenue"],
    srText: "Track clients, progress and revenue.",
  },
  headline: { lead: "Run your gym.", punch: "Not spreadsheets." },
  subtext:
    "FITVA puts clients, memberships, attendance and progress in one place — so you spend less time chasing renewals and more time coaching.",
  primaryCta: { label: "Start 14-Day Free Trial", href: "/signup" },
  secondaryCta: { label: "Book a Demo", href: "/#demo" },
  trust: ["No credit card required", "Setup in 5 minutes"],
};

/* -------------------------------------------------------------------------- */
/*                        Dashboard mockup (illustration)                     */
/* -------------------------------------------------------------------------- */
/* All names and numbers below are fictional sample data for the illustration. */

export type ClientStatus = "active" | "due" | "expired";

export type DashboardMockupContent = {
  ariaLabel: string;
  windowTitle: string;
  sampleBadge: string;
  gymName: string;
  searchPlaceholder: string;
  nav: string[];
  kpis: { label: string; value: string; trend: string; tone: Tone }[];
  clientsTitle: string;
  clientsAction: string;
  statusLabels: Record<ClientStatus, string>;
  clients: { name: string; plan: string; trainer: string; status: ClientStatus }[];
  attendanceTitle: string;
  attendance: { day: string; value: number }[];
  renewalsTitle: string;
  renewalAction: string;
  renewals: { name: string; detail: string; tone: Tone }[];
  progressTitle: string;
  progressUnit: string;
  progress: number[];
  toast: { title: string; text: string };
  checkIn: { title: string; text: string };
};

export const dashboardMockup: DashboardMockupContent = {
  ariaLabel:
    "Illustration of the FITVA dashboard: member counts, renewal alerts, a client list and a weekly attendance chart, using sample data.",
  windowTitle: "fitva / dashboard",
  sampleBadge: "Sample data",
  gymName: "Demo Gym · Main",
  searchPlaceholder: "Search clients…",
  nav: ["Dashboard", "Clients", "Memberships", "Attendance", "Trainers", "Reports"],
  kpis: [
    { label: "Active members", value: "248", trend: "+8 this week", tone: "primary" },
    { label: "Renewals due", value: "12", trend: "next 7 days", tone: "accent" },
    { label: "Check-ins today", value: "86", trend: "+14% vs avg", tone: "primary" },
    { label: "Revenue (MTD)", value: "₹1.8L", trend: "+11% vs last", tone: "primary" },
  ],
  clientsTitle: "Clients",
  clientsAction: "View all",
  statusLabels: { active: "Active", due: "Due", expired: "Expired" },
  clients: [
    { name: "Aarav Mehta", plan: "Quarterly", trainer: "Coach Neha", status: "active" },
    { name: "Sana Iqbal", plan: "Monthly", trainer: "Coach Vikram", status: "due" },
    { name: "Rohan Das", plan: "Annual", trainer: "Coach Neha", status: "active" },
    { name: "Meera Pillai", plan: "Monthly", trainer: "Coach Arjun", status: "expired" },
    { name: "Kabir Nair", plan: "Half-yearly", trainer: "Coach Vikram", status: "active" },
  ],
  attendanceTitle: "Attendance · this week",
  attendance: [
    { day: "M", value: 52 },
    { day: "T", value: 64 },
    { day: "W", value: 58 },
    { day: "T", value: 72 },
    { day: "F", value: 80 },
    { day: "S", value: 91 },
    { day: "S", value: 46 },
  ],
  renewalsTitle: "Renewal alerts",
  renewalAction: "Remind",
  renewals: [
    { name: "Sana Iqbal", detail: "Monthly · renews in 2 days", tone: "accent" },
    { name: "Ishaan Rao", detail: "Quarterly · renews in 5 days", tone: "primary" },
    { name: "Meera Pillai", detail: "Expired yesterday", tone: "muted" },
  ],
  progressTitle: "Progress · Aarav M.",
  progressUnit: "kg",
  progress: [84.2, 83.1, 82.4, 81.6, 80.9, 80.1],
  toast: { title: "Renewal due", text: "Sana Iqbal · in 2 days" },
  checkIn: { title: "Checked in", text: "Aarav Mehta · 06:28" },
};

/* -------------------------------------------------------------------------- */
/*                                 Stats strip                                */
/* -------------------------------------------------------------------------- */

export type Stat = {
  value: number;
  /** Zero-pad the counter to this many digits (scoreboard style). */
  pad?: number;
  suffix?: string;
  label: string;
  /** true = not a verified figure. Renders a visible footnote marker until replaced. */
  placeholder: boolean;
};

export const statsContent: { srTitle: string; placeholderNote: string; items: Stat[] } = {
  srTitle: "FITVA at a glance",
  placeholderNote: "Target figure — replace with measured data before launch.",
  items: [
    { value: 8, pad: 2, label: "Core modules in one app", placeholder: false },
    { value: 3, pad: 2, label: "Roles: owner, trainer, member", placeholder: false },
    { value: 14, suffix: "-day", label: "Free trial with full access", placeholder: false },
    // PLACEHOLDER: replace with a measured median once real onboarding data exists.
    { value: 5, suffix: " min", label: "Average setup time", placeholder: true },
  ],
};

/* -------------------------------------------------------------------------- */
/*                              Problem → Solution                            */
/* -------------------------------------------------------------------------- */

export type ProblemItem = {
  icon: LucideIcon;
  pain: { title: string; text: string };
  fix: { title: string; text: string };
};

export const problemSolutionContent: SectionCopy & {
  toggleLabel: string;
  toggle: { before: string; after: string };
  live: { before: string; after: string };
  painLabel: string;
  fixLabel: string;
  items: ProblemItem[];
} = {
  eyebrow: "The problem",
  title: "From gym-floor chaos to total control",
  highlight: "total control",
  description:
    "Most gyms still run on registers, spreadsheets and group chats. Here is what that costs you — and how FITVA fixes it.",
  toggleLabel: "Compare your gym before and after FITVA",
  toggle: { before: "Before FITVA", after: "With FITVA" },
  live: {
    before: "Showing common problems before FITVA.",
    after: "Showing how FITVA fixes each problem.",
  },
  painLabel: "Pain",
  fixLabel: "Fix",
  items: [
    {
      icon: CalendarClock,
      pain: {
        title: "Missed renewals",
        text: "Memberships expire silently and members drift away before anyone notices.",
      },
      fix: {
        title: "Renewal radar",
        text: "Alerts days before expiry, plus one-tap reminders so no renewal slips through.",
      },
    },
    {
      icon: DatabaseBackup,
      pain: {
        title: "Lost client data",
        text: "Registers, loose sheets and old phones — client history simply disappears.",
      },
      fix: {
        title: "One secure record",
        text: "Every profile, payment and measurement stored safely in one place, backed up.",
      },
    },
    {
      icon: Activity,
      pain: {
        title: "No progress tracking",
        text: "Clients can’t see their results, so motivation fades and they quit.",
      },
      fix: {
        title: "Visible progress",
        text: "Measurements and charts that show clients exactly how far they’ve come.",
      },
    },
    {
      icon: MessagesSquare,
      pain: {
        title: "Group-chat chaos",
        text: "Plans, payments and schedules buried in endless chat threads and voice notes.",
      },
      fix: {
        title: "One organised hub",
        text: "Plans, dues and schedules live in FITVA — not lost in a chat scroll.",
      },
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*                                Feature bento                               */
/* -------------------------------------------------------------------------- */

export type FeatureSize = "lg" | "wide" | "sm" | "full";
export type FeatureVisualKind =
  | "clients"
  | "renewals"
  | "attendance"
  | "progress"
  | "plans"
  | "trainers"
  | "payments"
  | "reports";

export type Feature = {
  icon: LucideIcon;
  title: string;
  benefit: string;
  size: FeatureSize;
  visual: FeatureVisualKind;
};

/** Order matters: tiles flow into a 4-column bento grid on desktop. */
export const featuresContent: SectionCopy & { items: Feature[] } = {
  eyebrow: "Features",
  title: "Everything your gym runs on",
  highlight: "runs on",
  description: "Eight modules that replace the register, the spreadsheet and the group chat.",
  items: [
    {
      icon: Users,
      title: "Client Management",
      benefit: "Every member’s profile, plan, contacts and history in one searchable place.",
      size: "lg",
      visual: "clients",
    },
    {
      icon: CalendarClock,
      title: "Membership & Renewals",
      benefit: "Automatic renewal alerts so no membership quietly expires.",
      size: "wide",
      visual: "renewals",
    },
    {
      icon: ScanLine,
      title: "Attendance Tracking",
      benefit: "Log check-ins in a tap and spot who’s slipping.",
      size: "sm",
      visual: "attendance",
    },
    {
      icon: Ruler,
      title: "Progress & Body Measurements",
      benefit: "Weight, body-fat and measurements charted over time.",
      size: "sm",
      visual: "progress",
    },
    {
      icon: Dumbbell,
      title: "Workout & Diet Plans",
      benefit: "Build reusable plans once and assign them to any client in seconds.",
      size: "wide",
      visual: "plans",
    },
    {
      icon: UserCog,
      title: "Trainer Management",
      benefit: "Assign clients to trainers and see every roster at a glance.",
      size: "sm",
      visual: "trainers",
    },
    {
      icon: BellRing,
      title: "Payment Reminders",
      benefit: "Friendly, automatic dues reminders — no awkward follow-ups.",
      size: "sm",
      visual: "payments",
    },
    {
      icon: TrendingUp,
      title: "Reports & Analytics",
      benefit:
        "Revenue, renewals, attendance and growth in clear monthly reports you can actually act on.",
      size: "full",
      visual: "reports",
    },
  ],
};

/** Sample data for the decorative micro-visuals inside the bento tiles (fictional). */
export const featureVisuals = {
  renewals: { label: "Quarterly · renews in 3 days", action: "Remind" },
  plans: ["Push · Pull · Legs", "High-protein · 2,200 kcal", "Mobility · 20 min"],
  trainers: ["Neha", "Vikram", "Arjun", "Isha"],
  payments: { amount: "₹1,499 due", status: "Reminder sent" },
  reports: {
    label: "Revenue · last 12 months",
    values: [42, 48, 45, 53, 58, 55, 62, 66, 64, 71, 77, 84],
  },
};

/* -------------------------------------------------------------------------- */
/*                                How it works                                */
/* -------------------------------------------------------------------------- */

export const howItWorksContent: SectionCopy & {
  stepLabel: string;
  steps: { icon: LucideIcon; title: string; text: string }[];
} = {
  eyebrow: "How it works",
  title: "Up and running in three reps",
  highlight: "three reps",
  description: "No hardware, no installation, no training course.",
  stepLabel: "Step",
  steps: [
    {
      icon: Building2,
      title: "Add your gym",
      text: "Create your account, set your membership plans and branch details in minutes.",
    },
    {
      icon: UserPlus,
      title: "Add clients & trainers",
      text: "Import or add members, invite trainers and assign clients to them.",
    },
    {
      icon: TrendingUp,
      title: "Track and grow",
      text: "Follow attendance, renewals and progress — and make decisions with real numbers.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*                                    Roles                                   */
/* -------------------------------------------------------------------------- */

export type RoleId = "owner" | "trainer" | "client";

export type Role = {
  id: RoleId;
  label: string;
  icon: LucideIcon;
  eyebrow: string;
  headline: string;
  text: string;
  bullets: [string, string, string];
};

export const rolesContent: SectionCopy & { tabsLabel: string; swipeHint: string; roles: Role[] } = {
  eyebrow: "Built for every role",
  title: "One app. Three experiences.",
  highlight: "Three experiences.",
  description: "Owners, trainers and members each get a view designed for what they actually do.",
  tabsLabel: "Choose a role",
  swipeHint: "Swipe to switch roles",
  roles: [
    {
      id: "owner",
      label: "Owner",
      icon: Crown,
      eyebrow: "For gym owners",
      headline: "Your whole business, one screen.",
      text: "See the health of your gym the moment you log in.",
      bullets: [
        "Live view of members, renewals and revenue",
        "Control plans, pricing, branches and staff access",
        "Monthly reports you can actually act on",
      ],
    },
    {
      id: "trainer",
      label: "Trainer",
      icon: Dumbbell,
      eyebrow: "For trainers",
      headline: "Every client, every session, sorted.",
      text: "Less admin between sets, more coaching on the floor.",
      bullets: [
        "See assigned clients and today’s sessions",
        "Build and assign workout & diet plans",
        "Log measurements and track client progress",
      ],
    },
    {
      id: "client",
      label: "Member",
      icon: User,
      eyebrow: "For members",
      headline: "Progress they can see.",
      text: "Members who see results stay longer.",
      bullets: [
        "Workout and diet plan always on their phone",
        "Progress charts and measurement history",
        "Membership status and renewal reminders",
      ],
    },
  ],
};

/** Sample data for the per-role mini mockups (fictional). */
export const roleMockups = {
  sampleBadge: "Sample",
  owner: {
    ariaLabel: "Owner view illustration: collections, active members, revenue trend and renewals.",
    title: "Owner overview",
    kpis: [
      { label: "Collections", value: "₹2.4L", trend: "+12% vs last month" },
      { label: "Active members", value: "248", trend: "+8 this week" },
    ],
    revenueLabel: "Revenue · last 6 months",
    revenue: [1.2, 1.5, 1.4, 1.8, 2.0, 2.4],
    listTitle: "Renewals this week",
    list: [
      { name: "Sana Iqbal", detail: "in 2 days" },
      { name: "Ishaan Rao", detail: "in 5 days" },
    ],
  },
  trainer: {
    ariaLabel: "Trainer view illustration: today’s sessions with assigned clients.",
    title: "Today’s sessions",
    summary: "4 sessions · 18 assigned clients",
    doneLabel: "Done",
    upcomingLabel: "Upcoming",
    sessions: [
      { time: "06:30", name: "Aarav Mehta", focus: "Strength · Legs", done: true },
      { time: "08:00", name: "Priya Kulkarni", focus: "Fat loss · HIIT", done: true },
      { time: "17:30", name: "Rohan Das", focus: "Hypertrophy · Push", done: false },
      { time: "19:00", name: "Neel Joshi", focus: "Mobility", done: false },
    ],
  },
  client: {
    ariaLabel: "Member view illustration: attendance ring, weight trend and next workout.",
    title: "My progress",
    ringLabel: "Attendance this month",
    ringValue: 82,
    stats: [
      { label: "Weight", value: "80.1 kg", trend: "−4.1 kg" },
      { label: "Waist", value: "84 cm", trend: "−5 cm" },
    ],
    weight: [84.2, 83.1, 82.4, 81.6, 80.9, 80.1],
    nextLabel: "Next workout",
    next: "Push day · Tomorrow 6:30 AM",
    planLabel: "Diet plan",
    plan: "High-protein · 2,200 kcal",
  },
};

/* -------------------------------------------------------------------------- */
/*                               Product showcase                             */
/* -------------------------------------------------------------------------- */

export type Hotspot = {
  id: "kpis" | "clients" | "attendance" | "renewals" | "progress";
  title: string;
  text: string;
  /** Which side the popover opens towards. */
  align: "left" | "right";
};

export const showcaseContent: SectionCopy & { figureCaption: string; hotspots: Hotspot[] } = {
  eyebrow: "Product tour",
  title: "See it before you sign up",
  highlight: "before you sign up",
  description: "Hover or tap the numbered markers to explore the dashboard.",
  figureCaption: "Interactive preview of the FITVA dashboard with sample data.",
  hotspots: [
    {
      id: "kpis",
      title: "Live KPIs",
      text: "Active members, renewals due, check-ins and revenue update as your day happens.",
      align: "right",
    },
    {
      id: "clients",
      title: "Client list",
      text: "Search, filter and open any profile. Status pills show who’s active, due or expired.",
      align: "right",
    },
    {
      id: "attendance",
      title: "Attendance trend",
      text: "Spot your busiest days and plan trainer shifts around real footfall.",
      align: "right",
    },
    {
      id: "renewals",
      title: "Renewal alerts",
      text: "Upcoming and overdue renewals, each with a one-tap reminder.",
      align: "left",
    },
    {
      id: "progress",
      title: "Progress tracking",
      text: "Body measurements charted over time for every client.",
      align: "right",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*                                   Pricing                                  */
/* -------------------------------------------------------------------------- */

/** Only INR for now. To offer another currency, add its code here plus a price for it in every plan. */
export type CurrencyCode = "INR";
/** `null` = unlimited. */
export type PlanLimits = {
  clients: number | null;
  trainers: number | null;
  branches: number | null;
};

export type Plan = {
  id: "starter" | "pro" | "elite";
  name: string;
  tagline: string;
  /** Price per month, billed monthly (monthly billing only — there are no yearly plans). */
  prices: Record<CurrencyCode, { monthly: number }>;
  limits: PlanLimits;
  features: string[];
  cta: NavLink;
  highlighted: boolean;
};

export type PricingContent = SectionCopy & {
  /** 👉 Switch the displayed currency here. Every plan must define a price for it. */
  currency: CurrencyCode;
  currencyLocales: Record<CurrencyCode, string>;
  perMonth: string;
  billedMonthly: string;
  limitLabels: Record<keyof PlanLimits, string>;
  unlimitedSymbol: string;
  unlimitedLabel: string;
  recommendedBadge: string;
  footnote: string;
  plans: Plan[];
};

// PLACEHOLDER: prices and limits are proposals — confirm with the business before launch.
export const pricingContent: PricingContent = {
  eyebrow: "Pricing",
  title: "Simple plans. Serious gains.",
  highlight: "Serious gains.",
  description: "Every plan starts with a 14-day free trial. Upgrade, downgrade or cancel anytime.",
  currency: "INR",
  currencyLocales: { INR: "en-IN" },
  perMonth: "/ month",
  billedMonthly: "Billed monthly",
  limitLabels: { clients: "Clients", trainers: "Trainers", branches: "Branches" },
  unlimitedSymbol: "∞",
  unlimitedLabel: "Unlimited",
  recommendedBadge: "Recommended",
  footnote: "Prices exclude applicable taxes. All plans include the 14-day free trial.",
  plans: [
    {
      id: "starter",
      name: "Starter",
      tagline: "For new and single-trainer gyms.",
      prices: { INR: { monthly: 4999 } },
      limits: { clients: 150, trainers: 2, branches: 1 },
      features: [
        "Client profiles & memberships",
        "Attendance tracking",
        "Automatic payment reminders",
        "Basic monthly reports",
      ],
      cta: { label: "Start free trial", href: "/signup?plan=starter" },
      highlighted: false,
    },
    {
      id: "pro",
      name: "Pro",
      tagline: "For growing gyms with a coaching team.",
      prices: { INR: { monthly: 6999 } },
      limits: { clients: 600, trainers: 10, branches: 2 },
      features: [
        "Everything in Starter",
        "Workout & diet plans",
        "Progress & body measurements",
        "Trainer management",
        "Advanced reports & exports",
      ],
      cta: { label: "Start free trial", href: "/signup?plan=pro" },
      highlighted: true,
    },
    {
      id: "elite",
      name: "Elite",
      tagline: "For multi-branch gyms and chains.",
      prices: { INR: { monthly: 14999 } },
      limits: { clients: null, trainers: null, branches: 5 },
      features: [
        "Everything in Pro",
        "Multi-branch dashboard",
        "Role-based staff permissions",
        "Assisted data import",
        "Priority support",
      ],
      cta: { label: "Start free trial", href: "/signup?plan=elite" },
      highlighted: false,
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*                                Testimonials                                */
/* -------------------------------------------------------------------------- */

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  gym: string;
  /** true = placeholder slot, shows a visible "Placeholder" badge. */
  placeholder: boolean;
};

export const testimonialsContent: SectionCopy & {
  carouselLabel: string;
  slideLabel: string;
  prevLabel: string;
  nextLabel: string;
  goToLabel: string;
  placeholderBadge: string;
  items: Testimonial[];
} = {
  eyebrow: "Testimonials",
  title: "Words from the gym floor",
  highlight: "gym floor",
  description:
    "We’re onboarding our first gyms. Real stories from real owners, trainers and members will appear here.",
  carouselLabel: "Testimonials",
  slideLabel: "{n} of {total}",
  prevLabel: "Previous testimonial",
  nextLabel: "Next testimonial",
  goToLabel: "Go to testimonial {n}",
  placeholderBadge: "Placeholder",
  // PLACEHOLDER: replace with real, consented testimonials (set placeholder: false).
  items: [
    {
      quote:
        "Testimonial coming soon. This space is reserved for a real story from a FITVA gym owner.",
      name: "Gym owner name",
      role: "Owner",
      gym: "Gym name, City",
      placeholder: true,
    },
    {
      quote:
        "Testimonial coming soon. This space is reserved for a trainer who coaches with FITVA every day.",
      name: "Trainer name",
      role: "Head Coach",
      gym: "Gym name, City",
      placeholder: true,
    },
    {
      quote:
        "Testimonial coming soon. This space is reserved for a member tracking their progress with FITVA.",
      name: "Member name",
      role: "Member",
      gym: "Gym name, City",
      placeholder: true,
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*                                     FAQ                                    */
/* -------------------------------------------------------------------------- */

export type FaqItem = { question: string; answer: string };

// PLACEHOLDER: verify every factual claim (security, payments, support) with the team.
export const faqContent: SectionCopy & { cta: NavLink; items: FaqItem[] } = {
  eyebrow: "FAQ",
  title: "Questions, answered",
  highlight: "answered",
  description: "Still unsure? Book a demo and we’ll walk you through FITVA with your own setup.",
  cta: { label: "Book a demo", href: "/#demo" },
  items: [
    {
      question: "Is my gym’s data secure?",
      answer:
        "Yes. Data is encrypted in transit and at rest, each gym’s data is isolated from every other gym, and access is controlled by role — owners, trainers and members only see what they should. We also run regular automated backups.",
    },
    {
      question: "How does the free trial work?",
      answer:
        "You get full access to every feature for 14 days. No credit card is required to start — pick a plan only if FITVA works for your gym.",
    },
    {
      question: "Can I cancel anytime?",
      answer:
        "Yes. There is no lock-in. You can cancel from your account settings at any time and export your data before you go.",
    },
    {
      question: "Do you support multiple branches?",
      answer:
        "Yes. Higher plans include multiple branches, each with its own members, trainers and reports — all visible from a single owner dashboard. See the plan limits in the pricing table.",
    },
    {
      question: "Can I import my existing client data?",
      answer:
        "Yes. Upload a spreadsheet (CSV or Excel) of your members and map the columns in a few clicks. On the Elite plan, our team helps you with the import.",
    },
    {
      question: "Does FITVA work on mobile?",
      answer:
        "Yes. FITVA is fully responsive and works in any modern browser on phones, tablets and desktops — for owners, trainers and members alike.",
    },
    {
      question: "Which payment methods do you accept?",
      answer:
        "Subscriptions can be paid by UPI, debit or credit card, and net banking. International customers can pay by card.",
    },
    {
      question: "What support do I get?",
      answer:
        "Every plan includes email and chat support, plus help getting set up. Elite plans get priority support and a guided onboarding session.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*                              Final CTA + form                              */
/* -------------------------------------------------------------------------- */

/** Allowed values for "number of members" — also used by the form schema. */
export const memberRanges = ["Under 50", "50–150", "150–300", "300–600", "600+"] as const;

type DemoFieldName = "name" | "gymName" | "phone" | "email" | "city" | "members";

export const finalCtaContent: {
  eyebrow: string;
  headline: { lead: string; punch: string };
  text: string;
  trialCta: NavLink;
  trust: string[];
  form: {
    title: string;
    description: string;
    fields: Record<DemoFieldName, { label: string; placeholder: string }>;
    submit: string;
    submitting: string;
    privacyNote: { before: string; link: NavLink; after: string };
    success: { title: string; text: string };
    errors: Record<DemoFieldName, string>;
    messages: { invalid: string; failed: string };
  };
} = {
  eyebrow: "Ready when you are",
  headline: { lead: "Your gym.", punch: "Levelled up." },
  text: "Start your 14-day free trial today — or tell us about your gym and we’ll walk you through FITVA.",
  trialCta: { label: "Start Free Trial", href: "/signup" },
  trust: ["No credit card required", "Cancel anytime"],
  form: {
    title: "Book a demo",
    description: "Share a few details and we’ll get in touch to schedule a quick walkthrough.",
    fields: {
      name: { label: "Your name", placeholder: "e.g. Priya Sharma" },
      gymName: { label: "Gym name", placeholder: "e.g. Iron Works Fitness" },
      phone: { label: "Phone", placeholder: "+91 98765 43210" },
      email: { label: "Email", placeholder: "you@yourgym.com" },
      city: { label: "City", placeholder: "e.g. Pune" },
      members: { label: "Number of members", placeholder: "Select a range" },
    },
    submit: "Request demo",
    submitting: "Sending…",
    privacyNote: {
      before: "By submitting, you agree to our ",
      link: { label: "Privacy Policy", href: "/privacy" },
      after: ".",
    },
    success: {
      title: "Request received!",
      text: "Thanks — we’ll reach out shortly to schedule your demo.",
    },
    errors: {
      name: "Please enter your name.",
      gymName: "Please enter your gym’s name.",
      phone: "Enter a valid phone number (8–15 digits).",
      email: "Enter a valid email address.",
      city: "Please enter your city.",
      members: "Select how many members you have.",
    },
    messages: {
      invalid: "Please fix the highlighted fields and try again.",
      failed: "Something went wrong. Please try again in a moment.",
    },
  },
};

/* -------------------------------------------------------------------------- */
/*                                   Footer                                   */
/* -------------------------------------------------------------------------- */

export const footerContent: {
  srTitle: string;
  navLabel: string;
  pitch: string;
  columns: { title: string; links: NavLink[] }[];
  socialLabel: string;
  // PLACEHOLDER: replace `href: "#"` with real profiles before launch.
  socials: { label: string; href: string; icon: LucideIcon }[];
  /** `{year}` is replaced with the current year. */
  copyright: string;
  tagline: string;
} = {
  srTitle: "Site footer",
  navLabel: "Footer",
  pitch: "Gym management software for owners who’d rather coach than chase spreadsheets.",
  columns: [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/#features" },
        { label: "How it Works", href: "/#how-it-works" },
        { label: "Pricing", href: "/#pricing" },
        { label: "FAQ", href: "/#faq" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
        { label: "Book a demo", href: "/#demo" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Help Center", href: "/help" },
        { label: "Blog", href: "/blog" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Refund Policy", href: "/refund-policy" },
      ],
    },
  ],
  socialLabel: "Social links",
  socials: [
    { label: "Photos (link coming soon)", href: "#", icon: Camera },
    { label: "Videos (link coming soon)", href: "#", icon: Play },
    { label: "Community (link coming soon)", href: "#", icon: MessageCircle },
    { label: "Email (link coming soon)", href: "#", icon: Mail },
  ],
  copyright: "© {year} FITVA. All rights reserved.",
  tagline: "Built for gyms in India — ready for the world.",
};
