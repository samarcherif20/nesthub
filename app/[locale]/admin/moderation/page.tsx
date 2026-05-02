// app/[locale]/admin/moderation/page.tsx
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  IoChatbubblesOutline,
  IoFlagOutline,
  IoFlag,
  IoEyeOutline,
  IoCloseOutline,
  IoSearchOutline,
  IoShieldOutline,
  IoArrowForwardOutline,
  IoHomeOutline,
  IoLocationOutline,
  IoAlertCircleOutline,
} from "react-icons/io5";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertBanner from "@/components/ui/Alert";
import Pagination from "@/components/ui/Pagination";
import { useModeration } from "./hooks/useModeration";

const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

const getAvatarUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  return `/api/admin/serve-image?url=${encodeURIComponent(url)}`;
};

const getListingImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return "";
  return `/api/listings/image?url=${encodeURIComponent(imageUrl)}`;
};

export default function ModerationPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("Moderation");

  const {
    conversations,
    loading,
    pagination,
    filter,
    search,
    alert,
    actionLoading,
    imageErrors,
    totalActive,
    totalFlagged,
    setFilter,
    setSearch,
    handleAction,
    handlePageChange,
    handleImageError,
    setAlert,
    fetchConversations,
  } = useModeration();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {t("status.active")}
          </span>
        );
      case "FLAGGED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
            <IoFlag className="text-red-500 text-xs" />
            {t("status.flagged")}
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
            <IoCloseOutline className="text-slate-500 text-xs" />
            {t("status.closed")}
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
      {alert && (
        <div className="fixed top-20 right-8 z-50">
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {t("description")}
          </p>
        </div>
        <div className="flex gap-3">
          <div
            className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-3 flex items-center gap-3 ${card3d}`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm flex-shrink-0">
              <IoChatbubblesOutline className="text-white text-base" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                {t("stats.active")}
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                {totalActive}
              </p>
            </div>
          </div>
          <div
            className={`bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-900/40 p-3 flex items-center gap-3 ${card3d}`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-sm flex-shrink-0">
              <IoFlag className="text-white text-base" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                {t("stats.flagged")}
              </p>
              <p className="text-xl font-black text-red-600 dark:text-red-400 leading-none">
                {totalFlagged}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card */}
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
                placeholder={t("searchPlaceholder")}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-700"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-700 dark:text-slate-300"
            >
              <option value="all">{t("filters.all")}</option>
              <option value="active">{t("filters.active")}</option>
              <option value="flagged">{t("filters.flagged")}</option>
              <option value="closed">{t("filters.closed")}</option>
            </select>
            <button
              onClick={() => fetchConversations()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold shadow-sm transition-all"
            >
              {t("apply")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
              <IoChatbubblesOutline className="text-5xl mb-3" />
              <p className="text-sm font-medium">{t("empty")}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                    {t("table.participants")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                    {t("table.listing")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                    {t("table.lastMessage")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                    {t("table.date")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                    {t("table.status")}
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                    {t("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {conversations.map((conv) => {
                  const listingImageUrl = conv.listing?.image;
                  const proxiedUrl = getListingImageUrl(listingImageUrl);
                  const hasImageError = imageErrors[conv.id];
                  return (
                    <tr
                      key={conv.id}
                      className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 overflow-hidden border-2 border-white dark:border-slate-900 flex items-center justify-center">
                              {conv.participants.owner.avatar ? (
                                <img
                                  src={getAvatarUrl(
                                    conv.participants.owner.avatar,
                                  )}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={(e) =>
                                    (e.currentTarget.style.display = "none")
                                  }
                                />
                              ) : (
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                  {conv.participants.owner.firstName?.charAt(
                                    0,
                                  ) ||
                                    conv.participants.owner.name?.charAt(0) ||
                                    "O"}
                                </span>
                              )}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 overflow-hidden border-2 border-white dark:border-slate-900 flex items-center justify-center">
                              {conv.participants.tenant.avatar ? (
                                <img
                                  src={getAvatarUrl(
                                    conv.participants.tenant.avatar,
                                  )}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={(e) =>
                                    (e.currentTarget.style.display = "none")
                                  }
                                />
                              ) : (
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                  {conv.participants.tenant.firstName?.charAt(
                                    0,
                                  ) ||
                                    conv.participants.tenant.name?.charAt(0) ||
                                    "T"}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {conv.participants.owner.firstName ||
                                conv.participants.owner.name ||
                                t("participants.owner")}{" "}
                              {conv.participants.owner.lastName || ""}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {t("participants.and")}{" "}
                              {conv.participants.tenant.firstName ||
                                conv.participants.tenant.name ||
                                t("participants.tenant")}{" "}
                              {conv.participants.tenant.lastName || ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                            {listingImageUrl && !hasImageError ? (
                              <img
                                src={proxiedUrl}
                                alt={
                                  conv.listing.title || t("listing.untitled")
                                }
                                className="w-full h-full object-cover"
                                onError={() => handleImageError(conv.id)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                <IoHomeOutline className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px]">
                              {conv.listing.title || t("listing.untitled")}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <IoLocationOutline className="text-[9px]" />
                              <span className="truncate max-w-[150px]">
                                {conv.listing.location ||
                                  `${conv.listing.governorate || ""} ${conv.listing.delegation || ""}`}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p
                          className={`text-sm truncate max-w-[250px] ${conv.hasReports ? "text-red-600 dark:text-red-400 font-medium" : "text-slate-600 dark:text-slate-400"}`}
                        >
                          {conv.lastMessage && conv.lastMessage.length > 60
                            ? conv.lastMessage.substring(0, 60) + "..."
                            : conv.lastMessage || t("table.noMessage")}
                        </p>
                        {conv.reportCount > 0 && (
                          <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                            <IoAlertCircleOutline className="text-[9px]" />
                            {conv.reportCount} {t("table.reports")}
                            {conv.reportCount > 1 ? "s" : ""}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDistanceToNow(new Date(conv.lastMessageDate), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(conv.status)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/${locale}/admin/conversations/${conv.id}`}
                            className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                          >
                            <IoEyeOutline className="text-base" />
                          </Link>
                          {conv.status !== "FLAGGED" ? (
                            <button
                              onClick={() => handleAction(conv.id, "FLAG")}
                              disabled={actionLoading === conv.id}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50"
                            >
                              <IoFlagOutline className="text-base" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction(conv.id, "UNFLAG")}
                              disabled={actionLoading === conv.id}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50"
                            >
                              <IoFlag className="text-base" />
                            </button>
                          )}
                          {conv.status !== "CLOSED" ? (
                            <button
                              onClick={() => handleAction(conv.id, "CLOSE")}
                              disabled={actionLoading === conv.id}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50"
                            >
                              <IoCloseOutline className="text-base" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction(conv.id, "REOPEN")}
                              disabled={actionLoading === conv.id}
                              className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all disabled:opacity-50"
                            >
                              <IoChatbubblesOutline className="text-base" />
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
          <div className="flex-shrink-0 border-t border-indigo-50 dark:border-indigo-900/30 px-4 py-3">
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

      {/* Footer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className={`bg-gradient-to-br from-sky-600 to-violet-600 rounded-2xl p-5 text-white relative overflow-hidden ${card3d}`}
        >
          <div className="relative z-10">
            <h3 className="text-base font-bold mb-1">
              {t("footer.autoModeration")}
            </h3>
            <p className="text-white/70 text-xs mb-4">
              {t("footer.autoDescription")}
            </p>
            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition">
              {t("footer.runAudit")}
            </button>
          </div>
          <IoShieldOutline className="absolute -right-3 -bottom-3 text-[80px] text-white/10" />
        </div>
        <div
          className={`bg-slate-100 dark:bg-slate-800 rounded-2xl p-5 ${card3d}`}
        >
          <div className="relative z-10">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {t("footer.communityRules")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
              {t("footer.rulesDescription")}
            </p>
            <button className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 group">
              {t("footer.viewPolicy")}
              <IoArrowForwardOutline className="transition-transform group-hover:translate-x-0.5 text-xs" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
