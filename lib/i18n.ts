// lib/i18n.ts

export const locales = ["fr", "ar", "en", "es", "de", "it"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

//  Helper pour vérifier si une string est une locale valide
export function isValidLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export const routing = {
  locales,
  defaultLocale,
};
