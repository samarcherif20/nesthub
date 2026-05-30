// app/[locale]/upgrade-role/page.tsx
"use client";
import React from "react";
import { useTheme } from "next-themes";
import {
  IoGlobeOutline,
  IoBusinessOutline,
  IoSparklesOutline,
  IoArrowForwardOutline,
  IoCloseOutline,
  IoHomeOutline,
  IoSwapHorizontalOutline,
} from "react-icons/io5";
import Link from "next/link";
import { useUpgradeRole } from "./hooks/useUpgradeRole";

// ─── Toast Component ─────────────────────────────────────────────────────────
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    info: "bg-sky-500",
  };

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${styles[type]} text-white`}
      >
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <IoCloseOutline className="text-sm" />
        </button>
      </div>
    </div>
  );
}

// ─── Loading Spinner ───
function LoadingSpinner({ role, t }: { role: "tenant" | "owner"; t: any }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6"
      style={{
        background: isDark
          ? "radial-gradient(circle at 50% 50%, #1a1c2c 0%, #050505 100%)"
          : "radial-gradient(circle at 50% 50%, #ede9fe 0%, #f8f7ff 100%)",
      }}
    >
      <style>{`
        @keyframes spinLoader { to { transform: rotate(360deg) } }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 20px ${role === "tenant" ? "rgba(0,92,171,.3)" : "rgba(113,42,226,.3)"} }
          50% { box-shadow: 0 0 50px ${role === "tenant" ? "rgba(0,92,171,.6)" : "rgba(113,42,226,.6)"} }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>

      <div className="relative w-20 h-20">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: `3px solid ${isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)"}`,
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: `3px solid transparent`,
            borderTopColor: role === "tenant" ? "#005cab" : "#712ae2",
            borderRightColor:
              role === "tenant" ? "rgba(0,92,171,.3)" : "rgba(113,42,226,.3)",
            animation: "spinLoader 1s cubic-bezier(.4,0,.2,1) infinite",
          }}
        />
        <div
          className="absolute inset-3 rounded-full flex items-center justify-center"
          style={{
            background: isDark
              ? "rgba(255,255,255,.03)"
              : "rgba(255,255,255,.5)",
            animation: "pulseGlow 2s ease-in-out infinite",
          }}
        >
          {role === "tenant" ? (
            <IoGlobeOutline className="text-2xl" style={{ color: "#005cab" }} />
          ) : (
            <IoBusinessOutline
              className="text-2xl"
              style={{ color: "#712ae2" }}
            />
          )}
        </div>
      </div>

      <div
        className="flex flex-col items-center gap-2"
        style={{ animation: "fadeInUp .5s ease both .2s" }}
      >
        <p
          className={`text-sm font-semibold tracking-[.15em] uppercase ${isDark ? "text-white/70" : "text-slate-700"}`}
        >
          {role === "tenant" ? t("loading.tenant") : t("loading.owner")}
        </p>
        <p
          className={`text-[10px] tracking-[.3em] uppercase ${isDark ? "text-white/25" : "text-slate-400"}`}
        >
          {t("loading.preparing")}
        </p>
      </div>
    </div>
  );
}

