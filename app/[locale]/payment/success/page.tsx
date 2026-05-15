// app/confirmation/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import MapPicker from "@/components/ui/maps/MapPicker";

import {
  IoCheckmarkCircleOutline,
  IoDocumentTextOutline,
  IoChatbubbleOutline,
  IoLocationOutline,
  IoCallOutline,
  IoKeyOutline,
  IoInformationCircleOutline,
  IoHomeOutline,
  IoShieldCheckmarkOutline,
  IoArrowForwardOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoPeopleOutline,
  IoLogInOutline,
  IoLogOutOutline,
  IoMoonOutline,
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
  IoGlobeOutline,
  IoFingerPrintOutline,
  IoNavigateOutline,
  IoMapOutline,
  IoSunnyOutline,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ============================================
// UTILS
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
// THEME BACKGROUND (Remplace AuroraBackground)
// ============================================
function ThemeBackground() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient selon le thème */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isDark
            ? "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950"
            : "bg-gradient-to-br from-sky-50 via-white to-indigo-50"
        }`}
      />

      {/* Animations lumineuses selon le thème */}
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

      {/* Grid pattern */}
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
// CONFETTI (Garde l'existant)
// ============================================
function Confetti() {
  // ... (garde ton code Confetti existant)
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
// TOAST (Version light/dark)
// ============================================
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const getStyles = () => {
    if (type === "success") {
      return isDark
        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
        : "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
    }
    if (type === "error") {
      return isDark
        ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
        : "bg-rose-500/10 text-rose-700 border-rose-500/20";
    }
    return isDark
      ? "bg-sky-500/10 text-sky-300 border-sky-500/20"
      : "bg-sky-500/10 text-sky-700 border-sky-500/20";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.9 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[100]"
    >
      <div
        className={`flex items-center gap-3 pl-5 pr-4 py-3.5 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-2xl border ${getStyles()}`}
      >
        {type === "success" ? (
          <IoCheckmarkCircleOutline className="text-lg" />
        ) : type === "error" ? (
          <IoAlertCircleOutline className="text-lg" />
        ) : (
          <IoSparklesOutline className="text-lg" />
        )}
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <IoCloseOutline className="text-sm" />
        </button>
      </div>
    </motion.div>
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
// ACCESS CODE DISPLAY (Version light/dark)
// ============================================
function AccessCodeDisplay({ code }: { code: string }) {
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
// SENSITIVE DATA FIELD (Version light/dark)
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
        <span className={`text-sm ${isDark ? "text-white/25" : "text-slate-400"}`}>
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
// PERSON ID CARD (Version light/dark)
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
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (!firstName) return null;

  const pipProfile = (url: string) => `/api/users/avatar?url=${encodeURIComponent(url)}`;

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
                      e.currentTarget.parentElement.className =
                        `w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-lg ${
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
              <p className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
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
              <span className={`text-[9px] font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                Vérifié
              </span>
            </div>
          )}
        </div>
        <div className="p-5 space-y-3.5">
          {cinNumber && (
            <SensitiveField
              label="Numéro CIN"
              value={cinNumber}
              icon={<IoFingerPrintOutline />}
              mono
              gradient
            />
          )}
          {email && (
            <SensitiveField
              label="Adresse e-mail"
              value={email}
              icon={<IoMailOutline />}
            />
          )}
          {phone && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-sm ${isDark ? "text-white/25" : "text-slate-400"}`}>
                  <IoCallOutline />
                </span>
                <span className={`text-[9px] font-extrabold uppercase tracking-[0.15em] ${isDark ? "text-white/30" : "text-slate-400"}`}>
                  Téléphone
                </span>
              </div>
              <div className={`px-3.5 py-2.5 rounded-xl border ${isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-slate-50 border-slate-200"}`}>
                <p className={`text-sm font-bold ${isDark ? "text-white/80" : "text-slate-700"}`}>{phone}</p>
              </div>
            </div>
          )}
          {extra?.map((item) => (
            <div key={item.label}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[9px] font-extrabold uppercase tracking-[0.15em] ${isDark ? "text-white/30" : "text-slate-400"}`}>
                  {item.label}
                </span>
              </div>
              <div className={`px-3.5 py-2.5 rounded-xl border ${isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-slate-50 border-slate-200"}`}>
                <p className={`text-sm font-bold ${isDark ? "text-white/60" : "text-slate-500"}`}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// COORDINATE DISPLAY (Version light/dark)
// ============================================
function CoordinateDisplay({ lat, lng }: { lat?: number; lng?: number }) {
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className={`relative h-44 rounded-2xl overflow-hidden border ${
          isDark ? "border-white/[0.06]" : "border-slate-200"
        }`}
      >
        <div
          className={`absolute inset-0 ${
            isDark
              ? "bg-gradient-to-br from-[#0a1628] via-[#0f1f3a] to-[#0a1628]"
              : "bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100"
          }`}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: isDark
              ? "linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)"
              : "linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 12 }}
            className="relative"
          >
            <motion.div
              className="absolute inset-0 w-16 h-16 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full border-2 border-indigo-500/30"
              animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full border-2 border-violet-500/20"
              animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
              <IoHomeOutline className="text-white text-xl" />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 rounded-full blur-sm" />
          </motion.div>
        </div>
        <div
          className={`absolute top-3 left-3 px-2 py-1 rounded-lg backdrop-blur-sm border ${
            isDark
              ? "bg-white/[0.06] border-white/[0.08]"
              : "bg-white/60 border-white/80"
          }`}
        >
          <span className={`text-[8px] font-bold uppercase tracking-wider ${
            isDark ? "text-white/40" : "text-slate-500"
          }`}>
            Position GPS
          </span>
        </div>
        <div
          className={`absolute top-3 right-3 px-2 py-1 rounded-lg backdrop-blur-sm border ${
            isDark
              ? "bg-indigo-500/10 border-indigo-500/20"
              : "bg-indigo-100 border-indigo-200"
          }`}
        >
          <span className={`text-[8px] font-bold uppercase tracking-wider ${
            isDark ? "text-indigo-400" : "text-indigo-600"
          }`}>
            Précis
          </span>
        </div>
        <div
          className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t ${
            isDark ? "from-[#070b14] to-transparent" : "from-white/80 to-transparent"
          }`}
        />
      </motion.div>

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
              <span className={`text-[8px] font-extrabold uppercase tracking-[0.15em] ${
                isDark ? "text-white/25" : "text-slate-400"
              }`}>
                Latitude
              </span>
            </div>
            <p className="text-lg font-mono font-black text-indigo-400 tracking-wider">
              {lat.toFixed(4)}°
            </p>
            <p className={`text-[9px] mt-0.5 ${isDark ? "text-white/15" : "text-slate-300"}`}>
              {lat > 0 ? "Nord" : "Sud"}
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
              <span className={`text-[8px] font-extrabold uppercase tracking-[0.15em] ${
                isDark ? "text-white/25" : "text-slate-400"
              }`}>
                Longitude
              </span>
            </div>
            <p className="text-lg font-mono font-black text-violet-400 tracking-wider">
              {lng.toFixed(4)}°
            </p>
            <p className={`text-[9px] mt-0.5 ${isDark ? "text-white/15" : "text-slate-300"}`}>
              {lng > 0 ? "Est" : "Ouest"}
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
              ✓ Copié dans le presse-papier
            </span>
          </motion.div>
        )}
      </AnimatePresence>

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
        Ouvrir dans Google Maps
        <IoChevronForwardOutline className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
      </motion.a>
    </div>
  );
}

// ============================================
// STEP INDICATOR (Version light/dark)
// ============================================
function StepIndicator({ activeStep }: { activeStep: number }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const steps = [
    { label: "Offre acceptée", icon: IoCheckmarkCircleOutline },
    { label: "Paiement", icon: IoCardOutline },
    { label: "Confirmation", icon: IoSparklesOutline },
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
                <div className={`absolute inset-0 ${isDark ? "bg-white/[0.06]" : "bg-slate-200"}`} />
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
// SECTION HEADER (Version light/dark)
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
        <h2 className={`text-sm font-extrabold leading-tight ${isDark ? "text-white" : "text-slate-800"}`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`text-[10px] font-medium ${isDark ? "text-white/30" : "text-slate-400"}`}>
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
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const searchParams = useSearchParams();
  const router = useRouter();
  const offerId = searchParams.get("offerId");
  const bookingId = searchParams.get("bookingId");
  const paymentIntent = searchParams.get("payment_intent");

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [imgError, setImgError] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") =>
      setToast({ message, type }),
    [],
  );

  // Toggle theme
  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  // Chargement dynamique des données
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        let data;
        let conversationIdTemp = null;

        if (paymentIntent) {
          const transactionRes = await fetch(
            `/api/payments/transaction?payment_intent=${paymentIntent}`,
          );

          if (transactionRes.ok) {
            const transaction = await transactionRes.json();

            if (transaction.bookingId) {
              const bookingRes = await fetch(
                `/api/bookings/${transaction.bookingId}`,
              );
              if (bookingRes.ok) {
                data = await bookingRes.json();
                conversationIdTemp = data.conversationId;
              }
            } else if (transaction.offerId) {
              const offerRes = await fetch(
                `/api/offers/${transaction.offerId}`,
              );
              if (offerRes.ok) {
                data = await offerRes.json();
                data = data.offer || data;
              }
            }
          }
        }

        if (!data && bookingId) {
          const res = await fetch(`/api/bookings/${bookingId}`);
          if (res.ok) {
            data = await res.json();
            conversationIdTemp = data.conversationId;
          } else {
            const offerRes = await fetch(`/api/offers/${bookingId}`);
            if (offerRes.ok) {
              data = await offerRes.json();
              data = data.offer || data;
            } else {
              throw new Error("Réservation non trouvée");
            }
          }
        }

        if (!data && offerId) {
          const res = await fetch(`/api/offers/${offerId}`);
          if (!res.ok) throw new Error("Erreur chargement offre");
          data = await res.json();
          data = data.offer || data;

          const bookingRes = await fetch(`/api/bookings?offerId=${offerId}`);
          if (bookingRes.ok) {
            const bookingData = await bookingRes.json();
            if (bookingData.bookings && bookingData.bookings.length > 0) {
              conversationIdTemp = bookingData.bookings[0].conversationId;
            }
          }
        }

        if (!data) {
          throw new Error("Aucun identifiant de réservation trouvé");
        }

        const nights =
          data.nights ||
          Math.ceil(
            (new Date(data.checkOut).getTime() -
              new Date(data.checkIn).getTime()) /
              86400000,
          );

        setBooking({
          id: data.id,
          reference: data.reference,
          issuedAt: data.createdAt,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          nights: nights,
          guests: data.guests,
          totalPrice: data.totalPrice,
          pricePerNight: data.pricePerNight,
          cleaningFee: data.cleaningFee || 0,
          serviceFee: data.serviceFee || 0,
          checkInTime: data.checkInTime || "15:00",
          checkOutTime: data.checkOutTime || "11:00",
          accessCode:
            data.revealedInfo?.accessCode ||
            Math.floor(1000 + Math.random() * 9000).toString(),
          tenant: {
            id: data.tenant?.id,
            firstName: data.tenant?.firstName,
            lastName: data.tenant?.lastName,
            cinNumber: data.tenant?.cinNumber,
            email: data.tenant?.email,
            phone: data.tenant?.phone,
            verified: data.tenant?.isIdentityVerified,
            profilePictureUrl: data.tenant?.profilePictureUrl,
          },
          owner: {
            id: data.owner?.id,
            firstName: data.owner?.firstName,
            lastName: data.owner?.lastName,
            cinNumber: data.owner?.cinNumber,
            email: data.owner?.email,
            phone: data.owner?.phone,
            verified: data.owner?.isIdentityVerified,
            joinedYear: data.owner?.joinedYear,
            listings: data.owner?.listingsCount,
            profilePictureUrl: data.owner?.profilePictureUrl,
          },
          listing: {
            id: data.listing?.id,
            title: data.listing?.title,
            type: data.listing?.type,
            address: data.listing?.fullAddress || data.listing?.location,
            image: data.listing?.photos?.[0]?.url || data.listing?.image,
            location: data.listing?.governorate || data.listing?.location,
            rating: data.owner?.rating,
            latitude: data.listing?.latitude,
            longitude: data.listing?.longitude,
          },
          conversationId: conversationIdTemp || data.conversationId,
        });

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      } catch (err) {
        console.error("Erreur:", err);
        showToast("Erreur lors du chargement des données", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [offerId, bookingId, paymentIntent, showToast]);

  const handleDownloadContract = async () => {
    if (!booking) return;
    setContractLoading(true);
    try {
      const requestBody: { offerId?: string; bookingId?: string } = {};
      if (booking.id) {
        requestBody.bookingId = booking.id;
      } else if (booking.offerId) {
        requestBody.offerId = booking.offerId;
      }

      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur génération contrat");
      }

      if (data.contract?.id) {
        window.open(`/api/contracts/${data.contract.id}/download`, "_blank");
        showToast("Contrat généré avec succès !", "success");
      } else {
        showToast("Erreur lors de la génération", "error");
      }
    } catch (error) {
      console.error("Erreur:", error);
      showToast("Erreur technique lors de la génération du contrat", "error");
    } finally {
      setContractLoading(false);
    }
  };

  const handleContactHost = () => {
    if (booking?.conversationId) {
      router.push(`/fr/messages/${booking.conversationId}`);
    } else {
      router.push("/fr/messages");
    }
  };

  const handleMyBookings = () => {
    router.push("/fr/reservations");
  };

  if (isLoading) {
    return (
      <LoadingSpinner
        variant="spinner"
        size="lg"
        color="primary"
        text="Vérification de votre paiement..."
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
            Réservation non trouvée
          </h1>
          <button
            onClick={handleMyBookings}
            className="text-indigo-500 hover:underline"
          >
            Voir mes réservations
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
          />
        )}
      </AnimatePresence>

      <TenantHeader />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        {/* Theme Toggle Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          onClick={toggleTheme}
          className={`fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg transition-all duration-300 ${
            isDark
              ? "bg-slate-800 text-yellow-400 hover:bg-slate-700"
              : "bg-white text-indigo-600 hover:bg-slate-100"
          }`}
        >
          {isDark ? <IoSunnyOutline className="text-xl" /> : <IoMoonOutline className="text-xl" />}
        </motion.button>

        {/* SUCCESS HERO */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-14"
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Paiement{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
              confirmé !
            </span>
          </h1>
          <p className={`text-sm mb-5 max-w-md mx-auto ${isDark ? "text-white/30" : "text-slate-500"}`}>
            Votre réservation est finalisée. Tous les détails sont ci-dessous.
          </p>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <p className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-1 ${
              isDark ? "text-white/25" : "text-slate-400"
            }`}>
              Montant payé
            </p>
            <p className={`text-4xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>
              <AnimatedPrice target={booking.totalPrice} duration={1.5} />{" "}
              <span className={`text-lg ${isDark ? "text-white/30" : "text-slate-400"}`}>TND</span>
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
            <span className={`text-[9px] font-extrabold uppercase tracking-[0.2em] ${
              isDark ? "text-white/25" : "text-slate-400"
            }`}>
              Réf:
            </span>
            <span className={`font-mono font-extrabold text-sm tracking-wider ${
              isDark ? "text-white" : "text-slate-700"
            }`}>
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
                    title="Détails du séjour"
                    subtitle={`Émis le ${fmtDate(booking.issuedAt)}`}
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
                      <p className={`text-[9px] font-extrabold uppercase tracking-[0.2em] ${
                        isDark ? "text-indigo-400" : "text-indigo-600"
                      }`}>
                        Propriété
                      </p>
                      <p className={`text-sm font-extrabold ${isDark ? "text-white" : "text-slate-800"}`}>
                        {booking.listing.title}
                      </p>
                      <p className={`text-[11px] flex items-center gap-1 mt-0.5 ${
                        isDark ? "text-white/30" : "text-slate-500"
                      }`}>
                        <IoLocationOutline className="text-xs flex-shrink-0" />
                        {booking.listing.address || booking.listing.location}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      {
                        icon: <IoLogInOutline className="text-indigo-400" />,
                        label: "Arrivée",
                        value: fmtDate(booking.checkIn),
                        sub: `Dès ${booking.checkInTime}`,
                        bg: isDark ? "border-indigo-500/10" : "border-indigo-200/50",
                      },
                      {
                        icon: <IoMoonOutline className="text-violet-400" />,
                        label: "Durée",
                        value: `${booking.nights} nuits`,
                        sub: `${booking.guests} voyageurs`,
                        bg: isDark ? "border-violet-500/10" : "border-violet-200/50",
                      },
                      {
                        icon: <IoLogOutOutline className="text-purple-400" />,
                        label: "Départ",
                        value: fmtDate(booking.checkOut),
                        sub: `Avant ${booking.checkOutTime}`,
                        bg: isDark ? "border-purple-500/10" : "border-purple-200/50",
                      },
                    ].map((d) => (
                      <div
                        key={d.label}
                        className={`rounded-xl p-3.5 bg-white/[0.02] border ${d.bg} flex flex-col gap-1.5`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{d.icon}</span>
                          <p className={`text-[8px] font-extrabold uppercase tracking-[0.15em] ${
                            isDark ? "text-white/25" : "text-slate-400"
                          }`}>
                            {d.label}
                          </p>
                        </div>
                        <p className={`text-xs font-extrabold ${isDark ? "text-white" : "text-slate-800"}`}>
                          {d.value}
                        </p>
                        <p className={`text-[10px] font-medium ${
                          isDark ? "text-white/25" : "text-slate-400"
                        }`}>
                          {d.sub}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2.5 mb-4">
                    {[
                      {
                        label: `${fmtPrice(booking.pricePerNight)} TND × ${booking.nights} nuits`,
                        value: nightsTotal,
                      },
                      { label: "Frais de ménage", value: booking.cleaningFee },
                      {
                        label: "Frais de service",
                        value: booking.serviceFee,
                        accent: true,
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between text-sm">
                        <span className={isDark ? "text-white/30" : "text-slate-500"}>
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
                  <div className={`flex justify-between items-center pt-4 border-t border-dashed ${
                    isDark ? "border-white/[0.06]" : "border-slate-200"
                  }`}>
                    <p className={`text-sm font-extrabold ${isDark ? "text-white" : "text-slate-800"}`}>
                      Total payé
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
                role="Locataire (Vous)"
                firstName={booking.tenant.firstName}
                lastName={booking.tenant.lastName}
                cinNumber={booking.tenant.cinNumber}
                email={booking.tenant.email}
                phone={booking.tenant.phone}
                verified={booking.tenant.verified}
                profilePictureUrl={booking.tenant.profilePictureUrl}
                delay={0.3}
              />
              <PersonCard
                role="Propriétaire (Hôte)"
                firstName={booking.owner.firstName}
                lastName={booking.owner.lastName}
                cinNumber={booking.owner.cinNumber}
                email={booking.owner.email}
                phone={booking.owner.phone}
                verified={booking.owner.verified}
                profilePictureUrl={booking.owner.profilePictureUrl}
                delay={0.35}
                extra={[
                  {
                    label: "Hôte depuis",
                    value: booking.owner.joinedYear?.toString(),
                  },
                  {
                    label: "Propriétés",
                    value: `${booking.owner.listings} annonces`,
                  },
                ].filter((e) => e.value)}
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
                <div
                  className={`h-px bg-gradient-to-r from-transparent to-transparent ${
                    isDark ? "via-indigo-500/30" : "via-indigo-500/20"
                  }`}
                />
                <div className="p-6">
                  <SectionHeader
                    icon={<IoDocumentTextOutline />}
                    title="Contrat & documents"
                    subtitle="Téléchargez votre contrat de location"
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
                      <p className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
                        Contrat de location
                      </p>
                      <p className={`text-[11px] mt-0.5 ${
                        isDark ? "text-white/30" : "text-slate-500"
                      }`}>
                        {booking.listing.title} · Réf {booking.reference}
                      </p>
                      <p className={`text-[10px] mt-1 ${
                        isDark ? "text-white/20" : "text-slate-400"
                      }`}>
                        PDF · Généré automatiquement · Signé électroniquement
                      </p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border flex-shrink-0 ${
                      isDark
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : "bg-emerald-100 border-emerald-200"
                    }`}>
                      <IoCheckmarkCircleOutline className="text-emerald-400 text-xs" />
                      <span className={`text-[9px] font-bold ${
                        isDark ? "text-emerald-400" : "text-emerald-600"
                      }`}>
                        Prêt
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
                      {contractLoading ? "Génération..." : "Télécharger le contrat"}
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
                      Contacter l'hôte
                    </button>
                  </div>

                  <div className={`flex items-center gap-2.5 mt-4 px-4 py-3 rounded-xl border ${
                    isDark
                      ? "bg-emerald-500/5 border-emerald-500/10"
                      : "bg-emerald-50 border-emerald-200"
                  }`}>
                    <IoShieldCheckmarkOutline className="text-emerald-400 text-base flex-shrink-0" />
                    <p className={`text-[11px] font-bold ${
                      isDark ? "text-emerald-400/70" : "text-emerald-600/70"
                    }`}>
                      Transaction sécurisée · Données chiffrées · PCI Compliant
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
                      <IoHomeOutline className={`text-5xl ${isDark ? "text-white/30" : "text-slate-400"}`} />
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
                        icon: <IoCalendarOutline className="text-indigo-400 text-sm" />,
                        val: fmtShort(booking.checkIn),
                        lbl: "Arrivée",
                      },
                      {
                        icon: <IoMoonOutline className="text-violet-400 text-sm" />,
                        val: `${booking.nights}N`,
                        lbl: "Durée",
                      },
                      {
                        icon: <IoPeopleOutline className="text-purple-400 text-sm" />,
                        val: booking.guests,
                        lbl: "Voyag.",
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
                        <p className={`text-sm font-extrabold ${isDark ? "text-white" : "text-slate-800"}`}>
                          {val}
                        </p>
                        <p className={`text-[9px] font-bold uppercase tracking-wider ${
                          isDark ? "text-white/25" : "text-slate-400"
                        }`}>
                          {lbl}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                    isDark
                      ? "bg-white/[0.02] border-white/[0.04]"
                      : "bg-white/50 border-slate-200"
                  }`}>
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? "text-white/30" : "text-slate-400"
                    }`}>
                      Total
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
      <div
        className={`h-px bg-gradient-to-r from-transparent to-transparent ${
          isDark ? "via-indigo-500/30" : "via-indigo-500/20"
        }`}
      />
      <div className="p-5">
        <SectionHeader
          icon={<IoNavigateOutline />}
          title="Emplacement exact"
          subtitle={booking.listing.address || booking.listing.location}
        />
        
        {/* MAP PICKER - Vue seule (readOnly) */}
        <div className="h-64 sm:h-80 w-full rounded-xl overflow-hidden">
          <MapPicker
            latitude={booking.listing.latitude}
            longitude={booking.listing.longitude}
            onLocationChange={() => {}} // readOnly donc pas de changement
            readOnly={true}
            showAllMarkers={false}
            className="w-full h-full"
          />
        </div>
        
        {/* Coordonnées textuelles sous la carte */}
        <div className="mt-4 flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${
              isDark ? "bg-emerald-400" : "bg-emerald-500"
            } animate-pulse`} />
            <code className={`text-[10px] font-mono font-medium ${
              isDark ? "text-white/40" : "text-slate-500"
            }`}>
              {booking.listing.latitude.toFixed(6)}, {booking.listing.longitude.toFixed(6)}
            </code>
          </div>
          <a
            href={`https://www.google.com/maps?q=${booking.listing.latitude},${booking.listing.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all group ${
              isDark
                ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/15"
                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            }`}
          >
            <IoNavigateOutline className="text-xs group-hover:rotate-[-15deg] transition-transform" />
            Ouvrir dans Google Maps
          </a>
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
              <p className={`text-[11px] leading-relaxed font-medium ${
                isDark ? "text-amber-400/50" : "text-amber-600/70"
              }`}>
                Le code d'accès sera activé le jour de votre arrivée à partir de{" "}
                {booking.checkInTime}. Contactez l'hôte via le chat pour toute question.
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
                <p className={`text-xs font-bold mb-0.5 ${
                  isDark ? "text-indigo-400" : "text-indigo-600"
                }`}>
                  E-mail envoyé
                </p>
                <p className={`text-[11px] leading-relaxed ${
                  isDark ? "text-indigo-400/40" : "text-indigo-600/60"
                }`}>
                  Un récapitulatif complet a été envoyé à votre adresse e-mail.
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
                  <p className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
                    Mes réservations
                  </p>
                  <p className={`text-[10px] ${isDark ? "text-white/25" : "text-slate-400"}`}>
                    Voir tous vos séjours
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
                <p className={`text-xs font-bold ${isDark ? "text-white/60" : "text-slate-600"}`}>
                  Besoin d'aide ?
                </p>
                <p className={`text-[10px] ${isDark ? "text-white/20" : "text-slate-400"}`}>
                  Support 24h/7j
                </p>
              </div>
              <button className={`text-xs font-bold transition-colors flex items-center gap-1 group ${
                isDark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"
              }`}>
                Centre d'aide{" "}
                <IoChevronForwardOutline className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </motion.div>

            {/* Guarantee badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { icon: <IoTrophyOutline />, label: "Meilleur prix", sub: "Garanti" },
                { icon: <IoFlashOutline />, label: "Confirmation", sub: "Instantanée" },
                { icon: <IoDiamondOutline />, label: "Qualité", sub: "Premium" },
              ].map((b) => (
                <div
                  key={b.label}
                  className={`text-center py-3 px-2 rounded-xl border transition-colors ${
                    isDark
                      ? "bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]"
                      : "bg-white/50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`text-lg mb-1.5 flex justify-center ${
                    isDark ? "text-white/20" : "text-slate-400"
                  }`}>
                    {b.icon}
                  </div>
                  <p className={`text-[9px] font-extrabold uppercase tracking-wider ${
                    isDark ? "text-white/40" : "text-slate-500"
                  }`}>
                    {b.label}
                  </p>
                  <p className={`text-[8px] ${isDark ? "text-white/15" : "text-slate-300"}`}>
                    {b.sub}
                  </p>
                </div>
              ))}
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
          <p className={`text-sm italic text-center sm:text-left ${
            isDark ? "text-white/20" : "text-slate-400"
          }`}>
            "Merci de faire confiance à{" "}
            <span className="not-italic font-bold text-indigo-400">NESTHUB</span>
            . Nous espérons que votre séjour sera inoubliable."
          </p>
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500" />
            <span className="text-lg font-extrabold tracking-tight text-white">
              NESTHUB
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}