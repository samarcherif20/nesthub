// app/fr/dashboard/owner/reservations/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoCalendarOutline,
  IoPeopleOutline,
  IoLocationOutline,
  IoChatbubbleOutline,
  IoShieldCheckmarkOutline,
  IoTrendingUpOutline,
  IoHomeOutline,
  IoAddOutline,
  IoFlashOutline,
  IoCameraOutline,
  IoTimeOutline,
  IoSearchOutline,
  IoPersonOutline,
  IoAlertCircleOutline,
  IoCloseOutline,
  IoEyeOutline,
  IoStarSharp,
  IoWalletOutline,
  IoChevronForwardOutline,
  IoMoonOutline,
  IoArrowForwardOutline,
  IoSparklesOutline,
} from "react-icons/io5";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pipListing = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;
const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

type Tab = "PENDING" | "ACCEPTED" | "PAST";

interface BookingRequest {
  id: string;
  status:
    | "PENDING"
    | "ACCEPTED"
    | "CONFIRMED"
    | "REJECTED"
    | "CANCELLED"
    | "COMPLETED";
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  message?: string;
  createdAt: string;
  tenant: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    image?: string;
    score?: number;
    isVerified?: boolean;
  };
  listing: {
    id: string;
    title: string;
    image?: string;
    images?: string[];
    location?: string;
    type?: string;
  };
}

interface Stats {
  pendingCount: number;
  weeklyRequests: number;
  occupancyRate: number;
  weeklyRevenue: number;
}

