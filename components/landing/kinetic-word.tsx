"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

const INTERVAL_MS = 2200;
/** Stop after two full loops (ending on the first word) so the motion doesn't run forever. */
const LOOPS = 2;

/** Cycles through `words` in place. Decorative: the parent provides the screen-reader text. */
export function KineticWord({ words, className }: { words: string[]; className?: string }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const total = words.length * LOOPS;

  useEffect(() => {
    if (reduce || words.length < 2 || step >= total) return;
    const timer = setTimeout(() => setStep((s) => s + 1), INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [reduce, step, total, words.length]);

  const word = words[step % words.length];

  return (
    <LazyMotion features={domAnimation}>
      <span className={cn("relative inline-grid overflow-hidden align-bottom", className)}>
        {/* Invisible copies reserve the width of the longest word, so nothing shifts (CLS). */}
        {words.map((w) => (
          <span key={w} className="invisible col-start-1 row-start-1">
            {w}
          </span>
        ))}
        <AnimatePresence initial={false} mode="popLayout">
          <m.span
            key={word}
            className="col-start-1 row-start-1"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </m.span>
        </AnimatePresence>
      </span>
    </LazyMotion>
  );
}
