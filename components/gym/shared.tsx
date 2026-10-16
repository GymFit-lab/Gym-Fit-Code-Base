"use client";

import { Plus, Search } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { gymContent } from "@/content/gym";
import { cn, fill, initials } from "@/lib/utils";
import type { ClientStatus } from "@/lib/gym/types";

const { common } = gymContent;

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 font-display text-5xl leading-none tracking-wide uppercase md:text-6xl">
          {title}
        </h1>
        <p className="mt-3 text-muted">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function LoadingState() {
  return (
    <p role="status" className="py-24 text-center font-mono text-sm text-muted">
      {common.loading}
    </p>
  );
}

const statusStyles: Record<ClientStatus, string> = {
  active: "bg-primary/15 text-primary-ink",
  due: "bg-fg/10 text-fg",
  overdue: "bg-accent/10 text-accent-ink",
  expired: "bg-accent/10 text-accent-ink",
  none: "bg-fg/5 text-muted",
};

export function StatusPill({ status }: { status: ClientStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        statusStyles[status],
      )}
    >
      {gymContent.statusLabels[status]}
    </span>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 font-mono text-xs font-bold",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Name + optional subtitle with an avatar — the first cell of most tables. */
export function Person({ name, subtitle }: { name: string; subtitle?: string }) {
  return (
    <span className="flex items-center gap-3">
      <Avatar name={name} />
      <span className="min-w-0">
        <span className="block truncate font-medium">{name}</span>
        {subtitle && (
          <span className="block truncate text-xs font-normal text-muted">{subtitle}</span>
        )}
      </span>
    </span>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <article className="rounded-3xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-muted">{label}</h3>
      <p className="mt-2 font-mono text-2xl font-bold tracking-tight md:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </article>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-0 flex-1 basis-64", className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-11"
      />
    </div>
  );
}

/** Add-button + modal. `children` receives `done`, which closes the dialog (and unmounts the form). */
export function FormDialog({
  label,
  title,
  description,
  variant = "primary",
  icon = true,
  disabled,
  children,
}: {
  label: string;
  title: string;
  description?: string;
  variant?: "primary" | "outline";
  icon?: boolean;
  disabled?: boolean;
  children: (done: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm" disabled={disabled}>
          {icon && <Plus aria-hidden="true" />}
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={common.close}>
        <DialogHeader title={title} description={description} />
        {children(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  );
}

/** Cancel + submit row at the bottom of every form. */
export function FormActions({ submit, onCancel }: { submit: string; onCancel: () => void }) {
  return (
    <div className="mt-2 flex flex-wrap justify-end gap-2">
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        {common.cancel}
      </Button>
      <Button type="submit" size="sm">
        {submit}
      </Button>
    </div>
  );
}

export type Column<T> = {
  id: string;
  header: string;
  align?: "right";
  /** The first column renders as the row header. */
  cell: (row: T) => ReactNode;
};

/** Responsive table with a "Show more" button for long lists. */
export function DataTable<T>({
  columns,
  rows,
  getKey,
  empty,
  pageSize = 25,
}: {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  empty: string;
  pageSize?: number;
}) {
  const [limit, setLimit] = useState(pageSize);

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border-strong px-4 py-10 text-center text-sm text-muted">
        {empty}
      </p>
    );
  }

  const hidden = rows.length - limit;

  return (
    <>
      <div className="-mx-5 overflow-x-auto md:-mx-6">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs tracking-wider text-muted uppercase">
              {columns.map((col, i) => (
                <th
                  key={col.id}
                  scope="col"
                  className={cn(
                    "px-3 py-3 font-semibold",
                    i === 0 && "px-5 md:px-6",
                    i === columns.length - 1 && "pr-5 md:pr-6",
                    col.align === "right" && "text-right",
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((row) => (
              <tr key={getKey(row)} className="border-b border-border last:border-0">
                {columns.map((col, i) => {
                  const className = cn(
                    "px-3 py-3",
                    i === 0 && "px-5 md:px-6",
                    i === columns.length - 1 && "pr-5 md:pr-6",
                    col.align === "right" && "text-right",
                  );
                  return i === 0 ? (
                    <th key={col.id} scope="row" className={cn(className, "font-medium")}>
                      {col.cell(row)}
                    </th>
                  ) : (
                    <td key={col.id} className={className}>
                      {col.cell(row)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hidden > 0 && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setLimit((n) => n + pageSize)}>
            {fill(common.showMoreCount, { count: hidden })}
          </Button>
        </div>
      )}
    </>
  );
}

/** Label + <select> pair used in filter bars. */
export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-muted">
      {label}
      {children}
    </label>
  );
}
