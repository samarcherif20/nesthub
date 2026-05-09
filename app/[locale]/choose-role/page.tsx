"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import CountUp from "react-countup";
import { RiLogoutCircleLine } from "react-icons/ri";
import { Loader2 } from "lucide-react";

// Composants UI
import { useChooseRole } from "./hooks/useChooseRole";

// React Icons
import {
  RiCompassDiscoverLine,
  RiCompassDiscoverFill,
  RiBuildingLine,
  RiBuildingFill,
  RiShieldCheckLine,
  RiLockLine,
  RiArrowRightLine,
  RiLogoutBoxLine,
  RiSearchLine,
  RiFlashlightLine,
  RiCameraLine,
  RiCustomerService2Line,
  RiBarChartBoxLine,
  RiCalendarCheckLine,
  RiBankCardLine,
  RiLineChartLine,
  RiSwapLine,
} from "react-icons/ri";
import {
  TbCompass,
  TbBuildingEstate,
  TbSparkles,
  TbCheck,
  TbFingerprint,
  TbMoon,
  TbSun,
} from "react-icons/tb";
import { PiHouseLineBold } from "react-icons/pi";
import { MdOutlineVerified } from "react-icons/md";
import { BsStarFill, BsArrowUpRight } from "react-icons/bs";
import { LuBadgeCheck } from "react-icons/lu";
import { HiMiniArrowRight } from "react-icons/hi2";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Types
type Role = "tenant" | "owner";

interface RoleData {
  key: Role;
  label: string;
  sublabel: string;
  headline: string;
  description: string;
  image: string;
  heroImage: string;
  from: string;
  via: string;
  to: string;
  glowRgb: string;
  accentHex: string;
  lightHex: string;
  perks: { Icon: React.ElementType; text: string }[];
  stats: { end: number; suffix: string; label: string }[];
  rating: string;
  reviews: string;
  cta: string;
}



// ═══════════════════════════════════════════════════
// MOUSE TILT HOOK
// ═══════════════════════════════════════════════════
function useTilt(strength = 10) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rX = useTransform(my, [-150, 150], [strength, -strength]);
  const rY = useTransform(mx, [-150, 150], [-strength, strength]);
  const srX = useSpring(rX, { stiffness: 160, damping: 20 });
  const srY = useSpring(rY, { stiffness: 160, damping: 20 });

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left - r.width / 2);
    my.set(e.clientY - r.top - r.height / 2);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };
  return { srX, srY, onMove, onLeave };
}

