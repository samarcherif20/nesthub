// app/[locale]/(auth)/inscription/verify-catch/page.tsx
"use client";

import { useTranslations } from "next-intl";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useVerifyCatch } from "./hooks/useVerifyCatch";

export default function VerifyCatchPage() {
  const t = useTranslations("VerifyCatch");
  
  useVerifyCatch();

  return (
    <div className="min-h-screen bg-linear-to-b from-white via-blue-50 to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center transition-colors duration-300">
      <div className="text-center px-4">
        {/* Animated spinner container */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-linear-to-r from-blue-500 via-purple-500 to-indigo-500 animate-ping opacity-75 dark:opacity-50"></div>
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 shadow-lg shadow-blue-500/30 dark:shadow-purple-500/20">
            <LoadingSpinner className="animate-spin h-8 w-8 text-white" />
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
          {t("title")}
        </h2>
        
        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
          {t("description")}
        </p>
      </div>
    </div>
  );
}