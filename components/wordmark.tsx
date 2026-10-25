import Link from "next/link";

import { commonContent } from "@/content/landing";
import { cn } from "@/lib/utils";

/** Logo files in public/brand/ (from the FITVA logo pack; 452 × 140 viewBox). */
const LOGO = {
  light: "/brand/fitva-logo-light.svg",
  dark: "/brand/fitva-logo-dark.svg",
  lightTagline: "/brand/fitva-logo-light-tagline.svg",
  darkTagline: "/brand/fitva-logo-dark-tagline.svg",
} as const;
const LOGO_WIDTH = 452;
const LOGO_HEIGHT = 140;

/**
 * The FITVA logo, linking home. Set its size with a height class (default `h-11`); the width
 * follows. Light/dark versions swap with the theme class in CSS, so there is no flash.
 * `withTagline` adds "Fitness for a better you" — use it only where the logo is large.
 */
export function Wordmark({
  className,
  withTagline = false,
}: {
  className?: string;
  withTagline?: boolean;
}) {
  const light = withTagline ? LOGO.lightTagline : LOGO.light;
  const dark = withTagline ? LOGO.darkTagline : LOGO.dark;

  return (
    <Link
      href="/"
      aria-label={commonContent.homeLabel}
      className={cn("inline-flex h-11 shrink-0 items-center", className)}
    >
      {/* Plain <img>: SVGs gain nothing from next/image optimisation. The link carries the label. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={light}
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className="h-full w-auto dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dark}
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className="hidden h-full w-auto dark:block"
      />
    </Link>
  );
}
