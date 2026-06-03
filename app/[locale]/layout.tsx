/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { isValidLocale, defaultLocale } from "@/lib/i18n"; // ← AJOUTER defaultLocale
import { ReactNode } from "react";
import "../favicon.ico";
import { ThemeProviderWrapper } from "./theme-provider-wrapper";
// @ts-expect-error
import "../globals.css";
import { AutoRefreshProvider } from "@/components/ui/providers/AutoRefreshProvider";
import { Toaster } from "sonner";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

// ⭐ NOUVELLE FONCTION : Charge les messages avec fallback vers le français
async function getMessagesWithFallback(locale: string) {
  // Charger les messages de la locale demandée
  let messages = await getMessages({ locale });

  // Si ce n'est pas le français, fusionner avec le français (fallback)
  if (locale !== defaultLocale) {
    try {
      const frMessages = await getMessages({ locale: defaultLocale });
      // Fusion : les clés de la locale écrasent celles du français
      messages = { ...frMessages, ...messages };
    } catch (error) {
      console.error(
        "Impossible de charger les messages français pour fallback:",
        error,
      );
    }
  }

  return messages;
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // ⭐ UTILISER LA NOUVELLE FONCTION au lieu de getMessages() seule
  const messages = await getMessagesWithFallback(locale);

  return (
    <ClerkProvider
      signInUrl="/login"
      signUpUrl="/register"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html
        lang={locale}
        dir={locale === "ar" ? "rtl" : "ltr"}
        suppressHydrationWarning
      >
        <body suppressHydrationWarning>
          <ThemeProviderWrapper>
            <NextIntlClientProvider messages={messages} locale={locale}>
              <AutoRefreshProvider>{children}</AutoRefreshProvider>
            </NextIntlClientProvider>
          </ThemeProviderWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}
