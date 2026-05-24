// app/[locale]/admin/bookings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  IoSearchOutline,
  IoCloseOutline,
  IoFilterOutline,
  IoDownloadOutline,
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
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ============================================
// STYLES DU THÈME ADMIN
// ============================================
const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

// ============================================
// TYPES
// ============================================
interface Booking {
  id: string;
  conversationId?: string; // ← AJOUTEZ CETTE LIGNE

  reference: string;
  listing: {
    id: string;
    title: string;
    governorate: string;
    images?: { url: string }[];
  };
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface BookingStats {
  totalBookings: number;
  activeStays: number;
  revenueThisMonth: number;
  cancellationRate: number;
  totalRevenue: number;
  pendingPayments: number;
  completedBookings: number;
  cancelledBookings: number;
}

// ============================================
// FORMATAGE
// ============================================
const formatDate = (dateString: string) => {
  if (!dateString) return "Date inconnue";
  try {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Date inconnue";
  }
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: 2,
  }).format(price);
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "CONFIRMED":
      return {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-400",
        label: "Confirmée",
      };
    case "PENDING":
      return {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-700 dark:text-amber-400",
        label: "En attente",
      };
    case "COMPLETED":
      return {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-400",
        label: "Terminée",
      };
    case "CANCELLED":
      return {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
        label: "Annulée",
      };
    case "CHECKED_IN":
      return {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-700 dark:text-purple-400",
        label: "En cours",
      };
    default:
      return {
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-600 dark:text-slate-400",
        label: status,
      };
  }
};

const getPaymentBadge = (status: string) => {
  switch (status) {
    case "PAID":
      return { color: "bg-green-500", label: "Payé" };
    case "PENDING":
      return { color: "bg-amber-400", label: "En attente" };
    case "REFUNDED":
      return { color: "bg-red-400", label: "Remboursé" };
    default:
      return { color: "bg-slate-400", label: status };
  }
};

