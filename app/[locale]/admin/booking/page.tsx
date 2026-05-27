"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  IoSearchOutline,
  IoCloseOutline,
  IoFilterOutline,
  IoEyeOutline,
  IoChatbubbleOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline as IoChevronNextOutline,
  IoTrashOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
} from "react-icons/io5";
import {
  PiUsersThree,
  PiBuildings,
  PiMoney,
  PiChartLineUp,
} from "react-icons/pi";
import { useTranslations } from "next-intl";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useBookings, type Booking } from "./hooks/useBookings";

// Styles du theme admin
const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

interface Toast {
  type: "success" | "error";
  message: string;
}

// Formatage
const formatDate = (dateString: string, locale: string) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const formatPrice = (price: number, locale: string) => {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: 2,
  }).format(price);
};

const getStatusBadge = (status: string, t: any) => {
  switch (status) {
    case "CONFIRMED":
      return {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-400",
        label: t("statusConfirmed"),
      };
    case "PENDING":
      return {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-700 dark:text-amber-400",
        label: t("statusPending"),
      };
    case "COMPLETED":
      return {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-400",
        label: t("statusCompleted"),
      };
    case "CANCELLED":
      return {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
        label: t("statusCancelled"),
      };
    case "CHECKED_IN":
      return {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-700 dark:text-purple-400",
        label: t("statusCheckedIn"),
      };
    default:
      return {
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-600 dark:text-slate-400",
        label: status,
      };
  }
};

const getPaymentBadge = (status: string, t: any) => {
  switch (status) {
    case "PAID":
      return { color: "bg-green-500", label: t("paymentPaid") };
    case "PENDING":
      return { color: "bg-amber-400", label: t("paymentPending") };
    case "REFUNDED":
      return { color: "bg-red-400", label: t("paymentRefunded") };
    default:
      return { color: "bg-slate-400", label: status };
  }
};

