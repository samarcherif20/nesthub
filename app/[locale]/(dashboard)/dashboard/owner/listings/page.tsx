"use client";

import { useState, useEffect, useCallback } from "react";
import * as React from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import { IdentityVerificationModal } from "@/components/ui/IdentityVerificationModal";
import {
  Home,
  Building2,
  Hotel,
  Layers,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  Archive,
  BarChart3,
  RefreshCw,
  X,
  Users,
  MapPin,
  Star,
  MoreVertical,
  EyeOff,
  Rocket,
  FileWarning,
  Calendar,
  Sparkles,
  TrendingDown,
  Zap,
  Award,
  CreditCard,
  ExternalLink,
  QrCode,
  Filter,
  Grid3X3,
  List,
  History,
  Clock,
  Crown,
  Flame,
  AlertTriangle,
  HelpCircle,
  Activity,
  Download,
  CalendarDays,
} from "lucide-react";
import { PiHouseLine } from "react-icons/pi";
import { IoWalletOutline } from "react-icons/io5";
import Pagination from "@/components/ui/Pagination";
import DeleteListingModal from "@/components/ui/modals/DeleteListingModal";
import QRCodeModal from "@/components/ui/modals/QRCodeModal";
import AlertBanner from "@/components/ui/Alert";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { PriceRangeSlider } from "@/components/ui/PriceRangeSlider";
import { useListings } from "./hooks/useListings";
import {
  TbHomeEdit,
  TbHomeOff,
  TbHomePlus,
  TbHomeSearch,
  TbHomeShare,
} from "react-icons/tb";
import { FaEye } from "react-icons/fa";
import { useRouter } from "next/navigation";

const pip = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;
const PAGE_SIZE = 6;

// Styles
const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

// STATUTS CONFIGURATION - AMELIOREE ET VISIBLE
const STATUS_CONFIG = {
  ACTIVE: {
    color: "text-white",
    bg: "bg-gradient-to-r from-emerald-500 to-emerald-600",
    border: "border-emerald-500",
    icon: CheckCircle,
    labelKey: "active",
    descKey: "activeDesc",
    glow: "shadow-lg shadow-emerald-500/30",
    cardBorder: "border-emerald-200 dark:border-emerald-800",
  },
  INACTIVE: {
    color: "text-white",
    bg: "bg-gradient-to-r from-amber-500 to-amber-600",
    border: "border-amber-500",
    icon: EyeOff,
    labelKey: "inactive",
    descKey: "inactiveDesc",
    glow: "shadow-lg shadow-amber-500/30",
    cardBorder: "border-amber-200 dark:border-amber-800",
  },
  DRAFT: {
    color: "text-white",
    bg: "bg-gradient-to-r from-slate-500 to-slate-600",
    border: "border-slate-500",
    icon: AlertCircle,
    labelKey: "draft",
    descKey: "draftDesc",
    glow: "shadow-lg shadow-slate-500/30",
    cardBorder: "border-slate-200 dark:border-slate-700",
  },
  ARCHIVED: {
    color: "text-white",
    bg: "bg-gradient-to-r from-purple-500 to-purple-600",
    border: "border-purple-500",
    icon: Archive,
    labelKey: "archived",
    descKey: "archivedDesc",
    glow: "shadow-lg shadow-purple-500/30",
    cardBorder: "border-purple-200 dark:border-purple-800",
  },
  PENDING_REVIEW: {
    color: "text-white",
    bg: "bg-gradient-to-r from-orange-500 to-amber-500",
    border: "border-orange-500",
    icon: Clock,
    labelKey: "pendingReview",
    descKey: "pendingReviewDesc",
    glow: "shadow-lg shadow-orange-500/30",
    cardBorder: "border-orange-200 dark:border-orange-800",
  },
  REJECTED: {
    color: "text-white",
    bg: "bg-gradient-to-r from-red-500 to-rose-600",
    border: "border-red-500",
    icon: AlertTriangle,
    labelKey: "rejected",
    descKey: "rejectedDesc",
    glow: "shadow-lg shadow-red-500/30",
    cardBorder: "border-red-200 dark:border-red-800",
  },
} as const;

// TYPE ICONS
const TYPE_ICONS: Record<string, React.ElementType> = {
  APARTMENT: Building2,
  VILLA: Home,
  STUDIO: Hotel,
  DUPLEX: Layers,
  HOUSE: Home,
  ROOM: Home,
};

