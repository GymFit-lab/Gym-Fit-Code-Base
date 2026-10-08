import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full min-w-0 rounded-xl border border-border-strong bg-bg px-4 text-base text-fg transition-colors placeholder:text-muted focus-visible:border-primary-ink disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-accent-ink",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
