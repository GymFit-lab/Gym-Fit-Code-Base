import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { Button } from "@/components/ui/button";
import { notFoundContent as content, placeholderCommon } from "@/content/pages";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main">
        <section className="section-y">
          <div className="container-x max-w-3xl text-center">
            <p className="eyebrow">{content.eyebrow}</p>
            <h1 className="mt-4 font-display text-7xl tracking-wide uppercase md:text-9xl">
              {content.title}
            </h1>
            <p className="mt-6 text-lg text-muted">{content.body}</p>
            <Button asChild size="lg" className="mt-10">
              <Link href="/">
                <ArrowLeft />
                {placeholderCommon.backLabel}
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
