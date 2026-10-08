"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { commonContent } from "@/content/landing";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={commonContent.themeToggleLabel}
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
    >
      {/* Both icons render; CSS picks one so server and client markup match. */}
      <Sun className="size-5 light:hidden" />
      <Moon className="hidden size-5 light:block" />
    </Button>
  );
}
