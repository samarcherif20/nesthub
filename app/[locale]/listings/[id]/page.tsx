// app/[locale]/listings/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { POILegend } from "@/components/ui/maps/POILegend";

import {
  IoHeartOutline,
  IoHeart,
  IoStar,
  IoLocationOutline,
  IoCheckmarkCircleOutline,
  IoShareSocialOutline,
  IoBedOutline,
  IoCloseOutline,
  IoPeopleOutline,
  IoTimeOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoShieldCheckmarkOutline,
  IoWifi,
  IoSnowOutline,
  IoTvOutline,
  IoLeafOutline,
  IoEyeOutline,
  IoPersonOutline,
  IoInformationCircleOutline,
  IoRemoveOutline,
  IoAddOutline,
  IoNavigateOutline,
  IoWalkOutline,
  IoArrowBackOutline,
  IoImagesOutline,
  IoCalendarOutline,
  IoLocationSharp,
  IoMapOutline,
  IoSparkles,
  IoHomeOutline,
  IoSearchOutline,
  IoCopyOutline,
} from "react-icons/io5";
import {
  FaSwimmingPool,
  FaParking,
  FaUtensils,
  FaWind,
  FaShower,
  FaFire,
  FaHome,
} from "react-icons/fa";
import {
  MdOutlineSquareFoot,
  MdOutlineElevator,
  MdBalcony,
  MdOutlineDeck,
  MdOutlineIron,
} from "react-icons/md";
import { useListingTest as useListing } from "@/hooks/useListingTest";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import AvailabilityCalendar from "@/components/ui/calendar/AvailabilityCalendar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { IdentityVerificationModal } from "@/components/ui/IdentityVerificationModal";
import { TbBeach } from "react-icons/tb";
import { Calendar, Plane } from "lucide-react";

// Dynamically import map with no SSR
const ListingMap = dynamic(() => import("@/components/ui/maps/ListingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-2xl">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs text-gray-500">Chargement de la carte...</p>
      </div>
    </div>
  ),
});

// Types for POIs
interface NearbyPOI {
  id: string;
  lat: number;
  lon: number;
  name: string;
  category: string;
  icon: string;
  color: string;
  distance: number;
  duration?: number;
}

// Utils
function fmtPrice(n: number) {
  return n.toLocaleString("fr-FR");
}