const getImageUrl = (url: string) => {
  if (!url) return "";
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

// Fonction pour vérifier si une réservation est supprimable (plus de 2 mois)
const isBookingDeletable = (booking: any) => {
  if (booking.status !== "COMPLETED" && booking.status !== "CANCELLED") {
    return false;
  }
  const checkOutDate = new Date(booking.checkOut);
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  return checkOutDate <= twoMonthsAgo;
};

// Composant Pagination
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  t,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  t: any;
}) {
  const pages = [];
  const maxVisible = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <IoChevronBackOutline className="text-lg" />
      </button>

      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
          >
            1
          </button>
          {startPage > 2 && <span className="text-slate-300">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${
            currentPage === page
              ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
          }`}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="text-slate-300">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <IoChevronNextOutline className="text-lg" />
      </button>
    </div>
  );
}

// Modal de confirmation amélioré avec bouton rouge pour suppression
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isDanger?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon centrée */}
        <div className="flex justify-center pt-6">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              isDanger
                ? "bg-red-100 dark:bg-red-900/30"
                : "bg-indigo-100 dark:bg-indigo-900/30"
            }`}
          >
            {isDanger ? (
              <IoTrashOutline className="text-2xl text-red-600 dark:text-red-400" />
            ) : (
              <IoCheckmarkCircleOutline className="text-2xl text-indigo-600 dark:text-indigo-400" />
            )}
          </div>
        </div>

        <div className="p-6 text-center">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
            {title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {message}
          </p>

          {/* Règle de suppression après 2 mois - visible uniquement pour delete */}
          {isDanger && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                📋 Règle de suppression: Seules les réservations terminées ou annulées depuis plus de 2 mois peuvent être supprimées définitivement.
              </p>
            </div>
          )}

          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all ${
                isDanger
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md shadow-red-500/30"
                  : "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-md shadow-indigo-500/30"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component
export default function AdminBookingsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const router = useRouter();
  const t = useTranslations("AdminBookings");

  const {
    bookings,
    stats,
    pagination,
    loading,
    filters,
    updateFilters,
    resetFilters,
    handlePageChange,
    executeAction,
  } = useBookings();

  const [showFilters, setShowFilters] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<"confirm" | "cancel" | "delete">("confirm");
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const statusOptions = [
    { value: "ALL", label: t("statusAll") },
    { value: "CONFIRMED", label: t("statusConfirmed") },
    { value: "PENDING", label: t("statusPending") },
    { value: "COMPLETED", label: t("statusCompleted") },
    { value: "CANCELLED", label: t("statusCancelled") },
    { value: "CHECKED_IN", label: t("statusCheckedIn") },
  ];

  const handleAction = (bookingId: string, action: "confirm" | "cancel" | "delete") => {
    setSelectedBookingId(bookingId);
    setModalAction(action);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedBookingId) return;
    const result = await executeAction(selectedBookingId, modalAction);
    if (result.success) {
      let message = "";
      switch (modalAction) {
        case "confirm":
          message = t("toastConfirmSuccess");
          break;
        case "cancel":
          message = t("toastCancelSuccess");
          break;
        case "delete":
          message = t("toastDeleteSuccess");
          break;
      }
      showToast("success", message);
    } else {
      showToast("error", t(result.message) || t("errorUnknown"));
    }
    setShowConfirmModal(false);
    setSelectedBookingId(null);
  };

  const statsCards = stats
    ? [
        {
          title: t("statTotalBookings"),
          value: stats.totalBookings.toLocaleString(),
          Icon: PiUsersThree,
          grad: "from-indigo-500 to-blue-600",
          cls: "text-indigo-600 dark:text-indigo-400",
        },
        {
          title: t("statActiveStays"),
          value: stats.activeStays.toString(),
          Icon: PiBuildings,
          grad: "from-emerald-400 to-teal-500",
          cls: "text-emerald-600 dark:text-emerald-400",
        },
        {
          title: t("statRevenueThisMonth"),
          value: formatPrice(stats.revenueThisMonth, locale),
          Icon: PiMoney,
          grad: "from-amber-400 to-orange-500",
          cls: "text-amber-600 dark:text-amber-400",
        },
        {
          title: t("statCancellationRate"),
          value: `${stats.cancellationRate}%`,
          Icon: PiChartLineUp,
          grad: "from-violet-500 to-purple-600",
          cls: stats.cancellationRate > 5 ? "text-red-600" : "text-emerald-600",
        },
      ]
    : [];

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <IoCheckmarkCircleOutline className="w-5 h-5" />
            ) : (
              <IoCloseCircleOutline className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-70"
            >
              <IoCloseCircleOutline className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmAction}
        title={
          modalAction === "confirm"
            ? t("modalConfirmTitle")
            : modalAction === "cancel"
            ? t("modalCancelTitle")
            : t("modalDeleteTitle")
        }
        message={
          modalAction === "confirm"
            ? t("modalConfirmMessage")
            : modalAction === "cancel"
            ? t("modalCancelMessage")
            : t("modalDeleteMessage")
        }
        confirmText={
          modalAction === "confirm"
            ? t("modalConfirmButton")
            : modalAction === "cancel"
            ? t("modalCancelButton")
            : t("modalDeleteButton")
        }
        cancelText={t("modalCancel")}
        isDanger={modalAction === "delete"}
      />

      <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
        {/* Header */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t("title")}
            </h2>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">
              {t("description")}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
            {statsCards.map(({ title, value, Icon, grad, cls }) => (
              <div
                key={title}
                className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-4 ${card3d}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm`}
                  >
                    <Icon className="text-white text-lg" />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {title}
                </p>
                <p className={`text-2xl font-black leading-none ${cls}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Filters + Table */}
        <div
          className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden ${block3d}`}
        >
          {/* Filters bar */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  placeholder={t("searchPlaceholder")}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100"
                />
              </div>
              <select
                value={filters.status}
                onChange={(e) => updateFilters({ status: e.target.value })}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-700 dark:text-slate-300"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  showFilters
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 text-indigo-500"
                }`}
              >
                <IoFilterOutline className="text-sm" /> {t("advancedFilters")}
              </button>
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <IoCloseOutline className="text-sm" /> {t("resetFilters")}
              </button>
            </div>

            {showFilters && (
              <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/30 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                    {t("dateFromLabel")}
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                    {t("dateToLabel")}
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => updateFilters({ dateTo: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                    {t("minAmountLabel")}
                  </label>
                  <input
                    type="number"
                    value={filters.minAmount}
                    onChange={(e) => updateFilters({ minAmount: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <LoadingSpinner />
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <PiUsersThree className="text-5xl text-indigo-300" />
                <p className="text-sm text-slate-500">{t("noBookings")}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {t("colBookingId")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {t("colProperty")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {t("colHostGuest")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {t("colDates")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {t("colAmount")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {t("colStatus")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {t("colPayment")}
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {t("colActions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {bookings.map((booking: any) => {
                    const statusBadge = getStatusBadge(booking.status, t);
                    const paymentBadge = getPaymentBadge(booking.paymentStatus, t);
                    const deletable = isBookingDeletable(booking);
                    
                    return (
                      <tr
                        key={booking.id}
                        className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors group"
                      >
                        <td className="px-4 py-4">
                          <span className="text-xs font-bold text-slate-400">
                            #{booking.reference?.slice(-8) || booking.id?.slice(-8)}
                          </span>
                        </td>
                        <td
                          className="px-4 py-4 cursor-pointer"
                          onClick={() =>
                            router.push(`/${locale}/admin/properties/${booking.listing?.id}`)
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                              {booking.listing?.images?.[0]?.url ? (
                                <img
                                  src={getImageUrl(booking.listing.images[0].url)}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <PiBuildings className="text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {booking.listing?.title || t("propertyUnknown")}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {booking.listing?.governorate || "-"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td
                          className="px-4 py-4 cursor-pointer"
                          onClick={() =>
                            router.push(`/${locale}/admin/users/${booking.tenant?.id}`)
                          }
                        >
                          <div className="flex flex-col gap-0.5">
                            <p className="text-xs font-semibold text-indigo-600">
                              {t("hostLabel")}: {booking.owner?.firstName}{" "}
                              {booking.owner?.lastName}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {t("guestLabel")}: {booking.tenant?.firstName}{" "}
                              {booking.tenant?.lastName}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs space-y-0.5">
                            <p>
                              {t("checkInLabel")}:{" "}
                              <span className="text-slate-600">
                                {formatDate(booking.checkIn, locale)}
                              </span>
                            </p>
                            <p>
                              {t("checkOutLabel")}:{" "}
                              <span className="text-slate-600">
                                {formatDate(booking.checkOut, locale)}
                              </span>
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            {formatPrice(booking.totalPrice, locale)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 text-[10px] font-bold rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                          >
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${paymentBadge.color}`} />
                            <span className="text-xs font-medium">{paymentBadge.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center items-center gap-1">
                            <button
                              onClick={() =>
                                router.push(`/${locale}/admin/booking/${booking.id}`)
                              }
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                              title={t("actionViewDetails")}
                            >
                              <IoEyeOutline className="text-base" />
                            </button>

                            <button
                              onClick={() => {
                                if (booking.conversationId) {
                                  router.push(`/${locale}/admin/conversations/${booking.conversationId}`);
                                } else {
                                  router.push(`/${locale}/admin/booking/${booking.id}?tab=messages`);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                              title={t("actionContact")}
                            >
                              <IoChatbubbleOutline className="text-base" />
                            </button>

                            {booking.status === "PENDING" && (
                              <button
                                onClick={() => handleAction(booking.id, "confirm")}
                                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                                title={t("actionConfirm")}
                              >
                                <IoCheckmarkCircleOutline className="text-base" />
                              </button>
                            )}

                            {(booking.status === "COMPLETED" || booking.status === "CANCELLED") && (
                              deletable ? (
                                <button
                                  onClick={() => handleAction(booking.id, "delete")}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                  title={t("actionDelete")}
                                >
                                  <IoTrashOutline className="text-base" />
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg"
                                  title={t("deleteNotAvailableTooltip")}
                                >
                                  <IoTrashOutline className="text-base" />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                       </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex-shrink-0 px-6 py-4 border-t border-indigo-50 dark:border-indigo-900/30 flex justify-between items-center">
              <p className="text-xs text-slate-500 font-medium">
                {t("paginationInfo", {
                  start: (pagination.page - 1) * pagination.limit + 1,
                  end: Math.min(pagination.page * pagination.limit, pagination.totalCount),
                  total: pagination.totalCount,
                })}
              </p>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                t={t}
              />
            </div>
          )}
        </div>

        {/* Footer Meta */}
        <div className="flex justify-between items-center pb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                {t("footerOperational")}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-200"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {t("footerLastUpdate")} {new Date().toLocaleTimeString(locale)}
            </p>
          </div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
            {t("footerCopyright")}
          </p>
        </div>
      </div>
    </>
  );
}