// ═══════════════════════════════════════════════════
// AURORA BACKGROUND
// ═══════════════════════════════════════════════════
function Aurora({ activeRole }: { activeRole: Role | null }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
      <div
        className={`absolute inset-0 ${isDark ? "bg-slate-950" : "bg-[#f0f2f8]"}`}
      />
      <div
        className="absolute inset-0 opacity-30 dark:opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle, ${isDark ? "#334155" : "#c0cce0"} 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      <motion.div
        animate={{
          background:
            activeRole === "owner"
              ? `radial-gradient(ellipse at 20% 30%, ${isDark ? "rgba(139,92,246,0.15)" : "rgba(113,42,226,0.12)"} 0%, transparent 60%)`
              : `radial-gradient(ellipse at 20% 30%, ${isDark ? "rgba(14,165,233,0.12)" : "rgba(0,92,171,0.1)"} 0%, transparent 60%)`,
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        className="absolute inset-0"
      />
      <motion.div
        animate={{
          background:
            activeRole === "tenant"
              ? `radial-gradient(ellipse at 80% 70%, ${isDark ? "rgba(14,165,233,0.15)" : "rgba(0,117,214,0.12)"} 0%, transparent 55%)`
              : `radial-gradient(ellipse at 80% 70%, ${isDark ? "rgba(139,92,246,0.12)" : "rgba(138,76,252,0.1)"} 0%, transparent 55%)`,
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        className="absolute inset-0"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// HEADER AVEC DÉGRADÉ SKY/PURPLE
// ═══════════════════════════════════════════════════
function Header({
  user,
  onLogout,
}: {
  user: UserData | null;
  onLogout: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const t = useTranslations("Common");
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const getAvatarUrl = () => {
    if (user?.avatar && !avatarError) {
      return user.avatar;
    }
    return null;
  };

  const getInitial = () => {
    return user?.name?.charAt(0).toUpperCase() || "U";
  };

  // Couleurs du header selon le scroll et le thème
  const getHeaderStyle = () => {
    if (scrolled) {
      // Style quand on scroll
      return {
        background: isDark 
          ? "rgba(15, 23, 42, 0.92)"  // slate-900 presque opaque
          : "rgba(255, 255, 255, 0.92)", // blanc presque opaque
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
        boxShadow: isDark
          ? "0 4px 24px -4px rgba(0,0,0,0.4)"
          : "0 4px 24px -4px rgba(0,0,0,0.08)",
      };
    } else {
      // Style en haut de page - dégradé transparent
      return {
        background: "linear-gradient(135deg, rgba(14,165,233,0.88), rgba(139,92,246,0.88), rgba(168,85,247,0.88))",
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow: "0 8px 32px -8px rgba(0,0,0,0.2)",
      };
    }
  };

  // Couleur du texte selon le scroll
  const textColor = scrolled 
    ? (isDark ? "text-white" : "text-gray-800")
    : "text-white";
  
  // Couleur du sous-titre
  const subtitleColor = scrolled
    ? (isDark ? "text-gray-400" : "text-gray-500")
    : "text-white/70";

  const headerStyle = getHeaderStyle();

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-50 px-4 py-3"
    >
      <div
        className="max-w-6xl mx-auto flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500"
        style={{
          background: headerStyle.background,
          backdropFilter: "blur(12px)",
          boxShadow: headerStyle.boxShadow,
          border: headerStyle.border,
        }}
      >
        {/* Logo avec ton image */}
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 shrink-0">
                      <Image
                        src="/logo/logo.png"
                        alt="NestHub Logo"
                        fill
                        className="object-contain scale-[5.75] translate-y-2.75 ml-2.5"
                      />
                    </div>
          <div className="flex flex-col">
            <span 
className={`ml-4 mt-1.5 font-black text-2xl tracking-tight transition-colors duration-300 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent`}              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              N E S T H U B
            </span>
           
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">

          {user && (
            <>
              <div 
                className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl transition-all duration-300
                  ${scrolled 
                    ? (isDark ? "bg-slate-800/50 border-slate-700" : "bg-gray-100/80 border-gray-200")
                    : "bg-white/20 backdrop-blur-sm border-white/30"
                  } border`}
              >
                <div className="relative w-8 h-8">
                  {getAvatarUrl() ? (
                    <img
                      src={getAvatarUrl()!}
                      alt={user.name}
                      className="w-full h-full rounded-lg object-cover ring-2 ring-white/20"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className={`w-full h-full rounded-lg flex items-center justify-center text-white font-bold ${
                      scrolled && !isDark ? "bg-gradient-to-r from-sky-500 to-purple-500" : "bg-white/20"
                    }`}>
                      {getInitial()}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
                </div>
                <div className="hidden sm:block leading-tight">
                  <p className={`text-[10px] font-semibold transition-colors duration-300 ${
                    scrolled ? (isDark ? "text-gray-400" : "text-gray-500") : "text-white/70"
                  }`}>
                    Connecté
                  </p>
                  <p className={`text-[13px] font-bold transition-colors duration-300 ${textColor}`}>
                    {user.name.length > 15 ? user.name.slice(0, 12) + "..." : user.name}
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className={`flex items-center gap-1.5 text-[12px] font-semibold transition-all duration-300 px-3 py-2 rounded-xl
                  ${scrolled
                    ? (isDark 
                      ? "text-gray-300 hover:text-red-400 hover:bg-red-500/10" 
                      : "text-gray-600 hover:text-red-500 hover:bg-red-50")
                    : "text-white/80 hover:text-white hover:bg-white/20"
                  }`}
              >
                <RiLogoutBoxLine className="text-base" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
// ═══════════════════════════════════════════════════
// REMEMBER TOGGLE
// ═══════════════════════════════════════════════════
function RememberToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const t = useTranslations("ChooseRole");

  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center gap-3 group select-none focus:outline-none"
    >
      <div className="relative w-12 h-[26px] flex-shrink-0">
        <motion.div
          animate={{
            background: value
              ? "linear-gradient(90deg,#14b8a6,#8b5cf6)"
              : isDark
                ? "#334155"
                : "#d1d5db",
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-full"
        />
        <motion.div
          animate={{ x: value ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 420, damping: 24 }}
          className="absolute top-[3px] w-[20px] h-[20px] bg-white rounded-full shadow-md"
        />
      </div>
      <span className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors text-left leading-snug">
        {t("rememberChoice")}
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════
// TRUST STRIP
// ═══════════════════════════════════════════════════
function TrustStrip() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const t = useTranslations("TrustStrip");

  const items = [
    { Icon: RiShieldCheckLine, label: t("ssl") },
    { Icon: RiLockLine, label: t("encryption") },
    { Icon: RiSwapLine, label: t("switch") },
    { Icon: MdOutlineVerified, label: t("certified") },
  ];

  return (
    <div className="flex items-center gap-4 flex-wrap justify-center">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 + i * 0.07 }}
          className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-[11px] font-semibold"
        >
          <item.Icon className="text-sm" />
          {item.label}
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════
function Footer() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const t = useTranslations("Footer");
  const locale = useLocale();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="relative z-10 mt-auto py-6 px-6 border-t"
      style={{
        background: isDark ? "rgba(15,23,42,0.4)" : "rgba(255,255,255,0.4)",
        backdropFilter: "blur(12px)",
        borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
      }}
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">
            © 2026 NESTHUB · {t("rights")}
          </p>
        </div>
        <div className="flex items-center gap-5">
          <a
            href={`/${locale}/help`}
            className="text-[11px] text-gray-400 dark:text-gray-500 hover:text-[#005cab] dark:hover:text-[#60a5fa] transition-colors uppercase tracking-wider font-semibold"
          >
            {t("help")}
          </a>
          <a
            href={`/${locale}/privacy`}
            className="text-[11px] text-gray-400 dark:text-gray-500 hover:text-[#005cab] dark:hover:text-[#60a5fa] transition-colors uppercase tracking-wider font-semibold"
          >
            {t("privacy")}
          </a>
          <a
            href={`/${locale}/terms`}
            className="text-[11px] text-gray-400 dark:text-gray-500 hover:text-[#005cab] dark:hover:text-[#60a5fa] transition-colors uppercase tracking-wider font-semibold"
          >
            {t("terms")}
          </a>
        </div>
      </div>
    </motion.footer>
  );
}

// ═══════════════════════════════════════════════════
// DONNÉES DES CARTES
// ═══════════════════════════════════════════════════
const getRoleData = (role: Role, t: any): RoleData => {
  const isTenant = role === "tenant";

  return {
    key: role,
    label: isTenant ? t("tenantLabel") : t("ownerLabel"),
    sublabel: isTenant ? t("tenantSublabel") : t("ownerSublabel"),
    headline: isTenant ? t("tenantHeadline") : t("ownerHeadline"),
    description: isTenant ? t("tenantDescription") : t("ownerDescription"),
    image: isTenant
      ? "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop"
      : "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
    heroImage: isTenant
      ? "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&h=900&fit=crop"
      : "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&h=900&fit=crop",
    from: isTenant ? "#00326b" : "#2a0070",
    via: isTenant ? "#0058a8" : "#5a10c8",
    to: isTenant ? "#1a8fff" : "#9d5cff",
    glowRgb: isTenant ? "0,92,171" : "113,42,226",
    accentHex: isTenant ? "#0075d6" : "#8a4cfc",
    lightHex: isTenant ? "#dbeeff" : "#ede9ff",
    perks: isTenant
      ? [
          { Icon: RiSearchLine, text: t("perk1Tenant") },
          { Icon: RiFlashlightLine, text: t("perk2Tenant") },
          { Icon: RiCameraLine, text: t("perk3Tenant") },
          { Icon: RiCustomerService2Line, text: t("perk4Tenant") },
        ]
      : [
          { Icon: RiBarChartBoxLine, text: t("perk1Owner") },
          { Icon: RiCalendarCheckLine, text: t("perk2Owner") },
          { Icon: RiBankCardLine, text: t("perk3Owner") },
          { Icon: RiLineChartLine, text: t("perk4Owner") },
        ],
    stats: isTenant
      ? [
          { end: 12800, suffix: "+", label: t("stat1Tenant") },
          { end: 24, suffix: "", label: t("stat2Tenant") },
          { end: 49, suffix: "K", label: t("stat3Tenant") },
        ]
      : [
          { end: 43, suffix: "%", label: t("stat1Owner") },
          { end: 4600, suffix: "+", label: t("stat2Owner") },
          { end: 98, suffix: "K+", label: t("stat3Owner") },
        ],
    rating: isTenant ? "4.9" : "4.8",
    reviews: isTenant ? "2 341" : "1 887",
    cta: isTenant ? t("ctaTenant") : t("ctaOwner"),
  };
};

// ═══════════════════════════════════════════════════
// ROLE CARD
// ═══════════════════════════════════════════════════
function RoleCard({
  roleData,
  isSelected,
  isDimmed,
  onSelect,
  delay,
  t,
}: {
  roleData: RoleData;
  isSelected: boolean;
  isDimmed: boolean;
  onSelect: () => void;
  delay: number;
  t: any;
}) {
  const [hovered, setHovered] = useState(false);
  const { srX, srY, onMove, onLeave } = useTilt(7);
  const CardIcon =
    roleData.key === "tenant" ? RiCompassDiscoverFill : RiBuildingFill;

  return (
    <motion.div
      initial={{ opacity: 0, y: 56, scale: 0.92 }}
      animate={{
        opacity: isDimmed ? 0.38 : 1,
        y: 0,
        scale: isSelected ? 1.03 : isDimmed ? 0.96 : 1,
        filter: isDimmed ? "grayscale(50%) blur(0.5px)" : "none",
      }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX: srX, rotateY: srY, transformPerspective: 1200 }}
      onMouseMove={(e) => {
        onMove(e);
        setHovered(true);
      }}
      onMouseLeave={() => {
        onLeave();
        setHovered(false);
      }}
      onClick={onSelect}
      className="relative cursor-pointer rounded-[32px] overflow-hidden flex-1 min-w-0 select-none"
      whileHover={{ zIndex: 10 }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[32px]">
        <motion.img
          src={roleData.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          animate={{ scale: hovered || isSelected ? 1.1 : 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <motion.div
        className="absolute inset-0"
        animate={{ opacity: hovered ? 0.96 : 0.91 }}
        transition={{ duration: 0.4 }}
        style={{
          background: `linear-gradient(160deg, ${roleData.from}f8 0%, ${roleData.via}e8 45%, ${roleData.to}c0 100%)`,
        }}
      />

      <div className="relative z-10 flex flex-col min-h-[520px] p-7 sm:p-8">
        <div className="flex items-start justify-between mb-8">
          <motion.div
            animate={hovered ? { y: -2, scale: 1.04 } : { y: 0, scale: 1 }}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] px-3.5 py-2 rounded-full text-white/90"
            style={{
              background: "rgba(255,255,255,0.14)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.22)",
            }}
          >
            <LuBadgeCheck className="text-sm text-white/70" />
            {roleData.sublabel}
          </motion.div>

          <AnimatePresence>
            {isSelected ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -120 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-2xl"
                style={{
                  boxShadow: `0 8px 30px rgba(${roleData.glowRgb},0.7)`,
                }}
              >
                <TbCheck
                  className="text-xl"
                  style={{ color: roleData.accentHex }}
                  strokeWidth={3}
                />
              </motion.div>
            ) : (
              <motion.div
                key="indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: hovered ? 1 : 0 }}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.14)",
                  border: "1.5px solid rgba(255,255,255,0.35)",
                }}
              >
                <BsArrowUpRight className="text-white text-sm" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          animate={
            hovered
              ? { scale: 1.15, rotate: 8, y: -6 }
              : isSelected
                ? { scale: 1.08, rotate: 4, y: -3 }
                : { scale: 1, rotate: 0, y: 0 }
          }
          transition={{ type: "spring", stiffness: 240, damping: 14 }}
          className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center mb-6 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.16)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.24)",
          }}
        >
          <CardIcon className="text-4xl text-white drop-shadow-lg" />
        </motion.div>

        <div className="mb-6">
          <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.18em] mb-2">
            {roleData.key === "tenant" ? t("forTenants") : t("forOwners")}
          </p>
          <h2 className="text-3xl font-black text-white leading-tight mb-3">
            {roleData.label}
          </h2>
          <p className="text-white/65 text-sm leading-relaxed font-medium">
            {roleData.description}
          </p>
        </div>

        <ul className="space-y-2.5 mb-auto">
          {roleData.perks.map((perk, i) => (
            <motion.li
              key={perk.text}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.2 + i * 0.07 }}
              className="flex items-center gap-3"
            >
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <perk.Icon className="text-white/90 text-sm" />
              </div>
              <span className="text-white/82 text-[13px] font-semibold">
                {perk.text}
              </span>
            </motion.li>
          ))}
        </ul>

        <div
          className="my-5 h-px"
          style={{ background: "rgba(255,255,255,0.12)" }}
        />

        <div className="grid grid-cols-3 gap-2 mb-5">
          {roleData.stats.map((s, i) => (
            <div key={s.label} className="text-center">
              <div className="text-xl font-black text-white leading-none mb-1">
                {isSelected || hovered ? (
                  <CountUp
                    end={s.end}
                    duration={1.5}
                    delay={i * 0.15}
                    suffix={s.suffix}
                    separator=" "
                  />
                ) : (
                  <span>
                    {s.end.toLocaleString("fr-FR")}
                    {s.suffix}
                  </span>
                )}
              </div>
              <div className="text-white/45 text-[9px] uppercase tracking-wider font-bold">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <BsStarFill
                  key={s}
                  className="text-yellow-300 text-xs drop-shadow"
                />
              ))}
            </div>
            <span className="text-white font-black text-sm">
              {roleData.rating}
            </span>
            <span className="text-white/45 text-xs">
              ({roleData.reviews} {t("reviews")})
            </span>
          </div>
          <motion.div
            animate={
              hovered || isSelected
                ? { opacity: 1, x: 0 }
                : { opacity: 0, x: -8 }
            }
            transition={{ duration: 0.25 }}
            className="flex items-center gap-1.5 text-white/90 text-xs font-black"
          >
            {isSelected ? t("selected") : t("choose")}
            <RiArrowRightLine
              className={isSelected ? "text-white" : "text-white/70"}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
// MODAL DE DÉCONNEXION (identique au layout)
// ═══════════════════════════════════════════════════
function LogoutModal({
  onClose,
  onConfirm,
  t,
}: {
  onClose: () => void;
  onConfirm: () => void;
  t: any;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-800">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
          <RiLogoutCircleLine className="text-3xl text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t("logoutConfirm")}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {t("logoutMessage")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300 font-medium text-sm transition-colors cursor-pointer"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm shadow-lg shadow-red-600/20 transition-colors cursor-pointer"
          >
            {t("logoutConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// TRANSITION SCREEN
// ═══════════════════════════════════════════════════
function TransitionScreen({
  roleData,
  onDone,
  t,
}: {
  roleData: RoleData;
  onDone: () => void;
  t: any;
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const CardIcon = roleData.key === "tenant" ? TbCompass : TbBuildingEstate;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${roleData.from}, ${roleData.via} 50%, ${roleData.to})`,
      }}
    >
      <div className="absolute inset-0">
        <img
          src={roleData.heroImage}
          alt=""
          className="w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
      </div>

      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 16,
            delay: 0.1,
          }}
          className="w-28 h-28 rounded-3xl flex items-center justify-center mb-8 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(24px)",
            border: "2px solid rgba(255,255,255,0.28)",
          }}
        >
          <CardIcon className="text-6xl text-white drop-shadow-lg" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-white/55 text-[11px] font-black uppercase tracking-[0.22em] mb-2"
        >
          {t("redirectingTo")}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-white text-4xl font-black mb-2 text-center"
        >
          {roleData.label}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/55 text-sm font-semibold mb-10"
        >
          {roleData.headline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scaleX: 0.6 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.4 }}
          className="w-56 h-1.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <motion.div
            className="h-full rounded-full bg-white"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
// CTA BUTTON
// ═══════════════════════════════════════════════════
function CTAButton({
  roleData,
  disabled,
  onClick,
  loading,
  t,
}: {
  roleData: RoleData | null;
  disabled: boolean;
  onClick: () => void;
  loading: boolean;
  t: any;
}) {
  const [hov, setHov] = useState(false);
  const CardIcon =
    roleData?.key === "tenant" ? RiCompassDiscoverFill : RiBuildingFill;

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <AnimatePresence>
        {!disabled && roleData && (
          <motion.div
            key={roleData.key}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: hov ? 0.7 : 0.4, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 rounded-2xl blur-2xl -z-10 scale-[1.08]"
            style={{
              background: `linear-gradient(135deg, ${roleData.from}, ${roleData.accentHex})`,
            }}
          />
        )}
      </AnimatePresence>

      <motion.button
        onClick={onClick}
        disabled={disabled || loading}
        whileHover={disabled || loading ? {} : { scale: 1.02 }}
        whileTap={disabled || loading ? {} : { scale: 0.97 }}
        className="relative w-full overflow-hidden rounded-2xl py-4 px-8 font-black text-[15px] transition-all duration-500 flex items-center justify-center cursor-pointer"
        style={{
          background:
            disabled || !roleData
              ? "#e5e7eb"
              : `linear-gradient(135deg, ${roleData.from} 0%, ${roleData.via} 50%, ${roleData.accentHex} 100%)`,
          color: disabled || !roleData ? "#9ca3af" : "#fff",
          cursor: disabled || loading ? "not-allowed" : "pointer",
          boxShadow:
            disabled || !roleData
              ? "none"
              : `0 12px 48px -8px rgba(${roleData.glowRgb},0.55)`,
        }}
      >
        {loading ? (
          <LoadingSpinner className="animate-spin h-5 w-5" />
        ) : (
          <>
            {!disabled && roleData && (
              <motion.div
                className="absolute inset-0 -skew-x-12 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)",
                }}
                animate={{ x: ["-150%", "250%"] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.6,
                  repeatDelay: 1.4,
                  ease: "easeInOut",
                }}
              />
            )}
            {disabled ? (
              <span className="flex items-center gap-2.5">
                <TbFingerprint className="text-xl text-gray-400" />
                {t("selectSpace")}
              </span>
            ) : (
              roleData && (
                <span className="flex items-center gap-3">
                  <CardIcon className="text-xl" />
                  {roleData.cta}
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.3,
                      ease: "easeInOut",
                    }}
                  >
                    <HiMiniArrowRight className="text-xl" />
                  </motion.span>
                </span>
              )
            )}
          </>
        )}
      </motion.button>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════
