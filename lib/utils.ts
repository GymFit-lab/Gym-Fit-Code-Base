import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CSSProperties } from "react";

/** Merge Tailwind class names, resolving conflicts (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Type-safe helper for inline CSS custom properties, e.g. `style={cssVars({ "--d": "90ms" })}`. */
export function cssVars(vars: Record<`--${string}`, string | number>): CSSProperties {
  return vars as CSSProperties;
}

/** Stagger delay for elements using the `data-reveal` scroll animation. */
export function revealDelay(index: number, stepMs = 80): CSSProperties {
  return cssVars({ "--reveal-delay": `${index * stepMs}ms` });
}

/** "Aarav Mehta" → "AM" */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** Replace `{key}` tokens in a content template: fill("Save {percent}%", { percent: 20 }). */
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** Make a React `useId()` value safe for SVG `id` / `url(#id)` references. */
export function svgId(prefix: string, reactId: string) {
  return `${prefix}-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
