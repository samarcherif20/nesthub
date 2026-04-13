/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";
import { ReactNode } from "react";
import "../favicon.ico";
import { ThemeProviderWrapper } from "./theme-provider-wrapper"; // Import the client wrapper

// @ts-expect-error
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
              {children}
            </NextIntlClientProvider>
          </ThemeProviderWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}
