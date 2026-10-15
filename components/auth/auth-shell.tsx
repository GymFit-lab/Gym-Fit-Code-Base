import Link from "next/link";
import { Check } from "lucide-react";

import { EcgLine } from "@/components/graphics/ecg-line";
import { authContent, type AuthPageCopy } from "@/content/auth";

/**
 * Two-column auth layout: brand panel (desktop only) + form card.
 * Server component — the interactive form is passed in as `children`.
 */
export function AuthShell({
  copy,
  notice,
  children,
}: {
  copy: AuthPageCopy;
  /** Optional line shown above the form (e.g. the selected plan or an OAuth error). */
  notice?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { panel } = authContent;

  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
      <div aria-hidden="true" className="floor-grid absolute inset-0" />
      <div aria-hidden="true" className="hero-aura absolute inset-0" />

      <div className="relative container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="hidden lg:block">
          <p className="eyebrow">{panel.eyebrow}</p>
          <p className="mt-4 font-display text-7xl leading-[0.9] tracking-wide uppercase xl:text-8xl">
            {panel.headline.lead}
            <br />
            <span className="text-primary-ink">{panel.headline.punch}</span>
          </p>
          <EcgLine beats={3} className="mt-8 h-14 max-w-md" />
          <ul className="mt-8 space-y-4">
            {panel.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-lg text-muted">
                <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-primary text-iron">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl sm:p-8 lg:mr-0">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="mt-3 font-display text-5xl leading-none tracking-wide uppercase sm:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-3 text-muted">{copy.description}</p>

          {notice && <div className="mt-5">{notice}</div>}

          <div className="mt-6">{children}</div>

          <p className="mt-8 text-center text-sm text-muted">
            {copy.switchPrompt}{" "}
            <Link
              href={copy.switchLink.href}
              className="font-semibold text-primary-ink underline-offset-4 hover:underline"
            >
              {copy.switchLink.label}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Small pill/banner used for the `notice` slot. */
export function AuthNotice({
  tone = "info",
  children,
}: {
  tone?: "info" | "error";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : undefined}
      className={
        tone === "error"
          ? "rounded-xl border border-accent/50 bg-accent/10 px-4 py-3 text-sm text-accent-ink"
          : "inline-flex rounded-full border border-primary-ink/40 bg-primary/10 px-3 py-1 font-mono text-xs tracking-wider text-primary-ink uppercase"
      }
    >
      {children}
    </p>
  );
}
