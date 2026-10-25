import { PulseDivider } from "@/components/graphics/pulse-divider";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { ProblemSolution } from "@/components/landing/problem-solution";
import { Roles } from "@/components/landing/roles";
import { Showcase } from "@/components/landing/showcase";
import { Stats } from "@/components/landing/stats";
import { StickyCta } from "@/components/landing/sticky-cta";
import { Testimonials } from "@/components/landing/testimonials";
import { buildJsonLd } from "@/lib/json-ld";

export default function HomePage() {
  const jsonLd = JSON.stringify(buildJsonLd()).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Hero />
      <Stats />
      <ProblemSolution />
      <PulseDivider />
      <Features />
      <HowItWorks />
      <Roles />
      <Showcase />
      <PulseDivider />
      <Pricing />
      <Testimonials />
      <PulseDivider />
      <Faq />
      <FinalCta />
      <StickyCta />
    </>
  );
}