// Verifier si l'annonce est nouvelle (moins de 7 jours)
const isNewListing = (createdAt: string) => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diffDays < 7;
};

// Tooltip component
function Tooltip({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) {
  return (
    <span className="group relative inline-block">
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {text}
      </span>
    </span>
  );
}

// BADGE DE STATUT AMELIORE
function StatusBadge({ status, t }: { status: string; t: any }) {
  const cfg =
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
  const Icon = cfg.icon;

  return (
    <div className="relative group">
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${cfg.color} ${cfg.bg} ${cfg.border} border ${cfg.glow} cursor-help shadow-md`}
      >
        <Icon size={12} /> {t(`status.${cfg.labelKey}`)}
      </span>
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-lg">
        {t(`status.${cfg.descKey}`)}
      </div>
    </div>
  );
}

// BADGE DE PERFORMANCE
function PerformanceBadge({ listing, t }: { listing: any; t: any }) {
  const conversionRate =
    listing.viewCount > 0
      ? (listing.bookingCount / listing.viewCount) * 100
      : 0;

  if (listing.status !== "ACTIVE") return null;

  if (conversionRate > 5) {
    return (
      <div className="absolute top-3 left-3 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10">
        <Flame size={10} className="text-white" />
        {t("performance.topPerformance")}
      </div>
    );
  }

  if (listing.viewCount > 100 && listing.bookingCount === 0) {
    return (
      <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10">
        <AlertTriangle size={10} />
        {t("performance.toOptimize")}
      </div>
    );
  }

  return null;
}

// BADGE NOUVEAU
function NewBadge({ t }: { t: any }) {
  return (
    <div className="absolute top-3 left-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10">
      {t("badges.new")}
    </div>
  );
}

// BADGE EN ATTENTE DE VALIDATION
function PendingReviewBadge({ t }: { t: any }) {
  return (
    <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10 flex items-center gap-1">
      <Clock size={10} /> {t("status.pendingReview")}
    </div>
  );
}

// BADGE REJETE
function RejectedBadge({ t }: { t: any }) {
  return (
    <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10 flex items-center gap-1">
      <AlertTriangle size={10} /> {t("status.rejected")}
    </div>
  );
}

// FONCTION getAIInsight
const getAIInsight = (listing: any, t: any) => {
  const conversionRate =
    listing.viewCount > 0
      ? ((listing.bookingCount / listing.viewCount) * 100).toFixed(1)
      : "0";

  switch (listing.status) {
    case "DRAFT":
      return {
        message: t("aiInsights.draft"),
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        border: "border-amber-200 dark:border-amber-800",
        icon: AlertCircle,
      };
    case "ARCHIVED":
      return {
        message: t("aiInsights.archived"),
        color: "text-purple-600",
        bg: "bg-purple-50 dark:bg-purple-900/20",
        border: "border-purple-200 dark:border-purple-800",
        icon: Archive,
      };
    case "INACTIVE":
      return {
        message: t("aiInsights.inactive"),
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        border: "border-amber-200 dark:border-amber-800",
        icon: EyeOff,
      };
    case "PENDING_REVIEW":
      return {
        message: t("aiInsights.pendingReview"),
        color: "text-orange-600",
        bg: "bg-orange-50 dark:bg-orange-900/20",
        border: "border-orange-200 dark:border-orange-800",
        icon: Clock,
      };
    case "REJECTED":
      return {
        message: t("aiInsights.rejected"),
        color: "text-red-600",
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
        icon: AlertTriangle,
      };
    case "ACTIVE":
      if (listing.viewCount < 30)
        return {
          message: t("aiInsights.lowViews"),
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800",
          icon: TrendingUp,
        };
      if (listing.bookingCount === 0)
        return {
          message: t("aiInsights.noBookings"),
          color: "text-indigo-600",
          bg: "bg-indigo-50 dark:bg-indigo-900/20",
          border: "border-indigo-200 dark:border-indigo-800",
          icon: Zap,
        };
      if (parseFloat(conversionRate) < 2)
        return {
          message: t("aiInsights.lowConversion"),
          color: "text-orange-600",
          bg: "bg-orange-50 dark:bg-orange-900/20",
          border: "border-orange-200 dark:border-orange-800",
          icon: TrendingDown,
        };
      return {
        message: t("aiInsights.excellent"),
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        border: "border-emerald-200 dark:border-emerald-800",
        icon: Award,
      };
    default:
      return {
        message: t("aiInsights.optimize"),
        color: "text-slate-600",
        bg: "bg-slate-50 dark:bg-slate-800",
        border: "border-slate-200 dark:border-slate-700",
        icon: Sparkles,
      };
  }
};

// STATISTIQUES RAPIDES
function QuickStatsCard({ listing, t }: { listing: any; t: any }) {
  const conversionRate =
    listing.viewCount > 0
      ? ((listing.bookingCount / listing.viewCount) * 100).toFixed(1)
      : "0";

  const revenue = listing.pricePerNight
    ? listing.pricePerNight * (listing.bookingCount || 0)
    : listing.pricePerMonth
      ? listing.pricePerMonth * (listing.bookingCount || 0)
      : 0;

  return (
    <div className="grid grid-cols-4 gap-2 pt-4 mt-2 border-t border-slate-100 dark:border-slate-700">
      <div className="text-center">
        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
          {t("table.views")}
        </p>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {listing.viewCount?.toLocaleString() || 0}
        </p>
      </div>
      <div className="text-center">
        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
          {t("table.bookings")}
        </p>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {listing.bookingCount || 0}
        </p>
      </div>
      <div className="text-center">
        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
          {t("table.conversion")}
        </p>
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {conversionRate}%
        </p>
      </div>
      <div className="text-center">
        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
          {t("table.revenue")}
        </p>
        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
          {revenue.toLocaleString()} {t("currency.tnd")}
        </p>
      </div>
    </div>
  );
}

// RECOMMANDATION
function RecommendationAlert({ listing, t }: { listing: any; t: any }) {
  if (listing.status !== "ACTIVE") return null;

  const conversionRate =
    listing.viewCount > 0
      ? (listing.bookingCount / listing.viewCount) * 100
      : 0;

  if (conversionRate < 2 && listing.viewCount > 50) {
    return (
      <div className="mt-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <p className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
          <AlertTriangle size={10} />
          {t("recommendations.lowConversion", {
            rate: conversionRate.toFixed(1),
          })}
        </p>
      </div>
    );
  }

  if (listing.bookingCount > 10) {
    return (
      <div className="mt-3 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
          <TrendingUp size={10} />
          {t("recommendations.excellentPerformance", {
            count: listing.bookingCount,
          })}
        </p>
      </div>
    );
  }

  return null;
}

// MENU DROPDOWN
function MenuDropdown({
  isOpen,
  onClose,
  onAction,
  listingId,
  currentStatus,
  locale,
  buttonId,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, id: string) => void;
  listingId: string;
  currentStatus: string;
  locale: string;
  buttonId: string;
  t: any;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen) {
      const buttonElement = document.getElementById(buttonId);
      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 4,
          left: rect.right - 180,
        });
      }
    }
  }, [isOpen, buttonId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const buttonElement = document.getElementById(buttonId);
      if (
        !target.closest(`.menu-dropdown-${listingId}`) &&
        buttonElement &&
        !buttonElement.contains(target)
      ) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, listingId, buttonId]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`fixed z-[100] bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/40 shadow-xl overflow-hidden min-w-[180px] menu-dropdown-${listingId} ${block3d}`}
      style={{ top: position.top, left: position.left }}
    >
      <div className="py-1">
        {currentStatus === "ACTIVE" && (
          <button
            onClick={() => onAction("INACTIVE", listingId)}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-700 dark:text-slate-300 hover:text-amber-600 flex items-center gap-2.5 transition-colors"
          >
            <EyeOff size={14} /> {t("actions.hide")}
          </button>
        )}
        {(currentStatus === "INACTIVE" || currentStatus === "DRAFT") && (
          <button
            onClick={() => onAction("ACTIVE", listingId)}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-700 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-2.5 transition-colors"
          >
            <Rocket size={14} /> {t("actions.publish")}
          </button>
        )}
        {currentStatus !== "ARCHIVED" && currentStatus !== "DRAFT" && (
          <button
            onClick={() => onAction("ARCHIVED", listingId)}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 text-slate-700 dark:text-slate-300 hover:text-purple-600 flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-800 transition-colors"
          >
            <Archive size={14} /> {t("actions.archive")}
          </button>
        )}
        {currentStatus === "ARCHIVED" && (
          <button
            onClick={() => onAction("INACTIVE", listingId)}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-2.5 transition-colors"
          >
            <FileWarning size={14} /> {t("actions.restore")}
          </button>
        )}
        {currentStatus === "ACTIVE" && (
          <Link
            href={`/${locale}/dashboard/owner/listings/${listingId}`}
            target="_blank"
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300 hover:text-blue-600 flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-800 transition-colors"
          >
            <TbHomeShare size={14} /> {t("actions.viewPublic")}
          </Link>
        )}
        <Link
          href={`/${locale}/dashboard/owner/listings/${listingId}/analytics`}
          className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-800 transition-colors"
        >
          <BarChart3 size={14} /> {t("actions.analytics")}
        </Link>
        <button
          onClick={() => onAction("DELETE", listingId)}
          className="w-full text-left px-4 py-2.5 text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-700 dark:text-slate-300 hover:text-rose-600 flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-800 transition-colors"
        >
          <Trash2 size={14} /> {t("actions.delete")}
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default function OwnerListingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  const t = useTranslations("OwnerListings");
  const { getToken } = useAuth();
  const router = useRouter();

  const {
    listings,
    loading,
    statsLoading,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount,
    tabCounts,
    globalStats,
    filters,
    setFilters,
    priceRange,
    actionLoading,
    alert,
    setAlert,
    updateStatus,
    handleDelete,
    resetFilters,
    refreshData,
    showVerificationModal,
    checkVerificationBeforeCreate,
    handleVerificationComplete,
    handleCloseVerificationModal,
  } = useListings(PAGE_SIZE);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [qrCodeListing, setQrCodeListing] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [dateFilter, setDateFilter] = useState<
    "all" | "week" | "month" | "year"
  >("all");
  const [isExporting, setIsExporting] = useState(false);

  const governorates = [
    "Tunis",
    "Ariana",
    "Ben Arous",
    "Manouba",
    "Nabeul",
    "Zaghouan",
    "Bizerte",
    "Béja",
    "Jendouba",
    "Le Kef",
    "Siliana",
    "Kairouan",
    "Kasserine",
    "Sidi Bouzid",
    "Sousse",
    "Monastir",
    "Mahdia",
    "Sfax",
    "Gafsa",
    "Tozeur",
    "Kébili",
    "Gabès",
    "Médenine",
    "Tataouine",
  ];

  const mainPhoto = (l: any) => {
    const p = l.photos?.find((p: any) => p.isMain) ?? l.photos?.[0];
    return p?.url ? pip(p.url) : null;
  };

  const handleMenuAction = async (action: string, id: string) => {
    setOpenMenuId(null);
    if (action === "DELETE") {
      const listing = listings.find((l) => l.id === id);
      setDeleteId(id);
      setDeleteTitle(listing?.title || "");
    } else {
      try {
        await updateStatus(id, action);
        setAlert({
          type: "success",
          message: t(
            `alerts.${action === "ACTIVE" ? "statusActivated" : action === "INACTIVE" ? "statusDeactivated" : "statusArchived"}`,
          ),
        });
      } catch (error) {
        setAlert({
          type: "error",
          message: t("alerts.statusChangeFailed"),
        });
      }
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshData();
      setAlert({
        type: "success",
        message: t("alerts.dataRefreshed"),
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: t("alerts.refreshFailed"),
      });
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const token = await getToken({ template: "my-app-template" });

      if (!token) {
        throw new Error("Token non disponible");
      }

      const response = await fetch("/api/listings/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filters: {
            status: activeTab === "all" ? "ALL" : activeTab.toUpperCase(),
            search: searchQuery || undefined,
            governorate: filters.governorate || undefined,
            minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
            maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
            minRooms: filters.minRooms ? parseInt(filters.minRooms) : undefined,
          },
          dateFilter: dateFilter !== "all" ? dateFilter : undefined,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `annonces_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setAlert({
          type: "success",
          message: t("alerts.exportSuccess"),
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
      setAlert({
        type: "error",
        message: t("alerts.exportFailed"),
      });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredListings = listings.filter((listing) => {
    if (dateFilter === "all") return true;
    const created = new Date(listing.createdAt);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (dateFilter === "week") return diffDays <= 7;
    if (dateFilter === "month") return diffDays <= 30;
    if (dateFilter === "year") return diffDays <= 365;
    return true;
  });

  const tabs = [
    {
      id: "all" as const,
      label: t("tabs.all"),
      count: tabCounts.all,
      icon: Home,
    },
    {
      id: "active" as const,
      label: t("tabs.active"),
      count: tabCounts.active,
      icon: Crown,
    },
    {
      id: "inactive" as const,
      label: t("tabs.inactive"),
      count: tabCounts.inactive,
      icon: EyeOff,
    },
    {
      id: "draft" as const,
      label: t("tabs.draft"),
      count: tabCounts.draft,
      icon: FileWarning,
    },
    {
      id: "pending" as const,
      label: t("tabs.pending"),
      count: tabCounts.pending || 0,
      icon: Clock,
    },
    {
      id: "archived" as const,
      label: t("tabs.archived"),
      count: tabCounts.archived,
      icon: Archive,
    },
  ];

  const statsCards = [
    {
      title: t("stats.totalRevenue"),
      value: `${globalStats.totalRevenue.toLocaleString("fr-FR")} ${t("currency.tnd")}`,
      Icon: IoWalletOutline,
      grad: "from-indigo-500 to-blue-600",
      bg: "border-indigo-100 dark:border-indigo-900/40",
      cls: "text-indigo-600 dark:text-indigo-400",
      growth: `+${globalStats.revenueGrowth}%`,
    },
    {
      title: t("stats.activeListings"),
      value: globalStats.activeCount,
      Icon: PiHouseLine,
      grad: "from-emerald-400 to-teal-500",
      bg: "border-emerald-100 dark:border-emerald-900/40",
      cls: "text-emerald-600 dark:text-emerald-400",
      growth: null,
    },
    {
      title: t("stats.totalViews"),
      value: globalStats.totalViews.toLocaleString("fr-FR"),
      Icon: Eye,
      grad: "from-amber-400 to-orange-500",
      bg: "border-amber-100 dark:border-amber-900/40",
      cls: "text-amber-600 dark:text-amber-400",
      growth: `+${globalStats.viewsGrowth}%`,
    },
    {
      title: t("stats.occupancyRate"),
      value: `${globalStats.occupancyRate}%`,
      Icon: Activity,
      grad: "from-violet-500 to-purple-600",
      bg: "border-violet-100 dark:border-violet-900/40",
      cls: "text-violet-600 dark:text-violet-400",
      growth: `+${globalStats.occupancyGrowth}%`,
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto p-6 gap-6 ">
      {/* Alerts */}
      {alert && (
        <div className="fixed top-5 right-5 z-[60] w-full max-w-sm animate-in slide-in-from-top-2 fade-in duration-300">
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl md:text-4xl font-black tracking-tight mb-1.5 text-slate-900 dark:text-white">
            {t("page.title")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {t("page.description")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export CSV Button */}
          <Tooltip text={t("actions.exportCSV")}>
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-500 hover:text-emerald-600 transition-colors"
            >
              {isExporting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent" />
              ) : (
                <Download size={15} />
              )}
            </button>
          </Tooltip>

          <Tooltip text={t("actions.refresh")}>
            <button
              onClick={handleRefresh}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-500 hover:text-indigo-600 transition-colors"
            >
              <RefreshCw size={15} />
            </button>
          </Tooltip>

          <div className="flex p-1 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
            <Tooltip text={t("actions.viewGrid")}>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-full transition-all ${viewMode === "grid" ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-indigo-400"}`}
              >
                <Grid3X3 size={16} />
              </button>
            </Tooltip>
            <Tooltip text={t("actions.viewList")}>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-full transition-all ${viewMode === "list" ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-indigo-400"}`}
              >
                <List size={16} />
              </button>
            </Tooltip>
          </div>

          <button
            onClick={() => {
              const canProceed = checkVerificationBeforeCreate();
              if (canProceed) {
                router.push(`/${locale}/dashboard/owner/listings/create`);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-full font-semibold text-sm shadow-sm transition-all whitespace-nowrap"
          >
            <TbHomePlus size={16} /> {t("actions.addListing")}
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-2">
        <CalendarDays size={14} className="text-slate-400" />
        <span className="text-xs font-medium text-slate-500">
          {t("filters.dateFilter")}
        </span>
        <div className="flex gap-1">
          {[
            { value: "all", label: t("filters.allDates") },
            { value: "week", label: t("filters.lastWeek") },
            { value: "month", label: t("filters.lastMonth") },
            { value: "year", label: t("filters.lastYear") },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setDateFilter(option.value as any)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                dateFilter === option.value
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-400 hover:text-indigo-400"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 animate-pulse"
            >
              <div className="h-4 w-20 bg-slate-100 dark:bg-slate-700 rounded mb-3" />
              <div className="h-7 w-28 bg-slate-100 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map(({ title, value, Icon, grad, bg, cls, growth }) => (
            <div
              key={title}
              className={`bg-white dark:bg-slate-900 rounded-2xl border ${bg} p-4 relative ${card3d} hover:shadow-md transition-all`}
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
                  <p className={`text-2xl font-black leading-none ${cls}`}>
                    {value}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium leading-tight">
                    {title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Layout avec Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filtres */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div
            className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden ${block3d}`}
          >
            <div className="px-4 py-3 border-b border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
              <div className="flex items-center gap-2">
                <Filter
                  size={14}
                  className="text-indigo-600 dark:text-indigo-400"
                />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  {t("filters.titre")}
                </h3>
              </div>
            </div>
            <div className="p-4 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                  {t("filters.governorate")}
                </label>
                <select
                  value={filters.governorate}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, governorate: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">{t("filters.allGovernorates")}</option>
                  {governorates.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                  {t("filters.priceRange")}
                </label>
                <PriceRangeSlider
                  minPrice={filters.minPrice}
                  maxPrice={filters.maxPrice}
                  onMinChange={(val) =>
                    setFilters((p) => ({ ...p, minPrice: val }))
                  }
                  onMaxChange={(val) =>
                    setFilters((p) => ({ ...p, maxPrice: val }))
                  }
                  minLimit={priceRange.min}
                  maxLimit={priceRange.max}
                  isLoading={statsLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                  {t("filters.minRooms")}
                </label>
                <input
                  type="number"
                  placeholder="1"
                  value={filters.minRooms}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, minRooms: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <button
                onClick={resetFilters}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border border-slate-200 dark:border-indigo-800"
              >
                <X size={14} /> {t("filters.reset")}
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-sky-300 to-violet-500 dark:from-sky-900/20 dark:to-violet-900/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Sparkles
                  size={12}
                  className="text-indigo-600 dark:text-indigo-400"
                />
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {t("filters.aiTitre")}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t("filters.aiTip")}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isActive ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"}`}
                  >
                    <Icon size={12} /> {tab.label}
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="relative w-full md:w-96">
              <TbHomeSearch
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 dark:text-indigo-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("filters.searchPlaceholder")}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-full border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-indigo-300 dark:placeholder:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Listings Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <LoadingSpinner />
              <p className="text-sm text-slate-400 dark:text-slate-500">
                {t("performance.spinner")}
              </p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 dark:from-sky-950/50 dark:to-purple-950/50 flex items-center justify-center shadow-lg">
                  <TbHomeOff
                    size={48}
                    className="text-sky-500 dark:text-sky-400"
                  />
                </div>
              </div>
              <h3 className="text-2xl font-headline font-bold bg-gradient-to-r from-sky-600 to-purple-600 dark:from-sky-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
                {t("emptyState.title")}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
                {t("emptyState.description", { platform: "NESTHUB" })}
              </p>
              <button
                onClick={() => {
                  const canProceed = checkVerificationBeforeCreate();
                  if (canProceed) {
                    router.push(`/${locale}/dashboard/owner/listings/create`);
                  }
                }}
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
              </button>
              <Link
                href={`/${locale}/help`}
                className="mt-6 text-xs text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex items-center gap-1"
              >
                <HelpCircle size={12} />
                {t("emptyState.helpLink")}
              </Link>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredListings.map((listing) => {
                const img = mainPhoto(listing);
                const price = listing.pricePerNight ?? listing.pricePerMonth;
                const unit = listing.pricePerNight
                  ? t("units.night")
                  : t("units.month");
                const TypeIcon = TYPE_ICONS[listing.type] ?? Building2;
                const isLoading = actionLoading === listing.id;
                const aiInsight = getAIInsight(listing, t);
                const InsightIcon = aiInsight.icon;
                const buttonId = `menu-btn-${listing.id}`;
                const isNew = isNewListing(listing.createdAt);
                const statusCfg =
                  STATUS_CONFIG[listing.status as keyof typeof STATUS_CONFIG] ||
                  STATUS_CONFIG.DRAFT;

                return (
                  <div
                    key={listing.id}
                    className={`group bg-white dark:bg-slate-900 rounded-2xl border-2 overflow-hidden ${card3d} hover:shadow-lg transition-all duration-300 ${statusCfg.cardBorder}`}
                  >
                    {/* Image Section */}
                    <div className="relative h-56 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {img ? (
                        <img
                          src={img}
                          alt={listing.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home
                            size={40}
                            className="text-slate-300 dark:text-slate-600"
                          />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                      <PerformanceBadge listing={listing} t={t} />

                      {isNew && <NewBadge t={t} />}

                      {listing.status === "PENDING_REVIEW" && (
                        <PendingReviewBadge t={t} />
                      )}

                      {listing.status === "REJECTED" && <RejectedBadge t={t} />}

                      <div className="absolute top-3 right-3">
                        <StatusBadge status={listing.status} t={t} />
                      </div>

                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">
                          {listing.title}
                        </h3>
                        <div className="flex items-center gap-1 text-white/90 text-xs font-medium">
                          <MapPin size={14} />
                          <span>{listing.governorate}</span>
                        </div>
                      </div>

                      {isLoading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Details Section */}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {price?.toLocaleString()} {t("currency.tnd")}
                          </span>
                          <span className="text-slate-500 text-xs ml-1">
                            {unit}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <Link
                            href={`/${locale}/dashboard/owner/listings/${listing.id}/edit`}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                          >
                            <TbHomeEdit size={16} />
                          </Link>
                          <Link
                            href={`/${locale}/dashboard/owner/listings/${listing.id}`}
                            target="_blank"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 transition-all"
                          >
                            <FaEye size={16} />
                          </Link>
                          <Link
                            href={`/${locale}/dashboard/owner/listings/${listing.id}/history`}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 transition-all"
                          >
                            <History size={16} />
                          </Link>
                          <button
                            onClick={() =>
                              setQrCodeListing({
                                id: listing.id,
                                title: listing.title,
                              })
                            }
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
                          >
                            <QrCode size={16} />
                          </button>
                          <div className="relative">
                            <button
                              id={buttonId}
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === listing.id ? null : listing.id,
                                )
                              }
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
                            >
                              <MoreVertical size={16} />
                            </button>
                            <MenuDropdown
                              isOpen={openMenuId === listing.id}
                              onClose={() => setOpenMenuId(null)}
                              onAction={handleMenuAction}
                              listingId={listing.id}
                              currentStatus={listing.status}
                              locale={locale}
                              buttonId={buttonId}
                              t={t}
                            />
                          </div>
                        </div>
                      </div>

                      <QuickStatsCard listing={listing} t={t} />
                      <RecommendationAlert listing={listing} t={t} />

                      <div
                        className={`mt-3 flex items-start gap-2 px-3 py-2 rounded-lg border text-[11px] ${aiInsight.color} ${aiInsight.bg} ${aiInsight.border}`}
                      >
                        <InsightIcon size={14} className="shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          {aiInsight.message}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add New Card */}
              <div className="group border-2 border-dashed border-gray-200 dark:border-indigo-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-white/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-500 dark:hover:border-purple-500 transition-all duration-300">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 transition-all duration-300">
                  <TbHomePlus
                    size={32}
                    className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-purple-400 transition-colors duration-300"
                  />
                </div>
                <h3 className="text-slate-400 dark:text-slate-300 font-headline font-bold mb-2 group-hover:text-indigo-700 dark:group-hover:text-purple-400 transition-colors duration-300">
                  {t("addNewCard.title")}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 mb-6 leading-relaxed">
                  {t("addNewCard.description")}
                </p>
                <Link
                  href={`/${locale}/dashboard/owner/listings/create`}
                  className="text-sm font-bold text-slate-400 dark:text-slate-400 flex items-center gap-1 hover:text-indigo-600 dark:hover:text-purple-400 transition-colors duration-300 group-hover:translate-x-1 transition-transform"
                >
                  {t("addNewCard.button")}
                  <TrendingUp
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
              </div>
            </div>
          ) : (
            // Vue liste
            <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden shadow-sm">
              {filteredListings.map((listing) => {
                const img = mainPhoto(listing);
                const price = listing.pricePerNight ?? listing.pricePerMonth;
                const unit = listing.pricePerNight
                  ? t("units.night")
                  : t("units.month");
                const TypeIcon = TYPE_ICONS[listing.type] ?? Building2;
                const isLoading = actionLoading === listing.id;
                const aiInsight = getAIInsight(listing, t);
                const InsightIcon = aiInsight.icon;
                const buttonId = `menu-btn-${listing.id}`;
                const isNew = isNewListing(listing.createdAt);
                const statusCfg =
                  STATUS_CONFIG[listing.status as keyof typeof STATUS_CONFIG] ||
                  STATUS_CONFIG.DRAFT;

                return (
                  <div
                    key={listing.id}
                    className={`group hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors p-4 flex flex-col xl:flex-row xl:items-center gap-4 border-l-4 ${statusCfg.cardBorder.replace("border-2", "border-l-4")}`}
                  >
                    <div className="relative shrink-0 w-full xl:w-40 h-28 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      {img ? (
                        <img
                          src={img}
                          alt={listing.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home
                            size={28}
                            className="text-slate-300 dark:text-slate-600"
                          />
                        </div>
                      )}
                      {isNew && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full">
                          {t("badges.new")}
                        </div>
                      )}
                      {listing.status === "PENDING_REVIEW" && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock size={8} /> {t("status.pendingReview")}
                        </div>
                      )}
                      {isLoading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <TypeIcon
                            size={14}
                            className="text-slate-400 dark:text-slate-500"
                          />
                          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                            {listing.title}
                          </h3>
                        </div>
                        <StatusBadge status={listing.status} t={t} />
                      </div>
                      <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-3">
                        <MapPin size={11} /> {listing.governorate}
                        {listing.delegation ? `, ${listing.delegation}` : ""}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
                            {t("table.views")}
                          </span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {listing.viewCount?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
                            {t("table.bookings")}
                          </span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {listing.bookingCount || 0}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
                            {t("table.favorites")}
                          </span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {listing.favoriteCount || 0}
                          </span>
                        </div>
                        {price && (
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
                              {t("table.price")}
                            </span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                              {price.toLocaleString()} {t("currency.tnd")}{" "}
                              <span className="text-[10px] font-normal">
                                {unit}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                      <div
                        className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-[11px] ${aiInsight.color} ${aiInsight.bg} ${aiInsight.border}`}
                      >
                        <InsightIcon size={14} className="shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          {aiInsight.message}
                        </span>
                      </div>
                    </div>
                    <div className="flex xl:flex-col gap-1.5 items-center xl:items-stretch shrink-0">
                      <Link
                        href={`/${locale}/listings/${listing.id}`}
                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <FaEye size={16} />
                      </Link>
                      <Link
                        href={`/${locale}/dashboard/owner/listings/${listing.id}/edit`}
                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <TbHomeEdit size={16} />
                      </Link>
                      <Link
                        href={`/${locale}/dashboard/owner/listings/${listing.id}/history`}
                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-sky-100 dark:hover:bg-sky-900/20"
                      >
                        <History size={16} />
                      </Link>
                      <button
                        onClick={() =>
                          setQrCodeListing({
                            id: listing.id,
                            title: listing.title,
                          })
                        }
                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                      >
                        <QrCode size={16} />
                      </button>
                      <div className="relative">
                        <button
                          id={buttonId}
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === listing.id ? null : listing.id,
                            )
                          }
                          className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-100 dark:hover:bg-rose-900/20"
                        >
                          <MoreVertical size={16} />
                        </button>
                        <MenuDropdown
                          isOpen={openMenuId === listing.id}
                          onClose={() => setOpenMenuId(null)}
                          onAction={handleMenuAction}
                          listingId={listing.id}
                          currentStatus={listing.status}
                          locale={locale}
                          buttonId={buttonId}
                          t={t}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modals */}
      <DeleteListingModal
        isOpen={!!deleteId}
        onClose={() => {
          setDeleteId(null);
          setDeleteTitle("");
        }}
        onConfirm={(withCancelBookings) => {
          if (deleteId) {
            handleDelete(deleteId, withCancelBookings || false);
            setDeleteId(null);
            setDeleteTitle("");
            setAlert({
              type: "success",
              message: t("alerts.listingDeleted"),
            });
          }
        }}
        isLoading={actionLoading !== null}
        listingTitle={deleteTitle}
        hasBookings={false}
        bookingsCount={0}
      />

      {qrCodeListing && (
        <QRCodeModal
          isOpen={!!qrCodeListing}
          onClose={() => setQrCodeListing(null)}
          listingId={qrCodeListing.id}
          listingTitle={qrCodeListing.title}
        />
      )}
      {/* Modal de vérification d'identité */}
      <IdentityVerificationModal
        isOpen={showVerificationModal}
        onClose={handleCloseVerificationModal}
        onVerified={() => {
          handleVerificationComplete().then((canProceed) => {
            if (canProceed) {
              router.push(`/${locale}/dashboard/owner/listings/create`);
            }
          });
        }}
        requiredAction="create_listing"
      />
    </div>
  );
}
