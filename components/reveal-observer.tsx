"use client";

import { useEffect } from "react";

/**
 * Enables the `data-reveal` scroll animation (see app/globals.css).
 * Content is only hidden once this has run, so the page stays readable without JS.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])");
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );

    targets.forEach((el) => observer.observe(el));
    root.classList.add("reveal-ready");

    return () => observer.disconnect();
  }, []);

  return null;
}
