"use client";
import React from "react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ReviewModal from "@/components/ui/modals/OwnerReviewModal";
import { useReview } from "./hooks/useReview";
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoCalendarOutline,
  IoPeopleOutline,
  IoChatbubbleOutline,
  IoShieldCheckmarkOutline,
  IoTrendingUpOutline,
  IoHomeOutline,
  IoAddOutline,
  IoFlashOutline,
  IoCameraOutline,
  IoTimeOutline,
  IoEyeOutline,
  IoStarSharp,
  IoWalletOutline,
  IoChevronForwardOutline,
  IoMoonOutline,
  IoArrowForwardOutline,
} from "react-icons/io5";
import { TbBrandBooking, TbHomePlus } from "react-icons/tb";
import {
  TrendingUp,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

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
  conversationId?: string;
  hasReview?: boolean;
  tenant: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    image?: string;
    score?: number;
    isVerified?: boolean;
    username?: string;
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
  acceptedCount: number;
  pastCount: number;
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

function tenantName(t: BookingRequest["tenant"]) {
  if (t.name) return t.name;
  if (t.firstName)
    return `${t.firstName}${t.lastName ? " " + t.lastName.charAt(0) + "." : ""}`;
  if (t.username) return t.username;
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
function StatusBadge({
  status,
  t,
}: {
  status: BookingRequest["status"];
  t: any;
}) {
  const map: Record<string, { label: string; dot: string; bg: string }> = {
    PENDING: {
      label: t("status.pending"),
      dot: "bg-amber-400 animate-pulse",
      bg: "bg-amber-50/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-700/40",
    },
    ACCEPTED: {
      label: t("status.accepted"),
      dot: "bg-sky-500",
      bg: "bg-sky-50/80 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-700/40",
    },
    CONFIRMED: {
      label: t("status.confirmed"),
      dot: "bg-emerald-500",
      bg: "bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-700/40",
    },
    REJECTED: {
      label: t("status.rejected"),
      dot: "bg-rose-500",
      bg: "bg-rose-50/80 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-700/40",
    },
    CANCELLED: {
      label: t("status.cancelled"),
      dot: "bg-gray-400",
      bg: "bg-gray-100/80 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border-gray-200/60 dark:border-gray-700/40",
    },
    COMPLETED: {
      label: t("status.completed"),
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
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          type === "success"
            ? "bg-green-500 text-white"
            : "bg-red-500 text-white"
        }`}
      >
        {type === "success" ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <AlertCircle className="w-5 h-5" />
        )}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  Icon,
  grad,
  bg,
  cls,
  growth,
}: {
  title: string;
  value: string | number;
  Icon: React.ElementType;
  grad: string;
  bg: string;
  cls: string;
  growth?: string | null;
}) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border ${bg} p-4 relative shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)] hover:shadow-md transition-all`}
    >
      {growth && (
        <div className="absolute top-3 right-3 text-emerald-500 text-[10px] font-bold">
          {growth}
        </div>
      )}
      <div className="flex items-center gap-4">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm flex-shrink-0`}
        >
          <Icon className="text-white text-xl" />
        </div>
        <div>
          <p className={`text-2xl font-black leading-none ${cls}`}>{value}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium leading-tight">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
function EmptyReservationsState({ t, locale }: { t: any; locale: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 dark:from-sky-950/50 dark:to-purple-950/50 flex items-center justify-center shadow-lg">
          <TbBrandBooking
            size={48}
            className="text-sky-500 dark:text-sky-400"
          />
        </div>
      </div>
      <h3 className="text-2xl font-headline font-bold bg-gradient-to-r from-sky-600 to-purple-600 dark:from-sky-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
        {t("emptyState.title")}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
        {t("emptyState.description")}
      </p>
      <Link
        href={`/${locale}/dashboard/owner/listings`}
        className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <TbHomePlus
          size={18}
          className="group-hover:rotate-12 transition-transform duration-300"
        />
        {t("emptyState.button")}
        <TrendingUp
          size={16}
          className="group-hover:translate-x-1 transition-transform duration-300"
        />
      </Link>
      <Link
        href={`/${locale}/help`}
        className="mt-6 text-xs text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex items-center gap-1"
      >
        <HelpCircle size={12} />
        {t("emptyState.helpLink")}
      </Link>
    </div>
  );
}

// ─── Request card ─────────────────────────────────────────────────────────────
function RequestCard({
  booking,
  isPending,
  onAccept,
  onReject,
  onOpenReview,
  t,
  locale,
  router,
}: {
  booking: BookingRequest;
  isPending: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onOpenReview?: (booking: BookingRequest) => void;
  t: any;
  locale: string;
  router: any;
}) {
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);
  const img = listingImage(booking.listing);
  const canCancel =
    booking.status === "CONFIRMED" && new Date(booking.checkIn) > new Date();

  const openConversation = async () => {
    const tenantId = booking.tenant.id;
    const listingId = booking.listing.id;
    const conversationId = booking.conversationId;

    if (conversationId) {
      router.push(
        `/${locale}/dashboard/owner/messages?conversationId=${conversationId}`,
      );
      return;
    }

    if (tenantId && listingId) {
      try {
        setAccepting(true);
        const res = await fetch(
          `/api/conversations?userId=${tenantId}&listingId=${listingId}`,
        );
        const data = await res.json();

        if (data.conversationId) {
          router.push(
            `/${locale}/dashboard/owner/messages?conversationId=${data.conversationId}`,
          );
        } else {
          router.push(`/${locale}/dashboard/owner/messages`);
        }
      } catch (error) {
        console.error("Erreur:", error);
        router.push(`/${locale}/dashboard/owner/messages`);
      } finally {
        setAccepting(false);
      }
    } else {
      router.push(`/${locale}/dashboard/owner/messages`);
    }
  };

  return (
    <div
      className={`group bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl overflow-hidden border transition-all duration-500 h-full flex flex-col ${
        hovered
          ? "border-indigo-200/60 dark:border-indigo-700/40 shadow-xl shadow-indigo-500/5 dark:shadow-indigo-500/5 -translate-y-0.5"
          : "border-white/50 dark:border-gray-800 shadow-sm"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent transition-opacity duration-500 ${hovered ? "opacity-100" : "opacity-0"}`}
      />

      <div className="flex flex-col sm:flex-row h-full">
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
            <StatusBadge status={booking.status} t={t} />
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
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  href={`/${locale}/profile/${booking.tenant.username}`}
                  className="flex-shrink-0"
                >
                  <Avatar
                    src={booking.tenant.image}
                    name={tenantName(booking.tenant)}
                    size={40}
                  />
                </Link>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/${locale}/profile/${booking.tenant.username}`}
                      className="text-sm font-bold text-gray-900 dark:text-white truncate hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                    >
                      {tenantName(booking.tenant)}
                    </Link>
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

            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-900/20 text-gray-600 dark:text-gray-300 border border-indigo-100/50 dark:border-indigo-800/30">
                <IoCalendarOutline className="text-indigo-500 dark:text-indigo-400 text-xs" />
                {fmtShort(booking.checkIn)} → {fmtShort(booking.checkOut)}
              </span>
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-violet-50/60 dark:bg-violet-900/20 text-gray-600 dark:text-gray-300 border border-violet-100/50 dark:border-violet-800/30">
                <IoMoonOutline className="text-violet-500 dark:text-violet-400 text-xs" />
                {booking.nights} {booking.nights > 1 ? t("nights") : t("night")}
              </span>
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-purple-50/60 dark:bg-purple-900/20 text-gray-600 dark:text-gray-300 border border-purple-100/50 dark:border-purple-800/30">
                <IoPeopleOutline className="text-purple-500 dark:text-purple-400 text-xs" />
                {booking.guests} {t("guests")}
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

            {booking.message && (
              <div className="border-l-[3px] border-indigo-200 dark:border-indigo-800 pl-3 mb-3">
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed italic line-clamp-2">
                  &ldquo;{booking.message}&rdquo;
                </p>
              </div>
            )}
          </div>

          {isPending ? (
            <div className="flex flex-col gap-2.5 mt-4">
              <button
                onClick={() => {
                  setAccepting(true);
                  onAccept(booking.id);
                }}
                disabled={accepting || rejecting}
                className="w-full py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {accepting ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <IoCheckmarkCircleOutline className="text-base" />{" "}
                    {t("actions.accept")}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setRejecting(true);
                  onReject(booking.id);
                }}
                disabled={accepting || rejecting}
                className="w-full py-3 rounded-2xl text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rejecting ? (
                  <span className="w-4 h-4 rounded-full border-2 border-rose-300/30 border-t-rose-400 animate-spin" />
                ) : (
                  <>
                    <IoCloseCircleOutline className="text-base" />{" "}
                    {t("actions.reject")}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
              <Link
                href={`/${locale}/dashboard/owner/listings/${booking.listing.id}`}
                className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
              >
                <IoEyeOutline className="inline mr-1 text-sm" />{" "}
                {t("actions.viewListing")}
              </Link>

              {/* Bouton "Donner un avis" - UNIQUEMENT si COMPLETED ET pas encore d'avis */}
              {booking.status === "COMPLETED" &&
                !booking.hasReview &&
                onOpenReview && (
                  <button
                    onClick={() => onOpenReview(booking)}
                    className="flex-1 text-center py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 relative bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <IoStarSharp className="text-sm" />
                    {t("actions.review")}
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                      +
                    </span>
                  </button>
                )}

              {/* Badge "Avis donné" si déjà fait */}
              {booking.status === "COMPLETED" && booking.hasReview && (
                <div className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {t("actions.reviewGiven")}
                </div>
              )}

              <button
                onClick={openConversation}
                className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <IoChatbubbleOutline className="text-sm" />{" "}
                {t("actions.message")}
              </button>

              {canCancel && (
                <Link
                  href={`/${locale}/dashboard/owner/reservations/${booking.id}/cancel`}
                  className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all"
                >
                  {t("actions.cancel")}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function OwnerReservationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  const t = useTranslations("OwnerReservations");
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("PENDING");
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    pendingCount: 0,
    acceptedCount: 0,
    pastCount: 0,
    weeklyRequests: 0,
    occupancyRate: 0,
    weeklyRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Utilisation du hook useReview
  const {
    showReviewModal,
    selectedBooking,
    openReviewModal,
    closeReviewModal,
    handleSubmitReview,
  } = useReview(
    () => {
      loadBookings();
      loadStats();
      setToast({ message: t("toast.reviewSuccess"), type: "success" });
    },
    () => {
      setToast({ message: t("toast.reviewError"), type: "error" });
    },
  );

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
      const bookingsList = Array.isArray(data) ? data : (data.bookings ?? []);
      setBookings(bookingsList);

      const pendingList = bookingsList.filter(
        (b: BookingRequest) => b.status === "PENDING",
      );
      const acceptedList = bookingsList.filter(
        (b: BookingRequest) =>
          b.status === "ACCEPTED" || b.status === "CONFIRMED",
      );
      const pastList = bookingsList.filter(
        (b: BookingRequest) =>
          b.status === "COMPLETED" ||
          b.status === "CANCELLED" ||
          b.status === "REJECTED",
      );

      if (data.stats) {
        setStats({
          pendingCount: data.stats.pendingCount ?? pendingList.length,
          acceptedCount: data.stats.acceptedCount ?? acceptedList.length,
          pastCount: data.stats.pastCount ?? pastList.length,
          weeklyRequests: data.stats.weeklyRequests ?? 0,
          occupancyRate: data.stats.occupancyRate ?? 0,
          weeklyRevenue: data.stats.weeklyRevenue ?? 0,
        });
      } else {
        setStats((prev) => ({
          ...prev,
          pendingCount: pendingList.length,
          acceptedCount: acceptedList.length,
          pastCount: pastList.length,
        }));
      }
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
      setStats((prev) => ({
        ...prev,
        weeklyRequests: d.weeklyRequests ?? prev.weeklyRequests,
        occupancyRate: d.occupancyRate ?? prev.occupancyRate,
        weeklyRevenue: d.weeklyRevenue ?? prev.weeklyRevenue,
      }));
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
        setToast({ message: t("toast.acceptSuccess"), type: "success" });
        setBookings((p) =>
          p.map((b) => (b.id === id ? { ...b, status: "ACCEPTED" } : b)),
        );
        loadStats();
        loadBookings();
      } else {
        setToast({ message: t("toast.acceptError"), type: "error" });
      }
    } catch {
      setToast({ message: t("toast.networkError"), type: "error" });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: t("rejectReason.default") }),
      });
      if (res.ok) {
        setToast({ message: t("toast.rejectSuccess"), type: "error" });
        setBookings((p) =>
          p.map((b) => (b.id === id ? { ...b, status: "REJECTED" } : b)),
        );
        loadStats();
        loadBookings();
      } else {
        setToast({ message: t("toast.rejectError"), type: "error" });
      }
    } catch {
      setToast({ message: t("toast.networkError"), type: "error" });
    }
  };

  const displayed = bookings;

  return (
    <div className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto bg-slate-50/20 dark:bg-slate-900/0 p-6 gap-6">
      {/* Toast */}
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
      `}</style>

      {/* Header avec tabs */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl md:text-4xl font-black tracking-tight mb-1.5 text-slate-900 dark:text-white">
            {t("page.title")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {t("page.description")}
          </p>
        </div>

        <div className="flex gap-1.5 bg-gray-200/50 dark:bg-gray-900/40 backdrop-blur-xl p-1 rounded-2xl border border-white/50 dark:border-gray-800">
          {[
            {
              key: "PENDING" as Tab,
              label: t("tabs.pending"),
              icon: <IoTimeOutline className="text-sm" />,
              count: stats.pendingCount,
            },
            {
              key: "ACCEPTED" as Tab,
              label: t("tabs.confirmed"),
              icon: <IoCheckmarkCircleOutline className="text-sm" />,
              count: stats.acceptedCount,
            },
            {
              key: "PAST" as Tab,
              label: t("tabs.past"),
              icon: <IoCalendarOutline className="text-sm" />,
              count: stats.pastCount,
            },
          ].map(({ key, label, icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                tab === key
                  ? "bg-gradient-to-r from-sky-600 to-purple-600 text-white shadow-md shadow-sky-500/25"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {icon}
              {label}
              {count > 0 && (
                <span
                  className={`text-[10px] min-w-[20px] h-5 px-1.5 rounded-full font-bold flex items-center justify-center ${
                    tab === key
                      ? "bg-white/20 text-white"
                      : "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400"
                  }`}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("stats.pending")}
          value={stats.pendingCount}
          Icon={IoTimeOutline}
          grad="from-sky-400 to-blue-500"
          bg="border-sky-100 dark:border-sky-900/40"
          cls="text-sky-600 dark:text-sky-400"
          growth={null}
        />
        <StatCard
          title={t("stats.weeklyRequests")}
          value={stats.weeklyRequests}
          Icon={IoCalendarOutline}
          grad="from-indigo-400 to-violet-500"
          bg="border-indigo-100 dark:border-indigo-900/40"
          cls="text-indigo-600 dark:text-indigo-400"
          growth={null}
        />
        <StatCard
          title={t("stats.occupancy")}
          value={`${stats.occupancyRate}%`}
          Icon={IoTrendingUpOutline}
          grad="from-emerald-400 to-teal-500"
          bg="border-emerald-100 dark:border-emerald-900/40"
          cls="text-emerald-600 dark:text-emerald-400"
          growth={`+${stats.occupancyRate > 0 ? stats.occupancyRate : 0}%`}
        />
        <StatCard
          title={t("stats.revenue")}
          value={`${stats.weeklyRevenue.toLocaleString()} ${t("currency.tnd")}`}
          Icon={IoWalletOutline}
          grad="from-violet-500 to-purple-600"
          bg="border-violet-100 dark:border-violet-900/40"
          cls="text-violet-600 dark:text-violet-400"
          growth={null}
        />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-7">
        <div className="space-y-5 min-w-0">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-gray-800/30 h-48 animate-pulse"
              />
            ))
          ) : displayed.length === 0 ? (
            <EmptyReservationsState t={t} locale={locale} />
          ) : (
            displayed.map((b, i) => (
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
                  onOpenReview={openReviewModal}
                  t={t}
                  locale={locale}
                  router={router}
                />
              </div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5 lg:sticky lg:top-6">
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl border border-sky-100 dark:border-sky-900/40 p-5">
            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-slate-400 dark:text-slate-500 mb-4">
              {t("sidebar.quickActions")}
            </p>
            <div className="space-y-2">
              {[
                {
                  href: `/${locale}/dashboard/owner`,
                  icon: <IoTrendingUpOutline />,
                  bg: "bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800/30 text-sky-600 dark:text-sky-400",
                  label: t("sidebar.analytics"),
                  sub: t("sidebar.revenue"),
                },
                {
                  href: `/${locale}/dashboard/owner/messages`,
                  icon: <IoChatbubbleOutline />,
                  bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800/30 text-violet-600 dark:text-violet-400",
                  label: t("sidebar.messages"),
                  sub: t("sidebar.conversations"),
                },
                {
                  href: `/${locale}/dashboard/owner/listings`,
                  icon: <IoHomeOutline />,
                  bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400",
                  label: t("sidebar.listings"),
                  sub: t("sidebar.manage"),
                },
              ].map(({ href, icon, bg, label, sub }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors group"
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
                  <IoChevronForwardOutline className="text-gray-300 dark:text-gray-600 group-hover:text-sky-500 dark:group-hover:text-sky-400 text-xs transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl border border-sky-100 dark:border-sky-900/40 p-5">
            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-slate-400 dark:text-slate-500 mb-4">
              {t("sidebar.tips")}
            </p>
            <div className="space-y-3">
              {[
                {
                  icon: (
                    <IoFlashOutline className="text-amber-500 dark:text-amber-400" />
                  ),
                  text: t("tips.fastResponse"),
                },
                {
                  icon: (
                    <IoCameraOutline className="text-sky-500 dark:text-sky-400" />
                  ),
                  text: t("tips.updatePhotos"),
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

          <div className="relative overflow-hidden rounded-3xl border border-white/50 dark:border-gray-800">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-purple-500 to-pink-500" />
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
                {t("sidebar.addListing")}
              </h4>
              <p className="text-xs text-white/60 mb-4">
                {t("sidebar.addListingDesc")}
              </p>
              <Link
                href={`/${locale}/dashboard/owner/listings/create`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-sky-600 rounded-xl text-xs font-bold hover:bg-white/90 transition-colors shadow-sm"
              >
                {t("sidebar.start")}{" "}
                <IoArrowForwardOutline className="text-sm" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL D'AVIS */}
      {selectedBooking && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={closeReviewModal}
          bookingId={selectedBooking.id}
          tenantId={selectedBooking.tenant.id}
          tenantUsername={selectedBooking.tenant.username || ""}
          tenantImage={selectedBooking.tenant.image}
          listingTitle={selectedBooking.listing.title}
          listingImage={selectedBooking.listing.image}
          checkIn={selectedBooking.checkIn}
          checkOut={selectedBooking.checkOut}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
}
