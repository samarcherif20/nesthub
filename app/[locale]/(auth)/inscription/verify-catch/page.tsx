"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useVerifyCatch } from "./hooks/useVerifyCatch";

export default function VerifyCatchPage() {
  const t = useTranslations("VerifyCatch");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useVerifyCatch();

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6"
      style={{
        background: isDark
          ? "radial-gradient(circle at 50% 50%, #1a1c2c 0%, #050505 100%)"
          : "radial-gradient(circle at 50% 50%, #ede9fe 0%, #f8f7ff 100%)",
      }}
    >
      <style>
        {`
          @keyframes spinLoader { to { transform: rotate(360deg) } }
          @keyframes pulseGlow {
            0%,100% { box-shadow: 0 0 20px rgba(113,42,226,.3) }
            50% { box-shadow: 0 0 50px rgba(0,92,171,.6) }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(16px) }
            to { opacity: 1; transform: translateY(0) }
          }
        `}
      </style>

      {/* Logo avec spinner */}
      <div className="relative w-24 h-24">
        {/* Cercle de bordure externe */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: `3px solid ${isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)"}`,
          }}
        />
        
        {/* Spinner rotatif */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: `3px solid transparent`,
            borderTopColor: "#005cab",
            borderRightColor: "rgba(113,42,226,.3)",
            animation: "spinLoader 1s cubic-bezier(.4,0,.2,1) infinite",
          }}
        />
        
        {/* Logo - PLUS DE CERCLE BLANC, le logo remplit tout */}
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
          />
        </div>
      </div>

      <div
        className="flex flex-col items-center gap-2"
        style={{ animation: "fadeInUp .5s ease both .2s" }}
      >
        <p
          className={`text-sm font-semibold tracking-[.15em] uppercase ${isDark ? "text-white/70" : "text-gray-700"}`}
        >
          {t("title")}
        </p>
        <p
          className={`text-[10px] tracking-[.3em] uppercase ${isDark ? "text-white/25" : "text-gray-400"}`}
        >
          {t("description")}
        </p>
      </div>

      <div className="flex gap-2 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "#712ae2",
              animation: `pulseGlow 1.4s ease-in-out ${i * 0.2}s infinite`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    </div>
  );
}