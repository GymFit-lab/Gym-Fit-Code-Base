"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";

import { demoSignOut } from "@/app/actions/demo-auth";
import { staffSignOut } from "@/app/actions/fitva-auth";
import { Button, type ButtonProps } from "@/components/ui/button";
import { authContent } from "@/content/auth";
import { authClient } from "@/lib/auth-client";
import type { AuthMode } from "@/lib/auth-mode";

export function SignOutButton({
  authMode,
  variant = "outline",
  size = "md",
  className,
}: {
  /** The active login system (pass `AUTH_MODE` from lib/auth-mode). */
  authMode: AuthMode;
} & Pick<ButtonProps, "variant" | "size" | "className">) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const { dashboard } = authContent;

  async function handleClick() {
    setPending(true);
    if (authMode === "demo") {
      await demoSignOut(); // redirects to /login
      return;
    }
    if (authMode === "fitva") {
      await staffSignOut(); // redirects to /login
      return;
    }
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <LogOut />}
      {pending ? dashboard.signingOut : dashboard.signOut}
    </Button>
  );
}
