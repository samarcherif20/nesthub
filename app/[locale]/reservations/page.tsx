// app/[locale]/reservations/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  IoCalendarOutline,
  IoPeopleOutline,
  IoLocationOutline,
  IoChatbubbleOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoArrowForwardOutline,
  IoHomeOutline,
  IoSearchOutline,
  IoPersonOutline,
  IoFilterOutline,
  IoCardOutline,
  IoDocumentTextOutline,
  IoStarOutline,
  IoRefreshOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";

const pipListing = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

const GRAD = "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600";
const GRAD_TEXT =
  "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent";
const BTN_GRAD = `${GRAD} text-white font-bold shadow-md shadow-indigo-200/50 dark:shadow-indigo-900/20 hover:opacity-90 active:scale-[.98] transition-all`;

type Tab = "UPCOMING" | "PAST" | "CANCELLED";

interface Reservation {
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
  isPaid?: boolean;
  reference?: string;
  listing: {
    id: string;
    title: string;
    image?: string;
    images?: string[];
    location?: string;
    rating?: number;
    type?: string;
  };
  owner: {
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    image?: string;
  };
  conversationId?: string;
  bookingOfferId?: string;
}

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ownerName(o: Reservation["owner"]) {
  if (o.name) return o.name;
  if (o.firstName)
    return `${o.firstName}${o.lastName ? " " + o.lastName.charAt(0) + "." : ""}`;
  return "Hôte";
}

function listingImage(l: Reservation["listing"]) {
  const url = l.image ?? l.images?.[0];
  return url ? pipListing(url) : null;
}

const STATUS_CONFIG: Record<
  Reservation["status"],
  { label: string; cls: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "En attente",
    cls: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100",
    icon: <IoTimeOutline />,
  },
  ACCEPTED: {
    label: "Acceptée",
    cls: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-100",
    icon: <IoCheckmarkCircleOutline />,
  },
  CONFIRMED: {
    label: "Confirmée",
    cls: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100",
    icon: <IoCheckmarkCircleOutline />,
  },
  REJECTED: {
    label: "Refusée",
    cls: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100",
    icon: <IoCloseCircleOutline />,
  },
  CANCELLED: {
    label: "Annulée",
    cls: "bg-gray-100 dark:bg-slate-800 text-gray-500 border-gray-200",
    icon: <IoCloseCircleOutline />,
  },
  COMPLETED: {
    label: "Terminée",
    cls: "bg-gray-50 dark:bg-slate-800 text-gray-500 border-gray-100",
    icon: <IoCheckmarkCircleOutline />,
  },
};

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
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg =
    type === "success"
      ? "bg-emerald-500"
      : type === "error"
        ? "bg-red-500"
        : "bg-sky-500";
  return (
    <div className="fixed top-20 right-4 z-[80] max-w-sm animate-in slide-in-from-top-3 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-xl ${bg}`}
      >
        <IoCheckmarkCircleOutline className="text-lg" />
        {message}
      </div>
    </div>
  );
}

