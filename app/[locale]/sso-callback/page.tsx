// app/[locale]/sso-callback/page.tsx
'use client';

import { useTranslations } from 'next-intl';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useSSOCallback } from './hooks/useSSOCallback';

export default function SSOCallbackPage() {
  const t = useTranslations("SSOCallback");
  const { error, processing } = useSSOCallback();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark transition-colors duration-300">
        <div className="text-center max-w-md mx-4 p-6 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-800 shadow-lg">
          <div className="text-red-500 text-4xl mb-4"></div>
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t("redirecting")}</p>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark transition-colors duration-300">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 animate-ping opacity-75 dark:opacity-50"></div>
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 shadow-lg shadow-blue-500/30 dark:shadow-purple-500/20">
              <LoadingSpinner size="lg" className="text-white" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
            {t("connecting")}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {t("pleaseWait")}
          </p>
        </div>
      </div>
    );
  }

  return null;
}