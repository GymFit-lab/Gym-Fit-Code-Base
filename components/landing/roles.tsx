"use client";

import { useRef, useState } from "react";

import { ChalkGrain } from "@/components/graphics/chalk-grain";
import { PlateMark } from "@/components/graphics/plate-mark";
import { SectionHeading } from "@/components/section-heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { roleMockups, rolesContent as content, type RoleId } from "@/content/landing";

function RoleMockup({ id }: { id: RoleId }) {
  const card = "rounded-2xl border border-border bg-surface-2 p-4";

  if (id === "owner") {
    const m = roleMockups.owner;
    const max = Math.max(...m.revenue);
    return (
      <div role="img" aria-label={m.ariaLabel} className="space-y-3">
        <div aria-hidden="true" className="grid grid-cols-2 gap-3">
          {m.kpis.map((k) => (
            <div key={k.label} className={card}>
              <p className="text-xs text-muted">{k.label}</p>
              <p className="mt-1 font-display text-4xl leading-none tracking-wide">{k.value}</p>
              <p className="mt-1 text-xs text-primary-ink">{k.trend}</p>
            </div>
          ))}
        </div>
        <div aria-hidden="true" className={card}>
          <p className="mb-3 text-xs font-semibold">{m.revenueLabel}</p>
          <div className="flex h-24 items-end gap-2">
            {m.revenue.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-primary"
                style={{ height: `${(v / max) * 100}%` }}
              />
            ))}
          </div>
        </div>
        <div aria-hidden="true" className={card}>
          <p className="mb-2 text-xs font-semibold">{m.listTitle}</p>
          {m.list.map((r) => (
            <p key={r.name} className="flex justify-between py-1 text-sm">
              {r.name} <span className="text-accent-ink">{r.detail}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (id === "trainer") {
    const m = roleMockups.trainer;
    return (
      <div role="img" aria-label={m.ariaLabel} className={card}>
        <div aria-hidden="true">
          <p className="font-semibold">{m.title}</p>
          <p className="text-xs text-muted">{m.summary}</p>
          <ul className="mt-4 space-y-2">
            {m.sessions.map((s) => (
              <li
                key={s.time}
                className="flex items-center gap-3 rounded-xl border border-border bg-bg p-3 text-sm"
              >
                <span className="font-mono text-xs text-muted">{s.time}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{s.name}</span>
                  <span className="block truncate text-xs text-muted">{s.focus}</span>
                </span>
                <span
                  className={
                    s.done
                      ? "rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary-ink"
                      : "rounded-full bg-fg/10 px-2 py-0.5 text-xs text-muted"
                  }
                >
                  {s.done ? m.doneLabel : m.upcomingLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const m = roleMockups.client;
  const circumference = 2 * Math.PI * 40;
  return (
    <div role="img" aria-label={m.ariaLabel} className={card}>
      <div aria-hidden="true">
        <p className="font-semibold">{m.title}</p>
        <div className="mt-4 flex items-center gap-5">
          <svg viewBox="0 0 100 100" className="size-28 -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth="10"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - m.ringValue / 100)}
            />
          </svg>
          <div>
            <p className="font-display text-5xl leading-none">{m.ringValue}%</p>
            <p className="text-xs text-muted">{m.ringLabel}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {m.stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-bg p-3">
              <p className="text-xs text-muted">{s.label}</p>
              <p className="font-semibold">{s.value}</p>
              <p className="text-xs text-primary-ink">{s.trend}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm">
          <span className="text-muted">{m.nextLabel}:</span> {m.next}
        </p>
        <p className="mt-1 text-sm">
          <span className="text-muted">{m.planLabel}:</span> {m.plan}
        </p>
      </div>
    </div>
  );
}

const SWIPE_MIN_PX = 50;

export function Roles() {
  const [active, setActive] = useState<RoleId>(content.roles[0].id);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function handleTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy)) return;
    const index = content.roles.findIndex((role) => role.id === active);
    const next = content.roles[index + (dx < 0 ? 1 : -1)];
    if (next) setActive(next.id);
  }

  return (
    <section aria-labelledby="roles-title" className="cut-bg relative bg-surface section-y">
      <ChalkGrain />
      <div className="relative container-x">
        <SectionHeading copy={content} id="roles-title" />

        <Tabs
          value={active}
          onValueChange={(value) => setActive(value as RoleId)}
          className="mt-12 items-center"
        >
          <TabsList aria-label={content.tabsLabel} className="max-w-full overflow-x-auto">
            {content.roles.map((role) => {
              const Icon = role.icon;
              return (
                <TabsTrigger key={role.id} value={role.id}>
                  <Icon className="size-4" />
                  {role.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <p className="mt-3 text-xs text-muted md:hidden">{content.swipeHint}</p>

          {content.roles.map((role) => (
            <TabsContent
              key={role.id}
              value={role.id}
              onTouchStart={(event) => {
                const touch = event.touches[0];
                touchStart.current = { x: touch.clientX, y: touch.clientY };
              }}
              onTouchEnd={handleTouchEnd}
              className="pop-in mt-6 grid w-full touch-pan-y items-center gap-10 border border-border bg-bg p-6 md:mt-10 md:p-10 lg:grid-cols-2"
            >
              <div>
                <p className="eyebrow">{role.eyebrow}</p>
                <h3 className="mt-3 font-display text-4xl tracking-wide uppercase md:text-5xl">
                  {role.headline}
                </h3>
                <p className="mt-3 text-lg text-muted">{role.text}</p>
                <ul className="mt-6 space-y-3">
                  {role.bullets.map((b) => (
                    <li key={b} className="flex gap-3">
                      <PlateMark className="mt-0.5 size-5 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <RoleMockup id={role.id} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
