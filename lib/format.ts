import { pricingContent, type CurrencyCode } from "@/content/landing";

/** Format a whole-number price in the configured currency, e.g. 2499 → "₹2,499". */
export function formatMoney(amount: number, currency: CurrencyCode = pricingContent.currency) {
  return new Intl.NumberFormat(pricingContent.currencyLocales[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Percentage saved by paying yearly instead of 12 × monthly. */
export function yearlySavingPercent(price: { monthly: number; yearly: number }) {
  if (price.monthly <= 0) return 0;
  return Math.max(0, Math.round((1 - price.yearly / (price.monthly * 12)) * 100));
}
