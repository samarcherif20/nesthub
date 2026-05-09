"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useVerifyCatch } from "./hooks/useVerifyCatch";

export default function VerifyCatchPage() {
  const t = useTranslations("VerifyCatch");
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  useVerifyCatch();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Évite l'hydratation mismatch
  if (!mounted) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-950">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-700" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden">
            <Image
              src="/logo/logo.png"
              alt="Logo"
              fill
              className="object-cover scale-110"
              sizes="100px"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 transition-colors duration-300"
      style={{
        background: isDark
          ? "radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)"
          : "radial-gradient(circle at 50% 50%, #ede9fe 0%, #f8f7ff 100%)",
      }}
    >
      <style>
        {`
          @keyframes spinLoader { 
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulseGlow {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Logo avec spinner */}
      <div className="relative w-24 h-24">
        {/* Cercle de bordure externe */}
        <div
          className="absolute inset-0 rounded-full transition-colors duration-300"
          style={{
            border: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
          }}
        />

        {/* Spinner rotatif avec la couleur primaire de l'app */}
        <div
          className="absolute inset-0 rounded-full transition-colors duration-300"
          style={{
            border: `2px solid transparent`,
            borderTopColor: isDark ? "#818cf8" : "#4f46e5",
            borderRightColor: isDark
              ? "rgba(129,140,248,0.3)"
              : "rgba(79,70,229,0.3)",
            animation: "spinLoader 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          }}
        />

        {/* Logo */}
        <div
          className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            animation: "pulseGlow 2s ease-in-out infinite",
          }}
        >
          <Image
            src="/logo/logo.png"
            alt="Logo"
            fill
            className="object-cover scale-110"
            sizes="100px"
            priority
          />
        </div>
      </div>

      {/* Texte */}
      <div
        className="flex flex-col items-center gap-2"
        style={{ animation: "fadeInUp 0.5s ease-out both 0.2s" }}
      >
        <p
          className={`text-sm font-semibold tracking-[0.15em] uppercase transition-colors duration-300 ${
            isDark ? "text-white/80" : "text-slate-700"
          }`}
        >
          {t("title")}
        </p>
        <p
          className={`text-[10px] tracking-[0.3em] uppercase transition-colors duration-300 ${
            isDark ? "text-white/30" : "text-slate-400"
          }`}
        >
          {t("description")}
        </p>
      </div>

      {/* Points de chargement */}
      <div className="flex gap-2 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
            style={{
              backgroundColor: isDark ? "#a78bfa" : "#6366f1",
              animation: `pulseGlow 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
