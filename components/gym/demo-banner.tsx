"use client";

import { Info } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { gymContent } from "@/content/gym";
import { isDemoData } from "@/lib/gym/data-source";
import { useGym } from "@/lib/gym/store";

const { demo } = gymContent;

/** Notice + reset while the gym pages run on dummy data. Remove with lib/gym/mock-data.ts. */
export function DemoBanner() {
  const { resetDemo } = useGym();
  const [busy, setBusy] = useState(false);

  if (!isDemoData) return null;

  return (
    <div
      role="note"
      className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm"
    >
      <Info className="size-4 shrink-0 text-accent-ink" aria-hidden="true" />
      <p className="min-w-0 flex-1 basis-72">
        <strong className="font-semibold text-accent-ink">{demo.title}.</strong>{" "}
        <span className="text-fg">{demo.body}</span>
      </p>
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await resetDemo();
          setBusy(false);
        }}
      >
        {busy ? demo.resetting : demo.reset}
      </Button>
    </div>
  );
}
