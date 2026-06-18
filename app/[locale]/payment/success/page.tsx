// app/[locale]/confirmation/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/ui/maps/MapPicker"), {
  ssr: false,
});
import {
  IoCheckmarkCircleOutline,
  IoDocumentTextOutline,
  IoChatbubbleOutline,
  IoLocationOutline,
  IoCallOutline,
  IoInformationCircleOutline,
  IoHomeOutline,
  IoShieldCheckmarkOutline,
  IoArrowForwardOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoPeopleOutline,
  IoLogInOutline,
  IoLogOutOutline,
  IoChevronForwardOutline,
  IoMailOutline,
  IoCardOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoStarSharp,
  IoSparklesOutline,
  IoCloseOutline,
  IoAlertCircleOutline,
  IoFlashOutline,
  IoDiamondOutline,
  IoTrophyOutline,
  IoFingerPrintOutline,
  IoNavigateOutline,
  IoMapOutline,
  IoMoonOutline,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useBookingConfirmation } from "./hooks/useBookingConfirmation";

// ============================================
// UTILS - helpers qui restent en dur (formatage)
// ============================================
function fmtDate(d: string | Date) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function fmtShort(d: string | Date) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}
function fmtPrice(n: number) {
  return n?.toLocaleString("fr-FR") || "0";
}

const pipListing = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

// ============================================
// THEME BACKGROUND
// ============================================
function ThemeBackground() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isDark
            ? "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950"
            : "bg-gradient-to-br from-sky-50 via-white to-indigo-50"
        }`}
      />
      <motion.div
        className={`absolute w-[600px] h-[600px] rounded-full blur-[120px] transition-colors duration-500 ${
          isDark ? "opacity-20" : "opacity-30"
        }`}
        style={{
          background: isDark
            ? "radial-gradient(circle, #4f46e5, #7c3aed, transparent)"
            : "radial-gradient(circle, #0ea5e9, #6366f1, transparent)",
          top: "-10%",
          right: "-5%",
        }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={`absolute w-[500px] h-[500px] rounded-full blur-[100px] transition-colors duration-500 ${
          isDark ? "opacity-15" : "opacity-20"
        }`}
        style={{
          background: isDark
            ? "radial-gradient(circle, #0ea5e9, #6366f1, transparent)"
            : "radial-gradient(circle, #a855f7, #ec4899, transparent)",
          bottom: "-15%",
          left: "-10%",
        }}
        animate={{
          x: [0, -30, 40, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={`absolute w-[400px] h-[400px] rounded-full blur-[80px] transition-colors duration-500 ${
          isDark ? "opacity-10" : "opacity-15"
        }`}
        style={{
          background: isDark
            ? "radial-gradient(circle, #a855f7, #ec4899, transparent)"
            : "radial-gradient(circle, #4f46e5, #7c3aed, transparent)",
          top: "40%",
          left: "30%",
        }}
        animate={{ x: [0, 50, -30, 0], y: [0, -40, 30, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          isDark ? "opacity-[0.03]" : "opacity-[0.02]"
        }`}
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

