"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;

function DialogContent({
  className,
  children,
  closeLabel = "Close",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { closeLabel?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        className="fixed inset-0 z-50 bg-iron/70 backdrop-blur-sm"
      />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border-strong bg-surface p-6 shadow-2xl md:p-8",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label={closeLabel}
          className="absolute top-4 right-4 grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-fg/5 hover:text-fg"
        >
          <X className="size-5" aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-6 pr-10">
      <DialogPrimitive.Title className="text-xl font-bold">{title}</DialogPrimitive.Title>
      <DialogPrimitive.Description className="mt-1 text-sm text-muted">
        {description ?? <span className="sr-only">{title}</span>}
      </DialogPrimitive.Description>
    </header>
  );
}

export { Dialog, DialogContent, DialogHeader, DialogTrigger };
