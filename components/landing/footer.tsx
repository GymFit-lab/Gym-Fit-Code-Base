import Link from "next/link";

import { Wordmark } from "@/components/wordmark";
import { footerContent as content } from "@/content/landing";
import { fill } from "@/lib/utils";

export function Footer() {
  return (
    <footer aria-labelledby="footer-title" className="border-t border-border bg-surface">
      <h2 id="footer-title" className="sr-only">
        {content.srTitle}
      </h2>
      <div className="container-x grid gap-12 py-16 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <Wordmark className="text-4xl" />
          <p className="mt-4 max-w-sm text-muted">{content.pitch}</p>
          <ul aria-label={content.socialLabel} className="mt-6 flex gap-2">
            {content.socials.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  className="grid size-11 place-items-center rounded-full border border-border-strong text-muted transition-colors hover:border-primary-ink hover:text-primary-ink"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label={content.navLabel} className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {content.columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-mono text-xs font-semibold tracking-widest text-muted uppercase">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:text-primary-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="container-x flex flex-col gap-2 py-6 text-sm text-muted md:flex-row md:justify-between">
          <p>{fill(content.copyright, { year: new Date().getFullYear() })}</p>
          <p>{content.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