// ============================================
// CONFETTI
// ============================================
function Confetti() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 2 + Math.random() * 2.5,
    size: 4 + Math.random() * 10,
    color: [
      "#6366f1",
      "#8b5cf6",
      "#a855f7",
      "#06b6d4",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#ec4899",
    ][Math.floor(Math.random() * 8)],
    rotation: Math.random() * 720,
    isCircle: Math.random() > 0.5,
  }));

  const [winHeight, setWinHeight] = useState(0);

  useEffect(() => {
    setWinHeight(window.innerHeight + 50);
    const handleResize = () => setWinHeight(window.innerHeight + 50);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[90] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={p.isCircle ? "rounded-full" : "rounded-sm"}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.size * (p.isCircle ? 1 : 0.6),
            backgroundColor: p.color,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0, x: 0 }}
          animate={{
            y: winHeight,
            opacity: [1, 1, 1, 0],
            rotate: p.rotation,
            x: (Math.random() - 0.5) * 300,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.12, 0.8, 0.4, 1],
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// TOAST
// ============================================
function Toast({
  message,
  type,
  onClose,
  t,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  t: any;
}) {
  useEffect(() => {
    const tm = setTimeout(onClose, 4000);
    return () => clearTimeout(tm);
  }, [onClose]);

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          type === "success"
            ? "bg-green-500 text-white"
            : "bg-red-500 text-white"
        }`}
      >
        {type === "success" ? (
          <IoCheckmarkCircleOutline className="w-5 h-5" />
        ) : (
          <IoAlertCircleOutline className="w-5 h-5" />
        )}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <IoCloseOutline className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// ANIMATED COUNTER
// ============================================
function AnimatedPrice({
  target,
  duration = 1.5,
}: {
  target: number;
  duration?: number;
}) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration]);
  return <>{fmtPrice(current)}</>;
}

// ============================================
// ACCESS CODE DISPLAY
// ============================================
function AccessCodeDisplay({ code, t }: { code: string; t: any }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (!code) return null;
  return (
    <div className="flex gap-2.5">
      {code.split("").map((d, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 15, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.3 + i * 0.08,
            type: "spring",
            stiffness: 300,
            damping: 15,
          }}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg transition-all duration-300 ${
            isDark
              ? "bg-white/[0.04] border-indigo-500/20 text-indigo-400 shadow-indigo-500/10"
              : "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-indigo-200/50"
          } border`}
        >
          {d}
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// SENSITIVE DATA FIELD
// ============================================
function SensitiveField({
  label,
  value,
  icon,
  mono = false,
  gradient = false,
}: {
  label: string;
  value?: string;
  icon: React.ReactNode;
  mono?: boolean;
  gradient?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [revealed, setRevealed] = useState(false);
  if (!value) return null;
  const masked = "•".repeat(value.length);

  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={`text-sm ${isDark ? "text-white/25" : "text-slate-400"}`}
        >
          {icon}
        </span>
        <span
          className={`text-[9px] font-extrabold uppercase tracking-[0.15em] ${
            isDark ? "text-white/30" : "text-slate-400"
          }`}
        >
          {label}
        </span>
        <button
          onClick={() => setRevealed(!revealed)}
          className={`ml-auto p-1 rounded-lg transition-colors ${
            isDark
              ? "text-white/20 hover:text-white/50 hover:bg-white/[0.04]"
              : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
          }`}
        >
          {revealed ? (
            <IoEyeOffOutline className="text-xs" />
          ) : (
            <IoEyeOutline className="text-xs" />
          )}
        </button>
      </div>
      <div
        className={`px-3.5 py-2.5 rounded-xl border transition-colors ${
          isDark
            ? "bg-white/[0.03] border-white/[0.06] group-hover:border-white/[0.1]"
            : "bg-slate-50 border-slate-200 group-hover:border-slate-300"
        }`}
      >
        <p
          className={`text-sm font-bold ${mono ? "font-mono tracking-[0.15em]" : ""} ${
            gradient
              ? "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent"
              : isDark
                ? "text-white/80"
                : "text-slate-700"
          } ${!revealed ? "blur-[4px] select-none" : ""}`}
        >
          {revealed ? value : masked}
        </p>
      </div>
    </div>
  );
}

