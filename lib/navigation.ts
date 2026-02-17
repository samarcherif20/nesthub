import { locales, defaultLocale } from "./i18n";
import { createNavigation } from "next-intl/navigation";

// CRÉER LES OUTILS DE NAVIGATION
export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  defaultLocale,
});