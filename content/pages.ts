/**
 * Copy for placeholder routes (auth modules, legal and company pages).
 * Every page here is a PLACEHOLDER and is excluded from search indexing until
 * `indexable` is set to true and real content replaces the body.
 */

export type PlaceholderPageContent = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  body: string;
  indexable: boolean;
};

export const placeholderCommon = {
  notice: "Placeholder page — replace before launch",
  backLabel: "Back to home",
};

const page = (p: PlaceholderPageContent) => p;

export const placeholderPages = {
  login: page({
    slug: "login",
    eyebrow: "Module 2 · Auth",
    title: "Log in",
    description: "Log in to your GymFit account.",
    body: "The GymFit login experience is built as a separate module. This route exists so every link on the landing page works today.",
    indexable: false,
  }),
  signup: page({
    slug: "signup",
    eyebrow: "Module 2 · Auth",
    title: "Start your free trial",
    description: "Create your GymFit account and start a 14-day free trial.",
    body: "Sign-up is built as a separate module. Your selected plan (if any) is passed in the URL as ?plan=… for that module to pick up.",
    indexable: false,
  }),
  privacy: page({
    slug: "privacy",
    eyebrow: "Legal",
    title: "Privacy Policy",
    description: "How GymFit collects, uses and protects your data.",
    body: "Our full privacy policy will be published here before launch. It must be reviewed by a qualified legal professional.",
    indexable: false,
  }),
  terms: page({
    slug: "terms",
    eyebrow: "Legal",
    title: "Terms of Service",
    description: "The terms that govern your use of GymFit.",
    body: "Our full terms of service will be published here before launch. They must be reviewed by a qualified legal professional.",
    indexable: false,
  }),
  refundPolicy: page({
    slug: "refund-policy",
    eyebrow: "Legal",
    title: "Refund Policy",
    description: "How refunds and cancellations work at GymFit.",
    body: "Our refund and cancellation policy will be published here before launch.",
    indexable: false,
  }),
  about: page({
    slug: "about",
    eyebrow: "Company",
    title: "About GymFit",
    description: "The team and story behind GymFit.",
    body: "Our story is coming soon. GymFit is built for gym owners who want to coach more and chase spreadsheets less.",
    indexable: false,
  }),
  contact: page({
    slug: "contact",
    eyebrow: "Company",
    title: "Contact us",
    description: "Get in touch with the GymFit team.",
    body: "Contact details are coming soon. In the meantime, use the demo form on the home page and we’ll get back to you.",
    indexable: false,
  }),
  help: page({
    slug: "help",
    eyebrow: "Resources",
    title: "Help Center",
    description: "Guides and answers for GymFit owners, trainers and members.",
    body: "Step-by-step guides are on their way.",
    indexable: false,
  }),
  blog: page({
    slug: "blog",
    eyebrow: "Resources",
    title: "Blog",
    description: "Ideas for running and growing a better gym.",
    body: "Articles on retention, pricing and gym operations are coming soon.",
    indexable: false,
  }),
} satisfies Record<string, PlaceholderPageContent>;

export const notFoundContent = {
  eyebrow: "Error 404",
  title: "Missed that rep",
  body: "The page you’re looking for doesn’t exist or has moved.",
};