// ============================================
// PERSON ID CARD (TOUT TRADUIT)
// ============================================
function PersonCard({
  role,
  firstName,
  lastName,
  cinNumber,
  email,
  phone,
  extra,
  verified,
  delay = 0,
  profilePictureUrl,
  t,
}: {
  role: string;
  firstName?: string;
  lastName?: string;
  cinNumber?: string;
  email?: string;
  phone?: string;
  extra?: { label: string; value: string }[];
  verified?: boolean;
  delay?: number;
  profilePictureUrl?: string;
  t: any;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (!firstName) return null;

  const pipProfile = (url: string) =>
    `/api/users/avatar?url=${encodeURIComponent(url)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative"
    >
      <div
        className={`absolute -inset-1 rounded-[28px] blur-lg transition-all duration-300 ${
          isDark
            ? "bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-purple-500/5"
            : "bg-gradient-to-r from-indigo-200/20 via-violet-200/20 to-purple-200/20"
        }`}
      />
      <div
        className={`relative backdrop-blur-xl border rounded-[24px] overflow-hidden transition-all duration-300 ${
          isDark
            ? "bg-white/[0.03] border-white/[0.06]"
            : "bg-white/70 border-white/50 shadow-lg shadow-slate-200/50"
        }`}
      >
        <div
          className={`h-px bg-gradient-to-r from-transparent to-transparent ${
            isDark ? "via-indigo-500/40" : "via-indigo-500/20"
          }`}
        />
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? "border-white/[0.04]" : "border-slate-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-white font-extrabold text-sm shadow-lg ${
                isDark
                  ? "bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-violet-500/20"
                  : "bg-gradient-to-br from-indigo-400 via-violet-400 to-purple-500 shadow-indigo-500/20"
              }`}
            >
              {profilePictureUrl ? (
                <img
                  src={pipProfile(profilePictureUrl)}
                  alt={firstName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = `${firstName.charAt(0)}${lastName?.charAt(0) || ""}`;
                      e.currentTarget.parentElement.className = `w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-lg ${
                        isDark
                          ? "bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-violet-500/20"
                          : "bg-gradient-to-br from-indigo-400 via-violet-400 to-purple-500 shadow-indigo-500/20"
                      }`;
                    }
                  }}
                />
              ) : (
                <span>
                  {firstName.charAt(0)}
                  {lastName?.charAt(0) || ""}
                </span>
              )}
            </div>
            <div>
              <p
                className={`text-[9px] font-extrabold uppercase tracking-[0.2em] ${
                  isDark ? "text-indigo-400" : "text-indigo-500"
                }`}
              >
                {role}
              </p>
              <p
                className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                {firstName} {lastName || ""}
              </p>
            </div>
          </div>
          {verified && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                isDark
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-emerald-100 border-emerald-200"
              }`}
            >
              <IoCheckmarkCircleOutline
                className={`text-xs ${isDark ? "text-emerald-400" : "text-emerald-500"}`}
              />
              <span
                className={`text-[9px] font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
              >
                {t("verified")}
              </span>
            </div>
          )}
        </div>
        <div className="p-5 space-y-3.5">
          {cinNumber && (
            <SensitiveField
              label={t("cinNumber")}
              value={cinNumber}
              icon={<IoFingerPrintOutline />}
              mono
              gradient
            />
          )}
          {email && (
            <SensitiveField
              label={t("email")}
              value={email}
              icon={<IoMailOutline />}
            />
          )}
          {phone && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`text-sm ${isDark ? "text-white/25" : "text-slate-400"}`}
                >
                  <IoCallOutline />
                </span>
                <span
                  className={`text-[9px] font-extrabold uppercase tracking-[0.15em] ${isDark ? "text-white/30" : "text-slate-400"}`}
                >
                  {t("phone")}
                </span>
              </div>
              <div
                className={`px-3.5 py-2.5 rounded-xl border ${isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-slate-50 border-slate-200"}`}
              >
                <p
                  className={`text-sm font-bold ${isDark ? "text-white/80" : "text-slate-700"}`}
                >
                  {phone}
                </p>
              </div>
            </div>
          )}
          {extra?.map((item) => (
            <div key={item.label}>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`text-[9px] font-extrabold uppercase tracking-[0.15em] ${isDark ? "text-white/30" : "text-slate-400"}`}
                >
                  {item.label}
                </span>
              </div>
              <div
                className={`px-3.5 py-2.5 rounded-xl border ${isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-slate-50 border-slate-200"}`}
              >
                <p
                  className={`text-sm font-bold ${isDark ? "text-white/60" : "text-slate-500"}`}
                >
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// COORDINATE DISPLAY (sans l'animation GPS)
// ============================================
function CoordinateDisplay({
  lat,
  lng,
  t,
}: {
  lat?: number;
  lng?: number;
  t: any;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [copied, setCopied] = useState<string | null>(null);
  if (!lat || !lng) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-3">
      {/* GARDÉ : Latitude et Longitude */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="group cursor-pointer"
          onClick={() => copyToClipboard(lat.toString(), "lat")}
        >
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              isDark
                ? "bg-white/[0.03] border-white/[0.06] hover:border-indigo-500/20"
                : "bg-white/50 border-slate-200 hover:border-indigo-500/20"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <IoNavigateOutline className="text-indigo-400 text-xs" />
              <span
                className={`text-[8px] font-extrabold uppercase tracking-[0.15em] ${
                  isDark ? "text-white/25" : "text-slate-400"
                }`}
              >
                {t("latitude")}
              </span>
            </div>
            <p className="text-lg font-mono font-black text-indigo-400 tracking-wider">
              {lat.toFixed(4)}°
            </p>
            <p
              className={`text-[9px] mt-0.5 ${isDark ? "text-white/15" : "text-slate-300"}`}
            >
              {lat > 0 ? t("north") : t("south")}
            </p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.65 }}
          className="group cursor-pointer"
          onClick={() => copyToClipboard(lng.toString(), "lng")}
        >
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              isDark
                ? "bg-white/[0.03] border-white/[0.06] hover:border-violet-500/20"
                : "bg-white/50 border-slate-200 hover:border-violet-500/20"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <IoMapOutline className="text-violet-400 text-xs" />
              <span
                className={`text-[8px] font-extrabold uppercase tracking-[0.15em] ${
                  isDark ? "text-white/25" : "text-slate-400"
                }`}
              >
                {t("longitude")}
              </span>
            </div>
            <p className="text-lg font-mono font-black text-violet-400 tracking-wider">
              {lng.toFixed(4)}°
            </p>
            <p
              className={`text-[9px] mt-0.5 ${isDark ? "text-white/15" : "text-slate-300"}`}
            >
              {lng > 0 ? t("east") : t("west")}
            </p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <span className="text-[10px] font-bold text-emerald-400">
              ✓ {t("copied")}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/*  GARDÉ : Lien Google Maps */}
      <motion.a
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75 }}
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-bold transition-all group ${
          isDark
            ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/15 hover:border-indigo-500/30"
            : "bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100"
        }`}
      >
        <IoNavigateOutline className="text-sm group-hover:rotate-[-15deg] transition-transform" />
        {t("openInGoogleMaps")}
        <IoChevronForwardOutline className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
      </motion.a>
    </div>
  );
}
// ============================================
// STEP INDICATOR (TOUT TRADUIT)
// ============================================
function StepIndicator({ activeStep, t }: { activeStep: number; t: any }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const steps = [
    { label: t("stepOffer"), icon: IoCheckmarkCircleOutline },
    { label: t("stepPayment"), icon: IoCardOutline },
    { label: t("stepConfirmation"), icon: IoSparklesOutline },
  ];

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const isDone = i < activeStep;
        const isActive = i === activeStep;
        const Icon = step.icon;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-initial">
            <div className="flex items-center gap-2">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  boxShadow: isActive
                    ? isDark
                      ? "0 4px 14px rgba(99,102,241,0.25)"
                      : "0 4px 14px rgba(99,102,241,0.15)"
                    : "0 0 0 rgba(0,0,0,0)",
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition-all duration-500 ${
                  isDone
                    ? isDark
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                      : "bg-emerald-100 border-emerald-300 text-emerald-600"
                    : isActive
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 border-indigo-500 text-white"
                      : isDark
                        ? "bg-white/[0.03] border-white/[0.08] text-white/20"
                        : "bg-slate-100 border-slate-200 text-slate-300"
                }`}
              >
                {isDone ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <IoCheckmarkCircleOutline className="text-sm" />
                  </motion.div>
                ) : (
                  <Icon className="text-sm" />
                )}
              </motion.div>
              <span
                className={`text-xs font-bold hidden sm:block transition-colors duration-500 ${
                  isDone
                    ? isDark
                      ? "text-emerald-400"
                      : "text-emerald-600"
                    : isActive
                      ? isDark
                        ? "text-indigo-400"
                        : "text-indigo-600"
                      : isDark
                        ? "text-white/20"
                        : "text-slate-300"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < 2 && (
              <div className="flex-1 h-px mx-3 relative overflow-hidden">
                <div
                  className={`absolute inset-0 ${isDark ? "bg-white/[0.06]" : "bg-slate-200"}`}
                />
                <motion.div
                  className="absolute inset-y-0 left-0 bg-emerald-500/50"
                  initial={{ width: "0%" }}
                  animate={{ width: isDone ? "100%" : "0%" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// SECTION HEADER (TRADUIT)
// ============================================
function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
          isDark
            ? "bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-violet-500/20"
            : "bg-gradient-to-br from-indigo-400 via-violet-400 to-purple-500 shadow-indigo-500/20"
        }`}
      >
        <span className="text-white text-base">{icon}</span>
      </div>
      <div>
        <h2
          className={`text-sm font-extrabold leading-tight ${isDark ? "text-white" : "text-slate-800"}`}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={`text-[10px] font-medium ${isDark ? "text-white/30" : "text-slate-400"}`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function ConfirmationPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const t = useTranslations("ConfirmationPage");

  const {
    booking,
    isLoading,
    showConfetti,
    toast,
    setToast,
    imgError,
    setImgError,
    contractLoading,
    handleDownloadContract,
    handleContactHost,
    handleMyBookings,
  } = useBookingConfirmation();

  if (isLoading) {
    return (
      <LoadingSpinner
        variant="spinner"
        size="lg"
        color="primary"
        text={t("loading.verifyingPayment")}
        fullScreen
      />
    );
  }

  if (!booking) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? "bg-[#070b14]" : "bg-sky-50"
        }`}
      >
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-500 mb-4">
            {t("errors.bookingNotFound")}
          </h1>
          <button
            onClick={handleMyBookings}
            className="text-indigo-500 hover:underline"
          >
            {t("buttons.viewMyBookings")}
          </button>
        </div>
      </div>
    );
  }

  const nightsTotal = booking.pricePerNight * booking.nights;
  const listingImageUrl = booking.listing.image
    ? pipListing(booking.listing.image)
    : null;

  return (
    <div className={`min-h-screen ${isDark ? "text-white" : "text-slate-800"}`}>
      <ThemeBackground />
      {showConfetti && <Confetti />}

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            t={t}
          />
        )}
      </AnimatePresence>

      <TenantHeader />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        {/* SUCCESS HERO */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-14"
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            {t("hero.title")}{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
              {t("hero.confirmed")}
            </span>
          </h1>
          <p
            className={`text-sm mb-5 max-w-md mx-auto ${isDark ? "text-white/30" : "text-slate-500"}`}
          >
            {t("hero.subtitle")}
          </p>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <p
              className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-1 ${
                isDark ? "text-white/25" : "text-slate-400"
              }`}
            >
              {t("hero.amountPaid")}
            </p>
            <p
              className={`text-4xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
            >
              <AnimatedPrice target={booking.totalPrice} duration={1.5} />{" "}
              <span
                className={`text-lg ${isDark ? "text-white/30" : "text-slate-400"}`}
              >
                TND
              </span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`mt-5 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border ${
              isDark
                ? "bg-white/[0.04] border-white/[0.06]"
                : "bg-white/50 border-slate-200"
            }`}
          >
            <span
              className={`text-[9px] font-extrabold uppercase tracking-[0.2em] ${
                isDark ? "text-white/25" : "text-slate-400"
              }`}
            >
              {t("hero.reference")}:
            </span>
            <span
              className={`font-mono font-extrabold text-sm tracking-wider ${
                isDark ? "text-white" : "text-slate-700"
              }`}
            >
              {booking.reference}
            </span>
            <IoCheckmarkCircleOutline className="text-emerald-400 text-sm" />
          </motion.div>
        </motion.section>

        {/* MAIN GRID - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 space-y-6">
            {/* STAY DETAILS */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div
                className={`absolute -inset-1 rounded-[28px] blur-lg ${
                  isDark
                    ? "bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-purple-500/5"
                    : "bg-gradient-to-r from-indigo-200/20 via-violet-200/20 to-purple-200/20"
                }`}
              />
              <div
                className={`relative backdrop-blur-xl border rounded-[24px] overflow-hidden ${
                  isDark
                    ? "bg-white/[0.03] border-white/[0.06]"
                    : "bg-white/70 border-white/50 shadow-lg shadow-slate-200/50"
                }`}
              >
                <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
                <div className="p-4 sm:p-6">
                  <SectionHeader
                    icon={<IoCalendarOutline />}
                    title={t("sections.stayDetails")}
                    subtitle={`${t("sections.issuedOn")} ${fmtDate(booking.issuedAt)}`}
                  />

                  <div
                    className={`flex items-start gap-3 p-4 rounded-xl border mb-5 ${
                      isDark
                        ? "bg-white/[0.03] border-white/[0.06]"
                        : "bg-white/50 border-slate-200"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                        isDark
                          ? "bg-indigo-500/10 border-indigo-500/20"
                          : "bg-indigo-50 border-indigo-200"
                      }`}
                    >
                      <IoHomeOutline className="text-indigo-400 text-base" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-[9px] font-extrabold uppercase tracking-[0.2em] ${
                          isDark ? "text-indigo-400" : "text-indigo-600"
                        }`}
                      >
                        {t("sections.property")}
                      </p>
                      <p
                        className={`text-sm font-extrabold ${isDark ? "text-white" : "text-slate-800"}`}
                      >
                        {booking.listing.title}
                      </p>
                      <p
                        className={`text-[11px] flex items-center gap-1 mt-0.5 ${
                          isDark ? "text-white/30" : "text-slate-500"
                        }`}
                      >
                        <IoLocationOutline className="text-xs flex-shrink-0" />
                        {booking.listing.address || booking.listing.location}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      {
                        icon: <IoLogInOutline className="text-indigo-400" />,
                        label: t("sections.checkIn"),
                        value: fmtDate(booking.checkIn),
                        sub: `${t("sections.from")} ${booking.checkInTime}`,
                      },
                      {
                        icon: <IoMoonOutline className="text-violet-400" />,
                        label: t("sections.duration"),
                        value: `${booking.nights} ${t("sections.nights")}`,
                        sub: `${booking.guests} ${booking.guests > 1 ? t("sections.travelers") : t("sections.traveler")}`,
                      },
                      {
                        icon: <IoLogOutOutline className="text-purple-400" />,
                        label: t("sections.checkOut"),
                        value: fmtDate(booking.checkOut),
                        sub: `${t("sections.before")} ${booking.checkOutTime}`,
                      },
                    ].map((d) => (
                      <div
                        key={d.label}
                        className={`rounded-xl p-3.5 bg-white/[0.02] border ${
                          isDark
                            ? "border-indigo-500/10"
                            : "border-indigo-200/50"
                        } flex flex-col gap-1.5`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{d.icon}</span>
                          <p
                            className={`text-[8px] font-extrabold uppercase tracking-[0.15em] ${
                              isDark ? "text-white/25" : "text-slate-400"
                            }`}
                          >
                            {d.label}
                          </p>
                        </div>
                        <p
                          className={`text-xs font-extrabold ${isDark ? "text-white" : "text-slate-800"}`}
                        >
                          {d.value}
                        </p>
                        <p
                          className={`text-[10px] font-medium ${
                            isDark ? "text-white/25" : "text-slate-400"
                          }`}
                        >
                          {d.sub}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2.5 mb-4">
                    {[
                      {
                        label: `${fmtPrice(booking.pricePerNight)} TND × ${booking.nights} ${t("sections.nights")}`,
                        value: nightsTotal,
                      },
                      {
                        label: t("sections.cleaningFee"),
                        value: booking.cleaningFee,
                      },
                      {
                        label: t("sections.serviceFee"),
                        value: booking.serviceFee,
                        accent: true,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between text-sm"
                      >
                        <span
                          className={
                            isDark ? "text-white/30" : "text-slate-500"
                          }
                        >
                          {item.label}
                        </span>
                        <span
                          className={`font-bold ${
                            item.accent
                              ? "text-indigo-400"
                              : isDark
                                ? "text-white/60"
                                : "text-slate-600"
                          }`}
                        >
                          {fmtPrice(item.value)} TND
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    className={`flex justify-between items-center pt-4 border-t border-dashed ${
                      isDark ? "border-white/[0.06]" : "border-slate-200"
                    }`}
                  >
                    <p
                      className={`text-sm font-extrabold ${isDark ? "text-white" : "text-slate-800"}`}
                    >
                      {t("sections.totalPaid")}
                    </p>
                    <p className="text-xl font-black bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
                      {fmtPrice(booking.totalPrice)}{" "}
                      <span className="text-sm">TND</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* PERSONAL DATA — TENANT & OWNER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PersonCard
                role={t("roles.tenant")}
                firstName={booking.tenant.firstName}
                lastName={booking.tenant.lastName}
                cinNumber={booking.tenant.cinNumber}
                email={booking.tenant.email}
                phone={booking.tenant.phone}
                verified={booking.tenant.verified}
                profilePictureUrl={booking.tenant.profilePictureUrl}
                delay={0.3}
                t={t}
              />
              <PersonCard
                role={t("roles.owner")}
                firstName={booking.owner.firstName}
                lastName={booking.owner.lastName}
                cinNumber={booking.owner.cinNumber}
                email={booking.owner.email}
                phone={booking.owner.phone}
                verified={booking.owner.verified}
                profilePictureUrl={booking.owner.profilePictureUrl}
                delay={0.35}
                extra={[]}
                t={t}
              />
            </div>

            {/* CONTRACT */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div
                className={`absolute -inset-1 rounded-[28px] blur-lg ${
                  isDark
                    ? "bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-purple-500/5"
                    : "bg-gradient-to-r from-indigo-200/20 via-violet-200/20 to-purple-200/20"
                }`}
              />
              <div
                className={`relative backdrop-blur-xl border rounded-[24px] overflow-hidden ${
                  isDark
                    ? "bg-white/[0.03] border-white/[0.06]"
                    : "bg-white/70 border-white/50 shadow-lg shadow-slate-200/50"
                }`}
              >
                <div className="p-6">
                  <SectionHeader
                    icon={<IoDocumentTextOutline />}
                    title={t("sections.contract")}
                    subtitle={t("sections.downloadContract")}
                  />

                  <div
                    className={`flex items-start gap-4 p-4 rounded-xl border mb-5 ${
                      isDark
                        ? "bg-white/[0.03] border-white/[0.06]"
                        : "bg-white/50 border-slate-200"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                        isDark
                          ? "bg-indigo-500/10 border-indigo-500/20"
                          : "bg-indigo-50 border-indigo-200"
                      }`}
                    >
                      <IoDocumentTextOutline className="text-indigo-400 text-xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}
                      >
                        {t("sections.rentalContract")}
                      </p>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          isDark ? "text-white/30" : "text-slate-500"
                        }`}
                      >
                        {booking.listing.title} · {t("sections.ref")}{" "}
                        {booking.reference}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isDark ? "text-white/20" : "text-slate-400"
                        }`}
                      >
                        {t("sections.pdfDescription")}
                      </p>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border flex-shrink-0 ${
                        isDark
                          ? "bg-emerald-500/10 border-emerald-500/20"
                          : "bg-emerald-100 border-emerald-200"
                      }`}
                    >
                      <IoCheckmarkCircleOutline className="text-emerald-400 text-xs" />
                      <span
                        className={`text-[9px] font-bold ${
                          isDark ? "text-emerald-400" : "text-emerald-600"
                        }`}
                      >
                        {t("sections.ready")}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleDownloadContract}
                      disabled={contractLoading}
                      className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <IoDocumentTextOutline className="text-lg" />
                      {contractLoading
                        ? t("buttons.generating")
                        : t("buttons.downloadContract")}
                    </button>
                    <button
                      onClick={handleContactHost}
                      className={`flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold transition-colors active:scale-[0.97] ${
                        isDark
                          ? "text-white/70 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06]"
                          : "text-slate-600 bg-white/50 hover:bg-white border border-slate-200"
                      }`}
                    >
                      <IoChatbubbleOutline className="text-lg" />
                      {t("buttons.contactHost")}
                    </button>
                  </div>

                  <div
                    className={`flex items-center gap-2.5 mt-4 px-4 py-3 rounded-xl border ${
                      isDark
                        ? "bg-emerald-500/5 border-emerald-500/10"
                        : "bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    <IoShieldCheckmarkOutline className="text-emerald-400 text-base flex-shrink-0" />
                    <p
                      className={`text-[11px] font-bold ${
                        isDark ? "text-emerald-400/70" : "text-emerald-600/70"
                      }`}
                    >
                      {t("sections.secureTransaction")}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-5 space-y-5">
            {/* Property card */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="relative"
            >
              <div
                className={`absolute -inset-1 rounded-[28px] blur-lg ${
                  isDark
                    ? "bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-purple-500/5"
                    : "bg-gradient-to-r from-indigo-200/20 via-violet-200/20 to-purple-200/20"
                }`}
              />
              <div
                className={`relative backdrop-blur-xl border rounded-[24px] overflow-hidden ${
                  isDark
                    ? "bg-white/[0.03] border-white/[0.06]"
                    : "bg-white/70 border-white/50 shadow-lg shadow-slate-200/50"
                }`}
              >
                <div className="relative h-48 sm:h-52 overflow-hidden">
                  {listingImageUrl && !imgError ? (
                    <img
                      src={listingImageUrl}
                      alt={booking.listing.title}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center ${
                        isDark
                          ? "bg-gradient-to-br from-indigo-500/20 to-violet-500/20"
                          : "bg-gradient-to-br from-indigo-500/10 to-violet-500/10"
                      }`}
                    >
                      <IoHomeOutline
                        className={`text-5xl ${isDark ? "text-white/30" : "text-slate-400"}`}
                      />
                    </div>
                  )}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${
                      isDark
                        ? "from-[#070b14] via-[#070b14]/30 to-transparent"
                        : "from-white/80 via-white/30 to-transparent"
                    }`}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-white/80 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                      {booking.listing.type}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-white bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
                      <IoStarSharp className="text-amber-400 text-[10px]" />
                      {booking.listing.rating}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white font-extrabold text-base mb-1">
                      {booking.listing.title}
                    </p>
                    <p className="text-white/50 text-xs flex items-center gap-1">
                      <IoLocationOutline className="text-xs flex-shrink-0" />
                      {booking.listing.location}
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      {
                        icon: (
                          <IoCalendarOutline className="text-indigo-400 text-sm" />
                        ),
                        val: fmtShort(booking.checkIn),
                        lbl: t("cards.checkInShort"),
                      },
                      {
                        icon: (
                          <IoMoonOutline className="text-violet-400 text-sm" />
                        ),
                        val: `${booking.nights}${t("cards.nightsShort")}`,
                        lbl: t("cards.durationShort"),
                      },
                      {
                        icon: (
                          <IoPeopleOutline className="text-purple-400 text-sm" />
                        ),
                        val: booking.guests,
                        lbl: t("cards.travelersShort"),
                      },
                    ].map(({ icon, val, lbl }) => (
                      <div
                        key={lbl}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border ${
                          isDark
                            ? "bg-white/[0.02] border-white/[0.04]"
                            : "bg-white/50 border-slate-200"
                        }`}
                      >
                        {icon}
                        <p
                          className={`text-sm font-extrabold ${isDark ? "text-white" : "text-slate-800"}`}
                        >
                          {val}
                        </p>
                        <p
                          className={`text-[9px] font-bold uppercase tracking-wider ${
                            isDark ? "text-white/25" : "text-slate-400"
                          }`}
                        >
                          {lbl}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                      isDark
                        ? "bg-white/[0.02] border-white/[0.04]"
                        : "bg-white/50 border-slate-200"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isDark ? "text-white/30" : "text-slate-400"
                      }`}
                    >
                      {t("cards.total")}
                    </span>
                    <span className="text-base font-black bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
                      {fmtPrice(booking.totalPrice)} TND
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {booking.listing.latitude && booking.listing.longitude && (
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <div
                  className={`absolute -inset-1 rounded-[28px] blur-lg ${
                    isDark
                      ? "bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-purple-500/5"
                      : "bg-gradient-to-r from-indigo-200/20 via-violet-200/20 to-purple-200/20"
                  }`}
                />
                <div
                  className={`relative backdrop-blur-xl border rounded-[24px] overflow-hidden ${
                    isDark
                      ? "bg-white/[0.03] border-white/[0.06]"
                      : "bg-white/70 border-white/50 shadow-lg shadow-slate-200/50"
                  }`}
                >
                  <div className="p-5">
                    <SectionHeader
                      icon={<IoNavigateOutline />}
                      title={t("sections.exactLocation")}
                      subtitle={
                        booking.listing.address || booking.listing.location
                      }
                    />

                    <div className="h-64 sm:h-80 w-full rounded-xl overflow-hidden">
                      <MapPicker
                        latitude={booking.listing.latitude}
                        longitude={booking.listing.longitude}
                        onLocationChange={() => {}}
                        readOnly={true}
                        showAllMarkers={false}
                        className="w-full h-full"
                      />
                    </div>

                    <div className="mt-6">
                      <CoordinateDisplay
                        lat={booking.listing.latitude}
                        lng={booking.listing.longitude}
                        t={t}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Info notes */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className={`flex items-start gap-3 p-4 rounded-2xl border ${
                isDark
                  ? "bg-amber-500/5 border-amber-500/10"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                  isDark
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-amber-100 border-amber-200"
                }`}
              >
                <IoInformationCircleOutline className="text-amber-400 text-sm" />
              </div>
              <p
                className={`text-[11px] leading-relaxed font-medium ${
                  isDark ? "text-amber-400/50" : "text-amber-600/70"
                }`}
              >
                {t("info.accessCodeActivation", {
                  checkInTime: booking.checkInTime,
                })}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`flex items-start gap-3 p-4 rounded-2xl border ${
                isDark
                  ? "bg-indigo-500/5 border-indigo-500/10"
                  : "bg-indigo-50 border-indigo-200"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                  isDark
                    ? "bg-indigo-500/10 border-indigo-500/20"
                    : "bg-indigo-100 border-indigo-200"
                }`}
              >
                <IoMailOutline className="text-indigo-400 text-sm" />
              </div>
              <div>
                <p
                  className={`text-xs font-bold mb-0.5 ${
                    isDark ? "text-indigo-400" : "text-indigo-600"
                  }`}
                >
                  {t("info.messageSent")}
                </p>
                <p
                  className={`text-[11px] leading-relaxed ${
                    isDark ? "text-indigo-400/40" : "text-indigo-600/60"
                  }`}
                >
                  {t("info.recapSent")}
                </p>
              </div>
            </motion.div>

            {/* Navigation links */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              onClick={handleMyBookings}
              className={`group flex items-center justify-between px-5 py-4 border rounded-2xl transition-all cursor-pointer ${
                isDark
                  ? "bg-white/[0.03] border-white/[0.06] hover:border-indigo-500/20 hover:bg-white/[0.04]"
                  : "bg-white/50 border-slate-200 hover:border-indigo-300 hover:bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                    isDark
                      ? "bg-indigo-500/10 border-indigo-500/20"
                      : "bg-indigo-50 border-indigo-200"
                  }`}
                >
                  <IoHomeOutline className="text-indigo-400 text-base" />
                </div>
                <div>
                  <p
                    className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}
                  >
                    {t("navigation.myBookings")}
                  </p>
                  <p
                    className={`text-[10px] ${isDark ? "text-white/25" : "text-slate-400"}`}
                  >
                    {t("navigation.viewAllStays")}
                  </p>
                </div>
              </div>
              <div
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                  isDark
                    ? "bg-white/[0.03] border-white/[0.06] group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20"
                    : "bg-white/50 border-slate-200 group-hover:bg-indigo-50 group-hover:border-indigo-200"
                }`}
              >
                <IoArrowForwardOutline
                  className={`transition-all text-sm ${
                    isDark
                      ? "text-white/30 group-hover:text-indigo-400 group-hover:translate-x-0.5"
                      : "text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5"
                  }`}
                />
              </div>
            </motion.div>

            {/* Help */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className={`flex items-center justify-between px-4 py-3.5 rounded-xl border ${
                isDark
                  ? "bg-white/[0.02] border-white/[0.04]"
                  : "bg-white/50 border-slate-200"
              }`}
            >
              <div>
                <p
                  className={`text-xs font-bold ${isDark ? "text-white/60" : "text-slate-600"}`}
                >
                  {t("help.needHelp")}
                </p>
                <p
                  className={`text-[10px] ${isDark ? "text-white/20" : "text-slate-400"}`}
                >
                  {t("help.support247")}
                </p>
              </div>
              <button
                onClick={handleContactHost}
                className={`text-xs font-bold transition-colors flex items-center gap-1 group ${
                  isDark
                    ? "text-indigo-400 hover:text-indigo-300"
                    : "text-indigo-600 hover:text-indigo-700"
                }`}
              >
                {t("help.helpCenter")}{" "}
                <IoChevronForwardOutline className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className={`mt-16 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-5 ${
            isDark ? "border-white/[0.04]" : "border-slate-200"
          }`}
        >
          <p
            className={`text-sm italic text-center sm:text-left ${
              isDark ? "text-white/20" : "text-slate-400"
            }`}
          >
            {t("footer.thankYou")}{" "}
            <span className="not-italic font-bold text-indigo-400">
              NESTHUB
            </span>
            . {t("footer.hopeEnjoy")}
          </p>
        </motion.div>
      </main>
    </div>
  );
}
