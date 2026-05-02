// app/[locale]/admin/properties/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";
import Pagination from "@/components/ui/Pagination";
import MapPickerWrapper from "@/components/ui/maps/MapPickerWrapper";

import {
  IoSearchOutline,
  IoFilterOutline,
  IoCloseOutline,
  IoDownloadOutline,
  IoRefreshOutline,
  IoEyeOutline,
  IoLocationOutline,
  IoHomeOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoAlertCircleOutline,
  IoArchiveOutline,
  IoEllipsisVerticalOutline,
  IoMapOutline,
  IoBuildOutline,
  IoLockClosedOutline,
  IoEyeOffOutline,
  IoCheckmarkDoneOutline,
  IoCloseCircleOutline,
} from "react-icons/io5";
import { BsFiletypeCsv, BsFiletypePdf, BsBuilding } from "react-icons/bs";
import { MdOutlineVilla, MdOutlineApartment } from "react-icons/md";
import { PiHouseLine } from "react-icons/pi";
import { FiChevronDown } from "react-icons/fi";

import { useAdminProperties } from "./hooks/useAdminProperties";

// Ombres
const block3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";
const card3d =
  "shadow-[0_2px_0_0_rgba(0,0,0,0.03),0_4px_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_0_0_rgba(0,0,0,0.18),0_4px_12px_-4px_rgba(0,0,0,0.22)]";

// Configuration des statuts
const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    dot: string;
    text: string;
    bg: string;
    actions?: string[];
  }
> = {
  ACTIVE: {
    label: "statusActive",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    actions: ["archiver", "desactiver"],
  },
  INACTIVE: {
    label: "statusInactive",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    actions: ["activer", "archiver"],
  },
  DRAFT: {
    label: "statusDraft",
    dot: "bg-slate-400",
    text: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800/50",
    actions: ["supprimer"],
  },
  ARCHIVED: {
    label: "statusArchived",
    dot: "bg-purple-500",
    text: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    actions: [],
  },
  PENDING_REVIEW: {
    label: "statusPending",
    dot: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    actions: ["valider", "rejeter"],
  },
  SUSPENDED: {
    label: "statusSuspended",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    actions: ["activer"],
  },
  REJECTED: {
    label: "statusRejected",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    actions: ["supprimer"],
  },
};

// Configuration des types
const TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  APARTMENT: {
    label: "typeApartment",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
    icon: <MdOutlineApartment />,
  },
  VILLA: {
    label: "typeVilla",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: <MdOutlineVilla />,
  },
  STUDIO: {
    label: "typeStudio",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-400",
    icon: <BsBuilding />,
  },
  DUPLEX: {
    label: "typeDuplex",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    icon: <IoBuildOutline />,
  },
  HOUSE: {
    label: "typeHouse",
    bg: "bg-slate-100 dark:bg-slate-800/50",
    text: "text-slate-700 dark:text-slate-300",
    icon: <PiHouseLine />,
  },
  ROOM: {
    label: "typeRoom",
    bg: "bg-pink-50 dark:bg-pink-950/30",
    text: "text-pink-700 dark:text-pink-400",
    icon: <IoHomeOutline />,
  },
};

// Fonctions pour les alertes
const getAlertIcon = (type: string) => {
  switch (type) {
    case "DISPUTE":
      return (
        <IoAlertCircleOutline className="text-rose-600 dark:text-rose-400" />
      );
    case "VALIDATION":
      return (
        <IoCheckmarkCircleOutline className="text-emerald-600 dark:text-emerald-400" />
      );
    case "MODIFICATION":
      return <IoTimeOutline className="text-amber-600 dark:text-amber-400" />;
    default:
      return <IoTimeOutline className="text-sky-600 dark:text-sky-400" />;
  }
};

const getAlertBg = (type: string) => {
  switch (type) {
    case "DISPUTE":
      return "bg-rose-100 dark:bg-rose-950/30";
    case "VALIDATION":
      return "bg-emerald-100 dark:bg-emerald-950/30";
    case "MODIFICATION":
      return "bg-amber-100 dark:bg-amber-950/30";
    default:
      return "bg-sky-100 dark:bg-sky-950/30";
  }
};

