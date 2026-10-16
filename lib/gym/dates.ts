/** Date helpers on "YYYY-MM-DD" strings, in the gym's time zone (Asia/Kolkata). */
const TIME_ZONE = "Asia/Kolkata";

const parse = (date: string) => new Date(`${date}T12:00:00Z`);
const toISODate = (d: Date) => d.toISOString().slice(0, 10);

/** Today's date in the gym's time zone. */
export function todayISO(now: Date | number = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

/** The gym-local date of an ISO timestamp. */
export const dateOf = (iso: string) => todayISO(new Date(iso));

export function addDays(date: string, days: number) {
  const d = parse(date);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

/** Add calendar months, clamping to the month's last day (31 Jan + 1 month → 28/29 Feb). */
export function addMonths(date: string, months: number) {
  const d = parse(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return toISODate(d);
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: string, to: string) {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000);
}

/** "2026-10-15" → "2026-10" */
export const monthOf = (date: string) => date.slice(0, 7);

/** The last `count` month keys ("YYYY-MM"), oldest first, ending with today's month. */
export function lastMonths(count: number, today: string) {
  const first = `${monthOf(today)}-01`;
  return Array.from({ length: count }, (_, i) => monthOf(addMonths(first, i - (count - 1))));
}

/** The last `count` dates, oldest first, ending today. */
export function lastDays(count: number, today: string) {
  return Array.from({ length: count }, (_, i) => addDays(today, i - (count - 1)));
}
