export const locales = ["ka", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ka";

export function isLocale(x: string): x is Locale {
  return (locales as readonly string[]).includes(x);
}

/** A text that exists in both languages. */
export type L10n = Record<Locale, string>;

export function fmtDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === "ka" ? "ka-GE" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function shortWallet(w: string): string {
  return w.length > 10 ? `${w.slice(0, 4)}…${w.slice(-4)}` : w;
}