function fmtShort(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}
function fmtDay(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { weekday: "short" });
}
function tenantName(t: BookingRequest["tenant"]) {
  if (t.name) return t.name;
  if (t.firstName)
    return `${t.firstName}${t.lastName ? " " + t.lastName.charAt(0) + "." : ""}`;
  return "Locataire";
}
function listingImage(l: BookingRequest["listing"]) {
  const url = l.image ?? l.images?.[0];
  return url ? pipListing(url) : null;
}
function timeAgo(d: string) {
  const ms = Date.now() - new Date(d).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}j`;
}


// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({
  src,
  name,
  size = 36,
}: {
  src?: string;
  name: string;
  size?: number;
}) {
  const [err, setErr] = useState(false);
  const url = src ? pipAvatar(src) : null;
  return (
    <div
      className="rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center font-medium text-white shadow-md shadow-violet-500/15"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background:
          !url || err
            ? "linear-gradient(135deg,#0ea5e9,#8b5cf6,#a855f7)"
            : "transparent",
      }}
    >
      {url && !err ? (
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: BookingRequest["status"] }) {
  const map: Record<string, { label: string; dot: string; bg: string }> = {
    PENDING: {
      label: "En attente",
      dot: "bg-amber-400 animate-pulse",
      bg: "bg-amber-50/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-700/40",
    },
    ACCEPTED: {
      label: "Acceptée",
      dot: "bg-sky-500",
      bg: "bg-sky-50/80 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-700/40",
    },
    CONFIRMED: {
      label: "Confirmée",
      dot: "bg-emerald-500",
      bg: "bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-700/40",
    },
    REJECTED: {
      label: "Refusée",
      dot: "bg-rose-500",
      bg: "bg-rose-50/80 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-700/40",
    },
    CANCELLED: {
      label: "Annulée",
      dot: "bg-gray-400",
      bg: "bg-gray-100/80 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border-gray-200/60 dark:border-gray-700/40",
    },
    COMPLETED: {
      label: "Terminée",
      dot: "bg-violet-500",
      bg: "bg-violet-50/80 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200/60 dark:border-violet-700/40",
    },
  };
  const { label, dot, bg } = map[status] ?? map.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.15em] px-3 py-1.5 rounded-full border backdrop-blur-sm ${bg}`}
    >
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed top-6 right-6 z-[80] flex items-center gap-2.5 pl-4 pr-3 py-3 rounded-2xl text-sm font-medium shadow-2xl backdrop-blur-xl border ${
        type === "success"
          ? "bg-emerald-50/90 dark:bg-emerald-900/80 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-emerald-500/10"
          : "bg-rose-50/90 dark:bg-rose-900/80 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 shadow-rose-500/10"
      }`}
    >
      {type === "success" ? (
        <IoCheckmarkCircleOutline className="text-lg" />
      ) : (
        <IoAlertCircleOutline className="text-lg" />
      )}
      {message}
      <button
        onClick={onClose}
        className="ml-1 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
      >
        <IoCloseOutline className="text-sm" />
      </button>
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  const styles: Record<string, string> = {
    sky: "bg-sky-50/60 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800/30 text-sky-600 dark:text-sky-400",
    violet:
      "bg-violet-50/60 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800/30 text-violet-600 dark:text-violet-400",
    emerald:
      "bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400",
    amber:
      "bg-amber-50/60 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30 text-amber-600 dark:text-amber-400",
  };
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-2xl border ${styles[color]} bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm`}
    >
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
          {value}
        </p>
        {sub && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ─── Request card ─────────────────────────────────────────────────────────────
function RequestCard({
  booking,
  isPending,
  onAccept,
  onReject,
}: {
  booking: BookingRequest;
  isPending: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);
  const img = listingImage(booking.listing);
  const canCancel =
    booking.status === "CONFIRMED" && new Date(booking.checkIn) > new Date();

  return (
    <div
      className={`group bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl overflow-hidden border transition-all duration-500 ${
        hovered
          ? "border-indigo-200/60 dark:border-indigo-700/40 shadow-xl shadow-indigo-500/5 dark:shadow-indigo-500/5 -translate-y-0.5"
          : "border-white/50 dark:border-gray-800 shadow-sm"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top accent */}
      <div
        className={`h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent transition-opacity duration-500 ${hovered ? "opacity-100" : "opacity-0"}`}
      />

      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-52 h-48 sm:h-auto relative overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950 dark:to-violet-950 flex-shrink-0">
          {img && !imgErr ? (
            <img
              src={img}
              alt={booking.listing.title}
              className={`w-full h-full object-cover transition-all duration-700 ${hovered ? "scale-110 brightness-105" : "scale-100"}`}
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-violet-500 to-purple-600 flex items-center justify-center">
              <IoHomeOutline className="text-white/30 text-5xl" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/5" />
          <div className="absolute top-3 left-3">
            <StatusBadge status={booking.status} />
          </div>
          {isPending && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[9px] font-medium text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
              <IoTimeOutline className="text-[10px]" />{" "}
              {timeAgo(booking.createdAt)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
          <div>
            {/* Top row */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={booking.tenant.image}
                  name={tenantName(booking.tenant)}
                  size={40}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {tenantName(booking.tenant)}
                    </h3>
                    {booking.tenant.isVerified && (
                      <IoShieldCheckmarkOutline className="text-emerald-500 text-sm flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                    {booking.listing.title}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent leading-none">
                  {booking.totalPrice.toLocaleString("fr-FR")}
                </p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-wider">
                  TND
                </p>
              </div>
            </div>

            {/* Info pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-900/20 text-gray-600 dark:text-gray-300 border border-indigo-100/50 dark:border-indigo-800/30">
                <IoCalendarOutline className="text-indigo-500 dark:text-indigo-400 text-xs" />
                {fmtShort(booking.checkIn)} → {fmtShort(booking.checkOut)}
              </span>
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-violet-50/60 dark:bg-violet-900/20 text-gray-600 dark:text-gray-300 border border-violet-100/50 dark:border-violet-800/30">
                <IoMoonOutline className="text-violet-500 dark:text-violet-400 text-xs" />
                {booking.nights} nuit{booking.nights > 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-purple-50/60 dark:bg-purple-900/20 text-gray-600 dark:text-gray-300 border border-purple-100/50 dark:border-purple-800/30">
                <IoPeopleOutline className="text-purple-500 dark:text-purple-400 text-xs" />
                {booking.guests}
              </span>
              {booking.tenant.score && (
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border ${
                    booking.tenant.score >= 80
                      ? "bg-emerald-50/60 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-800/30"
                      : "bg-amber-50/60 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100/50 dark:border-amber-800/30"
                  }`}
                >
                  <IoStarSharp className="text-[10px]" /> {booking.tenant.score}
                </span>
              )}
            </div>

            {/* Message */}
            {booking.message && (
              <div className="border-l-[3px] border-indigo-200 dark:border-indigo-800 pl-3 mb-3">
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed italic line-clamp-2">
                  &ldquo;{booking.message}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {isPending ? (
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setAccepting(true);
                  onAccept(booking.id);
                }}
                disabled={accepting || rejecting}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {accepting ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <IoCheckmarkCircleOutline className="text-base" /> Accepter
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setRejecting(true);
                  onReject(booking.id);
                }}
                disabled={accepting || rejecting}
                className="px-5 py-3 rounded-2xl text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all disabled:opacity-50 flex items-center gap-2 active:scale-[.98]"
              >
                {rejecting ? (
                  <span className="w-4 h-4 rounded-full border-2 border-rose-300/30 border-t-rose-400 animate-spin" />
                ) : (
                  <>
                    <IoCloseCircleOutline className="text-base" /> Refuser
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 pt-1">
              <Link
                href={`/fr/dashboard/owner/listings/${booking.listing.id}`}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <IoEyeOutline className="text-sm" /> Voir le bien
              </Link>
              {canCancel && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <Link
                    href={`/fr/dashboard/owner/reservations/${booking.id}/cancel`}
                    className="text-xs text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors"
                  >
                    Annuler
                  </Link>
                </>
              )}
              <span className="w-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
              <Link
                href="/fr/dashboard/owner/messages"
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <IoChatbubbleOutline className="text-sm" /> Message
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function OwnerReservationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("PENDING");
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    pendingCount: 0,
    weeklyRequests: 0,
    occupancyRate: 0,
    weeklyRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const m: Record<Tab, string> = {
        PENDING: "PENDING",
        ACCEPTED: "ACCEPTED,CONFIRMED",
        PAST: "COMPLETED,CANCELLED,REJECTED",
      };
      const res = await fetch(
        `/api/bookings?role=owner&status=${m[tab]}&pageSize=20`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : (data.bookings ?? []));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [tab]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings/stats?role=owner");
      if (!res.ok) return;
      const d = await res.json();
      setStats({
        pendingCount: d.pendingCount ?? 0,
        weeklyRequests: d.weeklyRequests ?? 0,
        occupancyRate: d.occupancyRate ?? 0,
        weeklyRevenue: d.weeklyRevenue ?? 0,
      });
    } catch {}
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleAccept = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}/accept`, { method: "POST" });
      if (res.ok) {
        setToast({ message: "Demande acceptée !", type: "success" });
        setBookings((p) =>
          p.map((b) => (b.id === id ? { ...b, status: "ACCEPTED" } : b)),
        );
        loadStats();
      } else
        setToast({ message: "Erreur lors de l'acceptation", type: "error" });
    } catch {
      setToast({ message: "Erreur de connexion", type: "error" });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Dates non disponibles" }),
      });
      if (res.ok) {
        setToast({ message: "Demande refusée", type: "error" });
        setBookings((p) =>
          p.map((b) => (b.id === id ? { ...b, status: "REJECTED" } : b)),
        );
        loadStats();
      } else setToast({ message: "Erreur lors du refus", type: "error" });
    } catch {
      setToast({ message: "Erreur de connexion", type: "error" });
    }
  };

  const displayed =
    tab === "PENDING"
      ? bookings.filter((b) => b.status === "PENDING")
      : bookings.filter((b) => b.status !== "PENDING");

  return (
    <div className="min-h-screen  text-gray-900 dark:text-gray-100 transition-colors">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fu { animation: fadeUp .5s cubic-bezier(.22,1,.36,1) both }
        .d1{animation-delay:.06s}.d2{animation-delay:.12s}.d3{animation-delay:.18s}
        .d4{animation-delay:.24s}.d5{animation-delay:.3s}
      `}</style>

      <main className="w-full px-5 lg:px-8 pt-8 pb-28">
        {/* Header */}
        <div className="mb-8 fu">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Gestion des Réservations
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Suivez et gérez les demandes de séjour pour vos propriétés
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8 fu d1">
          <StatPill
            icon={<IoTimeOutline />}
            label="En attente"
            value={stats.pendingCount}
            sub="à traiter"
            color="amber"
          />
          <StatPill
            icon={<IoCalendarOutline />}
            label="Cette semaine"
            value={stats.weeklyRequests}
            sub="nouvelles"
            color="sky"
          />
          <StatPill
            icon={<IoTrendingUpOutline />}
            label="Occupation"
            value={`${stats.occupancyRate}%`}
            sub="ce mois"
            color="violet"
          />
          <StatPill
            icon={<IoWalletOutline />}
            label="Revenus"
            value={`${stats.weeklyRevenue.toLocaleString()} TND`}
            sub="estimés"
            color="emerald"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/50 dark:border-gray-800 w-fit fu d2">
          {[
            {
              key: "PENDING" as Tab,
              label: "En attente",
              count: stats.pendingCount,
            },
            { key: "ACCEPTED" as Tab, label: "Confirmées" },
            { key: "PAST" as Tab, label: "Passées" },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                tab === key
                  ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/25"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span
                  className={`text-[10px] min-w-[20px] h-5 px-1.5 rounded-full font-bold flex items-center justify-center ${
                    tab === key
                      ? "bg-white/20 text-white"
                      : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  }`}
                >
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-7">
          {/* Cards */}
          <div className="space-y-5 min-w-0">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-gray-800/30 h-48 animate-pulse"
                />
              ))
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl border-2 border-dashed border-gray-200/60 dark:border-gray-700/40">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-center mb-4">
                  <IoCalendarOutline className="text-indigo-400 dark:text-indigo-600 text-2xl" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aucune réservation{" "}
                  {tab === "PENDING"
                    ? "en attente"
                    : tab === "ACCEPTED"
                      ? "confirmée"
                      : "passée"}
                </p>
              </div>
            ) : (
              <>
                {displayed.map((b, i) => (
                  <div
                    key={b.id}
                    className="fu"
                    style={{ animationDelay: `${i * 80 + 100}ms` }}
                  >
                    <RequestCard
                      booking={b}
                      isPending={tab === "PENDING" && b.status === "PENDING"}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  </div>
                ))}
                <div className="flex items-center justify-center gap-2 py-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />
                  <p className="text-xs text-gray-400 dark:text-gray-600 px-3">
                    {displayed.length} réservation
                    {displayed.length > 1 ? "s" : ""}
                  </p>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-200 dark:via-gray-800 to-transparent" />
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5 lg:sticky lg:top-6 fu d3">
            {/* Quick actions */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-gray-800 p-5">
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-gray-400 dark:text-gray-500 mb-4">
                Actions rapides
              </p>
              <div className="space-y-2">
                {[
                  {
                    href: "/fr/dashboard/owner",
                    icon: <IoTrendingUpOutline />,
                    bg: "bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800/30 text-sky-600 dark:text-sky-400",
                    label: "Analytics",
                    sub: "Revenus & stats",
                  },
                  {
                    href: "/fr/dashboard/owner/messages",
                    icon: <IoChatbubbleOutline />,
                    bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800/30 text-violet-600 dark:text-violet-400",
                    label: "Messages",
                    sub: "Conversations",
                  },
                  {
                    href: "/fr/dashboard/owner/listings",
                    icon: <IoHomeOutline />,
                    bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400",
                    label: "Mes biens",
                    sub: "Gérer",
                  },
                ].map(({ href, icon, bg, label, sub }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center text-sm ${bg}`}
                      >
                        {icon}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                          {label}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          {sub}
                        </p>
                      </div>
                    </div>
                    <IoChevronForwardOutline className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 text-xs transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-gray-800 p-5">
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-gray-400 dark:text-gray-500 mb-4">
                Conseils
              </p>
              <div className="space-y-3">
                {[
                  {
                    icon: (
                      <IoFlashOutline className="text-amber-500 dark:text-amber-400" />
                    ),
                    text: "Répondre en moins de 2h augmente vos réservations de 30%.",
                  },
                  {
                    icon: (
                      <IoCameraOutline className="text-sky-500 dark:text-sky-400" />
                    ),
                    text: "Mettez à jour vos photos pour la saison.",
                  },
                ].map(({ icon, text }, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                      {icon}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="relative overflow-hidden rounded-3xl border border-white/50 dark:border-gray-800">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600" />
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              <div className="relative p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                  <IoAddOutline className="text-white text-2xl" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Ajouter un bien
                </h4>
                <p className="text-xs text-white/60 mb-4">
                  Développez votre patrimoine
                </p>
                <Link
                  href="/fr/dashboard/owner/listings/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-white/90 transition-colors shadow-sm"
                >
                  Commencer <IoArrowForwardOutline className="text-sm" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl border-t border-white/50 dark:border-gray-800 z-50 rounded-t-[2rem]">
        {[
          { icon: <IoSearchOutline />, label: "Explorer", href: "/fr/search" },
          {
            icon: <IoCalendarOutline />,
            label: "Séjours",
            href: "/fr/dashboard/owner/reservations",
            active: true,
          },
          {
            icon: <IoChatbubbleOutline />,
            label: "Messages",
            href: "/fr/dashboard/owner/messages",
          },
          { icon: <IoPersonOutline />, label: "Profil", href: "/fr/profile" },
        ].map(({ icon, label, href, active }) => (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-colors ${
              active
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            <span className="text-xl">{icon}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest">
              {label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
