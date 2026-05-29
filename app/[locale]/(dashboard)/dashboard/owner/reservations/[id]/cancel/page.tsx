// app/[locale]/dashboard/owner/reservations/[id]/cancel/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  IoArrowBackOutline,
  IoWarningOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoCloseOutline,
  IoCashOutline,
  IoHomeOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import { useCancelBooking } from "./hooks/useCancelBooking";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pipListing = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;
const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

// ─── Avatar Component ─────────────────────────────────────────────────────────
function Avatar({
  src,
  name,
  size = 40,
}: {
  src?: string;
  name: string;
  size?: number;
}) {
  const [err, setErr] = useState(false);
  const url = src ? pipAvatar(src) : null;
  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-medium text-white shadow-md"
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

// ─── Toast Component ─────────────────────────────────────────────────────────
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
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
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

// ─── Breadcrumb Component ─────────────────────────────────────────────────────
function Breadcrumb({
  bookingRef,
  locale,
  t,
}: {
  bookingRef?: string;
  locale: string;
  t: any;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
      <Link
        href={`/${locale}/dashboard/owner/reservations`}
        className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase text-xs font-semibold tracking-wider"
      >
        {t("breadcrumb.reservations")}
      </Link>
      <IoChevronForwardOutline className="text-xs" />
      <span className="font-mono text-slate-500 dark:text-slate-300 uppercase text-xs">
        {bookingRef ? `#${bookingRef.slice(0, 8).toUpperCase()}` : "..."}
      </span>
      <IoChevronForwardOutline className="text-xs" />
      <span className="text-black dark:text-white font-semibold uppercase text-xs tracking-wider">
        {t("breadcrumb.cancellation")}
      </span>
    </div>
  );
}

export default function OwnerCancelBookingPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const t = useTranslations("OwnerCancelBooking");
  const locale = (params.locale as string) || "fr";

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [imageError, setImageError] = useState(false);

  const bookingId = params.id as string;

  //  Utilisation du hook
  const { isSubmitting, toast, setToast, handleCancel, clearToast } =
    useCancelBooking(getToken);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBooking(data);
    } catch (error) {
      console.error("Erreur chargement booking:", error);
      setToast({ type: "error", message: t("notFound") });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    if (confirmText.toUpperCase() !== "ANNULER") {
      setToast({ type: "error", message: t("confirmError") });
      return;
    }

    await handleCancel({ bookingId, reason, message }, () =>
      router.push(`/${locale}/dashboard/owner/reservations`),
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <IoCloseOutline className="text-4xl text-red-500 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">{t("notFound")}</p>
          <button
            onClick={() =>
              router.push(`/${locale}/dashboard/owner/reservations`)
            }
            className="mt-4 text-indigo-600 hover:underline"
          >
            {t("backToReservations")}
          </button>
        </div>
      </div>
    );
  }

  const checkInDate = booking.checkIn ? new Date(booking.checkIn) : null;
  const checkOutDate = booking.checkOut ? new Date(booking.checkOut) : null;
  const refundAmount = booking.totalPrice || 0;

  const mainPhoto =
    booking.listing?.photos?.find((p: any) => p.isMain) ||
    booking.listing?.photos?.[0];
  const listingImageUrl = mainPhoto?.url ? pipListing(mainPhoto.url) : null;
  const tenantAvatarUrl = booking.tenant?.profilePictureUrl
    ? pipAvatar(booking.tenant.profilePictureUrl)
    : null;
  const tenantName =
    booking.tenant?.username ||
    `${booking.tenant?.firstName || ""} ${booking.tenant?.lastName || ""}`.trim() ||
    t("details.tenant");

  const isConfirmDisabled =
    confirmText.toUpperCase() !== "ANNULER" || isSubmitting;

  return (
    <div className="p-6">
      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />
      )}

      {/* Breadcrumb */}
      <Breadcrumb
        bookingRef={booking.reference || booking.id}
        locale={locale}
        t={t}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          {t("title")}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Formulaire */}
        <div className="lg:col-span-7 space-y-6">
          {/* Important Notice */}
          <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-5 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <IoWarningOutline className="text-lg text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="text-base font-bold text-red-800 dark:text-red-300 mb-2">
                  {t("important.title")}
                </h2>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                    <span>{t("important.hostImpact")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                    <span>{t("important.calendarUnblock")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                    <span>{t("important.fullRefund")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cancellation Form */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                {t("form.reason")}
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              >
                <option value="">{t("form.selectReason")}</option>
                <option value="maintenance">{t("reasons.maintenance")}</option>
                <option value="double_booking">
                  {t("reasons.doubleBooking")}
                </option>
                <option value="damage">{t("reasons.damage")}</option>
                <option value="sold">{t("reasons.sold")}</option>
                <option value="other">{t("reasons.other")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                {t("form.message")}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("form.messagePlaceholder")}
                rows={4}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
                {t("form.confirmation")}
              </label>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {t("form.confirmText")}{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  ANNULER
                </span>
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ANNULER"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-center font-bold tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all uppercase"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Récapitulatif */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden sticky top-6 min-h-[560px]" >
            <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
              {listingImageUrl && !imageError ? (
                <img
                  src={listingImageUrl}
                  alt={booking.listing?.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <IoHomeOutline className="text-4xl text-slate-400" />
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span className="bg-red-600 text-white font-bold px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider">
                  {t("badge")}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {booking.listing?.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <IoLocationOutline className="text-[11px]" />
                  {booking.listing?.governorate}, {booking.listing?.delegation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    {t("details.checkIn")}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {checkInDate
                      ? format(checkInDate, "dd MMM yyyy", { locale: fr })
                      : "—"}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    {t("details.checkOut")}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {checkOutDate
                      ? format(checkOutDate, "dd MMM yyyy", { locale: fr })
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={booking.tenant?.profilePictureUrl}
                      name={tenantName}
                      size={40}
                    />
                    <div>
                      <p className="text-[10px] text-slate-500">
                        {t("details.tenant")}
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {tenantName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500">
                      {t("details.totalPrice")}
                    </p>
                    <p className="text-base font-bold text-red-600">
                      {booking.totalPrice?.toLocaleString(
                        locale === "fr" ? "fr-FR" : "en-US",
                      )}{" "}
                      TND
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <IoCashOutline className="text-slate-500 dark:text-slate-400" />
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {t("details.refund")}
                      </p>
                    </div>
                    <p className="text-base font-bold text-green-600">
                      {refundAmount.toLocaleString(
                        locale === "fr" ? "fr-FR" : "en-US",
                      )}{" "}
                      TND (100%)
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-amber-600 text-xs">
                    <span>{t("details.refundInfo")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
        <button
          onClick={onSubmit}
          disabled={isConfirmDisabled}
          className={`px-6 py-3 bg-red-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
            isConfirmDisabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-red-700 active:scale-[0.98]"
          }`}
        >
          <IoCloseOutline className="text-lg" />
          {isSubmitting ? t("buttons.cancelling") : t("buttons.confirm")}
        </button>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
        >
          {t("buttons.back")}
        </button>
      </div>
    </div>
  );
}
