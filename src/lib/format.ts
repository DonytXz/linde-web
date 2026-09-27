import type { Language } from "../api/types";

export function money(
  amount: number,
  currency: string,
  language: Language,
): string {
  const formatter = new Intl.NumberFormat(language, {
    style: "currency",
    currency,
    currencyDisplay: "code",
  });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amount / 10 ** digits);
}
export function dateTime(
  value: string,
  zone: string,
  language: Language,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(language, {
    timeZone: zone,
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(new Date(value));
}
export function localDate(value: string, zone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
export function browserZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Etc/UTC";
}
export function safeReturnPath(value: string | null, fallback: string) {
  return value &&
    /^\/(es|en)\//.test(value) &&
    !value.includes("\\") &&
    !/[\r\n]/.test(value)
    ? value
    : fallback;
}
export function idempotencyKey(scope: string) {
  const key = `linde:request:v1:${scope}`;
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  sessionStorage.setItem(key, value);
  return value;
}