const getImageUrl = (url: string) => {
  if (!url) return "";
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

// ============================================
// COMPOSANT PAGINATION
// ============================================
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
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

// ============================================
// MODAL DE CONFIRMATION
// ============================================
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
}: any) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {message}
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 transition"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TOAST NOTIFICATION
// ============================================
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
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div
        className={`rounded-xl shadow-lg p-4 flex items-center gap-3 ${type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
      >
        {type === "success" ? (
          <IoCheckmarkCircleOutline className="text-xl" />
        ) : (
          <IoCloseCircleOutline className="text-xl" />
        )}
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function AdminBookingsPage() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "fr";
  const { getToken } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const [modalAction, setModalAction] = useState<
    "confirm" | "cancel" | "delete"
  >("confirm");

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, search, statusFilter, dateFrom, dateTo, minAmount]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.append("search", search);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (minAmount) params.append("minAmount", minAmount);

      const res = await fetch(`/api/admin/bookings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.bookings) {
        setBookings(data.bookings);
        setPagination(
          data.pagination || {
            page: 1,
            totalPages: 1,
            totalCount: 0,
            limit: 10,
          },
        );
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("Erreur:", error);
      setToast({
        message: "Erreur lors du chargement des réservations",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setMinAmount("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleAction = async (
    bookingId: string,
    action: "confirm" | "cancel" | "delete",
  ) => {
    setSelectedBookingId(bookingId);
    setModalAction(action);
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    if (!selectedBookingId) return;

    try {
      const token = await getToken();

      if (modalAction === "delete") {
        const res = await fetch(`/api/admin/bookings?id=${selectedBookingId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setToast({
            message: "Réservation supprimée avec succès",
            type: "success",
          });
          fetchBookings();
        } else {
          setToast({
            message: data.error || "Une erreur est survenue",
            type: "error",
          });
        }
      } else {
        const res = await fetch(`/api/admin/bookings`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookingId: selectedBookingId,
            action: modalAction === "confirm" ? "confirm" : "cancel",
          }),
        });
        const data = await res.json();
        if (data.success) {
          setToast({
            message:
              modalAction === "confirm"
                ? "Réservation confirmée avec succès"
                : "Réservation annulée avec succès",
            type: "success",
          });
          fetchBookings();
        } else {
          setToast({
            message: data.error || "Une erreur est survenue",
            type: "error",
          });
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
      setToast({ message: "Une erreur est survenue", type: "error" });
    } finally {
      setShowConfirmModal(false);
      setSelectedBookingId(null);
    }
  };

  const exportToCSV = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/bookings/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reservations_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setToast({ message: "Export CSV réussi", type: "success" });
    } catch (error) {
      console.error("Erreur export:", error);
      setToast({ message: "Erreur lors de l'export", type: "error" });
    }
  };

  const statusOptions = [
    { value: "ALL", label: "Tous les statuts" },
    { value: "CONFIRMED", label: "Confirmée" },
    { value: "PENDING", label: "En attente" },
    { value: "COMPLETED", label: "Terminée" },
    { value: "CANCELLED", label: "Annulée" },
    { value: "CHECKED_IN", label: "En cours" },
  ];

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeAction}
        title={
          modalAction === "confirm"
            ? "Confirmer la réservation"
            : modalAction === "cancel"
              ? "Annuler la réservation"
              : "Supprimer la réservation"
        }
        message={
          modalAction === "confirm"
            ? "Êtes-vous sûr de vouloir confirmer cette réservation ?"
            : modalAction === "cancel"
              ? "Êtes-vous sûr de vouloir annuler cette réservation ?"
              : "Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible."
        }
        confirmText={
          modalAction === "confirm"
            ? "Confirmer"
            : modalAction === "cancel"
              ? "Annuler"
              : "Supprimer"
        }
      />

      <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
        {/* ── HEADER ── */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Gestion des Réservations
            </h2>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">
              Supervisez l'activité de location en temps réel sur toute la
              plateforme
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all text-sm font-medium"
            >
              <IoDownloadOutline className="text-base" /> Exporter CSV
            </button>
          </div>
        </div>

        {/* ── STATS CARDS ── */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
            {[
              {
                title: "Total Réservations",
                value: stats.totalBookings.toLocaleString(),
                Icon: PiUsersThree,
                grad: "from-indigo-500 to-blue-600",
                cls: "text-indigo-600 dark:text-indigo-400",
              },
              {
                title: "Séjours Actifs",
                value: stats.activeStays.toString(),
                Icon: PiBuildings,
                grad: "from-emerald-400 to-teal-500",
                cls: "text-emerald-600 dark:text-emerald-400",
              },
              {
                title: "Revenus du Mois",
                value: formatPrice(stats.revenueThisMonth),
                Icon: PiMoney,
                grad: "from-amber-400 to-orange-500",
                cls: "text-amber-600 dark:text-amber-400",
              },
              {
                title: "Taux d'Annulation",
                value: `${stats.cancellationRate}%`,
                Icon: PiChartLineUp,
                grad: "from-violet-500 to-purple-600",
                cls:
                  stats.cancellationRate > 5
                    ? "text-red-600"
                    : "text-emerald-600",
              },
            ].map(({ title, value, Icon, grad, cls }) => (
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

        {/* ── FILTERS + TABLE CARD ── */}
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ID, propriété ou voyageur..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
                <IoFilterOutline className="text-sm" /> Filtres avancés
              </button>
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <IoCloseOutline className="text-sm" /> Réinitialiser
              </button>
            </div>

            {showFilters && (
              <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/30 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                    Montant minimum (TND)
                  </label>
                  <input
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
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
                <p className="text-sm text-slate-500">
                  Aucune réservation trouvée
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Propriété
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Hôte / Voyageur
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Paiement
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {bookings.map((booking) => {
                    const statusBadge = getStatusBadge(booking.status);
                    const paymentBadge = getPaymentBadge(booking.paymentStatus);
                    return (
                      <tr
                        key={booking.id}
                        className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors group"
                      >
                        <td className="px-4 py-4">
                          <span className="text-xs font-bold text-slate-400">
                            #
                            {booking.reference?.slice(-8) ||
                              booking.id.slice(-8)}
                          </span>
                        </td>
                        <td
                          className="px-4 py-4 cursor-pointer"
                          onClick={() =>
                            router.push(
                              `/${locale}/admin/properties/${booking.listing?.id}`,
                            )
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                              {booking.listing?.images?.[0]?.url ? (
                                <img
                                  src={getImageUrl(
                                    booking.listing.images[0].url,
                                  )}
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
                                {booking.listing?.title || "Propriété"}
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
                            router.push(
                              `/${locale}/admin/users/${booking.tenant?.id}`,
                            )
                          }
                        >
                          <div className="flex flex-col gap-0.5">
                            <p className="text-xs font-semibold text-indigo-600">
                              Hôte: {booking.owner?.firstName}{" "}
                              {booking.owner?.lastName}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Voyageur: {booking.tenant?.firstName}{" "}
                              {booking.tenant?.lastName}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs space-y-0.5">
                            <p>
                              In:{" "}
                              <span className="text-slate-600">
                                {formatDate(booking.checkIn)}
                              </span>
                            </p>
                            <p>
                              Out:{" "}
                              <span className="text-slate-600">
                                {formatDate(booking.checkOut)}
                              </span>
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            {formatPrice(booking.totalPrice)}
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
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${paymentBadge.color}`}
                            ></div>
                            <span className="text-xs font-medium">
                              {paymentBadge.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center items-center gap-1">
                            {/* Voir détails */}
                            <button
                              onClick={() =>
                                router.push(
                                  `/${locale}/admin/booking/${booking.id}`,
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                              title="Voir détails"
                            >
                              <IoEyeOutline className="text-base" />
                            </button>

                            {/* Contacter - redirige vers la conversation */}
                            <button 
  onClick={() => {
    if (booking.conversationId) {
      // ✅ Rediriger vers la page de conversation
      router.push(`/${locale}/admin/conversations/${booking.conversationId}`);
    } else {
      // Fallback: s'il n'y a pas de conversation, rediriger vers la réservation
      router.push(`/${locale}/admin/booking/${booking.id}?tab=messages`);
    }
  }} 
  className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all" 
  title="Contacter"
>
  <IoChatbubbleOutline className="text-base" />
</button>
                            {/* Confirmer - SEULEMENT si PENDING */}
                            {booking.status === "PENDING" && (
                              <button
                                onClick={() =>
                                  handleAction(booking.id, "confirm")
                                }
                                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                                title="Confirmer la réservation"
                              >
                                <IoCheckmarkCircleOutline className="text-base" />
                              </button>
                            )}

                            {/* Supprimer - SEULEMENT si COMPLETED ou CANCELLED */}
                            {(booking.status === "COMPLETED" ||
                              booking.status === "CANCELLED") && (
                              <button
                                onClick={() =>
                                  handleAction(booking.id, "delete")
                                }
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                title="Supprimer la réservation"
                              >
                                <IoTrashOutline className="text-base" />
                              </button>
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
                Affichage 1 à {bookings.length} sur {pagination.totalCount}{" "}
                entrées
              </p>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
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
                Systèmes Opérationnels
              </span>
            </div>
            <div className="h-4 w-px bg-slate-200"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Dernière mise à jour: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
            © 2024 NESTHUB Admin Framework
          </p>
        </div>
      </div>
    </>
  );
}
