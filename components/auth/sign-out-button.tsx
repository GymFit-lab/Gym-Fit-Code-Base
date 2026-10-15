"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";

import { demoSignOut } from "@/app/actions/demo-auth";
import { Button, type ButtonProps } from "@/components/ui/button";
import { authContent } from "@/content/auth";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({
  demo,
  variant = "outline",
  size = "md",
  className,
}: {
  /** true while AUTH_MODE is "demo" (pass `isDemoAuth` from lib/auth-mode). */
  demo: boolean;
} & Pick<ButtonProps, "variant" | "size" | "className">) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const { dashboard } = authContent;

  async function handleClick() {
    setPending(true);
    if (demo) {
      await demoSignOut(); // redirects to /login
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
