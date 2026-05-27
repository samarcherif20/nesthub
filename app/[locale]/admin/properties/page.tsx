"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import MapPickerWrapper from "@/components/ui/maps/MapPickerWrapper";
import { CheckCircle, AlertCircle, X } from "lucide-react";

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
  IoMapOutline,
  IoBuildOutline,
  IoEyeOffOutline,
  IoCloseCircleOutline,
  IoTrashOutline,
  IoCheckboxOutline,
  IoSquareOutline,
  IoArrowUp,
  IoArrowDown,
  IoClose,
  IoWarningOutline,
} from "react-icons/io5";
import { BsFiletypeCsv, BsFiletypePdf, BsBuilding } from "react-icons/bs";
import { MdOutlineVilla, MdOutlineApartment } from "react-icons/md";
import { PiHouseLine } from "react-icons/pi";
import { FiChevronDown } from "react-icons/fi";

import { useAdminProperties, SortField, SortOrder } from "./hooks/useAdminProperties";

interface Toast {
  type: "success" | "error";
  message: string;
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  icon?: React.ReactNode;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

// Composant Modal de confirmation
function ConfirmModal({
  isOpen,
  title,
  message,
  icon,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isDanger = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isDanger ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"
          }`}>
            {icon || (isDanger ? (
              <IoTrashOutline className="w-8 h-8 text-red-600 dark:text-red-400" />
            ) : (
              <IoWarningOutline className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            ))}
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {message}
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                isDanger
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
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

// Composant Modal d'aperçu rapide
function PreviewModal({ listing, onClose, locale, t }: { listing: any; onClose: () => void; locale: string; t: any }) {
  if (!listing) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: "TND",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-10"
        >
          <IoClose className="w-5 h-5" />
        </button>
        
        <div className="p-6">
          {/* Image principale */}
          <div className="w-full h-64 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-4">
            {listing.photos?.[0]?.url ? (
              <img
                src={`/api/listings/image?url=${encodeURIComponent(listing.photos[0].url)}`}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <IoHomeOutline className="w-16 h-16 text-slate-400" />
              </div>
            )}
          </div>

          {/* Titre et prix */}
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{listing.title}</h2>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatPrice(listing.pricePerNight ?? listing.pricePerMonth)}
            </p>
          </div>

          {/* Localisation */}
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-4">
            <IoLocationOutline className="text-base" />
            <span>{listing.governorate}, {listing.delegation}</span>
          </div>

          {/* Détails */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-xs text-slate-400 dark:text-slate-500">Type</p>
              <p className="font-semibold">{listing.type}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-xs text-slate-400 dark:text-slate-500">Statut</p>
              <p className="font-semibold">{listing.status}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-xs text-slate-400 dark:text-slate-500">Propriétaire</p>
              <p className="font-semibold">{listing.owner?.firstName} {listing.owner?.lastName}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-xs text-slate-400 dark:text-slate-500">Créé le</p>
              <p className="font-semibold">{new Date(listing.createdAt).toLocaleDateString(locale)}</p>
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{listing.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href={`/${locale}/listings/${listing.id}`}
              target="_blank"
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-center font-medium transition-colors"
            >
              {t("viewFullListing")}
            </Link>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {t("close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant Badge Statut
function StatusBadge({ status, t }: { status: string; t: any }) {
  const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
    ACTIVE: { label: "statusActive", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    INACTIVE: { label: "statusInactive", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
    DRAFT: { label: "statusDraft", dot: "bg-slate-400", text: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/50" },
    ARCHIVED: { label: "statusArchived", dot: "bg-purple-500", text: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30" },
    PENDING_REVIEW: { label: "statusPending", dot: "bg-sky-500", text: "text-sky-700 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-950/30" },
    SUSPENDED: { label: "statusSuspended", dot: "bg-red-500", text: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30" },
    REJECTED: { label: "statusRejected", dot: "bg-red-500", text: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30" },
  };
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <span className={`text-xs font-bold flex items-center gap-1 ${cfg.text}`}>{t(cfg.label)}</span>
    </div>
  );
}

// Composant Badge Type
function TypeBadge({ type, t }: { type: string; t: any }) {
  const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    APARTMENT: { label: "typeApartment", bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", icon: <MdOutlineApartment /> },
    VILLA: { label: "typeVilla", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", icon: <MdOutlineVilla /> },
    STUDIO: { label: "typeStudio", bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-700 dark:text-purple-400", icon: <BsBuilding /> },
    DUPLEX: { label: "typeDuplex", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", icon: <IoBuildOutline /> },
    HOUSE: { label: "typeHouse", bg: "bg-slate-100 dark:bg-slate-800/50", text: "text-slate-700 dark:text-slate-300", icon: <PiHouseLine /> },
    ROOM: { label: "typeRoom", bg: "bg-pink-50 dark:bg-pink-950/30", text: "text-pink-700 dark:text-pink-400", icon: <IoHomeOutline /> },
  };
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.APARTMENT;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}
      {t(cfg.label)}
    </span>
  );
}

// Composant Avatar Propriétaire
function OwnerAvatar({ owner }: { owner: any }) {
  const [err, setErr] = React.useState(false);
  const initials = `${owner?.firstName?.[0] ?? ""}${owner?.lastName?.[0] ?? ""}`.toUpperCase() || "?";
  const name = owner?.firstName && owner?.lastName ? `${owner.firstName} ${owner.lastName}` : (owner?.email?.split("@")[0] ?? "Propriétaire");
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50 flex items-center justify-center overflow-hidden ring-2 ring-indigo-500/10 flex-shrink-0">
        {owner?.profilePictureUrl && !err ? (
          <img src={`/api/listings/image?url=${encodeURIComponent(owner.profilePictureUrl)}`} alt="" className="w-full h-full object-cover" onError={() => setErr(true)} />
        ) : (
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{initials}</span>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-none">{name}</p>
        {owner?.email && <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[120px] mt-0.5">{owner.email}</p>}
      </div>
    </div>
  );
}

export default function AdminPropertiesPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("AdminProperties");

  const [toast, setToast] = useState<Toast | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: string;
    id?: string;
    isBatch?: boolean;
  }>({ isOpen: false, type: "" });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

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
    mapCenter,
    priceMin,
    priceMax,
    governorate,
    ownerEmail,
    dateFrom,
    dateTo,
    stats,
    mapListings,
    recentAlerts,
    selectedIds,
    sortField,
    sortOrder,
    autoRefresh,
    previewListing,
    PAGE_SIZE,
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    setCurrentPage,
    setShowFilters,
    setShowExport,
    setPriceMin,
    setPriceMax,
    setGovernorate,
    setOwnerEmail,
    setDateFrom,
    setDateTo,
    setAutoRefresh,
    setPreviewListing,
    fetchListings,
    handleAction,
    handleBatchAction,
    handleExport,
    getMainImage,
    resetFilters,
    toggleSelect,
    toggleSelectAll,
    handleSort,
  } = useAdminProperties(locale);

  const showAllAlerts = false;
  const [showAllAlertsState, setShowAllAlertsState] = useState(false);
  const displayedAlerts = showAllAlertsState ? recentAlerts : recentAlerts?.slice(0, 4);
  const hasMoreAlerts = recentAlerts?.length > 4;

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
    } catch { return ""; }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: "TND",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const hasActiveFilters = searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL" || priceMin || priceMax || governorate || ownerEmail || dateFrom || dateTo;

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? <IoArrowUp className="inline ml-1 text-xs" /> : <IoArrowDown className="inline ml-1 text-xs" />;
  };

  const handleActionWithConfirm = (type: string, id?: string) => {
    setConfirmModal({ isOpen: true, type, id, isBatch: !id });
  };

  const executeAction = async () => {
    const { type, id, isBatch } = confirmModal;
    let result;
    
    if (isBatch) {
      result = await handleBatchAction(type);
    } else if (id) {
      result = await handleAction(type, id);
    } else {
      setConfirmModal({ isOpen: false, type: "" });
      return;
    }

    if (result.success && result.message) {
      showToast("success", result.message);
    } else if (!result.success && result.message) {
      showToast("error", result.message);
    }
    setConfirmModal({ isOpen: false, type: "" });
  };

  const showPagination = totalPages > 1 && totalCount > 0;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
            {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
  isOpen={confirmModal.isOpen}
  title={
    confirmModal.type === "activer" ? t("activerConfirmTitle") :
    confirmModal.type === "desactiver" ? t("desactiverConfirmTitle") :
    confirmModal.type === "archiver" ? t("archiverConfirmTitle") :
    confirmModal.type === "valider" ? t("validerConfirmTitle") :
    confirmModal.type === "rejeter" ? t("rejeterConfirmTitle") :
    confirmModal.type === "supprimer" ? t("supprimerConfirmTitle") :
    t("confirm")
  }
  message={
    confirmModal.isBatch ? 
      (confirmModal.type === "activer" ? t("activerBatchConfirmMessage", { count: selectedIds.size }) :
       confirmModal.type === "desactiver" ? t("desactiverBatchConfirmMessage", { count: selectedIds.size }) :
       confirmModal.type === "archiver" ? t("archiverBatchConfirmMessage", { count: selectedIds.size }) :
       t("confirm"))
    :
      (confirmModal.type === "activer" ? t("activerConfirmMessage") :
       confirmModal.type === "desactiver" ? t("desactiverConfirmMessage") :
       confirmModal.type === "archiver" ? t("archiverConfirmMessage") :
       confirmModal.type === "valider" ? t("validerConfirmMessage") :
       confirmModal.type === "rejeter" ? t("rejeterConfirmMessage") :
       confirmModal.type === "supprimer" ? t("supprimerConfirmMessage") :
       t("confirm"))
  }
  confirmText={t("confirm")}
  cancelText={t("cancel")}
  onConfirm={executeAction}
  onCancel={() => setConfirmModal({ isOpen: false, type: "" })}
  isDanger={confirmModal.type === "supprimer"}
/>
      {/* Preview Modal */}
      {previewListing && (
        <PreviewModal listing={previewListing} onClose={() => setPreviewListing(null)} locale={locale} t={t} />
      )}

      {/* En-tête */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t("title")}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t("description")}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
              autoRefresh
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            <IoRefreshOutline className={`text-base ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? t("autoRefreshOn") : t("autoRefreshOff")}
          </button>
          
