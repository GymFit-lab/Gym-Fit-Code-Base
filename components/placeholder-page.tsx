import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { placeholderCommon, type PlaceholderPageContent } from "@/content/pages";

export function placeholderMetadata(page: PlaceholderPageContent): Metadata {
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${page.slug}` },
    robots: page.indexable ? undefined : { index: false, follow: true },
  };
}

export function PlaceholderPage({ page }: { page: PlaceholderPageContent }) {
  return (
    <section className="relative overflow-hidden section-y">
      <div aria-hidden="true" className="floor-grid absolute inset-0" />
      <div className="relative container-x max-w-3xl">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1 className="mt-4 font-display text-6xl leading-[0.95] tracking-wide uppercase md:text-8xl">
          {page.title}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{page.body}</p>
        <p className="mt-8 inline-block rounded-full border border-accent/50 px-3 py-1 font-mono text-xs tracking-wider text-accent-ink uppercase">
          {placeholderCommon.notice}
        </p>
        <div className="mt-10">
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <ArrowLeft />
              {placeholderCommon.backLabel}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
