import { cn } from "@/lib/utils";

/** Dashboard card with a heading, optional description and optional header action. */
export function Panel({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-3xl border border-border bg-surface p-5 md:p-6", className)}>
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Shown when a list has no rows. */
export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border-strong px-4 py-8 text-center text-sm text-muted">
      {children}
    </p>
  );
}