          <button onClick={fetchListings} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-indigo-300 transition-all text-sm font-medium">
            <IoRefreshOutline className="text-base" />
            {t("refresh")}
          </button>
          
          <div className="relative">
            <button onClick={() => setShowExport(!showExport)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold shadow-sm transition-all">
              <IoDownloadOutline className="text-base" />
              {t("export")}
              <FiChevronDown className="text-xs" />
            </button>
            {showExport && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 z-50 overflow-hidden shadow-[0_4px_0_0_rgba(0,0,0,0.05)]">
                  {[
                    { fmt: "csv", icon: <BsFiletypeCsv className="text-emerald-500 text-lg" />, title: t("exportCSV"), desc: t("csvFormat") },
                    { fmt: "pdf", icon: <BsFiletypePdf className="text-red-500 text-lg" />, title: t("exportPDF"), desc: t("pdfFormat") },
                  ].map(({ fmt, icon, title, desc }) => (
                    <button key={fmt} onClick={() => { handleExport(fmt as "csv" | "pdf").then((result) => { showToast(result.success ? "success" : "error", result.message); }); }} className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 flex items-center gap-3 transition-colors border-b border-indigo-50 dark:border-indigo-900/30 last:border-b-0">
                      {icon}
                      <div><p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p><p className="text-xs text-slate-400 dark:text-slate-500">{desc}</p></div>
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
    { title: t("statsTotal"), value: stats.total, icon: <IoHomeOutline className="text-white text-xl" />, grad: "from-indigo-500 to-blue-600", textColor: "text-indigo-600 dark:text-indigo-400" },
    { title: t("statsActive"), value: stats.active, icon: <IoCheckmarkCircleOutline className="text-white text-xl" />, grad: "from-emerald-400 to-teal-500", textColor: "text-emerald-600 dark:text-emerald-400" },
    { title: t("statsPending"), value: stats.pending, icon: <IoTimeOutline className="text-white text-xl" />, grad: "from-amber-400 to-orange-500", textColor: "text-amber-600 dark:text-amber-400" },
    { title: t("statsRejected"), value: stats.rejected || 0, icon: <IoCloseCircleOutline className="text-white text-xl" />, grad: "from-red-400 to-rose-500", textColor: "text-red-600 dark:text-red-400" },
    { title: t("statsArchived"), value: stats.archived, icon: <IoArchiveOutline className="text-white text-xl" />, grad: "from-violet-500 to-purple-600", textColor: "text-violet-600 dark:text-violet-400" },
  ].map(({ title, value, icon, grad, textColor }) => (
    <div key={title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4 shadow-[0_2px_0_0_rgba(0,0,0,0.03)]">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-black leading-none ${textColor}`}>{value}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium leading-tight">{title}</p>
      </div>
    </div>
  ))}
</div>
      {/* Tableau principal */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-[0_4px_0_0_rgba(0,0,0,0.05)]">
        {/* Barre de filtres */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder={t("searchPlaceholder")} className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500">
              <option value="ALL">{t("allStatus")}</option>
              <option value="ACTIVE">{t("statusActive")}</option>
              <option value="INACTIVE">{t("statusInactive")}</option>
              <option value="DRAFT">{t("statusDraft")}</option>
              <option value="PENDING_REVIEW">{t("statusPending")}</option>
              <option value="REJECTED">{t("statusRejected")}</option>
              <option value="ARCHIVED">{t("statusArchived")}</option>
            </select>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500">
              <option value="ALL">{t("allTypes")}</option>
              <option value="APARTMENT">{t("typeApartment")}</option>
              <option value="VILLA">{t("typeVilla")}</option>
              <option value="STUDIO">{t("typeStudio")}</option>
              <option value="DUPLEX">{t("typeDuplex")}</option>
              <option value="HOUSE">{t("typeHouse")}</option>
              <option value="ROOM">{t("typeRoom")}</option>
            </select>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${showFilters ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-indigo-500"}`}>
              <IoFilterOutline className="text-sm" />
              {t("advancedFilters")}
            </button>
            <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-indigo-600">
              <IoCloseOutline className="text-sm" />
              {t("resetFilters")}
            </button>
            <p className="ml-auto text-xs font-medium text-slate-400 whitespace-nowrap">{totalCount} {totalCount > 1 ? t("propertiesCountPlural") : t("propertiesCount")}</p>
          </div>
          
          {/* FILTRES AVANCÉS ÉTENDUS */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-indigo-600 mb-1.5">{t("filterMinPrice")}</label>
                <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder={t("pricePlaceholder")} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-indigo-600 mb-1.5">{t("filterMaxPrice")}</label>
                <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder={t("pricePlaceholder")} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-indigo-600 mb-1.5">{t("filterGovernorate")}</label>
                <input type="text" value={governorate} onChange={(e) => setGovernorate(e.target.value)} placeholder={t("governoratePlaceholder")} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-indigo-600 mb-1.5">{t("filterOwnerEmail")}</label>
                <input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder={t("ownerEmailPlaceholder")} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-indigo-600 mb-1.5">{t("filterDateFrom")}</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-indigo-600 mb-1.5">{t("filterDateTo")}</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
              </div>
            </div>
          )}
        </div>

        {/* Actions batch */}
        {selectedIds.size > 0 && (
          <div className="flex-shrink-0 px-5 py-3 bg-indigo-50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">{selectedIds.size} sélectionnée(s)</span>
            <div className="flex gap-2">
              <button onClick={() => handleActionWithConfirm("activer", undefined)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors">Activer tout</button>
              <button onClick={() => handleActionWithConfirm("desactiver", undefined)} className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors">Désactiver tout</button>
              <button onClick={() => handleActionWithConfirm("archiver", undefined)} className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors">Archiver tout</button>
              <button onClick={() => toggleSelectAll()} className="px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-950/30 transition-colors">Désélectionner tout</button>
            </div>
          </div>
        )}

        {/* Tableau */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40"><LoadingSpinner /></div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 gap-4">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center"><IoHomeOutline className="text-4xl text-slate-400" /></div>
              <div className="text-center"><p className="text-base font-semibold text-slate-600">{hasActiveFilters ? t("emptySearch") : t("emptyProperties")}</p><p className="text-sm text-slate-400 mt-1">{hasActiveFilters ? t("tryDifferentFilters") : t("emptyPropertiesDesc")}</p>{hasActiveFilters && <button onClick={resetFilters} className="mt-4 px-4 py-2 text-sm text-indigo-600 font-medium border border-indigo-200 rounded-lg hover:bg-indigo-50">{t("resetFilters")}</button>}</div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleSelectAll} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                      {selectedIds.size === listings.length && listings.length > 0 ? <IoCheckboxOutline className="text-indigo-600" /> : <IoSquareOutline className="text-slate-400" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600" onClick={() => handleSort("title")}>
                    {t("tableHeaderProperty")} {getSortIcon("title")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("tableHeaderOwner")}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("tableHeaderType")}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600" onClick={() => handleSort("price")}>
                    {t("tableHeaderPrice")} {getSortIcon("price")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600" onClick={() => handleSort("status")}>
                    {t("tableHeaderStatus")} {getSortIcon("status")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600" onClick={() => handleSort("createdAt")}>
                    {t("tableHeaderDate")} {getSortIcon("createdAt")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("tableHeaderActions")}</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {listings.map((listing) => {
                  const imageUrl = getMainImage(listing);
                  const price = listing.pricePerNight ?? listing.pricePerMonth;
                  const priceUnit = listing.pricePerNight ? t("pricePerNight") : t("pricePerMonth");
                  return (
                    <tr key={listing.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-4 py-3.5">
                        <button onClick={() => toggleSelect(listing.id)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                          {selectedIds.has(listing.id) ? <IoCheckboxOutline className="text-indigo-600" /> : <IoSquareOutline className="text-slate-400" />}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 cursor-pointer" onClick={() => setPreviewListing(listing)}>
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                            {imageUrl ? <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><IoHomeOutline className="text-slate-400 text-lg" /></div>}
                          </div>
                          <div><p className="text-sm font-bold text-slate-900 dark:text-white leading-tight line-clamp-1 max-w-[180px]">{listing.title}</p><p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5"><IoLocationOutline className="text-xs" />{listing.governorate}, {listing.delegation}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><OwnerAvatar owner={listing.owner} /></td>
                      <td className="px-4 py-3.5"><TypeBadge type={listing.type} t={t} /></td>
                      <td className="px-4 py-3.5">{price ? <div><p className="text-sm font-bold text-slate-800">{formatPrice(price)}</p><p className="text-[10px] text-slate-400">{priceUnit}</p></div> : <span className="text-xs text-slate-400">—</span>}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={listing.status} t={t} /></td>
                      <td className="px-4 py-3.5"><p className="text-xs font-medium text-slate-500">{formatDate(listing.createdAt)}</p></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <Link
  href={`/${locale}/listings/${listing.id}`}
  target="_blank"
  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg inline-flex items-center justify-center transition-colors"
  title={t("viewListing")}
>
  <IoEyeOutline className="text-base" />
</Link>
                          {listing.status === "PENDING_REVIEW" && (
                            <>
                             <button 
  onClick={() => {
    handleAction("valider", listing.id).then((result) => {
      if (result.message) showToast(result.success ? "success" : "error", result.message);
    });
  }} 
  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" 
  title={t("validateListing")}
>
  <IoCheckmarkCircleOutline className="text-base" />
</button>

<button 
  onClick={() => {
    handleAction("rejeter", listing.id).then((result) => {
      if (result.message) showToast(result.success ? "success" : "error", result.message);
    });
  }} 
  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" 
  title={t("rejectListing")}
>
  <IoCloseCircleOutline className="text-base" />
</button>
                            </>
                          )}
                          {(listing.status === "INACTIVE" || listing.status === "SUSPENDED" || listing.status === "ARCHIVED") && (
                            <button onClick={() => handleActionWithConfirm("activer", listing.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title={t("activateListing")}><IoCheckmarkCircleOutline className="text-base" /></button>
                          )}
                          {listing.status === "ACTIVE" && (
                            <button onClick={() => handleActionWithConfirm("desactiver", listing.id)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title={t("deactivateListing")}><IoEyeOffOutline className="text-base" /></button>
                          )}
                          {(listing.status === "ACTIVE" || listing.status === "INACTIVE") && (
                            <button onClick={() => handleActionWithConfirm("archiver", listing.id)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title={t("archiveListing")}><IoArchiveOutline className="text-base" /></button>
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

        {showPagination && (
          <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800">
            <Pagination currentPage={Math.max(1, currentPage)} totalPages={Math.max(1, totalPages)} totalItems={Math.max(0, totalCount)} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      {/* Carte + Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 shadow-[0_2px_0_0_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-5"><h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><IoMapOutline className="text-indigo-500" />{t("mapTitle")}</h3><span className="text-xs text-slate-400">{mapListings.length} {mapListings.length !== 1 ? t("mapGeolocatedPlural") : t("mapGeolocated")}</span></div>
          <div className="h-80 rounded-xl overflow-hidden">
            {mapListings.length > 0 ? <MapPickerWrapper latitude={mapCenter.lat} longitude={mapCenter.lng} onLocationChange={() => {}} readOnly markers={mapListings.map((l) => ({ id: l.id, title: l.title, latitude: l.latitude, longitude: l.longitude, status: l.status, price: l.pricePerNight ?? l.pricePerMonth ?? undefined }))} showAllMarkers onMarkerClick={(id) => window.open(`/${locale}/listings/${id}`, "_blank")} /> : <div className="w-full h-full flex flex-col items-center justify-center gap-3 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200"><div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center"><IoMapOutline className="text-3xl text-slate-400" /></div><p className="text-sm text-slate-500 font-medium">{t("mapNoProperties")}</p><p className="text-xs text-slate-400">{t("emptyMapDesc")}</p></div>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 shadow-[0_2px_0_0_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-5"><h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><IoAlertCircleOutline className="text-indigo-500" />{t("alertsTitle")}</h3>{hasMoreAlerts && <span className="text-xs text-slate-400">{showAllAlertsState ? `${recentAlerts?.length} ${t("alertsTotal")}` : `4/${recentAlerts?.length}`}</span>}</div>
          <div className="space-y-3">
            {!recentAlerts || recentAlerts.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center"><div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3"><IoAlertCircleOutline className="text-3xl text-slate-400" /></div><p className="text-sm text-slate-500 font-medium">{t("alertsNoData")}</p><p className="text-xs text-slate-400 mt-1">{t("alertsQuiet")}</p></div> : displayedAlerts?.map((alertItem, idx) => (<div key={alertItem.id || idx} className="flex gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group" onClick={() => { if (alertItem.listingId) window.open(`/${locale}/listings/${alertItem.listingId}`, "_blank"); }}><div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 text-base transition-transform group-hover:scale-105"><IoTimeOutline className="text-sky-600" /></div><div className="flex-1 min-w-0"><p className="text-xs font-bold text-slate-900 leading-none mb-0.5">{alertItem.title}</p><p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{alertItem.description}</p><p className="text-[10px] text-slate-400 mt-1">{alertItem.time}</p></div></div>))}
          </div>
          {hasMoreAlerts && <button onClick={() => setShowAllAlertsState(!showAllAlertsState)} className="w-full mt-4 py-2.5 border border-slate-200 text-indigo-500 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">{showAllAlertsState ? <><IoEyeOffOutline className="text-sm" />{t("alertsViewLess")}</> : <><IoEyeOutline className="text-sm" />{t("alertsViewAll")} ({recentAlerts?.length})</>}</button>}
        </div>
      </div>
    </div>
  );
}