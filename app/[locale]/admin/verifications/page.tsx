// app/[locale]/admin/verifications/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useVerifications } from "./hooks/useVerifications";
import { CheckCircle, AlertCircle, X } from "lucide-react";

import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { IoIosSearch } from "react-icons/io";

import {
  MdOutlinePendingActions,
  MdOutlineFactCheck,
  MdMarkEmailRead,
} from "react-icons/md";
import {
  TbRefresh,
  TbLayoutDashboard,
  TbHistoryToggle,
  TbArrowUp,
  TbArrowDown,
} from "react-icons/tb";
import { FaRegCheckCircle } from "react-icons/fa";
import {
  IoArrowForwardOutline,
  IoFilterOutline,
  IoCloseOutline,
} from "react-icons/io5";
import { RiUserSharedLine } from "react-icons/ri";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { enUS } from "date-fns/locale";

interface Toast {
  type: "success" | "error";
  message: string;
}

type SortField = "date" | "user" | "status";
type SortOrder = "asc" | "desc";

const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

export default function VerificationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("Verifications");

  const [toast, setToast] = useState<Toast | null>(null);
  const [documentTypeFilter, setDocumentTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [tempSearch, setTempSearch] = useState("");
  const [search, setSearch] = useState("");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const {
    requests,
    stats,
    pagination,
    loading,
    error,
    isAdmin,
    isUserLoaded,
    setPage,
    refresh,
  } = useVerifications();

  // Gérer les erreurs du hook
  useEffect(() => {
    if (error) {
      showToast("error", error);
    }
  }, [error]);

  // Filtrage local
  const filteredRequests = requests.filter((req) => {
    // Filtre par type de document
    if (documentTypeFilter !== "ALL") {
      const isPassport =
        req.documentType === "passport" ||
        req.cinData?.documentType === "PASSPORT";
      if (documentTypeFilter === "PASSPORT" && !isPassport) return false;
      if (documentTypeFilter === "CIN" && isPassport) return false;
    }
    // Filtre par statut
    if (statusFilter !== "ALL") {
      if (req.status !== statusFilter) return false;
    }
    // Filtre par recherche textuelle
    if (search) {
      const searchLower = search.toLowerCase();
      const fullName =
        `${req.user.firstName} ${req.user.lastName}`.toLowerCase();
      const email = req.user.email?.toLowerCase() || "";
      if (!fullName.includes(searchLower) && !email.includes(searchLower))
        return false;
    }
    return true;
  });

  // Tri
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let aVal: any, bVal: any;
    switch (sortField) {
      case "date":
        aVal = new Date(a.submittedAt).getTime();
        bVal = new Date(b.submittedAt).getTime();
        break;
      case "user":
        aVal = `${a.user.firstName} ${a.user.lastName}`.toLowerCase();
        bVal = `${b.user.firstName} ${b.user.lastName}`.toLowerCase();
        break;
      case "status":
        aVal = a.status;
        bVal = b.status;
        break;
      default:
        return 0;
    }
    if (typeof aVal === "string") {
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <TbArrowUp className="inline ml-1 text-xs" />
    ) : (
      <TbArrowDown className="inline ml-1 text-xs" />
    );
  };

  const formatRelativeTime = (date: string) => {
    const dateLocale = locale === "fr" ? fr : enUS;
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: dateLocale,
    });
  };

  const handleSearchSubmit = () => {
    setSearch(tempSearch);
    setPage(1);
  };

  const handleSearchClear = () => {
    setTempSearch("");
    setSearch("");
    setPage(1);
  };

  const resetAllFilters = () => {
    setDocumentTypeFilter("ALL");
    setStatusFilter("ALL");
    setSearch("");
    setTempSearch("");
    setPage(1);
  };

  const hasActiveFilters =
    documentTypeFilter !== "ALL" || statusFilter !== "ALL" || search;

  if (!isUserLoaded || isAdmin === null)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );

  if (isAdmin === false)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-10 bg-white dark:bg-slate-900 rounded-2xl shadow-lg">
          <RiUserSharedLine className="text-6xl text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            {t("unauthorized")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t("adminRequired")}
          </p>
        </div>
      </div>
    );

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">
            {t("description")}
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          {[
            {
              title: t("stats.pending"),
              value: stats?.pendingCount ?? 0,
              Icon: MdOutlinePendingActions,
              grad: "from-amber-400 to-orange-500",
              border: "border-amber-100 dark:border-amber-900/40",
              cls: "text-amber-600 dark:text-amber-400",
            },
            {
              title: t("stats.processedToday"),
              value: stats?.processedToday ?? 0,
              Icon: MdOutlineFactCheck,
              grad: "from-indigo-500 to-violet-600",
              border: "border-indigo-100 dark:border-indigo-900/40",
              cls: "text-indigo-600 dark:text-indigo-400",
            },
          ].map(({ title, value, Icon, grad, border, cls }) => (
            <div
              key={title}
              className={`bg-white dark:bg-slate-900 rounded-2xl border ${border} px-4 py-3 flex items-center gap-3 ${card3d}`}
            >
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm flex-shrink-0`}
              >
                <Icon className="text-white text-base" />
              </div>
              <div>
                <p className={`text-xl font-black leading-none ${cls}`}>
                  {value}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                  {title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Card */}
      <div
        className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden ${block3d}`}
      >
        {/* Search and Filters Bar - TOUT EN UNE LIGNE */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <IoIosSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
              <input
                type="text"
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                placeholder={t("searchPlaceholder")}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-700"
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

            {/* Filtre Type de document */}
            <select
              value={documentTypeFilter}
              onChange={(e) => setDocumentTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">{t("allDocuments")}</option>
              <option value="CIN">{t("document.cin")}</option>
              <option value="PASSPORT">{t("document.passport")}</option>
            </select>

            {/* Filtre Statut */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">{t("allStatus")}</option>
              <option value="PENDING">{t("status.pending")}</option>
              <option value="VALIDATED">{t("status.validated")}</option>
              <option value="REJECTED">{t("status.rejected")}</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <IoCloseOutline className="text-sm" />
                {t("resetFilters")}
              </button>
            )}

            <button
              onClick={refresh}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-indigo-500 hover:border-indigo-400 hover:text-indigo-700 transition-all text-sm font-medium"
            >
              <TbRefresh className="text-base" />
              {t("refresh")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <LoadingSpinner />
            </div>
          ) : sortedRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/15 to-violet-400/15 rounded-full blur-3xl scale-150" />
                <div className="relative w-72 h-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden border border-indigo-100 dark:border-indigo-900/40">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                        <MdMarkEmailRead
                          className="text-indigo-300 dark:text-indigo-600"
                          size={100}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-3 -right-4 w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl">
                  <FaRegCheckCircle className="text-white" size={20} />
                </div>
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight text-center">
                {t("empty.title")}
              </h3>
              <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-lg leading-relaxed text-center">
                {t("empty.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link
                  href={`/${locale}/admin/dashboard`}
                  className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm shadow-sm transition-all"
                >
                  <TbLayoutDashboard size={18} />
                  {t("empty.backToDashboard")}
                </Link>
                <Link
                  href={`/${locale}/admin/verifications/history`}
                  className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:border-indigo-400 transition-all"
                >
                  <TbHistoryToggle size={18} />
                  {t("empty.viewHistory")}
                </Link>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-indigo-50/50 dark:bg-indigo-900/10">
                <tr className="border-b border-indigo-100 dark:border-indigo-900/30">
                  <th
                    className="px-5 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600"
                    onClick={() => handleSort("user")}
                  >
                    {t("table.user")} {getSortIcon("user")}
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                    {t("table.role")}
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                    {t("table.documentType")}
                  </th>
                  <th
                    className="px-5 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600"
                    onClick={() => handleSort("date")}
                  >
                    {t("table.date")} {getSortIcon("date")}
                  </th>
                  <th
                    className="px-5 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600"
                    onClick={() => handleSort("status")}
                  >
                    {t("table.status")} {getSortIcon("status")}
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                    {t("table.action")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {sortedRequests.map((req) => {
                  const isPassport =
                    req.documentType === "passport" ||
                    req.cinData?.documentType === "PASSPORT";
                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex-shrink-0">
                            {req.user.profilePictureUrl ? (
                              <img
                                src={`/api/admin/serve-image?url=${encodeURIComponent(req.user.profilePictureUrl)}`}
                                alt={req.user.firstName || ""}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                {req.user.firstName?.[0]}
                                {req.user.lastName?.[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight">
                              {req.user.firstName} {req.user.lastName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {req.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`
    inline-flex text-xs font-semibold px-2.5 py-1 rounded-full uppercase
    ${
      req.user.role === "PROPERTY_OWNER"
        ? "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800"
        : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
    }
  `}
                        >
                          {req.user.role === "PROPERTY_OWNER"
                            ? t("role.owner")
                            : t("role.tenant")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${
                            isPassport
                              ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          }`}
                        >
                          {isPassport
                            ? t("document.passport")
                            : t("document.cin")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {formatRelativeTime(req.submittedAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {req.status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {t("status.pending")}
                          </span>
                        ) : req.status === "VALIDATED" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {t("status.validated")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {t("status.rejected")}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/${locale}/admin/verifications/${req.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          {t("processRequest")}
                          <IoArrowForwardOutline />
                        </Link>
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
          <div className="flex-shrink-0 border-t border-indigo-50 dark:border-indigo-900/30 px-5 py-3">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalCount}
              pageSize={pagination.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
