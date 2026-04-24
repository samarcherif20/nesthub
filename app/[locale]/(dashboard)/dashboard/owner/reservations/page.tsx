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
  IoNotificationsOutline,
  IoHeartOutline,
  IoSearchOutline,
  IoChevronForwardOutline,
  IoStarSharp,
  IoPersonOutline,
  IoAlertCircleOutline,
} from "react-icons/io5";

// ─── pip helpers ──────────────────────────────────────────────────────────────

const pipListing = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;
const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

// ─── Design tokens ────────────────────────────────────────────────────────────

const GRAD = "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600";
const GRAD_TEXT =
  "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent";
const BTN_GRAD = `${GRAD} text-white font-bold shadow-md shadow-indigo-200/50 dark:shadow-indigo-900/20 hover:opacity-90 active:scale-[.98] transition-all`;

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtShort(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
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

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  src,
  name,
  size = 56,
}: {
  src?: string;
  name: string;
  size?: number;
}) {
  const [err, setErr] = useState(false);
  const url = src ? pipAvatar(src) : null;
  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background:
          !url || err
            ? "linear-gradient(135deg,#0ea5e9,#6366f1,#a855f7)"
            : "#e2e8f0",
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

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score?: number }) {
  if (!score) return null;
  const color =
    score >= 90
      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
      : score >= 75
        ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400"
        : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400";
  return (
    <span
      className={`text-[10px] font-extrabold px-2 py-0.5 rounded tracking-widest uppercase ${color}`}
    >
      Score: {score}/100
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingRequest["status"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: {
      label: "En attente",
      cls: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40",
    },
    ACCEPTED: {
      label: "Acceptée",
      cls: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40",
    },
    CONFIRMED: {
      label: "Confirmée",
      cls: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/40",
    },
    REJECTED: {
      label: "Refusée",
      cls: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40",
    },
    CANCELLED: {
      label: "Annulée",
      cls: "bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-slate-700",
    },
    COMPLETED: {
      label: "Terminée",
      cls: "bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-slate-700",
    },
  };
  const { label, cls } = map[status] ?? map.PENDING;
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${cls}`}
    >
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
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed top-24 right-4 z-[80] max-w-sm animate-in slide-in-from-top-3 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-xl ${
          type === "success" ? "bg-emerald-500" : "bg-red-500"
        }`}
      >
        {type === "success" ? (
          <IoCheckmarkCircleOutline className="text-lg" />
        ) : (
          <IoAlertCircleOutline className="text-lg" />
        )}
        {message}
      </div>
    </div>
  );
}

