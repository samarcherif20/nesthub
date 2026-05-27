// app/[locale]/admin/listings/validation/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import {
  IoSearchOutline,
  IoHourglassOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoHomeOutline,
  IoTrendingUpOutline,
  IoCheckmarkCircle,
  IoTimeOutline as IoTimeIcon,
  IoEyeOutline,
  IoGitBranchOutline,
  IoCreateOutline,
  IoCloseOutline,
  IoCheckmarkDoneCircleOutline,
  IoCloseCircleOutline,
  IoCalendarOutline,
} from "react-icons/io5";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import { useAdminListingsValidation } from "./hooks/useAdminListingsValidation";

interface Toast {
  type: "success" | "error";
  message: string;
}

const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

export default function ListingsValidationPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("AdminListingsValidation");
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const {
    listings,
    loading,
    initialLoading,
    activeTab,
    pagination,
    tempSearch,
    stats,
    imageErrors,
    setTempSearch,
    handleTabChange,
    handleSearchSubmit,
    handleSearchClear,
    handlePageChange,
    handleLimitChange,
    handleImageError,
    getAvatarUrl,
    getListingImageUrl,
    getListingTypeLabel,
    formatPrice,
  } = useAdminListingsValidation(locale);

  const getStatusBadge = (status: string, hasPendingRevision: boolean) => {
    if (status === "PENDING_REVIEW" && !hasPendingRevision) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 flex items-center gap-1">
          {t("badgeNew")}
        </span>
      );
    }
    if (status === "ACTIVE" && hasPendingRevision) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1">
          {t("badgeModification")}
        </span>
      );
    }
    if (status === "ACTIVE" && !hasPendingRevision) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1">
          {t("badgePublished")}
        </span>
      );
    }
    if (status === "REJECTED") {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
           {t("badgeRejected")}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        {t("badgePending")}
      </span>
    );
  };

  const getHistoryBadge = (listing: any) => {
    if (listing.status === "ACTIVE") {
      return (
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            {t("badgeValidated")}
          </span>
          {listing.validatedAt && (
            <span className="text-[9px] text-slate-400 flex items-center gap-1">
              <IoCalendarOutline size={9} />
              {format(new Date(listing.validatedAt), "dd/MM/yyyy", { locale: fr })}
            </span>
          )}
        </div>
      );
    }
    if (listing.status === "REJECTED") {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full text-[9px] font-bold uppercase bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {t("badgeRejected")}
            </span>
            {listing.rejectedAt && (
              <span className="text-[9px] text-slate-400 flex items-center gap-1">
                <IoCalendarOutline size={9} />
                {format(new Date(listing.rejectedAt), "dd/MM/yyyy", { locale: fr })}
              </span>
            )}
          </div>
          {listing.rejectionReason && (
            <p className="text-[9px] text-red-600 dark:text-red-400 max-w-[200px] truncate">
              {t("reasonPrefix")} {listing.rejectionReason}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const tabs = [
    { id: "all" as const, label: t("tabAll"), icon: IoHourglassOutline, count: stats.total },
    { id: "pending" as const, label: t("tabNew"), icon: IoCreateOutline, count: stats.pending },
    { id: "revisions" as const, label: t("tabRevisions"), icon: IoGitBranchOutline, count: stats.revisions },
    { id: "history" as const, label: t("tabHistory"), icon: IoTimeOutline, count: stats.validated + stats.rejected },
  ];

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
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

      <div className="flex-1">
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t("title")}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t("description")}</p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-orange-100 dark:border-orange-900/40 p-4 ${card3d}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <IoHourglassOutline className="text-orange-600 dark:text-orange-400 text-lg" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t("statsPending")}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center text-orange-500 text-[11px] font-semibold">
                  <IoTrendingUpOutline className="text-sm mr-1" />
                  <span>{stats.pending} {t("newListings")}, {stats.revisions} {t("modifications")}</span>
                </div>
              </div>
            </div>

            <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 p-4 ${card3d}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <IoCheckmarkCircle className="text-emerald-600 dark:text-emerald-400 text-lg" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t("statsProcessedToday")}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.processedToday}</p>
                </div>
              </div>
            </div>

            <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-purple-900/40 p-4 ${card3d}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <IoTimeIcon className="text-purple-600 dark:text-purple-400 text-lg" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t("statsAvgTime")}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgResponseTime}h</p>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center text-slate-500 text-[11px] font-semibold">
                  <IoTimeIcon className="text-sm mr-1" />
                  <span>{t("statsTarget")}</span>
                </div>
              </div>
            </div>

            <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-blue-100 dark:border-blue-900/40 p-4 ${card3d}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <IoCheckmarkDoneCircleOutline className="text-blue-600 dark:text-blue-400 text-lg" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t("statsHistory")}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.validated}</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">{stats.rejected}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(stats.validated / (stats.validated + stats.rejected || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500">
                    {Math.round((stats.validated / (stats.validated + stats.rejected || 1)) * 100)}% {t("statsValidated")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
                  <input
                    type="text"
                    value={tempSearch}
                    onChange={(e) => setTempSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                    placeholder={t("searchPlaceholder")}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100"
                  />
                  {tempSearch && (
                    <button
                      onClick={handleSearchClear}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <IoCloseOutline size={18} />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearchSubmit}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t("searchLoading") : t("searchButton")}
                </button>
              </div>
            </div>
          </div>

          {/* Results count + page size */}
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {pagination.totalCount > 0 ? (
                <>
                  {t("showing")}{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">{listings.length}</span>{" "}
                  {t("of")}{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">{pagination.totalCount}</span>{" "}
                  {t("properties")}
                </>
              ) : (
                t("noResults")
              )}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500 dark:text-slate-400">{t("show")}</label>
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                className="px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm text-slate-900 dark:text-slate-100"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden w-full max-w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      {t("tableHeaderOwner")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      {t("tableHeaderListing")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      {t("tableHeaderType")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      {t("tableHeaderPrice")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      {t("tableHeaderDate")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      {t("tableHeaderStatus")}
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      {t("tableHeaderActions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading && listings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <LoadingSpinner size="md" color="primary" />
                       </td>
                    </tr>
                  ) : listings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <IoHomeOutline className="w-12 h-12 text-slate-400 mb-3" />
                          <p className="text-slate-500 dark:text-slate-400">
                            {activeTab === "history" ? t("noHistory") : t("noResults")}
                          </p>
                        </div>
                       </td>
                    </tr>
                  ) : (
                    listings.map((listing) => {
                      const listingImageUrl = listing.images?.[0];
                      const proxiedUrl = getListingImageUrl(listingImageUrl);
                      const hasImageError = imageErrors[listing.id];
                      const displayPrice = listing.pricePerNight || listing.pricePerMonth;
                      const priceUnit = listing.pricePerNight ? t("pricePerNight") : t("pricePerMonth");

                      return (
                        <tr
                          key={listing.id}
                          className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors"
                        >
                          {/* Owner */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 overflow-hidden flex items-center justify-center">
                                {listing.owner.profilePictureUrl ? (
                                  <img
                                    src={getAvatarUrl(listing.owner.profilePictureUrl)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                  />
                                ) : (
                                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                    {listing.owner.firstName?.charAt(0) || "P"}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                  {listing.owner.firstName} {listing.owner.lastName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {listing.owner.email}
                                </p>
                              </div>
                            </div>
                           </td>

                          {/* Listing */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                                {listingImageUrl && !hasImageError ? (
                                  <img
                                    src={proxiedUrl}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                    onError={() => handleImageError(listing.id)}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                    <IoHomeOutline className="w-5 h-5 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px]">
                                  {listing.title}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <IoLocationOutline className="text-[9px]" />
                                  <span className="truncate max-w-[150px]">
                                    {listing.governorate}, {listing.delegation}
                                  </span>
                                </p>
                              </div>
                            </div>
                           </td>

                          {/* Type */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {getListingTypeLabel(listing.type)}
                            </span>
                           </td>

                          {/* Price */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {displayPrice ? (
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">
                                  {formatPrice(displayPrice)}
                                </p>
                                <p className="text-[9px] text-slate-400">{priceUnit}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                           </td>

                          {/* Date */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <p className="text-sm text-slate-900 dark:text-white">
                              {format(new Date(listing.createdAt), "dd MMM yyyy", { locale: fr })}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true, locale: fr })}
                            </p>
                           </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            {activeTab === "history"
                              ? getHistoryBadge(listing)
                              : getStatusBadge(listing.status, listing.hasPendingRevision)}
                           </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <Link
                              href={`/${locale}/admin/listings/validation/${listing.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-all"
                            >
                              <IoEyeOutline className="text-sm" />
                              {activeTab === "history" ? t("actionView") : t("actionProcess")}
                            </Link>
                           </td>
                         </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="border-t border-indigo-50 dark:border-indigo-900/30 px-4 py-3">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalCount}
                  pageSize={pagination.limit}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}