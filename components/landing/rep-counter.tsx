"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

function format(n: number, pad?: number) {
  return pad ? String(n).padStart(pad, "0") : String(n);
}

/**
 * Scoreboard number that counts up the first time it scrolls into view.
 * Server HTML shows the final value (no-JS and SEO safe); the visible digits are
 * aria-hidden and a static sr-only copy is announced instead.
 */
export function RepCounter({ value, pad }: { value: number; pad?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(value);

  useEffect(() => {
    if (reduce) return;
    if (!inView) {
      setCurrent(0);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setCurrent(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        {format(current, pad)}
      </span>
      <span className="sr-only">{format(value, pad)}</span>
    </>
  );
}
