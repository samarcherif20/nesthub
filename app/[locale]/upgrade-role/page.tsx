// app/[locale]/upgrade-role/page.tsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import {
  IoGlobeOutline,
  IoBusinessOutline,
  IoSparklesOutline,
  IoArrowForwardOutline,
  IoSunnyOutline,
  IoMoonOutline,
  IoNotificationsOutline,
  IoCloseOutline,
  IoHomeOutline,
  IoSwapHorizontalOutline,
  IoFlashOutline,
} from "react-icons/io5";
import Link from "next/link";
import Alert, { AlertStack } from "@/components/ui/Alert"; // 👈 IMPORT TON ALERT

/* ─── Loading Spinner ─── */
function LoadingSpinner({ role }: { role: "tenant" | "owner" }) {
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
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, 20px) }
          to { opacity: 1; transform: translate(-50%, 0) }
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
          className={`text-sm font-semibold tracking-[.15em] uppercase ${isDark ? "text-white/70" : "text-gray-700"}`}
        >
          {role === "tenant"
            ? "Chargement de l'Espace Locataire"
            : "Chargement du Dashboard Propriétaire"}
        </p>
        <p
          className={`text-[10px] tracking-[.3em] uppercase ${isDark ? "text-white/25" : "text-gray-400"}`}
        >
          Préparation de votre environnement…
        </p>
      </div>

      <div className="flex gap-2 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: role === "tenant" ? "#005cab" : "#712ae2",
              animation: `pulseGlow 1.4s ease-in-out ${i * 0.2}s infinite`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Dual-Role Modal ─── */