// Composant Badge Statut
function StatusBadge({ status, t }: { status: string; t: any }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <span className={`text-xs font-bold flex items-center gap-1 ${cfg.text}`}>
        {t(cfg.label)}
      </span>
    </div>
  );
}

// Composant Badge Type
function TypeBadge({ type, t }: { type: string; t: any }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.APARTMENT;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${cfg.bg} ${cfg.text}`}
    >
      {cfg.icon}
      {t(cfg.label)}
    </span>
  );
}

// Composant Avatar Propriétaire
function OwnerAvatar({ owner }: { owner: any }) {
  const [err, setErr] = React.useState(false);
  const pip = (url: string) =>
    `/api/listings/image?url=${encodeURIComponent(url)}`;
  const initials =
    `${owner?.firstName?.[0] ?? ""}${owner?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?";
  const name =
    owner?.firstName && owner?.lastName
      ? `${owner.firstName} ${owner.lastName}`
      : (owner?.email?.split("@")[0] ?? "Propriétaire");

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50 flex items-center justify-center overflow-hidden ring-2 ring-indigo-500/10 flex-shrink-0">
        {owner?.profilePictureUrl && !err ? (
          <img
            src={pip(owner.profilePictureUrl)}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setErr(true)}
          />
        ) : (
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {initials}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-none">
          {name}
        </p>
        {owner?.email && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[120px] mt-0.5">
            {owner.email}
          </p>
        )}
      </div>
    </div>
  );
}