export default function ChooseRolePage() {
  const t = useTranslations("ChooseRole");
  const locale = useLocale();
  const {
    user,
    selected,
    remember,
    transitioning,
    loading,
    submitting,
    showLogoutModal,
    isDark,
    setRemember,
    setShowLogoutModal,
    handleSelect,
    handleConfirm,
    handleLogout,
    handleCloseLogoutModal,
  } = useChooseRole();

  const roleDataTenant = getRoleData("tenant", t);
  const roleDataOwner = getRoleData("owner", t);
  const selectedRoleData =
    selected === "tenant"
      ? roleDataTenant
      : selected === "owner"
        ? roleDataOwner
        : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <LoadingSpinner
          fullScreen={true}
          variant="spinner"
          size="lg"
          color="primary"
          text={t("loading")}
          speed="normal"
        />{" "}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-white dark:bg-slate-950"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');`}</style>

      <Aurora activeRole={selected} />

      <AnimatePresence>
        {transitioning && selectedRoleData && (
          <TransitionScreen
            roleData={selectedRoleData}
            onDone={() => {}}
            t={t}
          />
        )}
      </AnimatePresence>

      <Header user={user} onLogout={() => setShowLogoutModal(true)} />

      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 pt-28 pb-12">
        <div className="max-w-6xl w-full flex flex-col items-center gap-8">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.15 }}
            className="text-center max-w-2xl"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.25,
                type: "spring",
                stiffness: 300,
                damping: 18,
              }}
              className="inline-flex items-center gap-2.5 mb-6 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
              style={{
                background: isDark
                  ? "rgba(30,41,59,0.8)"
                  : "rgba(255,255,255,0.8)",
                backdropFilter: "blur(16px)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
              }}
            >
              <motion.span
                animate={{ rotate: [0, 16, -10, 16, 0] }}
                transition={{
                  delay: 1.5,
                  duration: 1.1,
                  repeat: Infinity,
                  repeatDelay: 5,
                }}
                className="text-xl"
              >
                👋
              </motion.span>
              <span className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
                {t("greeting")},{" "}
                <span
                  className={`${isDark ? "text-white" : "text-gray-900"} font-black`}
                >
                  {user?.name.split(" ")[0] || t("user")}
                </span>{" "}
                !
              </span>
            </motion.div>

            <h1
              className={`text-[2.7rem] sm:text-5xl font-extrabold leading-[1.07] mb-5 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {t("title")}{" "}
              <span className="relative inline-block">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500">
                  {t("highlight")}
                </span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="absolute -bottom-1.5 left-0 right-0 h-[3px] rounded-full origin-left bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500"
                />
              </span>{" "}
              {t("question")}
            </h1>

            <p
              className={`text-base leading-relaxed font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              {t("description")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-sm"
            style={{
              background: isDark
                ? "rgba(30,41,59,0.75)"
                : "rgba(255,255,255,0.75)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
            }}
          >
            <MdOutlineVerified className="text-xl text-[#712ae2] dark:text-[#a78bfa] flex-shrink-0" />
            <span
              className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              {t("doubleProfile")}
            </span>
            <div
              className={`h-4 w-px ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
            />
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                <RiCompassDiscoverLine className="text-xs" /> {t("traveler")}
              </span>
              <span
                className={`${isDark ? "text-gray-600" : "text-gray-300"} font-bold`}
              >
                +
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                <RiBuildingLine className="text-xs" /> {t("owner")}
              </span>
            </div>
          </motion.div>

          <div
            className="w-full flex flex-col sm:flex-row gap-5 sm:gap-6"
            style={{ perspective: "1400px" }}
          >
            <RoleCard
              roleData={roleDataTenant}
              isSelected={selected === "tenant"}
              isDimmed={selected !== null && selected !== "tenant"}
              onSelect={() => handleSelect("tenant")}
              delay={0}
              t={t}
            />
            <RoleCard
              roleData={roleDataOwner}
              isSelected={selected === "owner"}
              isDimmed={selected !== null && selected !== "owner"}
              onSelect={() => handleSelect("owner")}
              delay={0.14}
              t={t}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="w-full max-w-lg flex flex-col items-center gap-5"
          >
            <RememberToggle value={remember} onChange={setRemember} />
            <CTAButton
              roleData={selectedRoleData}
              disabled={!selected}
              onClick={handleConfirm}
              loading={submitting}
              t={t}
            />
            <TrustStrip />
          </motion.div>
        </div>
      </main>

      <Footer />

      {/* Modal de déconnexion */}
      {showLogoutModal && (
        <LogoutModal
          onClose={handleCloseLogoutModal}
          onConfirm={handleLogout}
          t={{
            logoutConfirm: t("logoutConfirm"),
            logoutMessage: t("logoutMessage"),
            cancel: t("cancel"),
          }}
        />
      )}
    </div>
  );
}