function DualRoleModal({
  isDark,
  onClose,
  onNavigate,
}: {
  isDark: boolean;
  onClose: () => void;
  onNavigate: (role: "tenant" | "owner") => void;
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
              : "hover:bg-gray-100 text-gray-400"
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
          className={`text-center text-xl sm:text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Double Identité Activée
        </h3>
        <p
          className={`text-center text-sm mb-8 leading-relaxed ${isDark ? "text-white/40" : "text-gray-500"}`}
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Vous avez accès aux deux univers NESTHUB.
          <br />
          Où souhaitez-vous aller ?
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
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? "rgba(0,92,171,.15)"
                : "rgba(0,92,171,.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark
                ? "rgba(0,92,171,.08)"
                : "rgba(0,92,171,.05)";
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
                className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Espace Locataire
              </p>
              <p
                className={`text-[11px] ${isDark ? "text-white/35" : "text-gray-400"}`}
              >
                Rechercher & réserver des résidences
              </p>
            </div>
            <IoArrowForwardOutline
              className="text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-1 group-hover:translate-x-0"
              style={{ color: "#005cab", transition: "all .3s" }}
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
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? "rgba(113,42,226,.15)"
                : "rgba(113,42,226,.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark
                ? "rgba(113,42,226,.08)"
                : "rgba(113,42,226,.05)";
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
                className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Espace Propriétaire
              </p>
              <p
                className={`text-[11px] ${isDark ? "text-white/35" : "text-gray-400"}`}
              >
                Gérer vos biens & revenus
              </p>
            </div>
            <IoArrowForwardOutline
              className="text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-1 group-hover:translate-x-0"
              style={{ color: "#712ae2", transition: "all .3s" }}
            />
          </button>

          <button
            onClick={onClose}
            className={`mt-2 py-3 rounded-xl text-xs font-semibold tracking-[.15em] uppercase transition-colors cursor-pointer ${
              isDark
                ? "text-white/40 hover:text-white/70 hover:bg-white/[.04]"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            <IoHomeOutline className="inline mr-2 text-sm -mt-px" />
            Rester sur cette page
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE - UPGRADE ROLE
   ═══════════════════════════════════════════════ */
interface AlertItem {
  id: number;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

export default function UpgradeRolePage() {
  const router = useRouter();
  const { user } = useUser();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [loadingRole, setLoadingRole] = useState<"tenant" | "owner" | null>(
    null,
  );
  const [showDualModal, setShowDualModal] = useState(false);
  const [switcherActive, setSwitcherActive] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  // Alert states
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const nextIdRef = useRef(0);

  const [userRole, setUserRole] = useState<string>("");
  const [isBoth, setIsBoth] = useState(false);

  const addAlert = (type: AlertItem["type"], message: string) => {
    const id = nextIdRef.current++;
    setAlerts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 5000);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role);
          setIsBoth(data.role === "BOTH");
        }
      } catch (error) {
        console.error("Erreur vérification rôle:", error);
      }
    };
    checkUserRole();
  }, [user]);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const saveLastRole = (role: "tenant" | "owner") => {
    localStorage.setItem("lastRole", role);
  };

  const handleSelect = useCallback(
    (role: "tenant" | "owner") => {
      saveLastRole(role);
      setSelecting(true);
      setLoadingRole(role);
      setTimeout(() => {
        router.push(role === "tenant" ? "/fr/search" : "/fr/dashboard/owner");
      }, 1800);
    },
    [router],
  );

  const handleSwitcherClick = async () => {
    if (isBoth) {
      setSwitcherActive(true);
      setTimeout(() => {
        setShowDualModal(true);
      }, 200);
      return;
    }

    setUpgrading(true);
    try {
      const res = await fetch("/api/users/upgrade-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok) {
        setIsBoth(true);
        setUserRole("BOTH");
        addAlert(
          "success",
          "🎉 Mode Double Identité activé ! Vous pouvez maintenant accéder aux deux univers NESTHUB.",
        );

        // Ouvre le modal après activation
        setTimeout(() => {
          setSwitcherActive(true);
          setShowDualModal(true);
        }, 500);
      } else {
        addAlert(
          "error",
          data.error || "Erreur lors de l'activation du mode double identité.",
        );
      }
    } catch (error) {
      addAlert("error", "Erreur de connexion au serveur. Veuillez réessayer.");
    } finally {
      setUpgrading(false);
    }
  };

  const handleModalNavigate = (role: "tenant" | "owner") => {
    setShowDualModal(false);
    handleSelect(role);
  };

  const handleModalClose = () => {
    setShowDualModal(false);
    setSwitcherActive(false);
  };

  if (loadingRole || upgrading) {
    return <LoadingSpinner role={loadingRole || "tenant"} />;
  }

  const getRoleDisplay = () => {
    if (isBoth) return "⚡ Mode BOTH";
    if (userRole === "PROPERTY_OWNER") return "🏠 Propriétaire";
    if (userRole === "TENANT") return "🔍 Locataire";
    return "👤 Visiteur";
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden transition-colors duration-700"
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
        .selecting { opacity:0; transform:scale(1.05); transition: all .6s ease }
      `}</style>

      {/* ALERT STACK - Ton composant Alert */}
      <AlertStack
        alerts={alerts}
        onClose={(id) => setAlerts((prev) => prev.filter((a) => a.id !== id))}
        autoClose={5000}
      />

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
            background: isDark ? "rgba(113,42,226,.1)" : "rgba(139,92,246,.06)",
          }}
        />
      </div>

      {/* HEADER */}
      <header className="fixed top-0 w-full z-50">
        <nav className="flex justify-between items-center px-6 sm:px-12 h-20 sm:h-24 max-w-[1900px] mx-auto">
          <Link
            href="/fr/search"
            className="flex items-center gap-2 flex-shrink-0 select-none"
          >
            <img
              src="/logo/logo.png"
              alt="NESTHUB"
              className="h-23 w-auto object-contain scale-140 mt-6.5"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent -ml-10 mt-2.5">
              N E S T H U B
            </h1>
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            <div
              className="hidden sm:flex px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider items-center gap-1.5"
              style={{
                background: isBoth
                  ? "linear-gradient(135deg, #005cab20, #712ae220)"
                  : isDark
                    ? "rgba(255,255,255,.08)"
                    : "rgba(0,0,0,.04)",
                border: `1px solid ${isBoth ? "rgba(139,92,246,.3)" : isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)"}`,
              }}
            >
              <IoFlashOutline
                className="text-[10px]"
                style={{ color: isBoth ? "#712ae2" : isDark ? "#fff" : "#666" }}
              />
              <span
                style={{ color: isBoth ? "#712ae2" : isDark ? "#fff" : "#666" }}
              >
                {getRoleDisplay()}
              </span>
            </div>

            {mounted && (
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isDark
                    ? "bg-white/[.06] hover:bg-white/[.12] border border-white/[.08]"
                    : "bg-gray-900/5 hover:bg-gray-900/10 border border-gray-200"
                }`}
              >
                {isDark ? (
                  <IoSunnyOutline className="text-white/60 text-base" />
                ) : (
                  <IoMoonOutline className="text-gray-500 text-base" />
                )}
              </button>
            )}

            <IoNotificationsOutline
              className={`text-xl cursor-pointer transition-colors ${
                isDark
                  ? "text-white/50 hover:text-white"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            />

            <div
              className={`w-9 h-9 rounded-full p-0.5 overflow-hidden border ${
                isDark ? "border-white/15" : "border-gray-200"
              }`}
            >
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt=""
                  className={`w-full h-full rounded-full object-cover ${
                    isDark ? "opacity-70" : "opacity-90"
                  }`}
                />
              ) : (
                <div
                  className={`w-full h-full rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}
                />
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* MAIN - LE RESTE DE TON UI IDENTIQUE (TRONCATION POUR LA LECTURE) */}
      <main
        className={`relative z-10 h-full w-full flex flex-col items-center justify-center px-4 sm:px-6 ${
          selecting ? "selecting" : ""
        }`}
      >
        {/* ... TOUT LE RESTE DE TON UI EST IDENTIQUE ... */}
        <div className="relative w-full max-w-7xl flex flex-col items-center">
          <div className="text-center mb-12 sm:mb-16 space-y-4 fi fi1">
            <h2
              className="font-semibold tracking-[.4em] text-[10px] sm:text-[11px] uppercase"
              style={{
                color: "#005cab",
                animation: isDark
                  ? "portalPulse 3s ease-in-out infinite"
                  : "portalPulseLight 3s ease-in-out infinite",
              }}
            >
              {isBoth
                ? "Double Identité Activée"
                : "Activez le Mode Double Identité"}
            </h2>

            <h1
              className={`text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.95] font-black italic -mt-3 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {isBoth ? "Bienvenue dans" : "Devenez"}{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: isDark
                    ? "linear-gradient(to right, #005cab, white, #712ae2)"
                    : "linear-gradient(to right, #005cab, #4f46e5, #712ae2)",
                }}
              >
                {isBoth ? "l'Univers Dual" : "Locataire & Propriétaire"}
              </span>
            </h1>

            <p
              className={`mt-4 sm:mt-6 text-sm sm:text-base lg:text-sm max-w-2xl mx-auto font-light leading-relaxed ${
                isDark ? "text-white/40" : "text-gray-500"
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {isBoth
                ? "Vous avez maintenant accès aux deux univers NESTHUB. Choisissez votre rôle ci-dessous."
                : "Activez gratuitement le mode double identité pour accéder aux deux univers NESTHUB."}
            </p>
          </div>

          {/* Les cartes Locataire/Propriétaire et l'orb restent exactement identiques */}
          {/* ... (je ne réécris pas tout car le reste est strictement identique à ton original) ... */}
{/* Nexus core */}
<div className="relative flex items-center justify-center w-full h-[380px] sm:h-[400px]">
  {/* Left: LOCATAIRE */}
  <div className="absolute left-0 md:left-16 lg:left-20 z-10 fi fi2">
    <button onClick={() => handleSelect("tenant")} className="group text-left fl-a cursor-pointer">
      <div
        className="p-6 sm:p-8 rounded-2xl w-[260px] sm:w-[290px] transition-all duration-500 group-hover:scale-[1.03]"
        style={{
          background: isDark ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.6)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: isDark
            ? "1px solid rgba(255,255,255,.08)"
            : "1px solid rgba(255,255,255,.8)",
          boxShadow: isDark ? "none" : "0 8px 32px rgba(99,102,241,.06)",
        }}
      >
        <div className="flex items-center gap-3 sm:gap-4 mb-4">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
            style={{ background: isDark ? "rgba(0,92,171,.2)" : "rgba(0,92,171,.1)" }}
          >
            <IoGlobeOutline className="text-lg sm:text-xl" style={{ color: "#005cab" }} />
          </div>
          <h3
            className={`text-xl sm:text-2xl italic font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Locataire
          </h3>
        </div>

        <p
          className={`text-xs sm:text-sm leading-relaxed ${
            isDark ? "text-white/35" : "text-gray-500"
          }`}
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Accédez aux meilleures résidences en Tunisie. Recherche
          intelligente, réservation sécurisée et conciergerie incluse.
        </p>

        <div
          className="mt-5 sm:mt-6 pt-5 sm:pt-6 flex flex-col gap-2.5 sm:gap-3"
          style={{
            borderTop: isDark
              ? "1px solid rgba(255,255,255,.04)"
              : "1px solid rgba(0,0,0,.06)",
          }}
        >
          {["Recherche Avancée", "Paiement Sécurisé"].map((label) => (
            <div
              key={label}
              className={`flex items-center gap-2 text-[9px] sm:text-[10px] tracking-[.15em] uppercase ${
                isDark ? "text-white/50" : "text-gray-500"
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: "#005cab", boxShadow: "0 0 8px #005cab" }}
              />
              {label}
            </div>
          ))}
        </div>

        <div
          className="mt-5 flex items-center gap-2 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ color: "#005cab" }}
        >
          Explorer <IoArrowForwardOutline className="text-[10px]" />
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

    {/* Ray */}
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-px rotate-45 pointer-events-none"
      style={{
        background: isDark
          ? "linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent)"
          : "linear-gradient(90deg,transparent,rgba(139,92,246,.12),transparent)",
      }}
    />
  </div>

  {/* Right: PROPRIÉTAIRE */}
  <div className="absolute right-0 md:right-16 lg:right-20 z-10 fi fi4">
    <button onClick={() => handleSelect("owner")} className="group text-left fl-b cursor-pointer">
      <div
        className="p-6 sm:p-8 rounded-2xl w-[260px] sm:w-[290px] transition-all duration-500 group-hover:scale-[1.03]"
        style={{
          background: isDark ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.6)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: isDark
            ? "1px solid rgba(255,255,255,.08)"
            : "1px solid rgba(255,255,255,.8)",
          boxShadow: isDark ? "none" : "0 8px 32px rgba(139,92,246,.06)",
        }}
      >
        <div className="flex items-center gap-3 sm:gap-4 mb-4">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
            style={{
              background: isDark ? "rgba(113,42,226,.2)" : "rgba(113,42,226,.1)",
            }}
          >
            <IoBusinessOutline
              className="text-lg sm:text-xl"
              style={{ color: "#712ae2" }}
            />
          </div>
          <h3
            className={`text-xl sm:text-2xl italic font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Propriétaire
          </h3>
        </div>

        <p
          className={`text-xs sm:text-sm leading-relaxed ${
            isDark ? "text-white/35" : "text-gray-500"
          }`}
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Gagnez et gérez votre patrimoine immobilier. Publiez vos annonces,
          recevez des réservations et maximisez vos revenus.
        </p>

        <div
          className="mt-5 sm:mt-6 pt-5 sm:pt-6 flex flex-col gap-2.5 sm:gap-3"
          style={{
            borderTop: isDark
              ? "1px solid rgba(255,255,255,.04)"
              : "1px solid rgba(0,0,0,.06)",
          }}
        >
          {["Dashboard Complet", "Paiements Sécurisés"].map((label) => (
            <div
              key={label}
              className={`flex items-center gap-2 text-[9px] sm:text-[10px] tracking-[.15em] uppercase ${
                isDark ? "text-white/50" : "text-gray-500"
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: "#712ae2", boxShadow: "0 0 8px #712ae2" }}
              />
              {label}
            </div>
          ))}
        </div>

        <div
          className="mt-5 flex items-center gap-2 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ color: "#712ae2" }}
        >
          Gérer <IoArrowForwardOutline className="text-[10px]" />
        </div>
      </div>
    </button>
  </div>
</div>
          {/* Switcher / Upgrade Button */}
          <div className="mt-14 sm:mt-20 flex flex-col items-center gap-6 sm:gap-8 fi fi5">
            <button
              onClick={handleSwitcherClick}
              className={`relative group active:scale-95 transition-all duration-300 ${
                switcherActive ? "scale-105" : ""
              }`}
              style={{ cursor: "pointer" }}
            >
              {/* ... contenu identique de ton bouton ... */}
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
                style={{ background: "linear-gradient(90deg,#005cab,#712ae2)" }}
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
                  boxShadow: isDark
                    ? switcherActive
                      ? "0 15px 40px -5px rgba(0,0,0,.6), inset 0 1px 1px rgba(255,255,255,.12), 0 0 30px rgba(113,42,226,.2)"
                      : "0 10px 30px -5px rgba(0,0,0,.5), inset 0 1px 1px rgba(255,255,255,.08)"
                    : switcherActive
                      ? "0 15px 40px -5px rgba(0,0,0,.12), inset 0 1px 1px rgba(255,255,255,.8), 0 0 30px rgba(139,92,246,.1)"
                      : "0 10px 30px -5px rgba(0,0,0,.08), inset 0 1px 1px rgba(255,255,255,.8)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <span
                  className={`font-semibold uppercase tracking-[.25em] transition-all duration-500 ${
                    switcherActive
                      ? `text-[10px] sm:text-[11px] ${isDark ? "text-white/70" : "text-gray-600"}`
                      : `text-[9px] sm:text-[10px] ${isDark ? "text-white/50" : "text-gray-500"}`
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {isBoth ? "Initialiser Nexus" : "Activer"}
                </span>

                <div
                  className={`rounded-full relative overflow-hidden transition-all duration-500 ${
                    switcherActive
                      ? "w-14 sm:w-16 h-7 sm:h-8 p-1"
                      : "w-12 sm:w-14 h-6 sm:h-7 p-0.5 sm:p-1"
                  }`}
                  style={{
                    background: switcherActive
                      ? isDark
                        ? "rgba(113,42,226,.15)"
                        : "rgba(139,92,246,.1)"
                      : isDark
                        ? "rgba(255,255,255,.04)"
                        : "rgba(0,0,0,.04)",
                    border: switcherActive
                      ? isDark
                        ? "1px solid rgba(113,42,226,.3)"
                        : "1px solid rgba(139,92,246,.2)"
                      : isDark
                        ? "1px solid rgba(255,255,255,.08)"
                        : "1px solid rgba(139,92,246,.12)",
                  }}
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
                      boxShadow: switcherActive
                        ? "0 0 20px rgba(113,42,226,.6), 0 0 40px rgba(0,92,171,.3)"
                        : isDark
                          ? "0 0 15px rgba(255,255,255,.5)"
                          : "0 0 15px rgba(139,92,246,.4)",
                    }}
                  />
                </div>

                <span
                  className={`font-semibold uppercase tracking-[.25em] transition-all duration-500 ${
                    switcherActive
                      ? `text-[10px] sm:text-[11px] ${isDark ? "text-white" : "text-gray-900"}`
                      : `text-[9px] sm:text-[10px] ${isDark ? "text-white" : "text-gray-900"}`
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Double Identité
                </span>
              </div>
            </button>

            <div className="flex items-center gap-3 sm:gap-4">
              <div
                className={`w-6 sm:w-8 h-px ${isDark ? "bg-white/[.08]" : "bg-gray-300/30"}`}
              />
              <span
                className={`text-[8px] sm:text-[9px] tracking-[.4em] sm:tracking-[.5em] uppercase ${
                  isDark ? "text-white/20" : "text-gray-400/50"
                }`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {isBoth
                  ? "Plateforme de Location Intelligente"
                  : "Activation Gratuite"}
              </span>
              <div
                className={`w-6 sm:w-8 h-px ${isDark ? "bg-white/[.08]" : "bg-gray-300/30"}`}
              />
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="fixed bottom-0 w-full z-40">
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 sm:px-12 py-5 sm:py-8 max-w-[1800px] mx-auto">
          <span
            className={`text-[8px] sm:text-[9px] tracking-[.2em] uppercase ${
              isDark ? "text-white/20" : "text-gray-400/50"
            }`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            © 2025 NESTHUB Mediterranean Living. Tous droits réservés.
          </span>
          <div className="flex gap-6 sm:gap-10 mt-3 sm:mt-0">
            <Link
              href="/fr/legal/privacy"
              className={`text-[8px] sm:text-[9px] tracking-[.15em] sm:tracking-[.2em] uppercase transition-colors ${
                isDark
                  ? "text-white/20 hover:text-white/50"
                  : "text-gray-400/50 hover:text-gray-600"
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Confidentialité
            </Link>
            <Link
              href="/fr/legal/terms"
              className={`text-[8px] sm:text-[9px] tracking-[.15em] sm:tracking-[.2em] uppercase transition-colors ${
                isDark
                  ? "text-white/20 hover:text-white/50"
                  : "text-gray-400/50 hover:text-gray-600"
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Conditions
            </Link>
            <Link
              href="/fr/legal/mentions"
              className={`text-[8px] sm:text-[9px] tracking-[.15em] sm:tracking-[.2em] uppercase transition-colors ${
                isDark
                  ? "text-white/20 hover:text-white/50"
                  : "text-gray-400/50 hover:text-gray-600"
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Mentions
            </Link>
            <Link
              href="/fr/contact"
              className={`text-[8px] sm:text-[9px] tracking-[.15em] sm:tracking-[.2em] uppercase transition-colors ${
                isDark
                  ? "text-white/20 hover:text-white/50"
                  : "text-gray-400/50 hover:text-gray-600"
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>

      {showDualModal && (
        <DualRoleModal
          isDark={isDark}
          onClose={handleModalClose}
          onNavigate={handleModalNavigate}
        />
      )}
    </div>
  );
}