// ─── Booking request card ─────────────────────────────────────────────────────

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
  const img = listingImage(booking.listing);

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-100/50 dark:hover:shadow-black/30 transition-all duration-500">
      <div className="flex flex-col md:flex-row">
        {/* Listing image */}
        <div className="md:w-72 h-56 md:h-auto relative overflow-hidden bg-gray-100 dark:bg-slate-800 flex-shrink-0">
          {img && !imgErr ? (
            <img
              src={img}
              alt={booking.listing.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div
              className={`w-full h-full ${GRAD} flex items-center justify-center opacity-60`}
            >
              <IoHomeOutline className="text-white text-5xl" />
            </div>
          )}
          {/* Property label */}
          <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              {booking.listing.title}
            </span>
          </div>
          {/* Status */}
          <div className="absolute top-3 right-3">
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            {/* Tenant + price */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3.5">
                <Avatar
                  src={booking.tenant.image}
                  name={tenantName(booking.tenant)}
                  size={52}
                />
                <div>
                  <h3 className="font-extrabold text-lg text-gray-900 dark:text-white leading-tight">
                    {tenantName(booking.tenant)}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <ScoreBadge score={booking.tenant.score} />
                    {booking.tenant.isVerified && (
                      <IoShieldCheckmarkOutline className="text-emerald-500 text-base" />
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-2xl font-extrabold ${GRAD_TEXT}`}>
                  {booking.totalPrice.toLocaleString("fr-FR")} TND
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mt-0.5">
                  {booking.nights} nuit{booking.nights > 1 ? "s" : ""} ·{" "}
                  {fmtShort(booking.checkIn)} – {fmtShort(booking.checkOut)}
                </p>
              </div>
            </div>

            {/* Message */}
            {booking.message && (
              <div className="relative bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 mb-5 border border-gray-100 dark:border-slate-700/50">
                <span className="absolute -top-3 -left-1 text-indigo-200 dark:text-indigo-900 text-4xl leading-none select-none pointer-events-none font-serif">
                  "
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed italic">
                  {booking.message.length > 180
                    ? booking.message.slice(0, 180) + "…"
                    : booking.message}
                </p>
              </div>
            )}

            {/* Info chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                {
                  icon: <IoCalendarOutline />,
                  label: `${fmtDate(booking.checkIn)} → ${fmtDate(booking.checkOut)}`,
                },
                {
                  icon: <IoPeopleOutline />,
                  label: `${booking.guests} voyageur${booking.guests > 1 ? "s" : ""}`,
                },
                ...(booking.listing.location
                  ? [
                      {
                        icon: <IoLocationOutline />,
                        label: booking.listing.location,
                      },
                    ]
                  : []),
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 px-2.5 py-1 rounded-full"
                >
                  <span className="text-indigo-400">{icon}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          {isPending ? (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setAccepting(true);
                  onAccept(booking.id);
                }}
                disabled={accepting || rejecting}
                className={`flex-1 py-3.5 rounded-full text-sm flex items-center justify-center gap-2 ${BTN_GRAD} disabled:opacity-50`}
              >
                {accepting ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <IoCheckmarkCircleOutline className="text-base" />
                    Accepter la demande
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setRejecting(true);
                  onReject(booking.id);
                }}
                disabled={accepting || rejecting}
                className="px-6 py-3.5 rounded-full text-sm font-bold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {rejecting ? (
                  <span className="w-4 h-4 rounded-full border-2 border-red-300/30 border-t-red-400 animate-spin" />
                ) : (
                  <>
                    <IoCloseCircleOutline className="text-base" />
                    Refuser
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link
                href={`/fr/listings/${booking.listing.id}`}
                className="flex-1 py-3 px-4 rounded-full text-sm font-bold text-center bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors"
              >
                Voir le logement
              </Link>
              <Link
                href={`/fr/dashboard/owner/messages`}
                className="w-11 h-11 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                <IoChatbubbleOutline className="text-base" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

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
      const statusMap: Record<Tab, string> = {
        PENDING: "PENDING",
        ACCEPTED: "ACCEPTED,CONFIRMED",
        PAST: "COMPLETED,CANCELLED,REJECTED",
      };
      const res = await fetch(
        `/api/bookings?role=owner&status=${statusMap[tab]}&pageSize=20`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const raw: BookingRequest[] = Array.isArray(data)
        ? data
        : (data.bookings ?? []);
      setBookings(raw);
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
      const data = await res.json();
      setStats({
        pendingCount: data.pendingCount ?? 0,
        weeklyRequests: data.weeklyRequests ?? 0,
        occupancyRate: data.occupancyRate ?? 0,
        weeklyRevenue: data.weeklyRevenue ?? 0,
      });
    } catch {
      // stats are non-critical — silent fail
    }
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
      } else {
        setToast({ message: "Erreur lors de l'acceptation", type: "error" });
      }
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
      } else {
        setToast({ message: "Erreur lors du refus", type: "error" });
      }
    } catch {
      setToast({ message: "Erreur de connexion", type: "error" });
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === "PENDING");
  const nonPendingBookings = bookings.filter((b) => b.status !== "PENDING");

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className="w-full px-6 pt-10 pb-28">
        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            Gestion des Réservations
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base">
            Suivez et gérez les demandes de séjour pour vos propriétés
            d'exception.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-10 bg-gray-100 dark:bg-slate-800/60 p-1.5 rounded-2xl w-fit">
          {(
            [
              {
                key: "PENDING",
                label: "Demandes (En attente)",
                count: stats.pendingCount,
              },
              { key: "ACCEPTED", label: "Confirmées" },
              { key: "PAST", label: "Passées" },
            ] as { key: Tab; label: string; count?: number }[]
          ).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                tab === key
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-800"
              }`}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span
                  className={`ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-extrabold text-white ${GRAD}`}
                >
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main grid - with sidebar cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Booking cards - 8 cols */}
          <div className="lg:col-span-8 space-y-8">
            {isLoading ? (
              [...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 rounded-2xl h-64 animate-pulse border border-gray-100 dark:border-slate-800"
                />
              ))
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <IoCalendarOutline className="text-gray-300 dark:text-slate-600 text-3xl" />
                </div>
                <p className="font-semibold text-gray-500 dark:text-gray-500">
                  Aucune réservation{" "}
                  {tab === "PENDING"
                    ? "en attente"
                    : tab === "ACCEPTED"
                      ? "confirmée"
                      : "passée"}
                </p>
              </div>
            ) : (
              (tab === "PENDING" ? pendingBookings : nonPendingBookings).map(
                (b) => (
                  <RequestCard
                    key={b.id}
                    booking={b}
                    isPending={tab === "PENDING" && b.status === "PENDING"}
                    onAccept={handleAccept}
                    onReject={handleReject}
                  />
                ),
              )
            )}
          </div>

          {/* Right sidebar (4 cols) - 3 CARDS CONSERVÉES */}
          <div className="lg:col-span-4 space-y-6">
            {/* Stats card */}
            <div
              className={`${GRAD} p-7 rounded-2xl relative overflow-hidden text-white shadow-lg shadow-indigo-200/40 dark:shadow-indigo-900/30`}
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                  Aperçu hebdomadaire
                </span>
                <h4 className="text-3xl font-extrabold mt-2 leading-tight">
                  {stats.weeklyRequests} nouvelle
                  {stats.weeklyRequests > 1 ? "s" : ""} demande
                  {stats.weeklyRequests > 1 ? "s" : ""}
                </h4>
                <p className="mt-3 text-white/80 text-sm leading-relaxed">
                  Taux d'occupation ce mois :{" "}
                  <span className="font-extrabold text-white">
                    {stats.occupancyRate}%
                  </span>
                </p>
                {stats.weeklyRevenue > 0 && (
                  <p className="text-white/70 text-xs mt-1">
                    Revenus estimés :{" "}
                    <span className="font-bold text-white">
                      {stats.weeklyRevenue.toLocaleString("fr-FR")} TND
                    </span>
                  </p>
                )}
                <div className="mt-6 flex items-center gap-2 text-sm font-bold">
                  <Link
                    href="/fr/dashboard/owner/analytics"
                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                  >
                    Voir les revenus
                    <IoTrendingUpOutline className="text-lg" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Concierge tips */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
              <h5 className="font-extrabold text-gray-900 dark:text-white mb-5">
                Conseils Conciergerie
              </h5>
              <div className="space-y-5">
                {[
                  {
                    icon: <IoFlashOutline className="text-indigo-500" />,
                    text: (
                      <>
                        Répondre en moins de 2h augmente vos chances de
                        réservation de{" "}
                        <span className="font-bold text-gray-900 dark:text-white">
                          30%
                        </span>
                        .
                      </>
                    ),
                  },
                  {
                    icon: <IoCameraOutline className="text-indigo-500" />,
                    text: "Mettez à jour vos photos pour la saison estivale.",
                  },
                ].map(({ icon, text }, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0">
                      {icon}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Add listing CTA */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 flex flex-col items-center justify-center text-center p-8 gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                <IoAddOutline className="text-indigo-500 text-2xl" />
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 dark:text-white text-sm">
                  Ajouter un bien
                </h4>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                  Développez votre patrimoine
                </p>
              </div>
              <Link
                href="/fr/dashboard/owner/listings/new"
                className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity"
              >
                Lancer
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-gray-100 dark:border-slate-800 z-50 rounded-t-[2rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.08)]">
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
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-2xl transition-colors ${
              active
                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                : "text-gray-400 dark:text-gray-600"
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