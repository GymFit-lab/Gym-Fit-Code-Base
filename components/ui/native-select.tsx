import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/** Native <select> styled like the shadcn input — accessible and works without JS. */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          "h-12 w-full appearance-none rounded-xl border border-border-strong bg-bg pr-11 pl-4 text-base text-fg transition-colors focus-visible:border-primary-ink disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-accent-ink",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

export { NativeSelect };