// Menu d'actions
function ActionMenu({ listing, position, onClose, onAction, t }: any) {
  const cfg = STATUS_CONFIG[listing.status] ?? STATUS_CONFIG.DRAFT;
  const availableActions = cfg.actions || [];

  const actionMap: Record<
    string,
    { label: string; icon: React.ReactNode; color: string }
  > = {
    valider: {
      label: t("validateListing"),
      icon: <IoCheckmarkDoneOutline />,
      color:
        "hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
    },
    rejeter: {
      label: t("rejectListing"),
      icon: <IoCloseCircleOutline />,
      color:
        "hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30",
    },
    activer: {
      label: t("activateListing"),
      icon: <IoCheckmarkCircleOutline />,
      color:
        "hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
    },
    desactiver: {
      label: t("deactivateListing"),
      icon: <IoEyeOffOutline />,
      color:
        "hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30",
    },
    archiver: {
      label: t("archiveListing"),
      icon: <IoArchiveOutline />,
      color:
        "hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30",
    },
    supprimer: {
      label: t("deleteListing"),
      icon: <IoCloseCircleOutline />,
      color:
        "hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border-t border-slate-100 dark:border-slate-800",
    },
  };

  const actions = availableActions
    .map((actionKey) => actionMap[actionKey])
    .filter(Boolean);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className={`fixed z-50 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 overflow-hidden ${block3d}`}
        style={{ top: position.top, left: position.left }}
      >
        <div className="py-1">
          <button
            onClick={() => {
              window.open(`/fr/listings/${listing.id}`, "_blank");
              onClose();
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2.5 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
          >
            <span className="text-base">
              <IoEyeOutline />
            </span>
            {t("viewListing")}
          </button>

          {actions.map(({ label, icon, color }) => (
            <button
              key={label}
              onClick={() => {
                const actionKey = Object.keys(actionMap).find(
                  (key) => actionMap[key].label === label,
                );
                if (actionKey) {
                  if (actionKey === "supprimer") {
                    if (confirm(t("confirmDelete"))) {
                      onAction(actionKey, listing.id);
                    }
                  } else {
                    onAction(actionKey, listing.id);
                  }
                }
                onClose();
              }}
              className={`w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2.5 transition-colors ${color}`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// Composant Principal
export default function AdminPropertiesPage() {
  const t = useTranslations("AdminProperties");

  const {
    listings,
    loading,
    searchQuery,
    statusFilter,
    typeFilter,
    currentPage,
    totalPages,
    totalCount,
    showFilters,
    showExport,
    alert,
    menuState,
    mapCenter,
    priceMin,
    priceMax,
    governorate,
    stats,
    mapListings,
    recentAlerts,
    PAGE_SIZE,
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    setCurrentPage,
    setShowFilters,
    setShowExport,
    setMenuState,
    setAlert,
    setPriceMin,
    setPriceMax,
    setGovernorate,
    fetchListings,
    handleAction,
    handleExport,
    getMainImage,
    resetFilters,
  } = useAdminProperties();

  // État pour afficher toutes les alertes
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  // Nombre d'alertes à afficher initialement
  const initialAlertCount = 4;
  const displayedAlerts = showAllAlerts
    ? recentAlerts
    : recentAlerts?.slice(0, initialAlertCount);
  const hasMoreAlerts = recentAlerts?.length > initialAlertCount;

  const showPagination = totalPages > 1 && totalCount > 0;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6 ">
      {alert && (
        <div className="fixed top-5 right-5 z-[60] w-full max-w-sm">
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* En-tête */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {t("description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchListings}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-sm font-medium"
          >
            <IoRefreshOutline className="text-base" />
            {t("refresh")}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold shadow-sm transition-all"
            >
              <IoDownloadOutline className="text-base" />
              {t("export")}
              <FiChevronDown className="text-xs" />
            </button>
            {showExport && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExport(false)}
                />
                <div
                  className={`absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 z-50 overflow-hidden ${block3d}`}
                >
                  {[
                    {
                      fmt: "csv",
                      icon: (
                        <BsFiletypeCsv className="text-emerald-500 dark:text-emerald-400 text-lg" />
                      ),
                      title: t("exportCSV"),
                      desc: t("csvFormat"),
                    },
                    {
                      fmt: "pdf",
                      icon: (
                        <BsFiletypePdf className="text-red-500 dark:text-red-400 text-lg" />
                      ),
                      title: t("exportPDF"),
                      desc: t("pdfFormat"),
                    },
                  ].map(({ fmt, icon, title, desc }) => (
                    <button
                      key={fmt}
                      onClick={() => handleExport(fmt as "csv" | "pdf")}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 flex items-center gap-3 transition-colors border-b border-indigo-50 dark:border-indigo-900/30 last:border-b-0"
                    >
                      {icon}
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {title}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            title: t("statsTotal"),
            value: stats.total,
            icon: <IoHomeOutline className="text-white text-xl" />,
            grad: "from-indigo-500 to-blue-600",
            text: "text-indigo-600 dark:text-indigo-400",
          },
          {
            title: t("statsActive"),
            value: stats.active,
            icon: <IoCheckmarkCircleOutline className="text-white text-xl" />,
            grad: "from-emerald-400 to-teal-500",
            text: "text-emerald-600 dark:text-emerald-400",
          },
          {
            title: t("statsPending"),
            value: stats.pending,
            icon: <IoTimeOutline className="text-white text-xl" />,
            grad: "from-amber-400 to-orange-500",
            text: "text-amber-600 dark:text-amber-400",
          },
          {
            title: t("statsRejected"),
            value: stats.rejected || 0,
            icon: <IoCloseCircleOutline className="text-white text-xl" />,
            grad: "from-red-400 to-rose-500",
            text: "text-red-600 dark:text-red-400",
          },
          {
            title: t("statsArchived"),
            value: stats.archived,
            icon: <IoArchiveOutline className="text-white text-xl" />,
            grad: "from-violet-500 to-purple-600",
            text: "text-violet-600 dark:text-violet-400",
          },
        ].map(({ title, value, icon, grad, text }) => (
          <div
            key={title}
            className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4 ${card3d}`}
          >
            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm flex-shrink-0`}
            >
              {icon}
            </div>
            <div>
              <p className={`text-2xl font-black leading-none ${text}`}>
                {value}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium leading-tight">
                {title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tableau principal */}
      <div
        className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden ${block3d}`}
      >
        {/* Barre de filtres */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t("searchPlaceholder")}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">{t("allStatus")}</option>
              <option value="ACTIVE">{t("statusActive")}</option>
              <option value="INACTIVE">{t("statusInactive")}</option>
              <option value="DRAFT">{t("statusDraft")}</option>
              <option value="PENDING_REVIEW">{t("statusPending")}</option>
              <option value="REJECTED">{t("statusRejected")}</option>
              <option value="ARCHIVED">{t("statusArchived")}</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">{t("allTypes")}</option>
              <option value="APARTMENT">{t("typeApartment")}</option>
              <option value="VILLA">{t("typeVilla")}</option>
              <option value="STUDIO">{t("typeStudio")}</option>
              <option value="DUPLEX">{t("typeDuplex")}</option>
              <option value="HOUSE">{t("typeHouse")}</option>
              <option value="ROOM">{t("typeRoom")}</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                showFilters
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-indigo-500 dark:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-600"
              }`}
            >
              <IoFilterOutline className="text-sm" />
              {t("advancedFilters")}
            </button>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <IoCloseOutline className="text-sm" />
              {t("resetFilters")}
            </button>
            <p className="ml-auto text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
              {totalCount}{" "}
              {totalCount > 1
                ? t("propertiesCountPlural")
                : t("propertiesCount")}
            </p>
          </div>
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                  {t("filterMinPrice")}
                </label>
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder={t("pricePlaceholder")}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                  {t("filterMaxPrice")}
                </label>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder={t("pricePlaceholder")}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                  {t("filterGovernorate")}
                </label>
                <input
                  type="text"
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  placeholder={t("governoratePlaceholder")}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tableau */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <LoadingSpinner />
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-300 dark:text-slate-700">
              <IoHomeOutline className="text-5xl" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("noPropertiesFound")}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("tableHeaderProperty")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("tableHeaderOwner")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("tableHeaderType")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("tableHeaderPrice")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("tableHeaderStatus")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("tableHeaderDate")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("tableHeaderActions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {listings.map((listing) => {
                  const imageUrl = getMainImage(listing);
                  const price = listing.pricePerNight ?? listing.pricePerMonth;
                  const priceUnit = listing.pricePerNight
                    ? t("pricePerNight")
                    : t("pricePerMonth");
                  return (
                    <tr
                      key={listing.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <IoHomeOutline className="text-slate-400 dark:text-slate-600 text-lg" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight line-clamp-1 max-w-[180px]">
                              {listing.title}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                              <IoLocationOutline className="text-xs" />
                              {listing.governorate}, {listing.delegation}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <OwnerAvatar owner={listing.owner} />
                      </td>
                      <td className="px-4 py-3.5">
                        <TypeBadge type={listing.type} t={t} />
                      </td>
                      <td className="px-4 py-3.5">
                        {price ? (
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {price.toLocaleString("fr-FR")} TND
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              {priceUnit}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={listing.status} t={t} />
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {new Date(listing.createdAt).toLocaleDateString(
                            "fr-FR",
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/fr/listings/${listing.id}`}
                            target="_blank"
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                          >
                            <IoEyeOutline className="text-base" />
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              setMenuState({
                                listing,
                                position: {
                                  top: rect.bottom + window.scrollY + 5,
                                  left: rect.left + window.scrollX - 160,
                                },
                              });
                            }}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 rounded-lg transition-colors"
                          >
                            <IoEllipsisVerticalOutline className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {showPagination && (
          <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800">
            <Pagination
              currentPage={Math.max(1, currentPage)}
              totalPages={Math.max(1, totalPages)}
              totalItems={Math.max(0, totalCount)}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Carte + Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte géographique */}
        <div
          className={`lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 ${card3d}`}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <IoMapOutline className="text-indigo-500 dark:text-indigo-400" />
              {t("mapTitle")}
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {mapListings.length}{" "}
              {mapListings.length !== 1
                ? t("mapGeolocatedPlural")
                : t("mapGeolocated")}
            </span>
          </div>
          <div className="h-80 rounded-xl overflow-hidden">
            {mapListings.length > 0 ? (
              <MapPickerWrapper
                latitude={mapCenter.lat}
                longitude={mapCenter.lng}
                onLocationChange={() => {}}
                readOnly
                markers={mapListings.map((l) => ({
                  id: l.id,
                  title: l.title,
                  latitude: l.latitude,
                  longitude: l.longitude,
                  status: l.status,
                  price: l.pricePerNight ?? l.pricePerMonth ?? undefined,
                }))}
                showAllMarkers
                onMarkerClick={(id) =>
                  (window.location.href = `/fr/listings/${id}`)
                }
              />
            ) : (
              <div className="w-full h-full bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <IoMapOutline className="text-slate-300 dark:text-slate-600 text-4xl" />
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  {t("mapNoProperties")}
                </p>
              </div>
            )}
          </div>
          {mapListings.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {mapListings.slice(0, 6).map((l) => (
                <button
                  key={l.id}
                  onClick={() => window.open(`/fr/listings/${l.id}`, "_blank")}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[l.status]?.dot || "bg-slate-400"}`}
                  />
                  <span className="truncate max-w-[110px] text-slate-600 dark:text-slate-300">
                    {l.title}
                  </span>
                </button>
              ))}
              {mapListings.length > 6 && (
                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-400 dark:text-slate-500">
                  +{mapListings.length - 6} {t("mapOthers")}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Alertes récentes */}
        <div
          className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 ${card3d}`}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <IoAlertCircleOutline className="text-indigo-500 dark:text-indigo-400" />
              {t("alertsTitle")}
            </h3>
            {hasMoreAlerts && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {showAllAlerts
                  ? `${recentAlerts?.length} ${t("alertsTotal")}`
                  : `${initialAlertCount}/${recentAlerts?.length}`}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {!recentAlerts || recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                <IoCheckmarkCircleOutline className="text-4xl mx-auto mb-2 text-emerald-400 dark:text-emerald-500" />
                <p className="text-sm">{t("alertsNoData")}</p>
                <p className="text-xs mt-1">{t("alertsQuiet")}</p>
              </div>
            ) : (
              <>
                {displayedAlerts?.map((alertItem, idx) => (
                  <div
                    key={alertItem.id || idx}
                    className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                    onClick={() => {
                      if (alertItem.listingId) {
                        window.open(
                          `/fr/listings/${alertItem.listingId}`,
                          "_blank",
                        );
                      }
                    }}
                  >
                    <div
                      className={`w-9 h-9 rounded-full ${getAlertBg(alertItem.type)} flex items-center justify-center flex-shrink-0 text-base transition-transform group-hover:scale-105`}
                    >
                      {getAlertIcon(alertItem.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-0.5">
                        {alertItem.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                        {alertItem.description}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        {alertItem.time}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {hasMoreAlerts && (
            <button
              onClick={() => setShowAllAlerts(!showAllAlerts)}
              className="w-full mt-4 py-2.5 border border-slate-200 dark:border-slate-700 text-indigo-500 dark:text-indigo-400 text-xs font-bold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors flex items-center justify-center gap-2"
            >
              {showAllAlerts ? (
                <>
                  <IoEyeOffOutline className="text-sm" />
                  {t("alertsViewLess")}
                </>
              ) : (
                <>
                  <IoEyeOutline className="text-sm" />
                  {t("alertsViewAll")} ({recentAlerts?.length})
                </>
              )}
            </button>
          )}

          {!hasMoreAlerts && recentAlerts?.length > 0 && (
            <div className="w-full mt-4 py-2.5 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
              {recentAlerts?.length} alerte{recentAlerts?.length > 1 ? "s" : ""}{" "}
              récente{recentAlerts?.length > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {menuState.listing && (
        <ActionMenu
          listing={menuState.listing}
          position={menuState.position}
          onClose={() =>
            setMenuState({ listing: null, position: { top: 0, left: 0 } })
          }
          onAction={handleAction}
          t={t}
        />
      )}
    </div>
  );
}
