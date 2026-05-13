"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useSSOCallback } from "./hooks/useSSOCallback";
import { Loader2, CheckCircle, XCircle, Shield, Sparkles } from "lucide-react";

export default function SSOCallbackPage() {
  const t = useTranslations("SSOCallback");
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { error, processing } = useSSOCallback();
  
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

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

  // État d'erreur
  if (error) {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 transition-colors duration-300"
        style={{
          background: isDark
            ? "radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)"
            : "radial-gradient(circle at 50% 50%, #fee2e2 0%, #fef2f2 100%)",
        }}
      >
        <style>
          {`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-8px); }
              75% { transform: translateX(8px); }
            }
          `}
        </style>

        {/* Cercle d'erreur */}
        <div
          className="relative w-24 h-24"
          style={{ animation: "shake 0.5s ease-in-out" }}
        >
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-rose-600 animate-pulse"
            style={{ filter: "blur(20px)", opacity: 0.3 }}
          />
          <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-red-500 to-rose-600 shadow-xl shadow-red-500/30">
            <XCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Texte d'erreur */}
        <div
          className="flex flex-col items-center gap-3 text-center max-w-sm mx-4"
          style={{ animation: "fadeInUp 0.5s ease-out both 0.2s" }}
        >
          <h2
            className={`text-2xl font-bold tracking-tight ${
              isDark ? "text-white" : "text-slate-800"
            }`}
          >
            {t("errorTitle") || "Échec de la connexion"}
          </h2>
          <p
            className={`text-sm ${
              isDark ? "text-red-300" : "text-red-600"
            } font-medium`}
          >
            {error}
          </p>
          <p
            className={`text-xs ${
              isDark ? "text-slate-400" : "text-slate-500"
            } mt-1`}
          >
            {t("redirectingMessage") || "Redirection en cours..."}
          </p>
        </div>
      </div>
    );
  }

  // État de chargement (processing)
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
            50% { opacity: 1; transform: scale(1.1); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>

      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 200 + 50}px`,
              height: `${Math.random() * 200 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: isDark
                ? `radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 70%)`
                : `radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 70%)`,
              animation: `float ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* Logo avec spinner */}
      <div className="relative w-28 h-28">
        {/* Cercle de bordure externe avec glow */}
        <div
          className="absolute inset-0 rounded-full transition-colors duration-300"
          style={{
            border: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
            boxShadow: isDark
              ? "0 0 30px rgba(129,140,248,0.2)"
              : "0 0 30px rgba(79,70,229,0.15)",
          }}
        />

        {/* Spinner rotatif */}
        <div
          className="absolute inset-0 rounded-full transition-colors duration-300"
          style={{
            border: `2px solid transparent`,
            borderTopColor: isDark ? "#818cf8" : "#4f46e5",
            borderRightColor: isDark
              ? "rgba(129,140,248,0.3)"
              : "rgba(79,70,229,0.3)",
            borderBottomColor: isDark
              ? "rgba(129,140,248,0.1)"
              : "rgba(79,70,229,0.1)",
            animation: "spinLoader 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          }}
        />

        {/* Logo avec pulse */}
        <div
          className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden bg-white/10 backdrop-blur-sm"
          style={{
            animation: "pulseGlow 2s ease-in-out infinite",
          }}
        >
          <Image
            src="/logo/logo.png"
            alt="NestHub Logo"
            fill
            className="object-cover scale-[1.15]"
            sizes="112px"
            priority
          />
        </div>
      </div>

      {/* Texte principal */}
      <div
        className="flex flex-col items-center gap-2"
        style={{ animation: "fadeInUp 0.5s ease-out both 0.2s" }}
      >
        <p
          className={`text-sm font-semibold tracking-[0.15em] uppercase transition-colors duration-300 flex items-center gap-2 ${
            isDark ? "text-white/80" : "text-slate-700"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          {t("title") || "CONNEXION SÉCURISÉE"}
          <Sparkles className="w-3.5 h-3.5" />
        </p>
        <p
          className={`text-[10px] tracking-[0.3em] uppercase transition-colors duration-300 ${
            isDark ? "text-white/30" : "text-slate-400"
          }`}
        >
          {t("subtitle") || "VERIFICATION SSO"}
        </p>
      </div>

      {/* Message de chargement */}
      <div
        className="flex flex-col items-center gap-3 mt-2"
        style={{ animation: "fadeInUp 0.5s ease-out both 0.4s" }}
      >
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span
            className={`text-xs font-medium ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            {t("connecting") || "Connexion en cours"}
          </span>
        </div>
        <p
          className={`text-[10px] ${
            isDark ? "text-slate-500" : "text-slate-400"
          }`}
        >
          {t("pleaseWait") || "Veuillez patienter..."}
        </p>
      </div>

      {/* Points de chargement animés */}
      <div
        className="flex gap-2 mt-1"
        style={{ animation: "fadeInUp 0.5s ease-out both 0.6s" }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
            style={{
              backgroundColor: isDark ? "#818cf8" : "#4f46e5",
              animation: `pulseGlow 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Badge de sécurité */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 backdrop-blur-sm"
        style={{ animation: "fadeInUp 0.5s ease-out both 0.8s" }}
      >
        <CheckCircle className="w-3 h-3 text-emerald-500" />
        <span
          className={`text-[9px] font-medium ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {t("secureConnection") || "Connexion chiffrée • SSO"}
        </span>
      </div>
    </div>
  );
}