function nightsBetween(a: string, b: string) {
  if (!a || !b) return 0;
  return Math.max(
    0,
    Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000),
  );
}

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getWalkingTime(distanceKm: number) {
  const walkingSpeed = 5;
  const minutes = Math.round((distanceKm / walkingSpeed) * 60);
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

// Equipment icons mapping
const EQUIP_ICONS: Record<string, React.ReactNode> = {
  wifi: <IoWifi />,
  pool: <FaSwimmingPool />,
  ac: <IoSnowOutline />,
  kitchen: <FaUtensils />,
  parking: <FaParking />,
  terrace: <MdOutlineDeck />,
  washer: <FaWind />,
  tv: <IoTvOutline />,
  garden: <IoLeafOutline />,
  bbq: <FaFire />,
  iron: <MdOutlineIron />,
  sea: <IoEyeOutline />,
  elevator: <MdOutlineElevator />,
  balcony: <MdBalcony />,
  shower: <FaShower />,
};

// French translations for equipment
const EQUIP_NAMES_FR: Record<string, string> = {
  wifi: "Wi-Fi haut débit",
  tv: "Télévision",
  smartTv: "Smart TV",
  netflix: "Netflix",
  ac: "Climatisation",
  airConditioning: "Climatisation",
  heating: "Chauffage",
  kitchen: "Cuisine équipée",
  washer: "Machine à laver",
  dryer: "Sèche-linge",
  dishwasher: "Lave-vaisselle",
  microwave: "Micro-ondes",
  oven: "Four",
  coffeeMaker: "Cafetière",
  parking: "Parking gratuit",
  garage: "Garage",
  pool: "Piscine",
  swimmingPool: "Piscine",
  garden: "Jardin",
  terrace: "Terrasse",
  balcony: "Balcon",
  bbq: "Barbecue",
  gym: "Salle de sport",
  elevator: "Ascenseur",
  iron: "Fer à repasser",
  seaView: "Vue sur mer",
  mountainView: "Vue sur montagne",
  cityView: "Vue sur ville",
  smokingAllowed: "Fumeurs acceptés",
  petsAllowed: "Animaux acceptés",
  isFurnished: "Meublé",
};

function resolveEquipmentList(
  equipment: any,
): { name: string; icon: string }[] {
  if (!equipment) return [];

  let keys: string[] = [];
  if (typeof equipment === "object" && !Array.isArray(equipment)) {
    keys = Object.entries(equipment)
      .filter(([, v]) => v === true || v === "true")
      .map(([k]) => k);
  } else if (Array.isArray(equipment)) {
    keys = equipment;
  }

  return keys.map((key) => ({
    name:
      EQUIP_NAMES_FR[key] ||
      key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
    icon: key,
  }));
}

function parseHouseRules(rules: any): string[] {
  if (!rules) return [];
  if (Array.isArray(rules)) return rules;
  if (typeof rules === "object") {
    const result: string[] = [];
    if (rules.checkIn) result.push(`Arrivée à partir de ${rules.checkIn}`);
    if (rules.checkOut) result.push(`Départ avant ${rules.checkOut}`);
    if (rules.noSmoking === true) result.push("Interdiction de fumer");
    if (rules.noParties === true) result.push("Pas de fêtes");
    if (rules.petsAllowed === true) result.push("Animaux acceptés sur demande");
    return result;
  }
  return [];
}

function getImageUrl(url: string) {
  if (!url) return "";
  if (url.includes("/api/listings/image")) return url;
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
}

function getAvatarUrl(url: string) {
  if (!url) return "";
  if (url.includes("/api/listings/image")) return url;
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATED COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */
function AnimPrice({ target, delay = 0 }: { target: number; delay?: number }) {
  const [cur, setCur] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const start = performance.now() + delay * 1000;
    const tick = (now: number) => {
      if (now < start) {
        ref.current = requestAnimationFrame(tick);
        return;
      }
      const p = Math.min((now - start) / 800, 1);
      setCur(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [target, delay]);
  return <>{fmtPrice(cur)}</>;
}

function Background() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = !mounted
    ? false
    : theme === "dark" || (theme === "system" && systemTheme === "dark");

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none transition-colors duration-700">
      <div
        className={`absolute inset-0 ${isDark ? "bg-[#070b14]" : "bg-gradient-to-br from-sky-50 via-white to-indigo-50"}`}
      />
      <motion.div
        className={`absolute w-[600px] h-[600px] rounded-full blur-[120px] ${isDark ? "opacity-20" : "opacity-[0.07]"}`}
        style={{
          background: isDark
            ? "radial-gradient(circle,#4f46e5,#7c3aed,transparent)"
            : "radial-gradient(circle,#818cf8,#a78bfa,transparent)",
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
        className={`absolute w-[500px] h-[500px] rounded-full blur-[100px] ${isDark ? "opacity-15" : "opacity-[0.05]"}`}
        style={{
          background: isDark
            ? "radial-gradient(circle,#0ea5e9,#6366f1,transparent)"
            : "radial-gradient(circle,#60a5fa,#818cf8,transparent)",
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
      {isDark && (
        <>
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)",
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
        </>
      )}
    </div>
  );
}

// 3D Card component
function Card3D({
  icon,
  name,
  index,
  dark,
}: {
  icon: React.ReactNode;
  name: string;
  index: number;
  dark: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);
  const [sh, setSh] = useState({ x: 50, y: 50 });

  const onMove = (e: React.MouseEvent) => {
    const c = ref.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width,
      y = (e.clientY - r.top) / r.height;
    setTilt({ x: (y - 0.5) * -12, y: (x - 0.5) * 12 });
    setSh({ x: x * 100, y: y * 100 });
  };
  const onLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHover(false);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, rotateX: -8 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      onMouseMove={onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={onLeave}
      style={{
        transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transformStyle: "preserve-3d",
        transition: hover
          ? "transform 0.1s ease-out"
          : "transform 0.5s ease-out",
      }}
      className="relative cursor-default"
    >
      <div
        className="absolute -inset-1 rounded-2xl transition-all duration-300"
        style={{
          background: hover
            ? `radial-gradient(circle at 50% 50%, ${dark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.12)"}, transparent 70%)`
            : "transparent",
          filter: hover ? "blur(20px)" : "none",
          transform: `translate(${tilt.y * 0.5}px,${tilt.x * 0.5}px)`,
        }}
      />
      <div
        className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${
          hover
            ? dark
              ? "border-white/20 bg-slate-800/60 shadow-2xl"
              : "border-indigo-200/60 bg-white shadow-xl shadow-indigo-500/10"
            : dark
              ? "border-white/10 bg-slate-800/40"
              : "border-white bg-white shadow-sm"
        }`}
      >
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: hover ? 0.2 : 0,
            background: `radial-gradient(circle at ${sh.x}% ${sh.y}%, ${dark ? "rgba(255,255,255,0.4)" : "rgba(99,102,241,0.15)"}, transparent 60%)`,
          }}
        />
        <div
          className="relative p-4 flex flex-col items-center text-center gap-3"
          style={{ transform: "translateZ(20px)" }}
        >
          <div className="relative">
            <motion.div
              animate={
                hover ? { scale: 1.15, rotateZ: 5 } : { scale: 1, rotateZ: 0 }
              }
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-300 ${
                hover
                  ? dark
                    ? "bg-white/10 text-white/80"
                    : "bg-indigo-50 text-indigo-600"
                  : dark
                    ? "bg-white/5 text-white/40"
                    : "bg-gray-50 text-gray-400"
              }`}
            >
              {icon}
            </motion.div>
          </div>
          <div>
            <p
              className={`text-xs font-bold transition-colors duration-300 uppercase tracking-wide ${hover ? (dark ? "text-white/80" : "text-gray-800") : dark ? "text-white/40" : "text-gray-500"}`}
            >
              {name}
            </p>
          </div>
        </div>
        <div
          className={`absolute bottom-0 left-[10%] right-[10%] h-px transition-all duration-500 ${hover ? "bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" : "bg-transparent"}`}
        />
      </div>
    </motion.div>
  );
}

function Section({
  title,
  sub,
  children,
  delay = 0,
  action,
  dark,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  delay?: number;
  action?: React.ReactNode;
  dark: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.5 }}
    >
      <div
        className={`rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md ${
          dark
            ? "bg-slate-900/80 border border-white/10"
            : "bg-white border border-white shadow-sm"
        }`}
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={`text-sm font-extrabold uppercase tracking-wide ${dark ? "text-white/80" : "text-gray-800"}`}
                >
                  {title}
                </h3>
              </div>
              {sub && (
                <p
                  className={`text-[11px] mt-1 ${dark ? "text-white/40" : "text-gray-400"}`}
                >
                  {sub}
                </p>
              )}
            </div>
            {action}
          </div>
          {children}
        </div>
      </div>
    </motion.div>
  );
}

function Lightbox({
  images,
  index,
  onClose,
  onNav,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onNav: (i: number) => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onNav(index - 1);
      if (e.key === "ArrowRight" && index < images.length - 1) onNav(index + 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [index, images.length, onClose, onNav]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all z-10"
      >
        <IoCloseOutline className="text-xl" />
      </button>
      <button
        onClick={() => index > 0 && onNav(index - 1)}
        disabled={index === 0}
        className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 disabled:opacity-20 transition-all"
      >
        <IoChevronBackOutline className="text-xl" />
      </button>
      <button
        onClick={() => index < images.length - 1 && onNav(index + 1)}
        disabled={index === images.length - 1}
        className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 disabled:opacity-20 transition-all"
      >
        <IoChevronForwardOutline className="text-xl" />
      </button>
      <AnimatePresence mode="popLayout">
        <motion.img
          key={index}
          src={getImageUrl(images[index])}
          alt=""
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="max-h-[75vh] max-w-[85vw] object-contain rounded-lg"
        />
      </AnimatePresence>
      <div className="flex items-center gap-3 mt-6">
        <span className="text-white/30 text-xs font-mono">
          {index + 1}/{images.length}
        </span>
      </div>
    </motion.div>
  );
}

function HGallery({
  images,
  onOpen,
  dark,
}: {
  images: string[];
  onOpen: (i: number) => void;
  dark: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(true);
  const check = () => {
    const e = scrollRef.current;
    if (!e) return;
    setCanL(e.scrollLeft > 10);
    setCanR(e.scrollLeft < e.scrollWidth - e.clientWidth - 10);
  };
  useEffect(() => {
    check();
  }, []);
  const scroll = (d: number) => {
    scrollRef.current?.scrollBy({ left: d * 400, behavior: "smooth" });
    setTimeout(check, 400);
  };

  if (!images || images.length === 0)
    return (
      <div className="relative h-[480px] rounded-2xl overflow-hidden mb-3 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
        <p className="text-gray-500">Aucune image disponible</p>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative mb-8 group/g"
    >
      <div
        className="relative h-[480px] rounded-2xl overflow-hidden mb-3 cursor-pointer"
        onClick={() => onOpen(0)}
      >
        <motion.img
          src={getImageUrl(images[0])}
          alt=""
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.7 }}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t ${dark ? "from-black/80 via-black/30 to-transparent" : "from-black/40 via-black/10 to-transparent"}`}
        />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute bottom-6 left-6"
        >
          <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white/80 text-[10px] font-bold flex items-center gap-1.5">
            <IoImagesOutline className="text-xs" />
            {images.length} photos
          </div>
        </motion.div>
      </div>
      <div className="relative">
        {canL && (
          <button
            onClick={() => scroll(-1)}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full backdrop-blur-xl border flex items-center justify-center text-white/60 hover:text-white transition-all opacity-0 group-hover/g:opacity-100 ${dark ? "bg-black/80 border-white/10" : "bg-white/80 border-gray-200"}`}
          >
            <IoChevronBackOutline className="text-sm" />
          </button>
        )}
        {canR && (
          <button
            onClick={() => scroll(1)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full backdrop-blur-xl border flex items-center justify-center text-white/60 hover:text-white transition-all opacity-0 group-hover/g:opacity-100 ${dark ? "bg-black/80 border-white/10" : "bg-white/80 border-gray-200"}`}
          >
            <IoChevronForwardOutline className="text-sm" />
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={check}
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {images.map((img, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -3, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onOpen(i)}
              className={`flex-shrink-0 w-32 h-24 rounded-xl overflow-hidden cursor-pointer border transition-all ${dark ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-indigo-300 hover:shadow-lg"}`}
            >
              <img
                src={getImageUrl(img)}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Toast({
  message,
  type,
  onClose,
  dark,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  dark: boolean;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="fixed top-6 right-6 z-[100]"
    >
      <div
        className={`flex items-center gap-3 pl-4 pr-3 py-3 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-2xl border ${type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20" : type === "error" ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20" : "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20"}`}
      >
        {type === "success" ? (
          <IoCheckmarkCircleOutline />
        ) : (
          <IoInformationCircleOutline />
        )}
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
        >
          <IoCloseOutline className="text-xs" />
        </button>
      </div>
    </motion.div>
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations("ListingPage");

  const {
    listing,
    loading,
    checkIn,
    setCheckIn,
    checkOut,
    setCheckOut,
    blockedDates,
    pendingDates,
    pricingRules,
    showVerificationModal,
    checkVerificationBeforeInfoRequest,
    handleVerificationComplete,
    handleCloseVerificationModal,
  } = useListing(id);
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Déterminer si le thème est sombre
  const isDark =
    theme === "dark" || (theme === "system" && systemTheme === "dark");
  const dark = isDark && mounted;

  const [isFav, setIsFav] = useState(false);
  const [showAllEq, setShowAllEq] = useState(false);
  const [lbIdx, setLbIdx] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [showShare, setShowShare] = useState(false);

  // Info request states
  const [infoRequestLoading, setInfoRequestLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [sentInfoRequest, setSentInfoRequest] = useState<any>(null);

  // POI states
  const [nearbyPOIs, setNearbyPOIs] = useState<NearbyPOI[]>([]);
  const [poiFilters, setPoiFilters] = useState<string[]>([]);
  const [loadingPOIs, setLoadingPOIs] = useState(false);
  const [showAllDistances, setShowAllDistances] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState<NearbyPOI | null>(null);

  // Map key to force remount
  const [mapKey, setMapKey] = useState(0);

  // Voyageurs - OPTIONNEL (0 = non spécifié)
  const [localGuests, setLocalGuests] = useState(0);

  const showToast = useCallback(
    (m: string, t: "success" | "error" | "info" = "info") =>
      setToast({ message: m, type: t }),
    [],
  );

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("favorites");
    if (saved) setIsFav((JSON.parse(saved) as string[]).includes(id));
  }, [id]);

  // Force map remount when listing or dark mode changes
  useEffect(() => {
    if (listing?.id) {
      setMapKey((prev) => prev + 1);
    }
  }, [listing?.id, dark]);

  const fetchNearbyPOIs = useCallback(async () => {
    console.log("🔍 fetchNearbyPOIs START");

    if (!listing?.latitude || !listing?.longitude) {
      console.log("❌ Pas de coordonnées pour les POIs");
      setNearbyPOIs([]);
      return;
    }

    console.log(
      `📍 Chargement POIs pour: lat=${listing.latitude}, lng=${listing.longitude}`,
    );
    setLoadingPOIs(true);

    try {
      const url = `/api/listings/${id}/pois?radius=2000`;
      console.log("🌐 Appel API:", url);

      const res = await fetch(url);
      console.log("📡 Réponse reçue, status:", res.status);

      const data = await res.json();
      console.log("📦 Données POIs reçues:", data);

      if (data.success && data.pois) {
        console.log(`✅ ${data.pois.length} POIs trouvés`);
        setNearbyPOIs(data.pois);
      } else {
        console.log("⚠️ Aucun POI ou erreur dans la réponse");
        setNearbyPOIs([]);
      }
    } catch (error) {
      console.error("❌ Erreur fetchNearbyPOIs:", error);
      setNearbyPOIs([]);
    } finally {
      setLoadingPOIs(false);
    }
  }, [listing?.latitude, listing?.longitude, id]);

  useEffect(() => {
    if (listing?.id && listing?.latitude && listing?.longitude) {
      fetchNearbyPOIs();
    }
  }, [fetchNearbyPOIs, listing?.id, listing?.latitude, listing?.longitude]);
  const handleCalendarSelect = useCallback(
    (start: string, end: string) => {
      setCheckIn(start);
      setCheckOut(end);
    },
    [setCheckIn, setCheckOut],
  );

  const handlePoiClick = useCallback(
    (poi: NearbyPOI) => {
      setSelectedPoi(poi);
      if (listing?.latitude && listing?.longitude) {
        const url = `https://www.google.com/maps/dir/${listing.latitude},${listing.longitude}/${poi.lat},${poi.lon}`;
        window.open(url, "_blank");
      }
    },
    [listing?.latitude, listing?.longitude],
  );

  const handleToggleDistance = useCallback(() => {
    setShowAllDistances((prev) => !prev);
  }, []);

  const openInGoogleMaps = () => {
    if (listing?.latitude && listing?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`;
      window.open(url, "_blank");
    }
  };

  // Handle info request
  const sendInfoRequest = async () => {
    if (!checkIn || !checkOut) {
      showToast("Sélectionnez vos dates", "error");
      return;
    }
    setInfoRequestLoading(true);
    try {
      const response = await fetch("/api/info-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing?.id,
          message: `Séjour du ${fmtDate(checkIn)} au ${fmtDate(checkOut)} pour ${localGuests === 0 ? "nombre non spécifié" : localGuests} personne(s).\n\nJe suis intéressé(e) par votre logement, pourriez-vous me donner plus d'informations ?`,
          checkIn,
          checkOut,
          guests: localGuests === 0 ? null : localGuests,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSentInfoRequest(data.infoRequest);
        setShowInfoModal(true);
        showToast("Demande envoyée avec succès !", "success");
      } else {
        showToast(data.error || "Une erreur est survenue", "error");
      }
    } catch {
      showToast("Erreur de connexion", "error");
    } finally {
      setInfoRequestLoading(false);
    }
  };
  const handleInfoRequestWithVerification = () => {
    const canProceed = checkVerificationBeforeInfoRequest();
    if (canProceed) {
      sendInfoRequest();
    }
  };
  const handleToggleFavorite = () => {
    const next = !isFav;
    setIsFav(next);
    const saved = localStorage.getItem("favorites");
    let ids: string[] = saved ? JSON.parse(saved) : [];
    ids = next
      ? [...ids.filter((f) => f !== id), id]
      : ids.filter((f) => f !== id);
    localStorage.setItem("favorites", JSON.stringify(ids));
    window.dispatchEvent(new Event("favorites-updated"));
    showToast(
      next ? "Ajouté aux favoris" : "Retiré des favoris",
      next ? "success" : "info",
    );
  };

  // Remplacer handleShare par :
  const handleShare = async () => {
    const shareData = {
      title: listing?.title || "NestHub - Logement d'exception",
      text: `Découvrez ${listing?.title} sur NestHub - ${listing?.location}`,
      url: window.location.href,
    };

    // Vérifier si l'API Web Share est disponible (mobile/ navigateurs compatibles)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        showToast("Partagé avec succès !", "success");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          // Fallback : copier le lien
          await navigator.clipboard.writeText(window.location.href);
          showToast("Lien copié dans le presse-papier", "success");
        }
      }
    } else {
      // Fallback pour les navigateurs qui ne supportent pas Web Share
      await navigator.clipboard.writeText(window.location.href);
      showToast("Lien copié dans le presse-papier", "success");
    }
    setShowShare(false);
  };

  if (loading)
    return (
      <LoadingSpinner
        fullScreen
        text={t("loading")}
        size="lg"
        color="primary"
        variant="spinner"
        speed="normal"
      />
    );
  if (!listing)
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-800 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Logement non trouvé
          </h3>
          <Link
            href="/fr/search"
            className="text-sky-600 dark:text-sky-400 hover:underline text-sm font-medium"
          >
            Retour à la recherche
          </Link>
        </div>
      </div>
    );

  const nights = nightsBetween(checkIn, checkOut);
  const basePrice = listing.pricePerNight * nights;
  const cleaningFee = listing.cleaningFee ?? 85;
  const serviceFee = Math.round((basePrice + cleaningFee) * 0.05);
  const total = basePrice + cleaningFee + serviceFee;
  const equipmentItems = resolveEquipmentList(listing.equipment);
  const visibleEq = showAllEq ? equipmentItems : equipmentItems.slice(0, 9);
  const houseRules = parseHouseRules(listing.houseRules);
  const images = listing.images || [];
  const filteredPOIs =
    poiFilters.length > 0
      ? nearbyPOIs.filter((p) => poiFilters.includes(p.category))
      : nearbyPOIs;

  // Si pas encore monté, retourner un placeholder
  if (!mounted) return null;

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ${dark ? "text-white" : "text-gray-900"}`}
    >
      <Background />
      <TenantHeader />

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            dark={dark}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {lbIdx !== null && (
          <Lightbox
            images={images}
            index={lbIdx}
            onClose={() => setLbIdx(null)}
            onNav={setLbIdx}
          />
        )}
      </AnimatePresence>

      {/* Info Request Modal */}
      {showInfoModal && sentInfoRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-3">
                <IoCheckmarkCircleOutline className="text-2xl text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Demande envoyée !
              </h3>
              <div className="bg-sky-50 dark:bg-sky-950/30 rounded-xl p-3 mb-4 text-left">
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                  Votre demande d'information a été transmise à l'hôte.
                </p>
                <div className="border-t border-sky-100 dark:border-sky-900/50 my-2 pt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <IoCalendarOutline className="text-sky-500" />{" "}
                    <span className="font-semibold">Dates :</span>{" "}
                    {fmtDate(checkIn)} → {fmtDate(checkOut)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                    <IoPeopleOutline className="text-sky-500" />{" "}
                    <span className="font-semibold">Voyageurs :</span>{" "}
                    {localGuests === 0 ? "Non spécifié" : localGuests}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="flex-1 px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 transition"
                >
                  Fermer
                </button>
                <Link href="/fr/notifications" className="flex-1">
                  <button className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition">
                    Voir notifications
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header with Breadcrumb inline */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative z-20 transition-colors duration-700 bg-transparent`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumb inline with back button */}
            <div className="flex items-center gap-4">
              {/* Breadcrumb navigation */}
              <div className="flex items-center gap-3 text-sm">
                <Link
                  href="/fr/search"
                  className={`flex items-center gap-1.5 transition-all duration-300 ${dark ? "text-white/40 hover:text-indigo-400" : "text-gray-500 hover:text-indigo-600"} font-medium uppercase tracking-wide`}
                >
                  <span>RECHERCHE</span>
                </Link>
                <IoChevronForwardOutline
                  className={`text-[10px] ${dark ? "text-white/20" : "text-gray-300"}`}
                />
                <span
                  className={`font-semibold truncate max-w-[220px] uppercase tracking-wide ${dark ? "text-white/80" : "text-gray-800"}`}
                >
                  {listing.title}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowShare(!showShare)}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${dark ? "bg-white/5 border-white/10 text-white/40 hover:text-white/60" : "bg-white border-gray-200 text-gray-400 hover:text-gray-600"}`}
                >
                  <IoShareSocialOutline className="text-sm" />
                </motion.button>
                {showShare && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-40 overflow-hidden">
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <IoShareSocialOutline className="text-sm text-sky-500" />
                      Partager
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        showToast("Lien copié !", "success");
                        setShowShare(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-t border-gray-100 dark:border-slate-700"
                    >
                      <IoCopyOutline className="text-sm text-sky-500" />
                      Copier le lien
                    </button>
                  </div>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleFavorite}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${isFav ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : dark ? "bg-white/5 border-white/10 text-white/40 hover:text-rose-400" : "bg-white border-gray-200 text-gray-400 hover:text-rose-400 hover:border-rose-200"}`}
              >
                {isFav ? <IoHeart /> : <IoHeartOutline />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        <HGallery images={images} onOpen={setLbIdx} dark={dark} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`text-[9px] font-extrabold uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-full border ${dark ? "text-white/30 bg-white/5 border-white/10" : "text-indigo-500 bg-indigo-50 border-indigo-100"}`}
                >
                  {listing.type || "Logement"}
                </span>
                {listing.isVerified && (
                  <span
                    className={`flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${dark ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-emerald-600 bg-emerald-50 border-emerald-200"}`}
                  >
                    <IoShieldCheckmarkOutline className="text-[10px]" />
                    Vérifié
                  </span>
                )}
                {listing.rating > 0 && (
                  <span
                    className={`text-[9px] flex items-center gap-1 ${dark ? "text-white/20" : "text-gray-400"}`}
                  >
                    <IoStar className="text-amber-400 text-[10px]" />
                    {listing.rating} · {listing.reviewCount} avis
                  </span>
                )}
              </div>
              <h2
                className={`text-3xl sm:text-4xl font-black tracking-tight mb-2 ${dark ? "text-white/90" : "text-gray-900"}`}
              >
                {listing.title}
              </h2>
              <p
                className={`text-sm flex items-center gap-1.5 ${dark ? "text-white/30" : "text-gray-500"}`}
              >
                <IoLocationOutline />
                {listing.street ? `${listing.street}, ` : ""}
                {listing.delegation ? `${listing.delegation}, ` : ""}
                {listing.governorate}
              </p>
            </motion.div>
            {/* ✅ AJOUTE ICI - BANDEAU MODE VACANCES */}
            {listing.vacationMode &&
              listing.vacationStartDate &&
              listing.vacationEndDate && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-l-4 border-violet-500"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0">
                      <TbBeach
                        size={20}
                        className="text-violet-600 dark:text-violet-400"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-violet-800 dark:text-violet-300 flex items-center gap-2">
                        Mode vacances
                      </h4>
                      <p className="text-sm text-violet-600 dark:text-violet-400">
                        {listing.vacationMessage ||
                          "L'hôte est actuellement en vacances."}
                      </p>
                      {listing.vacationEndDate && (
                        <p className="text-xs text-violet-500 dark:text-violet-500 mt-1 flex items-center gap-1">
                          <Calendar size={12} />
                          Disponible à partir du{" "}
                          {new Date(listing.vacationEndDate).toLocaleDateString(
                            "fr-FR",
                            { day: "numeric", month: "long", year: "numeric" },
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

            {/* Quick Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2
                className={`text-sm font-extrabold mb-4 uppercase tracking-wide ${dark ? "text-white/80" : "text-gray-800"}`}
              >
                EN UN COUP D'ŒIL
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    icon: <IoBedOutline className="text-xl" />,
                    value: listing.bedrooms,
                    unit: "CHAMBRES",
                  },
                  {
                    icon: <FaShower className="text-xl" />,
                    value: listing.bathrooms,
                    unit: "SALLES DE BAIN",
                  },
                  {
                    icon: <MdOutlineSquareFoot className="text-xl" />,
                    value: listing.surfaceArea,
                    unit: "M²",
                  },
                  {
                    icon: <IoPeopleOutline className="text-xl" />,
                    value: listing.maxGuests
                      ? listing.maxGuests
                      : "Non spécifié",
                    unit: "VOYAGEURS MAX",
                  },
                  {
                    icon: <FaUtensils className="text-xl" />,
                    value: listing.numberOfKitchens || 1,
                    unit: "CUISINE(S)",
                  },
                  {
                    icon: <IoLeafOutline className="text-xl" />,
                    value: listing.hasGarden ? "✓" : "X",
                    unit: "JARDIN",
                  },
                  {
                    icon: <MdBalcony className="text-xl" />,
                    value: listing.hasBalcony ? "✓" : "X",
                    unit: "BALCON",
                  },
                  {
                    icon: <MdOutlineElevator className="text-xl" />,
                    value: listing.hasElevator ? "✓" : "X",
                    unit: "ASCENSEUR",
                  },
                  {
                    icon: <FaParking className="text-xl" />,
                    value: listing.hasGarage ? "✓" : "X",
                    unit: "PARKING",
                  },
                  {
                    icon: <IoHomeOutline className="text-xl" />,
                    value: listing.isFurnished ? "✓" : "X",
                    unit: "MEUBLÉ",
                  },
                ]
                  .slice(0, 6)
                  .map((stat, idx) => (
                    <motion.div
                      key={stat.unit}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                        dark
                          ? "bg-slate-800/40 border border-white/10"
                          : "bg-white border border-white shadow-sm"
                      }`}
                    >
                      <span
                        className={dark ? "text-white/40" : "text-indigo-400"}
                      >
                        {stat.icon}
                      </span>
                      <p
                        className={`text-xl font-black ${dark ? "text-white/80" : "text-gray-800"}`}
                      >
                        {stat.value !== undefined && stat.value !== ""
                          ? stat.value
                          : "—"}
                      </p>
                      <p
                        className={`text-[10px] font-medium uppercase tracking-wide ${dark ? "text-white/30" : "text-gray-400"}`}
                      >
                        {stat.unit}
                      </p>
                    </motion.div>
                  ))}
              </div>
            </motion.div>

            {/* Description */}
            {listing.description && (
              <Section
                title="À PROPOS"
                sub="Ce que cette propriété offre de spécial"
                delay={0.22}
                dark={dark}
              >
                <p
                  className={`text-sm leading-relaxed ${dark ? "text-white/40" : "text-gray-500"}`}
                >
                  {listing.description}
                </p>
              </Section>
            )}

            {/* Equipment - 3D cards */}
            {equipmentItems.length > 0 && (
              <Section
                title="ÉQUIPEMENTS"
                sub={`${equipmentItems.length} disponibles`}
                delay={0.25}
                action={
                  equipmentItems.length > 9 ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setShowAllEq(!showAllEq)}
                      className={`text-[10px] font-bold transition-colors uppercase ${dark ? "text-white/40 hover:text-white/60" : "text-indigo-500 hover:text-indigo-700"}`}
                    >
                      {showAllEq
                        ? "VOIR MOINS"
                        : `VOIR LES ${equipmentItems.length}`}
                    </motion.button>
                  ) : undefined
                }
                dark={dark}
              >
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                  style={{ perspective: "1000px" }}
                >
                  {visibleEq.map((eq, i) => (
                    <Card3D
                      key={i}
                      icon={
                        EQUIP_ICONS[eq.icon] || <IoCheckmarkCircleOutline />
                      }
                      name={eq.name}
                      index={i}
                      dark={dark}
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* Calendar */}
            <Section title="DISPONIBILITÉS" delay={0.28} dark={dark}>
              <p
                className={`text-xs ${dark ? "text-white/30" : "text-gray-400"} mb-3`}
              >
                Sélectionnez vos dates
              </p>
              {checkIn && checkOut && nights > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800"
                >
                  <IoCalendarOutline className="text-sky-500 text-sm" />
                  <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-400">
                    {nights} nuit{nights > 1 ? "s" : ""} · {fmtDate(checkIn)} →{" "}
                    {fmtDate(checkOut)}
                  </span>
                  <button
                    onClick={() => {
                      setCheckIn("");
                      setCheckOut("");
                    }}
                    className="text-sky-400"
                  >
                    <IoCloseOutline className="text-xs" />
                  </button>
                </motion.div>
              )}
              <div
                className={`rounded-xl p-2 border ${dark ? "bg-slate-800/40 border-white/10" : "bg-gray-50 border-gray-200"}`}
              >
                <AvailabilityCalendar
  availability={listing?.availability}
  blockedDates={blockedDates}
  pendingDates={pendingDates}
  pricingRules={pricingRules}
  selectedStart={checkIn}
  selectedEnd={checkOut}
  onSelectRange={handleCalendarSelect}
  // ✅ AJOUTE CETTE LIGNE
  listing={{
    vacationMode: listing.vacationMode,
    vacationStartDate: listing.vacationStartDate,
    vacationEndDate: listing.vacationEndDate,
  }}
/>
              </div>
            </Section>

            {/* Host Section - AVEC BIO DYNAMIQUE */}
            <Section title="VOTRE HÔTE" delay={0.2} dark={dark}>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.div whileHover={{ scale: 1.05 }} className="relative">
                  {listing.owner?.avatar ? (
                    <img
                      src={getAvatarUrl(listing.owner.avatar)}
                      alt={listing.owner.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
                      {listing.owner?.name?.charAt(0)?.toUpperCase() || "H"}
                    </div>
                  )}
                  {listing.owner?.isVerified && (
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 ${dark ? "border-slate-900" : "border-white"}`}
                    >
                      <IoCheckmarkCircleOutline className="text-white text-[8px]" />
                    </div>
                  )}
                </motion.div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-bold ${dark ? "text-white/80" : "text-gray-800"}`}
                  >
                    @{listing.owner?.username || listing.owner?.name || "Hôte"}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1 mb-2">
                    <span
                      className={`text-[10px] flex items-center gap-1 ${dark ? "text-white/30" : "text-gray-400"}`}
                    >
                      <FaHome className="text-[10px]" /> Membre depuis{" "}
                      {listing.owner?.memberSince || 2023}
                    </span>
                    <span
                      className={`text-[10px] flex items-center gap-1 ${dark ? "text-white/30" : "text-gray-400"}`}
                    >
                      <IoTimeOutline className="text-[10px]" /> Réponse rapide
                    </span>
                    <span
                      className={`text-[10px] flex items-center gap-1 text-emerald-500`}
                    >
                      <IoCheckmarkCircleOutline className="text-[10px]" />{" "}
                      Vérifié
                    </span>
                  </div>
                  {/* ✅ BIO DYNAMIQUE - utiliser listing.owner?.bio */}
                  <p
                    className={`text-xs leading-relaxed ${dark ? "text-white/40" : "text-gray-500"}`}
                  >
                    {listing.owner?.bio ||
                      "Passionné par l'hospitalité, je serai ravi de vous accueillir et de rendre votre séjour unique."}
                  </p>
                </div>
              </div>
            </Section>

            {/* Reviews Section - DYNAMIQUE avec reviewScores */}
            <Section
              title="AVIS"
              sub={`${listing.reviewCount || 0} témoignages`}
              delay={0.32}
              dark={dark}
            >
              {listing.reviews && listing.reviews.length > 0 ? (
                <>
                  {/* Barres de scores - seulement s'il y a des avis */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      {
                        label: "Propreté",
                        value: listing.reviewScores?.cleanliness || 4.5,
                      },
                      {
                        label: "Précision",
                        value: listing.reviewScores?.accuracy || 4.5,
                      },
                      {
                        label: "Communication",
                        value: listing.reviewScores?.communication || 4.5,
                      },
                      {
                        label: "Emplacement",
                        value: listing.reviewScores?.location || 4.5,
                      },
                      {
                        label: "Arrivée",
                        value: listing.reviewScores?.checkin || 4.5,
                      },
                      {
                        label: "Qualité-prix",
                        value: listing.reviewScores?.value || 4.5,
                      },
                    ].map((score, idx) => (
                      <motion.div
                        key={score.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        <span
                          className={`text-xs w-24 ${dark ? "text-white/40" : "text-gray-500"}`}
                        >
                          {score.label}
                        </span>
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-amber-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${((score.value || 0) / 5) * 100}%`,
                            }}
                            transition={{
                              duration: 0.8,
                              delay: 0.2 + idx * 0.05,
                            }}
                          />
                        </div>
                        <span
                          className={`text-xs font-semibold ${dark ? "text-white/60" : "text-gray-700"}`}
                        >
                          {(score.value || 0).toFixed(1)}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Liste des avis */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {listing.reviews.slice(0, 2).map((review, i) => (
                      <motion.div
                        key={review.id || i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        whileHover={{ y: -4 }}
                        className={`p-4 rounded-xl transition-all duration-300 ${
                          dark
                            ? "bg-slate-800/40 border border-white/10"
                            : "bg-white border border-white shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p
                              className={`text-sm font-semibold ${dark ? "text-white/80" : "text-gray-800"}`}
                            >
                              {review.author}
                            </p>
                            <p
                              className={`text-[10px] ${dark ? "text-white/30" : "text-gray-400"} mt-0.5`}
                            >
                              {review.date}
                            </p>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <IoStar
                                key={s}
                                className={`text-[11px] ${s <= (review.rating || 5) ? "text-amber-400" : dark ? "text-white/20" : "text-gray-200"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p
                          className={`text-sm leading-relaxed ${dark ? "text-white/50" : "text-gray-500"}`}
                        >
                          {review.comment}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Bouton voir tous les avis - seulement s'il y a des avis */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`mt-4 w-full py-2.5 rounded-xl border border-dashed text-xs font-medium uppercase tracking-wide transition-all ${dark ? "border-white/10 text-white/30 hover:text-white/50 hover:border-white/20" : "border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300"}`}
                  >
                    VOIR TOUS LES {listing.reviewCount || 0} AVIS
                  </motion.button>
                </>
              ) : (
                // Message "Aucun avis" - sans barres de scores ni bouton
                <div
                  className={`p-6 rounded-xl text-center ${dark ? "bg-slate-800/40 border border-white/10" : "bg-gray-50 border border-white shadow-sm"}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${dark ? "bg-slate-700" : "bg-gray-100"}`}
                    >
                      <IoStar
                        className={`text-2xl ${dark ? "text-gray-500" : "text-gray-400"}`}
                      />
                    </div>
                    <p
                      className={`text-sm font-medium ${dark ? "text-white/60" : "text-gray-600"}`}
                    >
                      Aucun avis pour le moment
                    </p>
                    <p
                      className={`text-xs ${dark ? "text-white/30" : "text-gray-400"}`}
                    >
                      Soyez le premier à donner votre avis !
                    </p>
                  </div>
                </div>
              )}
            </Section>
            {/* Rules */}
            {houseRules.length > 0 && (
              <Section
                title="RÈGLEMENT"
                sub="Conditions et horaires"
                delay={0.3}
                dark={dark}
              >
                <div className="space-y-2.5">
                  {houseRules.map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-center gap-2.5 text-xs ${dark ? "text-white/40" : "text-gray-500"}`}
                    >
                      <IoTimeOutline
                        className={`text-sm flex-shrink-0 ${dark ? "text-white/20" : "text-gray-300"}`}
                      />
                      <span>{r}</span>
                    </motion.div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* RIGHT COLUMN - Booking Widget */}
          <div className="lg:col-span-5 lg:sticky lg:top-45">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute -inset-[2px] rounded-[26px] overflow-hidden">
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7,#6366f1)",
                      backgroundSize: "300% 300%",
                    }}
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>
                <div
                  className={`relative rounded-[24px] overflow-hidden ${dark ? "bg-slate-900" : "bg-white"}`}
                >
                  <div className="relative px-6 py-5 overflow-hidden">
                    <div
                      className={`absolute inset-0 ${dark ? "bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-purple-500/10" : "bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50"}`}
                    />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                    <div className="relative flex items-end justify-between">
                      <div>
                        <p
                          className={`text-[9px] uppercase tracking-[0.15em] font-bold mb-1 ${dark ? "text-white/30" : "text-indigo-400/60"}`}
                        >
                          Par nuit
                        </p>
                        <p
                          className={`text-3xl font-black ${dark ? "text-white" : "text-gray-900"}`}
                        >
                          <AnimPrice target={listing.pricePerNight} />
                          <span
                            className={`text-sm ml-1 ${dark ? "text-white/30" : "text-gray-400"}`}
                          >
                            TND
                          </span>
                        </p>
                      </div>
                      {listing.rating > 0 && (
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <IoStar className="text-amber-400" />
                            <span
                              className={`text-xl font-black ${dark ? "text-white/80" : "text-gray-800"}`}
                            >
                              {listing.rating}
                            </span>
                          </div>
                          <p
                            className={`text-[9px] ${dark ? "text-white/20" : "text-gray-400"}`}
                          >
                            {listing.reviewCount} avis
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        className={`p-3 rounded-xl border transition-all ${dark ? "bg-white/5 border-white/10 hover:border-white/20" : "bg-gray-50 border-gray-200 hover:border-indigo-300"}`}
                      >
                        <label
                          className={`text-[8px] uppercase tracking-[0.15em] font-bold block mb-1.5 ${dark ? "text-white/30" : "text-indigo-500"}`}
                        >
                          Arrivée
                        </label>
                        <input
                          type="date"
                          value={checkIn}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => {
                            setCheckIn(e.target.value);
                            if (checkOut && e.target.value >= checkOut)
                              setCheckOut("");
                          }}
                          className={`w-full bg-transparent text-xs focus:outline-none ${dark ? "text-white/60 [color-scheme:dark]" : "text-gray-700"}`}
                        />
                      </div>
                      <div
                        className={`p-3 rounded-xl border transition-all ${dark ? "bg-white/5 border-white/10 hover:border-white/20" : "bg-gray-50 border-gray-200 hover:border-indigo-300"}`}
                      >
                        <label
                          className={`text-[8px] uppercase tracking-[0.15em] font-bold block mb-1.5 ${dark ? "text-white/30" : "text-indigo-500"}`}
                        >
                          Départ
                        </label>
                        <input
                          type="date"
                          value={checkOut}
                          min={
                            checkIn || new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) => setCheckOut(e.target.value)}
                          className={`w-full bg-transparent text-xs focus:outline-none ${dark ? "text-white/60 [color-scheme:dark]" : "text-gray-700"}`}
                        />
                      </div>
                    </div>

                    {/* Section Voyageurs - OPTIONNEL */}
                    <div
                      className={`p-3 rounded-xl border ${dark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}
                    >
                      <label
                        className={`text-[8px] uppercase tracking-[0.15em] font-bold block mb-2 ${dark ? "text-white/30" : "text-indigo-500"}`}
                      >
                        Voyageurs (optionnel)
                      </label>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (localGuests > 1) {
                                setLocalGuests(localGuests - 1);
                              } else if (localGuests === 1) {
                                setLocalGuests(0);
                              }
                            }}
                            disabled={localGuests === 0}
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-30 transition-all ${dark ? "bg-white/10 border-white/10 text-white/40 hover:text-white hover:bg-white/20" : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"}`}
                          >
                            <IoRemoveOutline className="text-sm" />
                          </button>
                          <span
                            className={`text-sm font-bold w-8 text-center ${dark ? "text-white/70" : "text-gray-700"}`}
                          >
                            {localGuests === 0 ? "—" : localGuests}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (localGuests === 0) {
                                setLocalGuests(1);
                              } else if (listing.maxGuests) {
                                if (localGuests < listing.maxGuests) {
                                  setLocalGuests(localGuests + 1);
                                }
                              } else {
                                if (localGuests < 20) {
                                  setLocalGuests(localGuests + 1);
                                }
                              }
                            }}
                            disabled={
                              listing.maxGuests
                                ? localGuests >= listing.maxGuests
                                : localGuests >= 20
                            }
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-30 transition-all ${dark ? "bg-white/10 border-white/10 text-white/40 hover:text-white hover:bg-white/20" : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"}`}
                          >
                            <IoAddOutline className="text-sm" />
                          </button>
                        </div>
                        <span
                          className={`text-[10px] ${dark ? "text-white/20" : "text-gray-400"}`}
                        >
                          {listing.maxGuests
                            ? `Max ${listing.maxGuests} pers.`
                            : "Aucune limite"}
                        </span>
                      </div>
                      <p
                        className={`text-[9px] mt-2 ${dark ? "text-white/15" : "text-gray-400"}`}
                      >
                        {localGuests === 0
                          ? "Non spécifié — vous pouvez indiquer le nombre plus tard"
                          : `${localGuests} voyageur${localGuests > 1 ? "s" : ""} sélectionné${localGuests > 1 ? "s" : ""}`}
                      </p>
                    </div>

                    {nights > 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 pt-2"
                      >
                        <div className="flex justify-between text-xs">
                          <span
                            className={dark ? "text-white/30" : "text-gray-400"}
                          >
                            {fmtPrice(listing.pricePerNight)} TND × {nights}{" "}
                            nuit{nights > 1 ? "s" : ""}
                          </span>
                          <span
                            className={`font-bold ${dark ? "text-white/50" : "text-gray-600"}`}
                          >
                            {fmtPrice(basePrice)} TND
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span
                            className={dark ? "text-white/30" : "text-gray-400"}
                          >
                            Ménage
                          </span>
                          <span
                            className={`font-bold ${dark ? "text-white/50" : "text-gray-600"}`}
                          >
                            {fmtPrice(cleaningFee)} TND
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span
                            className={dark ? "text-white/30" : "text-gray-400"}
                          >
                            Service (5%)
                          </span>
                          <span
                            className={`font-bold ${dark ? "text-white/50" : "text-gray-600"}`}
                          >
                            {fmtPrice(serviceFee)} TND
                          </span>
                        </div>
                        <div
                          className={`pt-3 border-t flex justify-between items-center ${dark ? "border-white/10" : "border-gray-200"}`}
                        >
                          <span
                            className={`text-xs font-extrabold ${dark ? "text-white/60" : "text-gray-700"}`}
                          >
                            Total
                          </span>
                          <span
                            className={`text-xl font-black ${dark ? "text-white/80" : "text-gray-900"}`}
                          >
                            <AnimPrice target={total} delay={0.3} />
                            <span
                              className={`text-xs ml-1 ${dark ? "text-white/30" : "text-gray-400"}`}
                            >
                              TND
                            </span>
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <div
                        className={`py-5 text-center text-[11px] border border-dashed rounded-xl ${dark ? "text-white/20 border-white/10" : "text-gray-400 border-gray-200"}`}
                      >
                        Sélectionnez vos dates
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleInfoRequestWithVerification}
                      disabled={
                        infoRequestLoading ||
                        !checkIn ||
                        !checkOut ||
                        listing.vacationMode
                      }
                      className={`w-full py-3.5 rounded-xl text-sm font-extrabold transition-all disabled:opacity-20 disabled:cursor-not-allowed ${
                        listing.vacationMode
                          ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          : dark
                            ? "bg-white/10 border border-white/20 text-white/60 hover:text-white/80 hover:bg-white/20"
                            : "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30"
                      }`}
                    >
                      {listing.vacationMode ? (
                        <span className="flex items-center justify-center gap-2">
                          <Plane size={16} /> Mode vacances - Indisponible
                        </span>
                      ) : infoRequestLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Envoi...
                        </span>
                      ) : !checkIn || !checkOut ? (
                        "Choisissez vos dates"
                      ) : (
                        "Demander une information"
                      )}
                    </button>
                    <p
                      className={`text-center text-[10px] ${dark ? "text-white/20" : "text-gray-400"}`}
                    >
                      Annulation flexible · Sans engagement
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { i: <IoShieldCheckmarkOutline />, l: "Sécurisé" },
                        { i: <IoCheckmarkCircleOutline />, l: "Garanti" },
                        { i: <IoPersonOutline />, l: "24h/24" },
                      ].map((b) => (
                        <div
                          key={b.l}
                          className={`text-center py-2 rounded-xl border ${dark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                        >
                          <div
                            className={`text-sm mb-0.5 flex justify-center ${dark ? "text-white/20" : "text-indigo-400/40"}`}
                          >
                            {b.i}
                          </div>
                          <p
                            className={`text-[8px] font-bold ${dark ? "text-white/20" : "text-gray-400"}`}
                          >
                            {b.l}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* SECTION MAP */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16"
        >
          <Section title="LOCALISATION ET QUARTIER" delay={0.32} dark={dark}>
            <div className="space-y-4">
              <div
                className={`flex items-center justify-between p-3 rounded-xl ${dark ? "bg-slate-800/40 border border-white/10" : "bg-gray-50 border border-white shadow-sm"}`}
              >
                <div className="flex items-center gap-2">
                  <IoLocationSharp className="text-sky-500 text-base" />
                  <div>
                    <p
                      className={`text-xs font-medium ${dark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {listing.street && `${listing.street}, `}
                      {listing.delegation && `${listing.delegation}, `}
                      {listing.governorate}
                    </p>
                    <p
                      className={`text-[10px] mt-0.5 ${dark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      Tunisie
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openInGoogleMaps}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-xs font-semibold hover:opacity-90 transition"
                >
                  <IoNavigateOutline className="text-sm" />
                  Ouvrir dans Maps
                </motion.button>
              </div>

              {/* Map */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-slate-700">
                <div className="w-full h-[500px] sm:h-[550px]">
                  {listing?.latitude && listing?.longitude ? (
                    <ListingMap
                      key={mapKey}
                      homeLat={listing.latitude}
                      homeLng={listing.longitude}
                      pois={filteredPOIs}
                      selectedPoi={selectedPoi}
                      zoom={14}
                      onPoiClick={handlePoiClick}
                      showAllDistances={showAllDistances}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-800">
                      <IoMapOutline className="text-4xl text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        Position non disponible
                      </p>
                    </div>
                  )}
                </div>

                {/* POI Legend */}
                {nearbyPOIs.length > 0 && (
                  <POILegend
                    pois={nearbyPOIs}
                    onFilterChange={setPoiFilters}
                    onToggleDistance={handleToggleDistance}
                    showAllDistances={showAllDistances}
                  />
                )}

                {loadingPOIs && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-20">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                      <p className="text-xs text-gray-500">
                        Chargement des points d'intérêt...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* POI List */}
              {nearbyPOIs.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3
                      className={`text-sm font-bold ${dark ? "text-white" : "text-gray-900"} flex items-center gap-2`}
                    >
                      <IoLocationSharp className="text-sky-500" />
                      Points d'intérêt à proximité
                    </h3>
                    <span className="text-[10px] text-gray-400">
                      {nearbyPOIs.length} lieux trouvés
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                    {filteredPOIs.slice(0, 12).map((poi, idx) => (
                      <motion.div
                        key={poi.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        whileHover={{ scale: 1.01, x: 2 }}
                        onClick={() => handlePoiClick(poi)}
                        className={`flex items-center justify-between gap-2 p-2 rounded-lg transition-all duration-300 cursor-pointer overflow-hidden ${
                          selectedPoi?.id === poi.id
                            ? "bg-indigo-100 dark:bg-indigo-900/50 border-l-4 border-indigo-500"
                            : dark
                              ? "bg-slate-800/40 hover:bg-slate-800 border border-white/10"
                              : "bg-gray-50 hover:bg-gray-100 border border-white shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${poi.color}20` }}
                          >
                            <span className="text-base">{poi.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-medium ${dark ? "text-gray-200" : "text-gray-800"} truncate`}
                            >
                              {poi.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400">
                                {poi.distance?.toFixed(1)} km
                              </span>
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                                <IoWalkOutline className="text-[9px]" />
                                {getWalkingTime(poi.distance || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (listing?.latitude && listing?.longitude) {
                              const url = `https://www.google.com/maps/dir/${listing.latitude},${listing.longitude}/${poi.lat},${poi.lon}`;
                              window.open(url, "_blank");
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-all duration-200 shrink-0 ${
                            dark
                              ? "hover:bg-white/10 text-white/40 hover:text-indigo-400"
                              : "hover:bg-gray-200 text-gray-400 hover:text-indigo-600"
                          }`}
                          title="Itinéraire sur Google Maps"
                        >
                          <IoNavigateOutline className="text-sm" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                  {filteredPOIs.length > 12 && (
                    <p className="text-center text-[10px] text-gray-400 mt-2">
                      +{filteredPOIs.length - 12} autres lieux disponibles sur
                      la carte
                    </p>
                  )}
                </div>
              )}

              <div
                className={`p-3 rounded-xl ${dark ? "bg-sky-950/20 border border-sky-900/40" : "bg-sky-50 border border-sky-100"}`}
              >
                <div className="flex items-start gap-2">
                  <IoInformationCircleOutline className="text-sky-500 text-base mt-0.5" />
                  <div>
                    <p
                      className={`text-xs font-semibold ${dark ? "text-sky-400" : "text-sky-700"} mb-1`}
                    >
                      Transport à proximité
                    </p>
                    <p
                      className={`text-[11px] ${dark ? "text-sky-300" : "text-sky-600"} leading-relaxed`}
                    >
                      Le quartier est bien desservi. De nombreux commerces,
                      restaurants et services sont accessibles à pied ou à
                      quelques minutes en voiture.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </motion.div>
      </main>
      {/* Modal de vérification d'identité */}
      <IdentityVerificationModal
        isOpen={showVerificationModal}
        onClose={handleCloseVerificationModal}
        onVerified={async () => {
          const canProceed = await handleVerificationComplete();
          if (canProceed) {
            sendInfoRequest();
          }
        }}
        requiredAction="make_booking"
      />
    </div>
  );
}