function ReservationCard({
  res,
  onPay,
  onCancel,
  t,
}: {
  res: Reservation;
  onPay: (r: Reservation) => void;
  onCancel: (id: string) => void;
  t: any;
}) {
  const [imgErr, setImgErr] = useState(false);
  const img = listingImage(res.listing);
  const cfg = STATUS_CONFIG[res.status];
  const isPendingPayment =
    (res.status === "ACCEPTED" || res.status === "CONFIRMED") && !res.isPaid;
  const isConfirmedPaid =
    (res.status === "CONFIRMED" || res.status === "ACCEPTED") && res.isPaid;
  const isPast = res.status === "COMPLETED";

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500 flex flex-col md:flex-row">
      <div className="md:w-2/5 h-56 md:h-auto relative overflow-hidden bg-gray-100 dark:bg-slate-800 flex-shrink-0">
        {img && !imgErr ? (
          <img
            src={img}
            alt={res.listing.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            className={`w-full h-full ${GRAD} flex items-center justify-center opacity-60`}
          >
            <IoHomeOutline className="text-white text-5xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span
            className={`flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 ${cfg.cls}`}
          >
            {cfg.icon} {cfg.label}
          </span>
        </div>
        {res.listing.type && (
          <div className="absolute bottom-3 left-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
              {res.listing.type}
            </span>
          </div>
        )}
      </div>

      <div className="md:w-3/5 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white leading-snug line-clamp-2">
              {res.listing.title}
            </h3>
            <p className={`text-lg font-extrabold shrink-0 ${GRAD_TEXT}`}>
              {res.totalPrice.toLocaleString("fr-FR")} TND
            </p>
          </div>
          <div className="space-y-2 my-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <IoCalendarOutline className="text-indigo-400 text-base" />
              <span>
                {fmtDate(res.checkIn)} → {fmtDate(res.checkOut)}
              </span>
              <span className="text-gray-300">·</span>
              <span className="font-semibold">
                {res.nights} nuit{res.nights > 1 ? "s" : ""}
              </span>
            </div>
            {res.listing.location && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <IoLocationOutline className="text-indigo-400 text-base" />
                <span className="truncate">{res.listing.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <IoPersonOutline className="text-indigo-400 text-base" />
              <span>
                {t("host")} : {ownerName(res.owner)}
              </span>
            </div>
          </div>
          {isPast && (
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <IoStarOutline
                  key={i}
                  className="text-amber-300 text-base cursor-pointer hover:text-amber-400"
                />
              ))}
              <span className="text-xs text-gray-400 ml-2">
                {t("leaveReview")}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          {isPendingPayment ? (
            <>
              <button
                onClick={() => onPay(res)}
                className={`flex-1 py-2.5 px-4 rounded-full text-sm flex items-center justify-center gap-2 ${BTN_GRAD}`}
              >
                <IoCardOutline className="text-base" /> {t("payNow")}
              </button>
              {res.conversationId && (
                <Link
                  href={`/fr/messages?conversation=${res.conversationId}`}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                >
                  <IoChatbubbleOutline className="text-base" />
                </Link>
              )}
            </>
          ) : isConfirmedPaid ? (
            <>
              <Link
                href={`/fr/listings/${res.listing.id}`}
                className="flex-1 py-2.5 px-4 rounded-full text-sm font-bold text-center bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <IoDocumentTextOutline className="text-base" />{" "}
                {t("viewDetails")}
              </Link>
              {res.conversationId && (
                <Link
                  href={`/fr/messages?conversation=${res.conversationId}`}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                >
                  <IoChatbubbleOutline className="text-base" />
                </Link>
              )}
            </>
          ) : isPast ? (
            <Link
              href={`/fr/listings/${res.listing.id}`}
              className="flex-1 py-2.5 px-4 rounded-full text-sm font-bold text-center bg-gray-100 dark:bg-slate-800 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              {t("viewListing")} <IoArrowForwardOutline className="text-sm" />
            </Link>
          ) : res.status === "PENDING" ? (
            <>
              <Link
                href={`/fr/messages?conversation=${res.conversationId ?? ""}`}
                className="flex-1 py-2.5 px-4 rounded-full text-sm font-bold text-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center justify-center gap-2"
              >
                <IoChatbubbleOutline className="text-base" />{" "}
                {t("viewConversation")}
              </Link>
              <button
                onClick={() => onCancel(res.id)}
                className="px-4 py-2.5 rounded-full text-sm font-bold bg-red-50 text-red-500 border border-red-100 hover:bg-red-100"
              >
                {t("cancel")}
              </button>
            </>
          ) : (
            <Link
              href={`/fr/listings/${res.listing.id}`}
              className="flex-1 py-2.5 px-4 rounded-full text-sm font-bold text-center bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {t("viewListing")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row animate-pulse">
      <div className="md:w-2/5 h-56 md:h-48 bg-gray-100 dark:bg-slate-800" />
      <div className="md:w-3/5 p-5 space-y-3">
        <div className="h-5 bg-gray-100 rounded-full w-3/4" />
        <div className="h-4 bg-gray-100 rounded-full w-1/2" />
        <div className="h-4 bg-gray-100 rounded-full w-full" />
        <div className="h-4 bg-gray-100 rounded-full w-2/3" />
      </div>
    </div>
  );
}

export default function TenantReservationsPage() {
  const t = useTranslations("ReservationsPage");
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("UPCOMING");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") =>
      setToast({ message, type }),
    [],
  );

  const loadReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusMap: Record<Tab, string> = {
        UPCOMING: "PENDING,ACCEPTED,CONFIRMED",
        PAST: "COMPLETED",
        CANCELLED: "CANCELLED,REJECTED",
      };
      const res = await fetch(
        `/api/bookings?role=tenant&status=${statusMap[tab]}&pageSize=20`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const raw: Reservation[] = Array.isArray(data)
        ? data
        : (data.bookings ?? []);
      setReservations(
        raw.map((r) => ({
          ...r,
          nights:
            r.nights ||
            Math.ceil(
              (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) /
                86400000,
            ),
        })),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handlePay = (res: Reservation) => {
    const params = new URLSearchParams({
      bookingId: res.id,
      ...(res.bookingOfferId ? { offerId: res.bookingOfferId } : {}),
    });
    router.push(`/fr/payment?${params.toString()}`);
  };

  const handleCancel = async (id: string) => {
    if (!confirm(t("confirmCancel"))) return;
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      if (res.ok) {
        showToast(t("cancelled"), "info");
        setReservations((p) =>
          p.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b)),
        );
      } else {
        showToast(t("errorCancel"), "error");
      }
    } catch {
      showToast(t("connectionError"), "error");
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "UPCOMING", label: t("upcoming") },
    { key: "PAST", label: t("past") },
    { key: "CANCELLED", label: t("cancelled") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-800 dark:to-purple-900">
      <TenantHeader />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className="pt-6 pb-28 max-w-7xl mx-auto px-4 sm:px-6">
        

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
            {t("title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
            {t("subtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
          <div className="flex gap-1 bg-gray-100 dark:bg-slate-800/60 p-1.5 rounded-2xl">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === key ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:bg-white/50"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 md:ml-auto">
            <button
              onClick={loadReservations}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-gray-600 text-sm font-medium hover:border-gray-300"
            >
              <IoRefreshOutline className="text-base" /> {t("refresh")}
            </button>
          </div>
        </div>

        {/* Reservations grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <IoCalendarOutline className="text-gray-300 text-3xl" />
              </div>
              <p className="font-semibold text-gray-500 mb-2">
                {t("noReservations")}{" "}
                {tab === "UPCOMING"
                  ? t("upcomingLower")
                  : tab === "PAST"
                    ? t("pastLower")
                    : t("cancelledLower")}
              </p>
              {tab === "UPCOMING" && (
                <Link
                  href="/fr/search"
                  className={`mt-4 px-6 py-2.5 rounded-full text-sm ${BTN_GRAD}`}
                >
                  {t("findListing")}
                </Link>
              )}
            </div>
            <div className="bg-indigo-50/60 dark:bg-indigo-950/20 rounded-2xl border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center p-10 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
                <IoHomeOutline className="text-indigo-500 text-2xl" />
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-indigo-700 mb-1">
                  {t("exploreTitle")}
                </h4>
                <p className="text-gray-500 text-sm mb-4">{t("exploreText")}</p>
                <Link
                  href="/fr/search"
                  className={`px-5 py-2 rounded-full text-sm ${BTN_GRAD}`}
                >
                  {t("findListing")}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reservations.map((r) => (
              <ReservationCard
                key={r.id}
                res={r}
                onPay={handlePay}
                onCancel={handleCancel}
                t={t}
              />
            ))}
            {tab === "UPCOMING" && (
              <div className="bg-indigo-50/60 dark:bg-indigo-950/20 rounded-2xl border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center p-10 text-center gap-3 min-h-[200px]">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <IoSearchOutline className="text-indigo-500 text-xl" />
                </div>
                <div>
                  <h4 className="font-extrabold text-indigo-700 mb-1">
                    {t("exploreTitle")}
                  </h4>
                  <p className="text-gray-500 text-sm mb-3">
                    {t("exploreText")}
                  </p>
                  <Link
                    href="/fr/search"
                    className={`px-4 py-2 rounded-full text-sm ${BTN_GRAD}`}
                  >
                    {t("findListing")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
