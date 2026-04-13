// app/[locale]/(dashboard)/owner/listings/[id]/history/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  History,
  Tag,
  Image,
  Wrench,
  FileText,
  CheckCircle,
  EyeOff,
  AlertCircle,
  Archive,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  useListingHistory,
  formatValue,
  getTimeKey,
  pip,
  ACTION_CONFIG,
  STATUS_LABELS,
  FIELD_LABELS,
} from "./hooks/useListingHistory";
import { TbHomeOff } from "react-icons/tb";

// Fonction pour traduire les noms d'équipements
function getEquipmentLabel(eqKey: string, t: any): string {
  const equipmentLabels: Record<string, string> = {
    wifi: t("equipment.wifi"),
    ac: t("equipment.ac"),
    heating: t("equipment.heating"),
    kitchen: t("equipment.kitchen"),
    parking: t("equipment.parking"),
    pool: t("equipment.pool"),
    gym: t("equipment.gym"),
    washer: t("equipment.washer"),
    tv: t("equipment.tv"),
    balcony: t("equipment.balcony"),
    dishwasher: t("equipment.dishwasher"),
    dryer: t("equipment.dryer"),
    coffee: t("equipment.coffee"),
    smartlock: t("equipment.smartlock"),
    speaker: t("equipment.speaker"),
    workplace: t("equipment.workplace"),
    elevator: t("equipment.elevator"),
  };
  return equipmentLabels[eqKey] || eqKey.replace(/([A-Z])/g, " $1").trim();
}

// Skeleton loader pour le contenu principal
function ContentSkeleton({ t }: { t: any }) {
  return (
    <div className="space-y-8">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <ChevronRight size={14} className="text-slate-400" />
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <ChevronRight size={14} className="text-slate-400" />
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>

      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
        <div>
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
      </div>

      {/* Filters skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl">
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-3 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl">
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-3 animate-pulse" />
          <div className="flex gap-2 flex-wrap">
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Timeline skeleton */}
      <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-8 space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
            <div className="mb-3 h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div>
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
                  <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriceDiff({
  old: oldVal,
  next: newVal,
  t,
}: {
  old: any;
  next: any;
  t: any;
}) {
  const a = parseFloat(oldVal);
  const b = parseFloat(newVal);
  if (isNaN(a) || isNaN(b)) return null;
  const diff = b - a;
  const pct = Math.abs(Math.round((diff / a) * 100));
  if (diff === 0)
    return (
      <span className="text-slate-400 dark:text-slate-500 text-xs">
        {t("timeline.unchanged")}
      </span>
    );
  if (diff > 0)
    return (
      <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
        +{diff.toLocaleString()} TND ({pct}%)
      </span>
    );
  return (
    <span className="text-rose-600 dark:text-rose-400 text-xs font-bold">
      {diff.toLocaleString()} TND ({pct}%)
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  const config = STATUS_LABELS[status];
  if (!config) return null;
  const icons: Record<string, React.ElementType> = {
    CheckCircle: CheckCircle,
    EyeOff: EyeOff,
    AlertCircle: AlertCircle,
    Archive: Archive,
  };
  const Icon = icons[config.icon as string] || CheckCircle;
  return <Icon size={14} className={config.color} />;
}

function getActionIcon(iconName: string) {
  const icons: Record<string, React.ElementType> = {
    Tag: Tag,
    Image: Image,
    Wrench: Wrench,
    FileText: FileText,
    CheckCircle: CheckCircle,
  };
  return icons[iconName] || FileText;
}

function extractStatusValue(value: any): string {
  if (!value) return "";
  if (typeof value === "string" && !value.startsWith("{")) return value;
  if (typeof value === "object" && value.status) return value.status;
  if (typeof value === "string" && value.includes("status")) {
    try {
      const parsed = JSON.parse(value);
      return parsed.status || value;
    } catch {
      return value;
    }
  }
  return value;
}

function extractEquipmentList(value: any): string[] {
  if (!value) return [];
  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([, v]) => v === true)
      .map(([k]) => k);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Object.entries(parsed)
        .filter(([, v]) => v === true)
        .map(([k]) => k);
    } catch {
      return [];
    }
  }
  return [];
}

function getUserFullName(user: any, t: any): string {
  if (user?.firstName && user?.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user?.firstName) return user.firstName;
  if (user?.username) return user.username;
  if (user?.email) return user.email.split("@")[0];
  return t("user.default");
}

