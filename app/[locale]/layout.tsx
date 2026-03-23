/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";
import { ReactNode } from "react";
import { Toaster } from "sonner";

import "../favicon.ico";
import "../globals.css";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <ClerkProvider>
      <html 
        lang={locale} 
        dir={locale === "ar" ? "rtl" : "ltr"}
        suppressHydrationWarning
      >
        <body suppressHydrationWarning>
          <NextIntlClientProvider messages={messages} locale={locale}>
            {children}
            {/* ⭐⭐⭐ TOASTER AJOUTÉ ICI ⭐⭐⭐ */}
            <Toaster 
              position="top-center"
              richColors
              closeButton
              theme={locale === "ar" ? "dark" : "light"} // Optionnel : adapte selon la locale
            />
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}