// app/[locale]/dashboard/owner/listings/[id]/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  ChevronRight,
  MapPin,
  Eye,
  CalendarDays,
  TrendingUp,
  Bed,
  Bath,
  Users,
  Square,
  CheckCircle2,
  User,
  UserPlus,
  Trash2,
  EyeOff,
  X,
  ChevronLeft,
  ArrowLeft,
  Home,
  Calendar,
  Activity,
  CalendarCheck,
  RotateCcw,
  Plus,
  Minus,
  Navigation,
  DollarSign,
  CreditCard,
  Clock,
  Wifi,
  Wind,
  Flame,
  Utensils,
  Car,
  Waves,
  Dumbbell,
  Tv,
  Trees,
  WashingMachine,
  Fan,
  Shield,
  Sparkles,
  Coffee,
  Smartphone,
  Music,
  BookOpen,
  Lock,
  ArrowUp,
} from "lucide-react";

import MapPickerWrapper from "@/components/ui/maps/MapPickerWrapper";
import DeleteListingModal from "@/components/ui/modals/DeleteListingModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { TbHomeEdit, TbHomeOff, TbHomeShare, TbMapShare } from "react-icons/tb";
import { PiCalendarSlashDuotone } from "react-icons/pi";
import { LiaMapMarkedAltSolid } from "react-icons/lia";
import { useListingDetail } from "./hooks/useListingDetail";

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