export default function ListingHistoryPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = React.use(params);
  const t = useTranslations("ListingHistory");
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    loading,
    listingTitle,
    filterType,
    setFilterType,
    days,
    setDays,
    currentPage,
    setCurrentPage,
    totalPages,
    groupedHistory,
    filterOptions,
    periodOptions,
  } = useListingHistory(id, setError);

  const handleExportPDF = async () => {
    if (exporting) return;

    setExporting(true);
    setError(null);

    try {
      // Build URL with current filters
      let url = `/api/listings/${id}/history/export?days=${days}`;
      if (filterType) url += `&actionType=${filterType}`;

      // Fetch the HTML content
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const html = await response.text();

      // Create a blob and download
      const blob = new Blob([html], { type: "text/html" });
      const link = document.createElement("a");
      const downloadUrl = URL.createObjectURL(blob);
      link.href = downloadUrl;
      link.download = `historique-${listingTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Export error:", error);
      setError(t("errors.exportFailed"));
      setTimeout(() => setError(null), 5000);
    } finally {
      setExporting(false);
    }
  };

  // Afficher le skeleton pendant le chargement
    if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950 min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("page.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!listingTitle) {
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
    <div className="flex-1 flex flex-col overflow-y-auto bg-white dark:bg-slate-950">
      <div className="w-full px-0 py-6 md:py-8">
        <div ref={contentRef}>
          {/* Breadcrumb */}
          <div className="px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">
              <Link
                href={`/${locale}/dashboard/owner/listings`}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {t("breadcrumb.listings")}
              </Link>
              <ChevronRight size={14} />
              <Link
                href={`/${locale}/dashboard/owner/listings/${id}`}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[200px]"
              >
                {listingTitle}
              </Link>
              <ChevronRight size={14} />
              <span className="font-bold text-slate-900 dark:text-white">
                {t("breadcrumb.history")}
              </span>
            </nav>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <p className="text-sm text-rose-600 dark:text-rose-400">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-headline font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {t("page.title")}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">
                  {t("page.description", { title: listingTitle })}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl font-medium text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download
                    size={16}
                    className={exporting ? "animate-pulse" : ""}
                  />
                  {exporting ? t("actions.exporting") : t("actions.export")}
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 block">
                  {t("filters.period")}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {periodOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setDays(opt.days)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        days === opt.days
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {t(
                        `filters.${opt.label.toLowerCase().replace(/ /g, "")}`,
                      ) || opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 block">
                  {t("filters.type")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilterType(opt.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-2 ${
                        filterType === opt.value
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${filterType === opt.value ? "bg-white" : opt.dotColor}`}
                      />
                      {t(`filters.${opt.value.toLowerCase()}`) || opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-8 space-y-10 px-4 sm:px-6 lg:px-8">
            {Object.entries(groupedHistory).map(([dateKey, entries]) => (
              <div key={dateKey} className="relative">
                <div className="absolute -left-[41px] top-0 bg-white dark:bg-slate-950 border-4 border-indigo-500 w-5 h-5 rounded-full z-10 shadow-sm"></div>

                <div className="mb-3">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    {dateKey}
                  </span>
                </div>

                {entries.map((entry, idx) => {
                  const config =
                    ACTION_CONFIG[entry.actionType] || ACTION_CONFIG.UPDATE;
                  const Icon = getActionIcon(config.icon);
                  const isPrice =
                    entry.fieldName === "pricePerNight" ||
                    entry.fieldName === "pricePerMonth";
                  const isStatus = entry.fieldName === "status";
                  const isPhoto = entry.fieldName === "photos";
                  const isEquipment = entry.fieldName === "equipment";
                  const userName = getUserFullName(entry.changedByUser, t);

                  const oldStatusValue = isStatus
                    ? extractStatusValue(entry.oldValue)
                    : null;
                  const newStatusValue = isStatus
                    ? extractStatusValue(entry.newValue)
                    : null;
                  const oldEquipmentList = isEquipment
                    ? extractEquipmentList(entry.oldValue)
                    : [];
                  const newEquipmentList = isEquipment
                    ? extractEquipmentList(entry.newValue)
                    : [];

                  // Obtenir le label traduit du champ
                  const getFieldLabel = () => {
                    if (entry.fieldName === "pricePerNight")
                      return t("fieldLabels.pricePerNight");
                    if (entry.fieldName === "pricePerMonth")
                      return t("fieldLabels.pricePerMonth");
                    if (entry.fieldName === "status")
                      return t("fieldLabels.status");
                    if (entry.fieldName === "photos")
                      return t("fieldLabels.photos");
                    if (entry.fieldName === "equipment")
                      return t("fieldLabels.equipment");
                    if (entry.fieldName === "description")
                      return t("fieldLabels.description");
                    if (entry.fieldName === "title")
                      return t("fieldLabels.title");
                    return t("fieldLabels.general");
                  };

                  return (
                    <div
                      key={entry.id}
                      className={`flex flex-col md:flex-row gap-5 ${idx > 0 ? "mt-6" : ""}`}
                    >
                      <div className="w-32 pt-1">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {getTimeKey(entry.createdAt)}
                        </p>
                      </div>
                      <div className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                              {entry.changedByUser.profilePictureUrl ? (
                                <img
                                  src={pip(
                                    entry.changedByUser.profilePictureUrl,
                                  )}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                  {userName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {userName}
                              </p>
                              <p className="text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">
                                {entry.actionType === "PRICE_UPDATE" &&
                                  t("roles.owner")}
                                {entry.actionType === "STATUS_CHANGE" &&
                                  t("roles.owner")}
                                {entry.actionType === "PHOTO_UPDATE" &&
                                  t("roles.owner")}
                                {entry.actionType === "EQUIPMENT_UPDATE" &&
                                  t("roles.coOwner")}
                                {entry.actionType === "UPDATE" &&
                                  t("roles.coOwner")}
                                {entry.actionType === "CREATE" &&
                                  t("roles.owner")}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.color}`}
                          >
                            <Icon size={10} />
                            {t(`actionTypes.${entry.actionType}`) ||
                              config.label}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="space-y-4">
                          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                            {getFieldLabel()}
                          </h3>

                          {(entry.oldValue !== null ||
                            entry.newValue !== null) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Ancienne valeur */}
                              {entry.oldValue !== null && (
                                <div
                                  className={`rounded-xl p-4 ${isPhoto ? "relative" : "bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800"}`}
                                >
                                  <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                    {t("timeline.oldValue")}
                                  </p>
                                  {isPhoto ? (
                                    <div className="relative w-full">
                                      <img
                                        src={pip(entry.oldValue)}
                                        alt={t("photo.old")}
                                        className="w-full h-auto max-h-[400px] object-contain rounded-lg border-4 border-rose-500 shadow-lg"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                                        <span className="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded">
                                          {t("timeline.deleted")}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-rose-600 dark:text-rose-400 line-through break-all">
                                      {formatValue(
                                        entry.oldValue,
                                        entry.fieldName,
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Nouvelle valeur */}
                              {entry.newValue !== null && (
                                <div
                                  className={`rounded-xl p-4 ${isPhoto ? "relative" : "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800"} ${entry.oldValue !== null ? "md:border-l md:border-slate-200 dark:md:border-slate-700 md:pl-4" : ""}`}
                                >
                                  <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                    {t("timeline.newValue")}
                                  </p>
                                  {isPhoto ? (
                                    <div className="relative w-full">
                                      <img
                                        src={pip(entry.newValue)}
                                        alt={t("photo.new")}
                                        className="w-full h-auto max-h-[400px] object-contain rounded-lg border-4 border-emerald-500 shadow-lg"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                                        <span className="text-white font-bold text-xs bg-emerald-600 px-2 py-1 rounded">
                                          {t("timeline.new")}
                                        </span>
                                      </div>
                                    </div>
                                  ) : isStatus ? (
                                    <div className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold break-all">
                                      {t(
                                        `status.${newStatusValue?.toLowerCase()}`,
                                      ) || newStatusValue}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold break-all">
                                      {formatValue(
                                        entry.newValue,
                                        entry.fieldName,
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Price difference */}
                          {isPrice &&
                            entry.oldValue !== null &&
                            entry.newValue !== null && (
                              <div className="mt-2">
                                <PriceDiff
                                  old={entry.oldValue}
                                  next={entry.newValue}
                                  t={t}
                                />
                              </div>
                            )}

                          {/* Equipment changes list - AVEC TRADUCTION */}
                          {isEquipment && entry.oldValue && entry.newValue && (
                            <div className="mt-2 space-y-2">
                              {newEquipmentList
                                .filter((eq) => !oldEquipmentList.includes(eq))
                                .map((eq) => (
                                  <div
                                    key={eq}
                                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                                  >
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                      ✓ {t("equipment.added")} :
                                    </span>
                                    <span>{getEquipmentLabel(eq, t)}</span>
                                  </div>
                                ))}
                              {oldEquipmentList
                                .filter((eq) => !newEquipmentList.includes(eq))
                                .map((eq) => (
                                  <div
                                    key={eq}
                                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                                  >
                                    <span className="text-rose-600 dark:text-rose-400 font-medium">
                                      ✗ {t("equipment.removed")} :
                                    </span>
                                    <span>{getEquipmentLabel(eq, t)}</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {Object.keys(groupedHistory).length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <History
                    size={28}
                    className="text-slate-400 dark:text-slate-500"
                  />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                  {t("emptyState.title")}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm">
                  {t("emptyState.description")}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                >
                  <ChevronLeft size={14} />
                </button>
                {(() => {
                  const pages: (number | string)[] = [];
                  const delta = 2;
                  const range = [];
                  const rangeWithDots = [];
                  let l;

                  for (let i = 1; i <= totalPages; i++) {
                    if (
                      i === 1 ||
                      i === totalPages ||
                      (i >= currentPage - delta && i <= currentPage + delta)
                    ) {
                      range.push(i);
                    }
                  }

                  for (const i of range) {
                    if (l) {
                      if (i - l === 2) {
                        rangeWithDots.push(l + 1);
                      } else if (i - l !== 1) {
                        rangeWithDots.push("...");
                      }
                    }
                    rangeWithDots.push(i);
                    l = i;
                  }
                  return rangeWithDots.map((page, idx) =>
                    page === "..." ? (
                      <span
                        key={`dots-${idx}`}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page as number)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                          currentPage === page
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  );
                })()}
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
