"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { authContent } from "@/content/auth";
import { cn } from "@/lib/utils";

/** Password field with a show/hide toggle. Accepts every <input> prop (incl. RHF `register`). */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-12", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? authContent.hidePassword : authContent.showPassword}
        aria-pressed={visible}
        className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:text-fg"
      >
        {visible ? (
          <EyeOff className="size-5" aria-hidden="true" />
        ) : (
          <Eye className="size-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