// Skeleton pour les KPIs
function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1">
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton pour le contenu principal
function ContentSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Gallery skeleton */}
        <div className="grid grid-cols-3 gap-3 h-90">
          <div className="col-span-2 row-span-2 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
        {/* Description skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-11/12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-10/12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="space-y-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded mb-4 animate-pulse" />
          <div className="space-y-3">
            <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Map des icônes pour les équipements
const EQUIPMENT_ICONS: Record<string, any> = {
  wifi: Wifi,
  ac: Wind,
  heating: Flame,
  kitchen: Utensils,
  parking: Car,
  pool: Waves,
  gym: Dumbbell,
  washer: WashingMachine,
  tv: Tv,
  balcony: Trees,
  dishwasher: Utensils,
  dryer: Fan,
  coffee: Coffee,
  smartlock: Lock,
  speaker: Music,
  workplace: BookOpen,
  elevator: ArrowUp,
  airConditioning: Wind,
};

// Shadow styles
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_20px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.3),0_8px_20px_-4px_rgba(0,0,0,0.4)]";

// Quick Stats Card Component
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
    <div className="grid grid-cols-4 gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
      <div className="text-center">
        <div className="flex justify-center mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">
          {t("quickStats.views")}
        </p>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {listing.viewCount?.toLocaleString() || 0}
        </p>
      </div>
      <div className="text-center">
        <div className="flex justify-center mb-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">
          {t("quickStats.bookings")}
        </p>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {listing.bookingCount || 0}
        </p>
      </div>
      <div className="text-center">
        <div className="flex justify-center mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">
          {t("quickStats.conversion")}
        </p>
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {conversionRate}%
        </p>
      </div>
      <div className="text-center">
        <div className="flex justify-center mb-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">
          {t("quickStats.revenue")}
        </p>
        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
          {revenue.toLocaleString()} {t("currency.tnd")}
        </p>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status, t }: { status: string; t: any }) {
  const config = {
    ACTIVE: {
      bg: "bg-emerald-100 dark:bg-emerald-500/20",
      text: "text-emerald-700 dark:text-emerald-400",
      icon: CheckCircle2,
    },
    INACTIVE: {
      bg: "bg-amber-100 dark:bg-amber-500/20",
      text: "text-amber-700 dark:text-amber-400",
      icon: EyeOff,
    },
    DRAFT: {
      bg: "bg-slate-100 dark:bg-slate-700",
      text: "text-slate-600 dark:text-slate-400",
      icon: EyeOff,
    },
  };
  const cfg = config[status as keyof typeof config] || config.DRAFT;
  const Icon = cfg.icon;
  return (
    <span
      className={`px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.text} text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit mt-3.5`}
    >
      <Icon className="w-3.5 h-3.5" />
      {t(`status.${status.toLowerCase()}`)}
    </span>
  );
}

// Booking Status Badge Component
function BookingStatusBadge({ status, t }: { status: string; t: any }) {
  const config = {
    CONFIRMED: {
      bg: "bg-blue-50 dark:bg-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
      icon: CheckCircle2,
    },
    PENDING: {
      bg: "bg-amber-50 dark:bg-amber-900/30",
      text: "text-amber-600 dark:text-amber-400",
      icon: Clock,
    },
    PAID: {
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      text: "text-emerald-600 dark:text-emerald-400",
      icon: CreditCard,
    },
  };
  const cfg = config[status as keyof typeof config] || config.PENDING;
  const Icon = cfg.icon;
  return (
    <span
      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${cfg.bg} ${cfg.text} flex items-center gap-1`}
    >
      <Icon className="w-3 h-3" />
      {t(`bookingStatus.${status.toLowerCase()}`)}
    </span>
  );
}

// Equipment Item Component avec icône
function EquipmentItem({ eqKey, t }: { eqKey: string; t: any }) {
  const Icon = EQUIPMENT_ICONS[eqKey] || CheckCircle2;
  const label = t(
    `equipment.${eqKey}`,
    eqKey.replace(/([A-Z])/g, " $1").trim(),
  );

  return (
    <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <span className="text-sm text-slate-700 dark:text-slate-300">
        {label}
      </span>
    </div>
  );
}

export default function OwnerListingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = React.use(params);
  const t = useTranslations("OwnerListingDetail");
  const slideshowRef = React.useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const {
    listing,
    loading,
    showGalleryModal,
    setShowGalleryModal,
    galleryStartIndex,
    showFullDescription,
    setShowFullDescription,
    showAllAmenities,
    setShowAllAmenities,
    bookings,
    currentMonth,
    showDeleteModal,
    setShowDeleteModal,
    isDeleting,
    zoomLevel,
    setZoomLevel,
    isSlideshow,
    handleEdit,
    handleDeleteClick,
    handleConfirmDelete,
    handleToggleStatus,
    nextPhoto,
    prevPhoto,
    toggleSlideshow,
    changeMonth,
    openInExternalMap,
    allEquipment,
    mainEquipment,
    previewPhotos,
    remainingPhotosCount,
    getCalendarDays,
  } = useListingDetail(id, locale, setError);

  const pip = (url: string) =>
    `/api/listings/image?url=${encodeURIComponent(url)}`;

  // Afficher le skeleton pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb skeleton */}
          <div className="mb-6 flex items-center gap-2">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
            <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
          {/* KPIs skeleton */}
          <KPISkeleton />
          {/* Content skeleton */}
          <ContentSkeleton />
        </main>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="relative mb-5">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-purple-500/20 rounded-2xl blur-2xl animate-pulse"></div>
            <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50 mx-auto flex items-center justify-center shadow-lg">
              <TbHomeOff className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-headline font-bold bg-gradient-to-r from-sky-400 to-purple-600 dark:from-sky-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
            {t("notFound.title")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-5 text-sm leading-relaxed max-w-sm mx-auto">
            {t("notFound.description")}
          </p>
          <Link
            href={`/${locale}/dashboard/owner/listings`}
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-400 to-purple-600 hover:from-sky-500 hover:to-purple-700 text-white rounded-lg font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 overflow-hidden"
          >
            <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 ease-out group-hover:w-full"></span>
            <ArrowLeft className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="relative z-10">{t("notFound.button")}</span>
          </Link>
          <p className="mt-5 text-xs text-slate-400 dark:text-slate-500">
            {t("notFound.helpText")}{" "}
            <Link
              href={`/${locale}/dashboard/owner`}
              className="text-purple-600 dark:text-indigo-400 hover:underline"
            >
              {t("notFound.dashboardLink")}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-body text-on-surface dark:text-slate-200 antialiased">
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Link
            href={`/${locale}/dashboard/owner/listings`}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
          >
            {t("breadcrumb.listings")}
          </Link>
          <ChevronRight className="w-4 h-4 opacity-50" />
          <span className="text-slate-900 dark:text-white font-bold truncate max-w-[300px]">
            {listing.title}
          </span>
        </nav>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <p className="text-sm text-rose-600 dark:text-rose-400">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="mb-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1 space-y-1">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-3xl lg:text-4xl font-headline font-extrabold text-slate-900 dark:text-white leading-tight">
                {listing.title}
              </h1>
              <StatusBadge status={listing.status} t={t} />
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Navigation className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">
                {listing.governorate}
                {listing.delegation ? `, ${listing.delegation}` : ""}
                {listing.street ? `, ${listing.street}` : ""}
              </span>
            </div>
          </div>

          {/* Action Buttons avec Tooltips */}
          <div className="flex items-center gap-3">
            <Tooltip text={t("actions.viewPublic")}>
              <Link
                href={`/${locale}/listings/${listing.id}`}
                target="_blank"
                className={`px-5 py-2.5 rounded-xl border-2 border-indigo-500 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 flex items-center gap-2 ${card3d}`}
              >
                <TbHomeShare className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t("actions.viewPublic")}
                </span>
              </Link>
            </Tooltip>
            <Tooltip text={t("actions.edit")}>
              <button
                onClick={handleEdit}
                className={`px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-700 hover:to-purple-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 active:scale-95 ${card3d}`}
              >
                <TbHomeEdit className="w-4 h-4" />
                <span className="hidden sm:inline">{t("actions.edit")}</span>
              </button>
            </Tooltip>
          </div>
        </header>

        {/* KPIs Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div
            className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/40 group hover:shadow-md transition-all duration-300 ${card3d}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  {t("stats.views")}
                </p>
                <p className="text-xl lg:text-2xl font-headline font-bold text-indigo-600 dark:text-indigo-400">
                  {listing.viewCount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border border-rose-100 dark:border-rose-900/40 group hover:shadow-md transition-all duration-300 ${card3d}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/40 dark:to-rose-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                <CalendarCheck className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  {t("stats.bookings")}
                </p>
                <p className="text-xl lg:text-2xl font-headline font-bold text-rose-600 dark:text-rose-400">
                  {listing.bookingCount}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border border-teal-100 dark:border-teal-900/40 group hover:shadow-md transition-all duration-300 ${card3d}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/40 dark:to-teal-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  {t("stats.occupancy")}
                </p>
                <p className="text-xl lg:text-2xl font-headline font-bold text-teal-600 dark:text-teal-400">
                  0%
                </p>
              </div>
            </div>
          </div>

          <div
            className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/40 group hover:shadow-md transition-all duration-300 ${card3d}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  {t("stats.revenue")}
                </p>
                <p className="text-xl lg:text-2xl font-headline font-bold text-emerald-600 dark:text-emerald-400">
                  {t("stats.revenueValue")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <div className="grid grid-cols-3 gap-3 h-90">
              <div
                className="col-span-2 row-span-2 rounded-2xl overflow-hidden relative group cursor-pointer bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900"
                onClick={() => setShowGalleryModal(true)}
              >
                {previewPhotos[0] && (
                  <img
                    src={pip(previewPhotos[0].url)}
                    alt={listing.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}
                <div className="absolute bottom-3 left-3">
                  <span className="text-white text-xs font-bold bg-indigo-700/60 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {t("gallery.mainPhoto")}
                  </span>
                </div>
              </div>
              <div
                className="rounded-2xl overflow-hidden relative group cursor-pointer bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900"
                onClick={() => setShowGalleryModal(true)}
              >
                {previewPhotos[1] && (
                  <img
                    src={pip(previewPhotos[1].url)}
                    alt={`${listing.title} - 2`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}
              </div>
              <div
                className="rounded-2xl overflow-hidden relative group cursor-pointer bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900"
                onClick={() => setShowGalleryModal(true)}
              >
                {previewPhotos[2] && (
                  <img
                    src={pip(previewPhotos[2].url)}
                    alt={`${listing.title} - 3`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}
                {remainingPhotosCount > 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-md">
                    <span className="text-white font-bold text-lg">
                      +{remainingPhotosCount} {t("gallery.morePhotos")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <section
              className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/40 ${card3d}`}
            >
              <h2 className="text-lg font-headline font-bold text-slate-900 dark:text-white mb-3">
                {t("sections.description")}
              </h2>
              <p
                className={`text-slate-600 dark:text-slate-400 text-sm leading-relaxed ${!showFullDescription ? "line-clamp-4" : ""}`}
              >
                {listing.description || t("sections.noDescription")}
              </p>
              {listing.description && listing.description.length > 300 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-3 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline"
                >
                  {showFullDescription
                    ? t("actions.showLess")
                    : t("actions.showMore")}
                </button>
              )}

              <div className="flex flex-wrap gap-2.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                  <Bed className="w-4 h-4" /> {listing.rooms} {t("specs.rooms")}
                </div>
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                  <Bath className="w-4 h-4" /> {listing.bathrooms}{" "}
                  {t("specs.bathrooms")}
                </div>
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                  <Users className="w-4 h-4" /> {listing.maxGuests}{" "}
                  {t("specs.guests")}
                </div>
                {listing.surfaceArea && (
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                    <Square className="w-4 h-4" /> {listing.surfaceArea}{" "}
                    {t("units.sqm")}
                  </div>
                )}
              </div>
            </section>

            {/* Amenities - Version avec icônes */}
            <section
              className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/40 ${card3d}`}
            >
              <h2 className="text-lg font-headline font-bold text-slate-900 dark:text-white mb-4">
                {t("sections.amenities")}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(showAllAmenities ? allEquipment : mainEquipment).map(
                  ([key]) => (
                    <EquipmentItem key={key} eqKey={key} t={t} />
                  ),
                )}
              </div>
              {allEquipment.length > 6 && (
                <button
                  onClick={() => setShowAllAmenities(!showAllAmenities)}
                  className="mt-4 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline"
                >
                  {showAllAmenities
                    ? t("actions.showLess")
                    : t("actions.showAllAmenities", {
                        count: allEquipment.length,
                      })}
                </button>
              )}
            </section>

            {/* Location */}
            <section className="space-y-3">
              <h2 className="text-lg font-headline font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LiaMapMarkedAltSolid className="w-5 h-5 text-black dark:text-gray-400" />
                {t("sections.location")}
              </h2>
              <div
                className={`h-64 rounded-2xl overflow-hidden relative bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 ${card3d}`}
              >
                {listing.latitude && listing.longitude ? (
                  <>
                    <MapPickerWrapper
                      latitude={listing.latitude}
                      longitude={listing.longitude}
                      onLocationChange={() => {}}
                      readOnly={true}
                    />
                    <Tooltip text={t("location.openInMaps")}>
                      <button
                        onClick={openInExternalMap}
                        className="absolute top-3 right-3 z-10 bg-white dark:bg-slate-800 rounded-lg p-2 shadow-lg hover:shadow-xl transition-all flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      >
                        <span className="hidden sm:inline">
                          {t("location.openInMaps")}
                        </span>
                        <TbMapShare className="w-4.5 h-4.5" />
                      </button>
                    </Tooltip>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 dark:bg-slate-700/20 flex items-center justify-center mb-3">
                      <MapPin className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                      {t("sections.noLocation")}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-5">
            {/* Next Bookings */}
            <section
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/40 ${card3d}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-headline font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {t("sections.nextBookings")}
                </h2>
                <Link
                  href={`/${locale}/dashboard/owner/listings/${id}/bookings`}
                  className="text-purple-700 dark:text-purple-400 text-xs font-bold hover:underline"
                >
                  {t("actions.viewAll")}
                </Link>
              </div>
              <div className="space-y-2">
                {bookings.length > 0 ? (
                  bookings.slice(0, 3).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center shrink-0">
                        <User className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {booking.tenantName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(booking.checkIn).toLocaleDateString(
                            "fr-FR",
                          )}{" "}
                          −{" "}
                          {new Date(booking.checkOut).toLocaleDateString(
                            "fr-FR",
                          )}
                        </p>
                      </div>
                      <BookingStatusBadge status={booking.status} t={t} />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 mx-auto mb-2 flex items-center justify-center">
                      <PiCalendarSlashDuotone className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                      {t("sections.noBookings")}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Calendar */}
            <section
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/40 ${card3d}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-headline font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  {t("sections.availability")}
                </h2>
                <div className="flex gap-0.5">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => changeMonth(1)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider">
                {currentMonth.toLocaleString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <div className="grid grid-cols-7 gap-0.5">
                {t("calendar.days")
                  .split(",")
                  .map((day, idx) => (
                    <div
                      key={idx}
                      className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase py-1.5 text-center"
                    >
                      {day}
                    </div>
                  ))}
                {getCalendarDays().map((day, idx) => (
                  <div
                    key={idx}
                    className={`aspect-square flex items-center justify-center text-xs font-semibold rounded-md transition-all ${
                      day === null
                        ? "text-slate-300 dark:text-slate-700"
                        : day === 12 || day === 13 || day === 14
                          ? "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 text-indigo-700 dark:text-indigo-400"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 cursor-default"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Team Section */}
        <section className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/40">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <div>
              <h2 className="text-lg font-headline font-bold text-slate-900 dark:text-white">
                {t("sections.team")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t("sections.teamDescription")}
              </p>
            </div>
            <Tooltip text={t("actions.invite")}>
              <Link
                href={`/${locale}/dashboard/owner/team?listingId=${listing.id}&openInvite=true`}
                className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <UserPlus className="w-4 h-4" />
                {t("actions.invite")}
              </Link>
            </Tooltip>
          </div>
          <div className="flex flex-wrap gap-3">
            <div
              className={`bg-white dark:bg-slate-900 p-3 rounded-xl flex items-center gap-2.5 border border-slate-200 dark:border-slate-700 ${card3d}`}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                {listing.owner?.profilePictureUrl ? (
                  <img
                    src={pip(listing.owner.profilePictureUrl)}
                    alt={listing.owner?.firstName || ""}
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-white">
                  {listing.owner?.firstName ||
                    listing.owner?.username ||
                    t("sections.ownerDefault")}
                </p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                  {t("sections.mainOwner")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Actions avec Tooltips */}
        <footer className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t("footer.lastModified")}{" "}
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {new Date(listing.updatedAt).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Tooltip
              text={
                listing.status === "ACTIVE"
                  ? t("actions.hide")
                  : t("actions.publish")
              }
            >
              <button
                onClick={handleToggleStatus}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-colors uppercase tracking-wider"
              >
                {listing.status === "ACTIVE" ? (
                  <>
                    <EyeOff className="w-4 h-4" /> {t("actions.hide")}
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" /> {t("actions.publish")}
                  </>
                )}
              </button>
            </Tooltip>
            <Tooltip text={t("actions.delete")}>
              <button
                onClick={handleDeleteClick}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors uppercase tracking-wider"
              >
                <Trash2 className="w-4 h-4" />
                {t("actions.delete")}
              </button>
            </Tooltip>
          </div>
        </footer>
      </main>

      {/* Gallery Modal */}
      {showGalleryModal && listing && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowGalleryModal(false);
                  setZoomLevel(1);
                  if (slideshowRef.current) {
                    clearInterval(slideshowRef.current);
                  }
                }}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <Tooltip text={t("gallery.slideshow")}>
                <button
                  onClick={toggleSlideshow}
                  className={`p-2 rounded-full transition-colors ${isSlideshow ? "bg-indigo-500 text-white" : "bg-white/10 hover:bg-white/20 text-white"}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </Tooltip>
            </div>
            <span className="text-white text-sm font-bold">
              {galleryStartIndex + 1} / {listing.photos.length}
            </span>
            <div className="w-16" />
          </div>

          <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
            <div
              className="relative transition-transform duration-300 ease-out"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={pip(listing.photos[galleryStartIndex]?.url)}
                alt={listing.title}
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            </div>

            <button
              onClick={prevPhoto}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-2">
              <button
                onClick={() =>
                  setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))
                }
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-white text-xs font-mono min-w-[50px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 3))}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex justify-center gap-1.5 p-4 overflow-x-auto bg-black/50">
            {listing.photos.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => {
                  setGalleryStartIndex(idx);
                  setZoomLevel(1);
                }}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${idx === galleryStartIndex ? "border-indigo-500 ring-2 ring-indigo-500/50" : "border-transparent opacity-50 hover:opacity-75"}`}
              >
                <img
                  src={pip(photo.url)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal &&
        createPortal(
          <DeleteListingModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            isLoading={isDeleting}
            listingTitle={listing.title}
          />,
          document.body,
        )}
    </div>
  );
}
