// Importe les outils de next-intl
import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

// 1. DÉFINIR LES LANGUES DISPONIBLES
export const locales = ["fr", "ar", "en", "es", "de", "it"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

// 2. CONFIGURATION next-intl
export default getRequestConfig(async ({ locale }) => {
  if (!locale || !locales.includes(locale as Locale)) notFound();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: "Africa/Tunis",
    now: new Date(),
  };
});
