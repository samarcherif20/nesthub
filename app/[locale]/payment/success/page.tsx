// app/confirmation/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "react-icons/io5";
import Image from "next/image";
import { TenantHeader } from "@/components/ui/header/TenantHeader";

/* ═══════════════════════════════════════════════════════════════════════════════
   UTILS
   ═══════════════════════════════════════════════════════════════════════════════ */
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function fmtShort(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}
function fmtPrice(n: number) {
  return n.toLocaleString("fr-FR");
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MOCK BOOKING CONFIRMATION — WITH PRIVATE DATA
   ═══════════════════════════════════════════════════════════════════════════════ */
const BOOKING = {
  id: "bk_9x82kf",
  reference: "RES-2026-7XKP",
  issuedAt: "2026-07-10T14:32:00Z",
  checkIn: "2026-08-15",
  checkOut: "2026-08-20",
  nights: 5,
  guests: 3,
  totalPrice: 1555,
  pricePerNight: 280,
  cleaningFee: 85,
  serviceFee: 70,
  checkInTime: "15:00",
  checkOutTime: "11:00",
  accessCode: "4829",

  tenant: {
    id: "t_01",
    firstName: "Youssef",
    lastName: "Ben Ahmed",
    cinNumber: "11458732",
    email: "youssef.benahmed@email.com",
    phone: "+216 98 412 763",
    dateOfBirth: "1994-03-22",
    nationality: "Tunisienne",
    verified: true,
  },

  owner: {
    id: "o_01",
    firstName: "Amira",
    lastName: "Khelifi",
    cinNumber: "08921456",
    email: "amira.khelifi@email.com",
    phone: "+216 22 387 104",
    isPremium: true,
    verified: true,
    rating: 4.96,
    listings: 4,
    joinedYear: 2019,
  },

  listing: {
    id: "ls_1",
    title: "Villa Les Oliviers",
    type: "Villa premium",
    location: "Sidi Bou Said, La Marsa, Tunis",
    address: "47 Rue Habib Thameur, Sidi Bou Said 2026",
    latitude: 36.8704,
    longitude: 10.3476,
    altitude: 85,
    rating: 4.92,
    reviews: 128,
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
    amenities: [
      "Piscine infinity",
      "Vue mer Méditerranée",
      "WiFi fibre",
      "Parking privé",
      "Climatisation",
      "Terrasse rooftop",
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════════════════════
   AURORA BACKGROUND
   ═══════════════════════════════════════════════════════════════════════════════ */
function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[#070b14]" />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
        style={{
          background: "radial-gradient(circle, #4f46e5, #7c3aed, transparent)",
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
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
        style={{
          background: "radial-gradient(circle, #0ea5e9, #6366f1, transparent)",
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
        className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-[80px]"
        style={{
          background: "radial-gradient(circle, #a855f7, #ec4899, transparent)",
          top: "40%",
          left: "30%",
        }}
        animate={{ x: [0, 50, -30, 0], y: [0, -40, 30, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CONFETTI
   ═══════════════════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════════════════════════════════════════ */
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.9 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[100]"
    >
      <div
        className={`flex items-center gap-3 pl-5 pr-4 py-3.5 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-2xl border ${type === "success" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : type === "error" ? "bg-rose-500/10 text-rose-300 border-rose-500/20" : "bg-sky-500/10 text-sky-300 border-sky-500/20"}`}
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
          className="ml-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <IoCloseOutline className="text-sm" />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════════════════
   ACCESS CODE DISPLAY
   ═══════════════════════════════════════════════════════════════════════════════ */
function AccessCodeDisplay({ code }: { code: string }) {
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
          className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-indigo-500/20 flex items-center justify-center font-black text-2xl text-indigo-400 shadow-lg shadow-indigo-500/10"
        >
          {d}
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SENSITIVE DATA FIELD — with reveal toggle
   ═══════════════════════════════════════════════════════════════════════════════ */
function SensitiveField({
  label,
  value,
  icon,
  mono = false,
  gradient = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  mono?: boolean;
  gradient?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const masked = "•".repeat(value.length);

  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-white/25 text-sm">{icon}</span>
        <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-white/30">
          {label}
        </span>
        <button
          onClick={() => setRevealed(!revealed)}
          className="ml-auto text-white/20 hover:text-white/50 transition-colors p-1 rounded-lg hover:bg-white/[0.04]"
        >
          {revealed ? (
            <IoEyeOffOutline className="text-xs" />
          ) : (
            <IoEyeOutline className="text-xs" />
          )}
        </button>
      </div>
      <div className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] group-hover:border-white/[0.1] transition-colors">
        <p
          className={`text-sm font-bold ${mono ? "font-mono tracking-[0.15em]" : ""} ${gradient ? "bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent" : "text-white/80"} ${!revealed ? "blur-[4px] select-none" : ""}`}
        >
          {revealed ? value : masked}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PERSON ID CARD
   ═══════════════════════════════════════════════════════════════════════════════ */
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
}: {
  role: string;
  firstName: string;
  lastName: string;
  cinNumber: string;
  email: string;
  phone: string;
  extra?: { label: string; value: string }[];
  verified?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-purple-500/5 rounded-[28px] blur-lg" />

      <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-[24px] overflow-hidden">
        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-violet-500/20">
              {firstName.charAt(0)}
              {lastName.charAt(0)}
            </div>
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-indigo-400">
                {role}
              </p>
              <p className="text-sm font-bold text-white">
                {firstName} {lastName}
              </p>
            </div>
          </div>
          {verified && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <IoCheckmarkCircleOutline className="text-emerald-400 text-xs" />
              <span className="text-[9px] font-bold text-emerald-400">
                Vérifié
              </span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-3.5">
          <SensitiveField
            label="Numéro CIN"
            value={cinNumber}
            icon={<IoFingerPrintOutline />}
            mono
            gradient
          />

          <SensitiveField
            label="Adresse e-mail"
            value={email}
            icon={<IoMailOutline />}
          />

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-white/25 text-sm">
                <IoCallOutline />
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-white/30">
                Téléphone
              </span>
            </div>
            <div className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-sm font-bold text-white/80">{phone}</p>
            </div>
          </div>

          {extra?.map((item) => (
            <div key={item.label}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-white/30">
                  {item.label}
                </span>
              </div>
              <div className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-sm font-bold text-white/60">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COORDINATE DISPLAY
   ═══════════════════════════════════════════════════════════════════════════════ */
function CoordinateDisplay({
  lat,
  lng,
  altitude,
}: {
  lat: number;
  lng: number;
  altitude?: number;
}) {
  const [copied, setCopied] = useState<string | null>(null);

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
        className="relative h-44 rounded-2xl overflow-hidden border border-white/[0.06]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0f1f3a] to-[#0a1628]" />

        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.8,
              type: "spring",
              stiffness: 200,
              damping: 12,
            }}
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

        <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-white/[0.06] backdrop-blur-sm border border-white/[0.08]">
          <span className="text-[8px] font-bold text-white/40 uppercase tracking-wider">
            Position GPS
          </span>
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-indigo-500/10 backdrop-blur-sm border border-indigo-500/20">
          <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-wider">
            Précis
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#070b14] to-transparent" />
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="group cursor-pointer"
          onClick={() => copyToClipboard(lat.toString(), "lat")}
        >
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-indigo-500/20 transition-all">
            <div className="flex items-center gap-1.5 mb-1">
              <IoNavigateOutline className="text-indigo-400 text-xs" />
              <span className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-white/25">
                Latitude
              </span>
            </div>
            <p className="text-lg font-mono font-black text-indigo-400 tracking-wider">
              {lat.toFixed(4)}°
            </p>
            <p className="text-[9px] text-white/15 mt-0.5">
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
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/20 transition-all">
            <div className="flex items-center gap-1.5 mb-1">
              <IoMapOutline className="text-violet-400 text-xs" />
              <span className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-white/25">
                Longitude
              </span>
            </div>
            <p className="text-lg font-mono font-black text-violet-400 tracking-wider">
              {lng.toFixed(4)}°
            </p>
            <p className="text-[9px] text-white/15 mt-0.5">
              {lng > 0 ? "Est" : "Ouest"}
            </p>
          </div>
        </motion.div>
      </div>

      {altitude && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
        >
          <div className="flex items-center gap-2">
            <IoGlobeOutline className="text-white/20 text-sm" />
            <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-white/25">
              Altitude
            </span>
          </div>
          <span className="text-sm font-mono font-bold text-white/50">
            {altitude}m
          </span>
        </motion.div>
      )}

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
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold hover:bg-indigo-500/15 hover:border-indigo-500/30 transition-all group"
      >
        <IoNavigateOutline className="text-sm group-hover:rotate-[-15deg] transition-transform" />
        Ouvrir dans Google Maps
        <IoChevronForwardOutline className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
      </motion.a>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP INDICATOR
   ═══════════════════════════════════════════════════════════════════════════════ */
function StepIndicator({ activeStep }: { activeStep: number }) {
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
                    ? "0 4px 14px rgba(99,102,241,0.25)"
                    : "0 0 0 rgba(0,0,0,0)",
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition-colors duration-500 ${isDone ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : isActive ? "bg-gradient-to-br from-indigo-500 to-violet-600 border-indigo-500 text-white" : "bg-white/[0.03] border-white/[0.08] text-white/20"}`}
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
                className={`text-xs font-bold hidden sm:block transition-colors duration-500 ${isDone ? "text-emerald-400" : isActive ? "text-indigo-400" : "text-white/20"}`}
              >
                {step.label}
              </span>
            </div>
            {i < 2 && (
              <div className="flex-1 h-px mx-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/[0.06]" />
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

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════════════════════════════════════ */
function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 flex-shrink-0">
        <span className="text-white text-base">{icon}</span>
      </div>
      <div>
        <h2 className="text-sm font-extrabold text-white leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[10px] text-white/30 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   LOADING SCREEN
   ═══════════════════════════════════════════════════════════════════════════════ */
function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#070b14] flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-8"
      >
        <div className="relative">
          <motion.div
            className="w-20 h-20 rounded-3xl border-2 border-indigo-500/30"
            style={{ borderTopColor: "#6366f1" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 rounded-2xl border-2 border-violet-500/30"
            style={{ borderBottomColor: "#8b5cf6" }}
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <IoCheckmarkCircleOutline className="text-2xl text-emerald-400" />
            </motion.div>
          </div>
        </div>
        <div className="text-center">
          <motion.p
            className="text-white/80 text-sm font-bold mb-3"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Chargement de votre confirmation
          </motion.p>
          <div className="flex gap-1.5 justify-center">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-emerald-500"
                animate={{ y: [0, -8, 0], opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.12,
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN APP — PAYMENT SUCCESS PAGE (NEXT.JS)
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function ConfirmationPage() {
  const booking = BOOKING;
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") =>
      setToast({ message, type }),
    [],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }, 2200);
    return () => clearTimeout(t);
  }, []);

  const nightsTotal = booking.pricePerNight * booking.nights;

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <AuroraBackground />
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

      <TenantHeader></TenantHeader>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        {/* Steps */}

        {/* SUCCESS HERO */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-14"
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
            Paiement{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              confirmé !
            </span>
          </h1>
          <p className="text-white/30 text-sm mb-5 max-w-md mx-auto">
            Votre réservation est finalisée. Tous les détails sont ci-dessous.
          </p>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <p className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-bold mb-1">
              Montant payé
            </p>
            <p className="text-4xl font-black text-white">
              <AnimatedPrice target={booking.totalPrice} duration={1.5} />{" "}
              <span className="text-lg text-white/30">TND</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-5 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.06]"
          >
            <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/25">
              Réf:
            </span>
            <span className="font-mono font-extrabold text-sm text-white tracking-wider">
              {booking.reference}
            </span>
            <IoCheckmarkCircleOutline className="text-emerald-400 text-sm" />
          </motion.div>
        </motion.section>

        {/* MAIN GRID */}
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
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-purple-500/5 rounded-[28px] blur-lg" />
              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-[24px] overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
                <div className="p-6">
                  <SectionHeader
                    icon={<IoCalendarOutline />}
                    title="Détails du séjour"
                    subtitle={`Émis le ${fmtDate(booking.issuedAt)}`}
                  />

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <IoHomeOutline className="text-indigo-400 text-base" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-indigo-400">
                        Propriété
                      </p>
                      <p className="text-sm font-extrabold text-white">
                        {booking.listing.title}
                      </p>
                      <p className="text-[11px] text-white/30 flex items-center gap-1 mt-0.5">
                        <IoLocationOutline className="text-xs flex-shrink-0" />
                        {booking.listing.address}
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
                        bg: "border-indigo-500/10",
                      },
                      {
                        icon: <IoMoonOutline className="text-violet-400" />,
                        label: "Durée",
                        value: `${booking.nights} nuits`,
                        sub: `${booking.guests} voyageurs`,
                        bg: "border-violet-500/10",
                      },
                      {
                        icon: <IoLogOutOutline className="text-purple-400" />,
                        label: "Départ",
                        value: fmtDate(booking.checkOut),
                        sub: `Avant ${booking.checkOutTime}`,
                        bg: "border-purple-500/10",
                      },
                    ].map((d) => (
                      <div
                        key={d.label}
                        className={`rounded-xl p-3.5 bg-white/[0.02] border ${d.bg} flex flex-col gap-1.5`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{d.icon}</span>
                          <p className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-white/25">
                            {d.label}
                          </p>
                        </div>
                        <p className="text-xs font-extrabold text-white">
                          {d.value}
                        </p>
                        <p className="text-[10px] text-white/25 font-medium">
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
                      <div
                        key={item.label}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-white/30">{item.label}</span>
                        <span
                          className={`font-bold ${item.accent ? "text-indigo-400" : "text-white/60"}`}
                        >
                          {fmtPrice(item.value)} TND
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-dashed border-white/[0.06]">
                    <p className="text-sm font-extrabold text-white">
                      Total payé
                    </p>
                    <p className="text-xl font-black bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
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
                delay={0.3}
                extra={[
                  {
                    label: "Date de naissance",
                    value: fmtDate(booking.tenant.dateOfBirth),
                  },
                  { label: "Nationalité", value: booking.tenant.nationality },
                ]}
              />
              <PersonCard
                role="Propriétaire (Hôte)"
                firstName={booking.owner.firstName}
                lastName={booking.owner.lastName}
                cinNumber={booking.owner.cinNumber}
                email={booking.owner.email}
                phone={booking.owner.phone}
                verified={booking.owner.verified}
                delay={0.35}
                extra={[
                  {
                    label: "Hôte depuis",
                    value: booking.owner.joinedYear.toString(),
                  },
                  {
                    label: "Propriétés",
                    value: `${booking.owner.listings} annonces`,
                  },
                ]}
              />
            </div>

            {/* CONTRACT */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-purple-500/5 rounded-[28px] blur-lg" />
              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-[24px] overflow-hidden">
                <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                <div className="p-6">
                  <SectionHeader
                    icon={<IoDocumentTextOutline />}
                    title="Contrat & documents"
                    subtitle="Téléchargez votre contrat de location"
                  />

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-5">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <IoDocumentTextOutline className="text-indigo-400 text-xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">
                        Contrat de location
                      </p>
                      <p className="text-[11px] text-white/30 mt-0.5">
                        {booking.listing.title} · Réf {booking.reference}
                      </p>
                      <p className="text-[10px] text-white/20 mt-1">
                        PDF · Généré automatiquement · Signé électroniquement
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0">
                      <IoCheckmarkCircleOutline className="text-emerald-400 text-xs" />
                      <span className="text-[9px] font-bold text-emerald-400">
                        Prêt
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        showToast("Contrat téléchargé !", "success")
                      }
                      className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.97] transition-all"
                    >
                      <IoDocumentTextOutline className="text-lg" />
                      Télécharger le contrat
                    </button>
                    <button className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold text-white/70 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] transition-colors active:scale-[0.97]">
                      <IoChatbubbleOutline className="text-lg" />
                      Contacter l'hôte
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 mt-4 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <IoShieldCheckmarkOutline className="text-emerald-400 text-base flex-shrink-0" />
                    <p className="text-[11px] font-bold text-emerald-400/70">
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
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-purple-500/5 rounded-[28px] blur-lg" />
              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-[24px] overflow-hidden">
                <div className="relative h-52 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={booking.listing.image}
                    alt={booking.listing.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/30 to-transparent" />
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
                        lbl: "Arrivée",
                      },
                      {
                        icon: (
                          <IoMoonOutline className="text-violet-400 text-sm" />
                        ),
                        val: `${booking.nights}N`,
                        lbl: "Durée",
                      },
                      {
                        icon: (
                          <IoPeopleOutline className="text-purple-400 text-sm" />
                        ),
                        val: booking.guests,
                        lbl: "Voyag.",
                      },
                    ].map(({ icon, val, lbl }) => (
                      <div
                        key={lbl}
                        className="flex flex-col items-center gap-1 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                      >
                        {icon}
                        <p className="text-sm font-extrabold text-white">
                          {val}
                        </p>
                        <p className="text-[9px] font-bold text-white/25 uppercase tracking-wider">
                          {lbl}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-xs font-bold text-white/30 uppercase tracking-wider">
                      Total
                    </span>
                    <span className="text-base font-black bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                      {fmtPrice(booking.totalPrice)} TND
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* EXACT LOCATION */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-purple-500/5 rounded-[28px] blur-lg" />
              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-[24px] overflow-hidden">
                <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                <div className="p-5">
                  <SectionHeader
                    icon={<IoNavigateOutline />}
                    title="Emplacement exact"
                    subtitle={booking.listing.address}
                  />
                  <CoordinateDisplay
                    lat={booking.listing.latitude}
                    lng={booking.listing.longitude}
                    altitude={booking.listing.altitude}
                  />
                </div>
              </div>
            </motion.div>

            {/* Info notes */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <IoInformationCircleOutline className="text-amber-400 text-sm" />
              </div>
              <p className="text-[11px] text-amber-400/50 leading-relaxed font-medium">
                Le code d'accès sera activé le jour de votre arrivée à partir de{" "}
                {booking.checkInTime}. Contactez l'hôte via le chat pour toute
                question.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <IoMailOutline className="text-indigo-400 text-sm" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-400 mb-0.5">
                  E-mail envoyé
                </p>
                <p className="text-[11px] text-indigo-400/40 leading-relaxed">
                  Un récapitulatif complet a été envoyé à votre adresse e-mail.
                </p>
              </div>
            </motion.div>

            {/* Navigation links */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="group flex items-center justify-between px-5 py-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:border-indigo-500/20 hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <IoHomeOutline className="text-indigo-400 text-base" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Mes réservations
                  </p>
                  <p className="text-[10px] text-white/25">
                    Voir tous vos séjours
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                <IoArrowForwardOutline className="text-white/30 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all text-sm" />
              </div>
            </motion.div>

            {/* Help */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
            >
              <div>
                <p className="text-xs font-bold text-white/60">
                  Besoin d'aide ?
                </p>
                <p className="text-[10px] text-white/20">Support 24h/7j</p>
              </div>
              <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 group">
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
                {
                  icon: <IoTrophyOutline />,
                  label: "Meilleur prix",
                  sub: "Garanti",
                },
                {
                  icon: <IoFlashOutline />,
                  label: "Confirmation",
                  sub: "Instantanée",
                },
                {
                  icon: <IoDiamondOutline />,
                  label: "Qualité",
                  sub: "Premium",
                },
              ].map((b) => (
                <div
                  key={b.label}
                  className="text-center py-3 px-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                >
                  <div className="text-white/20 text-lg mb-1.5 flex justify-center">
                    {b.icon}
                  </div>
                  <p className="text-[9px] font-extrabold text-white/40 uppercase tracking-wider">
                    {b.label}
                  </p>
                  <p className="text-[8px] text-white/15">{b.sub}</p>
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
          className="mt-16 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-5"
        >
          <p className="text-sm text-white/20 italic text-center sm:text-left">
            "Merci de faire confiance à{" "}
            <span className="not-italic font-bold text-indigo-400">
              DjerbaStay
            </span>
            . Nous espérons que votre séjour sera inoubliable."
          </p>
          <div className="flex items-center gap-2 opacity-20">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500" />
            <span className="text-lg font-extrabold tracking-tight text-white">
              DJERBASTAY
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