// ─── Dual-Role Modal ───
function DualRoleModal({
  isDark,
  onClose,
  onNavigate,
  t,
}: {
  isDark: boolean;
  onClose: () => void;
  onNavigate: (role: "tenant" | "owner") => void;
  t: any;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
      <style>{`
        @keyframes modalBgIn { from{opacity:0} to{opacity:1} }
        @keyframes modalIn { from{opacity:0;transform:scale(.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{
          background: isDark ? "rgba(0,0,0,.7)" : "rgba(0,0,0,.3)",
          backdropFilter: "blur(8px)",
          animation: "modalBgIn .3s ease both",
        }}
      />
      <div
        className="relative w-full max-w-md rounded-3xl p-8 sm:p-10"
        style={{
          background: isDark ? "rgba(15,15,25,.95)" : "rgba(255,255,255,.95)",
          border: isDark
            ? "1px solid rgba(255,255,255,.1)"
            : "1px solid rgba(139,92,246,.15)",
          boxShadow: isDark
            ? "0 30px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.05)"
            : "0 30px 80px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.8)",
          animation: "modalIn .4s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isDark
              ? "hover:bg-white/10 text-white/40"
              : "hover:bg-slate-100 text-slate-400"
          }`}
        >
          <IoCloseOutline className="text-xl" />
        </button>

        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(0,92,171,.2), rgba(113,42,226,.2))"
                : "linear-gradient(135deg, rgba(0,92,171,.1), rgba(113,42,226,.1))",
            }}
          >
            <IoSwapHorizontalOutline
              className="text-3xl"
              style={
                {
                  background: "linear-gradient(135deg, #005cab, #712ae2)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                } as React.CSSProperties
              }
            />
          </div>
        </div>

        <h3
          className={`text-center text-xl sm:text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
        >
          {t("modal.title")}
        </h3>
        <p
          className={`text-center text-sm mb-8 leading-relaxed ${isDark ? "text-white/40" : "text-slate-500"}`}
        >
          {t("modal.description")}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => onNavigate("tenant")}
            className="group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer"
            style={{
              background: isDark ? "rgba(0,92,171,.08)" : "rgba(0,92,171,.05)",
              border: isDark
                ? "1px solid rgba(0,92,171,.15)"
                : "1px solid rgba(0,92,171,.12)",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: isDark
                  ? "rgba(0,92,171,.25)"
                  : "rgba(0,92,171,.12)",
              }}
            >
              <IoGlobeOutline
                className="text-xl"
                style={{ color: "#005cab" }}
              />
            </div>
            <div className="flex-1 text-left">
              <p
                className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {t("modal.tenant")}
              </p>
              <p
                className={`text-[11px] ${isDark ? "text-white/35" : "text-slate-400"}`}
              >
                {t("modal.tenantDesc")}
              </p>
            </div>
            <IoArrowForwardOutline
              className="text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ color: "#005cab" }}
            />
          </button>

          <button
            onClick={() => onNavigate("owner")}
            className="group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer"
            style={{
              background: isDark
                ? "rgba(113,42,226,.08)"
                : "rgba(113,42,226,.05)",
              border: isDark
                ? "1px solid rgba(113,42,226,.15)"
                : "1px solid rgba(113,42,226,.12)",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: isDark
                  ? "rgba(113,42,226,.25)"
                  : "rgba(113,42,226,.12)",
              }}
            >
              <IoBusinessOutline
                className="text-xl"
                style={{ color: "#712ae2" }}
              />
            </div>
            <div className="flex-1 text-left">
              <p
                className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {t("modal.owner")}
              </p>
              <p
                className={`text-[11px] ${isDark ? "text-white/35" : "text-slate-400"}`}
              >
                {t("modal.ownerDesc")}
              </p>
            </div>
            <IoArrowForwardOutline
              className="text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ color: "#712ae2" }}
            />
          </button>

          <button
            onClick={onClose}
            className={`mt-2 py-3 rounded-xl text-xs font-semibold tracking-[.15em] uppercase transition-colors ${
              isDark
                ? "text-white/40 hover:text-white/70 hover:bg-white/[.04]"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            <IoHomeOutline className="inline mr-2 text-sm -mt-px" />
            {t("modal.stay")}
          </button>
        </div>
      </div>
    </div>
  );
}

const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

/* ═══════════════════════════════════════════════ MAIN PAGE - UI ONLY ═══════════════════════════════════════════════ */
export default function UpgradeRolePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  const { resolvedTheme } = useTheme();
  const {
    mounted,
    selecting,
    loadingRole,
    showDualModal,
    switcherActive,
    upgrading,
    toast,
    isBoth,
    profilePictureUrl,
    showToast,
    handleSelect,
    handleSwitcherClick,
    handleModalNavigate,
    handleModalClose,
    t,
    user,
  } = useUpgradeRole(locale);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  if (loadingRole || upgrading) {
    return <LoadingSpinner role={loadingRole || "tenant"} t={t} />;
  }

  return (
    <>
      <div
        className="fixed inset-0 transition-colors duration-700"
        style={{
          background: isDark
            ? "radial-gradient(circle at 50% 50%, #1a1c2c 0%, #050505 100%)"
            : "radial-gradient(circle at 50% 50%, #ede9fe 0%, #f8f7ff 100%)",
        }}
      >
        <style>{`
          @keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
          @keyframes floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
          @keyframes orbGlow {
            0%,100%{filter:drop-shadow(0 0 20px rgba(113,42,226,.3))}
            50%{filter:drop-shadow(0 0 50px rgba(0,92,171,.6))}
          }
          @keyframes orbGlowLight {
            0%,100%{filter:drop-shadow(0 0 15px rgba(139,92,246,.15))}
            50%{filter:drop-shadow(0 0 40px rgba(99,102,241,.25))}
          }
          @keyframes spinSlow { to{transform:rotate(360deg)} }
          @keyframes spinReverse { to{transform:rotate(-360deg)} }
          @keyframes portalPulse { 0%,100%{opacity:.12} 50%{opacity:.2} }
          @keyframes portalPulseLight { 0%,100%{opacity:.04} 50%{opacity:.08} }
          @keyframes fadeIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
          @keyframes titleGlow { 0%,100%{text-shadow:0 0 20px rgba(0,92,171,.3)} 50%{text-shadow:0 0 40px rgba(113,42,226,.5)} }
          .fl-a { animation: floatA 6s ease-in-out infinite }
          .fl-b { animation: floatB 6s ease-in-out infinite; animation-delay: -2s }
          .orb-glow-dark { animation: orbGlow 4s ease-in-out infinite }
          .orb-glow-light { animation: orbGlowLight 4s ease-in-out infinite }
          .spin-s { animation: spinSlow 10s linear infinite }
          .spin-r { animation: spinReverse 15s linear infinite }
          .spin-s2 { animation: spinSlow 22s linear infinite }
          .fi { animation: fadeIn .8s cubic-bezier(.22,1,.36,1) both }
          .fi1{animation-delay:.1s}.fi2{animation-delay:.2s}.fi3{animation-delay:.35s}
          .fi4{animation-delay:.5s}.fi5{animation-delay:.65s}
          .title-glow { animation: titleGlow 3s ease-in-out infinite }
          .selecting { opacity:0; transform:scale(1.05); transition: all .6s ease }
        `}</style>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => showToast("", "info")}
          />
        )}

        {/* AMBIENT */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh]"
            style={{
              background: isDark
                ? "radial-gradient(circle at 50% 50%, rgba(113,66,225,.15) 0%, transparent 70%)"
                : "radial-gradient(circle at 50% 50%, rgba(139,92,246,.08) 0%, transparent 70%)",
              animation: isDark
                ? "portalPulse 8s ease-in-out infinite"
                : "portalPulseLight 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px]"
            style={{
              background: isDark ? "rgba(0,92,171,.1)" : "rgba(99,102,241,.08)",
            }}
          />
          <div
            className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px]"
            style={{
              background: isDark
                ? "rgba(113,42,226,.1)"
                : "rgba(139,92,246,.06)",
            }}
          />
        </div>

        {/* HEADER */}
        <header className="fixed top-0 w-full z-50">
          <nav className="flex justify-between items-center px-6 sm:px-12 h-20 sm:h-24 max-w-[1900px] mx-auto">
            <div className="flex items-center gap-2 flex-shrink-0 select-none">
              <img
                src="/logo/logo.png"
                alt="NESTHUB"
                className="h-23 w-auto object-contain scale-140 mt-6.5"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent -ml-10 mt-2.5">
                N E S T H U B
              </h1>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <div
                className={`w-13 h-13 rounded-full p-0.5 overflow-hidden border ${
                  isDark ? "border-white/15" : "border-slate-500"
                }`}
              >
                {profilePictureUrl ? (
                  <img
                    src={pipAvatar(profilePictureUrl)}
                    alt="Profile"
                    className={`w-full h-full rounded-full object-cover ${
                      isDark ? "opacity-70" : "opacity-90"
                    }`}
                    onError={(e) => {
                      console.error(
                        "Failed to load avatar:",
                        profilePictureUrl,
                      );
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    className={`w-full h-full rounded-full flex items-center justify-center ${
                      isDark ? "bg-white/10" : "bg-slate-100"
                    }`}
                  >
                    <span
                      className={`text-xs font-medium ${isDark ? "text-white/50" : "text-slate-500"}`}
                    >
                      {user?.firstName?.[0]?.toUpperCase() ||
                        user?.lastName?.[0]?.toUpperCase() ||
                        "U"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </header>

        {/* MAIN */}
        <main
          className={`relative z-10 h-full w-full flex flex-col items-center justify-center px-4 sm:px-6 ${
            selecting ? "selecting" : ""
          }`}
        >
          <div className="relative w-full max-w-7xl flex flex-col items-center">
            {/* Titre */}
            <div className="text-center mb-12 sm:mb-16 space-y-4 fi fi1">
              <h1
                className={`text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.95] font-black italic mt-25 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: isDark
                      ? "linear-gradient(to right, #005cab, white, #712ae2)"
                      : "linear-gradient(to right, #005cab, #4f46e5, #712ae2)",
                  }}
                >
                  {t("title.part1")}
                </span>
                <br />
                <span
                  className="bg-clip-text text-transparent title-glow"
                  style={{
                    backgroundImage: isDark
                      ? "linear-gradient(to right, #712ae2, white, #005cab)"
                      : "linear-gradient(to right, #712ae2, #4f46e5, #005cab)",
                  }}
                >
                  {t("title.part2")}
                </span>
              </h1>

              <p
                className={`mt-4 sm:mt-6 text-sm sm:text-base max-w-2xl mx-auto font-light leading-relaxed ${
                  isDark ? "text-white/40" : "text-slate-500"
                }`}
              >
                {isBoth ? t("subtitle.both") : t("subtitle.upgrade")}
              </p>
            </div>

            {/* Nexus core - Boutons TENANT et OWNER */}
            <div className="relative flex items-center justify-center w-full h-[380px] sm:h-[400px]">
              {/* Left: TENANT */}
              <div className="absolute left-0 md:left-16 lg:left-20 z-10 fi fi2">
                <button
                  onClick={() => handleSelect("tenant")}
                  className="group text-left fl-a cursor-pointer"
                >
                  <div
                    className="p-6 sm:p-8 rounded-2xl w-[260px] sm:w-[290px] transition-all duration-500 group-hover:scale-[1.03]"
                    style={{
                      background: isDark
                        ? "rgba(255,255,255,.03)"
                        : "rgba(255,255,255,.6)",
                      backdropFilter: "blur(20px)",
                      border: isDark
                        ? "1px solid rgba(255,255,255,.08)"
                        : "1px solid rgba(255,255,255,.8)",
                    }}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 mb-4">
                      <div
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                        style={{
                          background: isDark
                            ? "rgba(0,92,171,.2)"
                            : "rgba(0,92,171,.1)",
                        }}
                      >
                        <IoGlobeOutline
                          className="text-lg sm:text-xl"
                          style={{ color: "#005cab" }}
                        />
                      </div>
                      <h3
                        className={`text-xl sm:text-2xl italic font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {t("tenant.title")}
                      </h3>
                    </div>
                    <p
                      className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-white/35" : "text-slate-500"}`}
                    >
                      {t("tenant.description")}
                    </p>
                    <div
                      className="mt-5 flex items-center gap-2 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ color: "#005cab" }}
                    >
                      {t("tenant.explore")}{" "}
                      <IoArrowForwardOutline className="text-[10px]" />
                    </div>
                  </div>
                </button>
              </div>

              {/* Center: Orb */}
              <div className="relative z-20 fi fi3">
                <div
                  className={`w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 rounded-full backdrop-blur-[60px] flex items-center justify-center ${
                    isDark ? "orb-glow-dark" : "orb-glow-light"
                  }`}
                  style={{
                    background: isDark
                      ? "radial-gradient(circle at 30% 30%, rgba(255,255,255,.15) 0%, rgba(255,255,255,.04) 50%, transparent 100%)"
                      : "radial-gradient(circle at 30% 30%, rgba(255,255,255,.9) 0%, rgba(255,255,255,.4) 50%, transparent 100%)",
                    boxShadow: isDark
                      ? "inset 0 0 50px rgba(255,255,255,.08), 0 0 80px rgba(113,42,226,.25), 0 0 120px rgba(0,92,171,.15)"
                      : "inset 0 0 50px rgba(255,255,255,.5), 0 0 60px rgba(139,92,246,.1), 0 0 100px rgba(99,102,241,.08), 0 20px 60px rgba(0,0,0,.04)",
                  }}
                >
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden"
                    style={{
                      border: isDark
                        ? "1px solid rgba(255,255,255,.08)"
                        : "1px solid rgba(139,92,246,.12)",
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-full spin-s"
                      style={{
                        border: isDark
                          ? "1px solid rgba(255,255,255,.04)"
                          : "1px solid rgba(139,92,246,.08)",
                      }}
                    />
                    <div
                      className="absolute inset-4 rounded-full spin-r"
                      style={{
                        border: isDark
                          ? "1px solid rgba(255,255,255,.04)"
                          : "1px solid rgba(139,92,246,.06)",
                      }}
                    />
                    <div
                      className="absolute inset-8 rounded-full spin-s2"
                      style={{
                        border: isDark
                          ? "1px solid rgba(255,255,255,.03)"
                          : "1px solid rgba(139,92,246,.04)",
                      }}
                    />
                    <IoSparklesOutline
                      className={`text-4xl sm:text-5xl relative z-10 ${
                        isDark ? "text-white/70" : "text-violet-400/60"
                      }`}
                    />
                  </div>
                </div>
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-px rotate-45 pointer-events-none"
                  style={{
                    background: isDark
                      ? "linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent)"
                      : "linear-gradient(90deg,transparent,rgba(139,92,246,.12),transparent)",
                  }}
                />
              </div>

              {/* Right: OWNER */}
              <div className="absolute right-0 md:right-16 lg:right-20 z-10 fi fi4">
                <button
                  onClick={() => handleSelect("owner")}
                  className="group text-left fl-b cursor-pointer"
                >
                  <div
                    className="p-6 sm:p-8 rounded-2xl w-[260px] sm:w-[290px] transition-all duration-500 group-hover:scale-[1.03]"
                    style={{
                      background: isDark
                        ? "rgba(255,255,255,.03)"
                        : "rgba(255,255,255,.6)",
                      backdropFilter: "blur(20px)",
                      border: isDark
                        ? "1px solid rgba(255,255,255,.08)"
                        : "1px solid rgba(255,255,255,.8)",
                    }}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 mb-4">
                      <div
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                        style={{
                          background: isDark
                            ? "rgba(113,42,226,.2)"
                            : "rgba(113,42,226,.1)",
                        }}
                      >
                        <IoBusinessOutline
                          className="text-lg sm:text-xl"
                          style={{ color: "#712ae2" }}
                        />
                      </div>
                      <h3
                        className={`text-xl sm:text-2xl italic font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {t("owner.title")}
                      </h3>
                    </div>
                    <p
                      className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-white/35" : "text-slate-500"}`}
                    >
                      {t("owner.description")}
                    </p>
                    <div
                      className="mt-5 flex items-center gap-2 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ color: "#712ae2" }}
                    >
                      {t("owner.manage")}{" "}
                      <IoArrowForwardOutline className="text-[10px]" />
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Switcher / Upgrade Button */}
            <div className="mb-18 sm:mt-20 flex flex-col items-center gap-6 sm:gap-8 fi fi5">
              <button
                onClick={handleSwitcherClick}
                className={`relative group active:scale-95 transition-all duration-300 ${switcherActive ? "scale-105" : ""}`}
              >
                <div
                  className="absolute -inset-1 rounded-full blur transition-all duration-700 group-hover:duration-200"
                  style={{
                    background: "linear-gradient(90deg,#005cab,#712ae2)",
                    opacity: isDark
                      ? switcherActive
                        ? 0.5
                        : 0.2
                      : switcherActive
                        ? 0.35
                        : 0.15,
                  }}
                />
                <div
                  className="absolute -inset-1 rounded-full blur opacity-0 group-hover:opacity-60 transition-all duration-200"
                  style={{
                    background: "linear-gradient(90deg,#005cab,#712ae2)",
                  }}
                />
                <div
                  className={`relative rounded-full flex items-center transition-all duration-500 ${
                    switcherActive
                      ? "px-10 sm:px-14 py-5 sm:py-7 gap-5 sm:gap-7"
                      : "px-8 sm:px-12 py-4 sm:py-6 gap-4 sm:gap-6"
                  }`}
                  style={{
                    background: isDark
                      ? "rgba(2,6,15,.95)"
                      : "rgba(255,255,255,.85)",
                    border: isDark
                      ? `1px solid rgba(255,255,255,${switcherActive ? ".15" : ".08"})`
                      : `1px solid rgba(139,92,246,${switcherActive ? ".25" : ".15"})`,
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <span
                    className={`font-semibold uppercase tracking-[.25em] transition-all duration-500 ${
                      switcherActive
                        ? `text-[10px] sm:text-[11px] ${isDark ? "text-white/70" : "text-slate-600"}`
                        : `text-[9px] sm:text-[10px] ${isDark ? "text-white/50" : "text-slate-500"}`
                    }`}
                  >
                    {isBoth ? t("button.initialize") : t("button.activate")}
                  </span>

                  <div
                    className={`rounded-full relative overflow-hidden transition-all duration-500 ${
                      switcherActive
                        ? "w-14 sm:w-16 h-7 sm:h-8 p-1"
                        : "w-12 sm:w-14 h-6 sm:h-7 p-0.5 sm:p-1"
                    }`}
                  >
                    <div
                      className={`absolute left-1 top-1 rounded-full transition-all duration-500 ${
                        switcherActive
                          ? "w-5 sm:w-6 h-5 sm:h-6 translate-x-7 sm:translate-x-8"
                          : "w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-6 sm:group-hover:translate-x-7"
                      }`}
                      style={{
                        background: switcherActive
                          ? "linear-gradient(135deg,#005cab,#712ae2)"
                          : isDark
                            ? "linear-gradient(135deg,white,#a0a0b0)"
                            : "linear-gradient(135deg,#8b5cf6,#6366f1)",
                      }}
                    />
                  </div>

                  <span
                    className={`font-semibold uppercase tracking-[.25em] transition-all duration-500 ${
                      switcherActive
                        ? `text-[10px] sm:text-[11px] ${isDark ? "text-white" : "text-slate-900"}`
                        : `text-[9px] sm:text-[10px] ${isDark ? "text-white" : "text-slate-900"}`
                    }`}
                  >
                    {t("button.dualIdentity")}
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className={`w-6 sm:w-8 h-px ${isDark ? "bg-white/[.08]" : "bg-slate-500"}`}
                />
                <span
                  className={`text-[8px] sm:text-[9px] tracking-[.4em] sm:tracking-[.5em] uppercase ${
                    isDark ? "text-white/20" : "text-slate-500"
                  }`}
                >
                  {isBoth ? t("footer.tagline") : t("footer.free")}
                </span>
                <div
                  className={`w-6 sm:w-8 h-px ${isDark ? "bg-white/[.08]" : "bg-slate-500"}`}
                />
              </div>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="fixed bottom-0 w-full z-40">
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 sm:px-12 py-5 sm:py-8 max-w-[1800px] mx-auto">
            <span
              className={`text-[8px] sm:text-[9px] tracking-[.2em] uppercase ${isDark ? "text-white/20" : "text-slate-500"}`}
            >
              © 2026 NESTHUB . {t("footer.rights")}
            </span>
            <div className="flex gap-6 sm:gap-10 mt-3 sm:mt-0">
              {[
                { href: `/${locale}/privacy`, label: t("footer.privacy") },
                { href: `/${locale}/terms`, label: t("footer.terms") },
                {
                  href: `/${locale}/#contact-section`,
                  label: t("footer.contact"),
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[8px] sm:text-[9px] tracking-[.15em] sm:tracking-[.2em] uppercase transition-colors ${
                    isDark
                      ? "text-white/20 hover:text-white/50"
                      : "text-slate-500 hover:text-slate-600"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {showDualModal && (
        <DualRoleModal
          isDark={isDark}
          onClose={handleModalClose}
          onNavigate={handleModalNavigate}
          t={t}
        />
      )}
    </>
  );
}
