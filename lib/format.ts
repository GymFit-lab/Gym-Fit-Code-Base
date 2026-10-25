import { pricingContent, type CurrencyCode } from "@/content/landing";

/** Format a whole-number price in the configured currency, e.g. 2499 → "₹2,499". */
export function formatMoney(amount: number, currency: CurrencyCode = pricingContent.currency) {
  return new Intl.NumberFormat(pricingContent.currencyLocales[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
