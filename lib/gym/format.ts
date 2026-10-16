import { formatMoney } from "@/lib/format";

const LOCALE = "en-IN";
const TIME_ZONE = "Asia/Kolkata";

const dateFormat = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options });

export { formatMoney };

/** "2026-10-15" → "15 Oct 2026" */
export function formatDate(date: string) {
  return dateFormat({ day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

/** ISO timestamp → "6:28 pm" */
export function formatClock(iso: string) {
  return dateFormat({ hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

/** "2026-10" → "Oct 2026" */
export function formatMonthYear(month: string) {
  return dateFormat({ month: "short", year: "numeric" }).format(new Date(`${month}-01T12:00:00Z`));
}

/** "2026-10-15" → "15 Oct" */
export function formatDayMonth(date: string) {
  return dateFormat({ day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00Z`));
}
