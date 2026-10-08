import { faqContent, pricingContent } from "@/content/landing";
import { siteConfig } from "@/lib/site-config";

/** Organization + SoftwareApplication + FAQPage structured data, built from content. */
export function buildJsonLd() {
  const { url, name, description, contactEmail } = siteConfig;
  const monthlyPrices = pricingContent.plans.map(
    (plan) => plan.prices[pricingContent.currency].monthly,
  );

  const organization = {
    "@type": "Organization",
    "@id": `${url}/#organization`,
    name,
    url,
    logo: `${url}/icon.svg`,
    email: contactEmail,
  };

  const softwareApplication = {
    "@type": "SoftwareApplication",
    "@id": `${url}/#software`,
    name,
    description,
    url,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    publisher: { "@id": `${url}/#organization` },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: pricingContent.currency,
      lowPrice: Math.min(...monthlyPrices),
      highPrice: Math.max(...monthlyPrices),
      offerCount: pricingContent.plans.length,
    },
  };

  const faqPage = {
    "@type": "FAQPage",
    "@id": `${url}/#faq`,
    mainEntity: faqContent.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, softwareApplication, faqPage],
  };
}
