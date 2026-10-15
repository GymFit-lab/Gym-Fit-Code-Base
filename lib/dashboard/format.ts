import { dashboardContent } from "@/content/dashboard";
import { formatMoney } from "@/lib/format";
import { fill } from "@/lib/utils";

/** Dashboard dates are shown in the gym's local time. */
const LOCALE = "en-IN";
const TIME_ZONE = "Asia/Kolkata";

export function formatNumber(value: number) {
  return new Intl.NumberFormat(LOCALE).format(value);
}

/** Format a value by its declared kind ("currency" uses the site currency, e.g. ₹1,96,400). */
export function formatValue(value: number, format: "number" | "currency") {
  return format === "currency" ? formatMoney(value) : formatNumber(value);
}

/** Compact form for axis ticks: 196400 → "₹1.96L" / 1200 → "1.2K". */
export function formatCompact(value: number, format: "number" | "currency") {
  if (format === "currency" && value >= 100000) {
    return `₹${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 1)}L`;
  }
  const compact = new Intl.NumberFormat(LOCALE, { notation: "compact" }).format(value);
  return format === "currency" ? `₹${compact}` : compact;
}

const dateFormat = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options });

/** "2026-10" → "Oct" */
export function formatMonth(month: string) {
  return dateFormat({ month: "short" }).format(new Date(`${month}-01T12:00:00Z`));
}

/** "2026-10-15" → "Thu" */
export function formatWeekday(date: string) {
  return dateFormat({ weekday: "short" }).format(new Date(`${date}T12:00:00Z`));
}

/** "2026-10-15" → "15 Oct" */
export function formatShortDate(date: string) {
  return dateFormat({ day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00Z`));
}

/** ISO timestamp → "6:28 pm" */
export function formatTime(iso: string) {
  return dateFormat({ hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

/** ISO timestamp → "4 min ago" (relative to `now`). */
export function formatRelative(iso: string, now = Date.now()) {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  const { relative } = dashboardContent;
  if (minutes < 1) return relative.justNow;
  if (minutes < 60) return fill(relative.minutes, { n: minutes });
  return fill(relative.hours, { n: Math.floor(minutes / 60) });
}

/** Percentage change from `previous` to `value`, rounded to one decimal (null if no baseline). */
export function percentChange(value: number, previous: number) {
  if (previous === 0) return null;
  return Math.round(((value - previous) / previous) * 1000) / 10;
}
