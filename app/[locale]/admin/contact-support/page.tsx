// app/[locale]/admin/contacts/page.tsx
"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle, AlertCircle, X } from "lucide-react";

import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import {
  IoMailOutline,
  IoPersonOutline,
  IoSearchOutline,
  IoCloseOutline,
  IoChatbubbleOutline,
} from "react-icons/io5";
import { PiUsersThree } from "react-icons/pi";
import { MdOutlinePending } from "react-icons/md";
import { BsEnvelope } from "react-icons/bs";
import { GoShieldCheck } from "react-icons/go";

import { useAdminContacts } from "./hooks/useAdminContacts";

interface Toast {
  type: "success" | "error";
  message: string;
}

const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

// Fonction pour obtenir l'URL de l'image de profil
const getProfileImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  return `/api/admin/serve-image?url=${encodeURIComponent(url)}`;
};

export default function AdminContactsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const router = useRouter();
  const t = useTranslations("AdminContacts");
  const [toast, setToast] = React.useState<Toast | null>(null);

  const {
    loading,
    searchTerm,
    typeFilter,
    statusFilter,
    currentPage,
    totalPages,
    paginatedMessages,
    stats,
    hasActiveFilters,
    setSearchTerm,
    setTypeFilter,
    setStatusFilter,
    setCurrentPage,
    resetFilters,
  } = useAdminContacts();

  const formatDate = (date: string) => {
    const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
    return new Date(date).toLocaleDateString(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleRowClick = (id: string) => {
    router.push(`/${locale}/admin/contact-support/${id}`);
  };

  // État pour gérer les erreurs d'image
  const [imageErrors, setImageErrors] = React.useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("page.title")}
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">
            {t("page.description")}
          </p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title: t("stats.totalInquiries"), value: stats.total, Icon: PiUsersThree, grad: "from-indigo-500 to-blue-600", cls: "text-indigo-600 dark:text-indigo-400" },
          { title: t("stats.pending"), value: stats.pending, Icon: MdOutlinePending, grad: "from-amber-400 to-orange-500", cls: "text-amber-600 dark:text-amber-400" },
          { title: t("stats.responseRate"), value: `${stats.responseRate.toFixed(1)}%`, Icon: GoShieldCheck, grad: "from-emerald-400 to-teal-500", cls: "text-emerald-600 dark:text-emerald-400" },
          { title: t("stats.userMessages"), value: stats.userMessages, Icon: IoPersonOutline, grad: "from-violet-500 to-purple-600", cls: "text-violet-600 dark:text-violet-400" },
          { title: t("stats.visitorMessages"), value: stats.visitorMessages, Icon: BsEnvelope, grad: "from-sky-400 to-blue-500", cls: "text-sky-600 dark:text-sky-400" },
        ].map(({ title, value, Icon, grad, cls }) => (
          <div key={title} className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-4 flex items-center gap-4 ${card3d}`}>
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm flex-shrink-0`}>
              <Icon className="text-white text-xl" />
            </div>
            <div>
              <p className={`text-2xl font-black leading-none ${cls}`}>{value}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium leading-tight">{title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* TABLEAU PRINCIPAL */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden ${block3d}`}>
        {/* Barre de filtres */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Recherche */}
            <div className="relative flex-1 min-w-[200px]">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("filters.searchPlaceholder")}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-700"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <IoCloseOutline size={18} />
                </button>
              )}
            </div>

            {/* Filtre Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-700 dark:text-slate-300"
            >
              <option value="all">{t("filters.type.all")}</option>
              <option value="user">{t("filters.type.user")}</option>
              <option value="visitor">{t("filters.type.visitor")}</option>
            </select>

            {/* Filtre Statut */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-700 dark:text-slate-300"
            >
              <option value="all">{t("filters.status.all")}</option>
              <option value="new">{t("filters.status.new")}</option>
              <option value="resolved">{t("filters.status.resolved")}</option>
            </select>

            {hasActiveFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
                <IoCloseOutline className="text-sm" />
                {t("resetFilters")}
              </button>
            )}
          </div>
        </div>

        {/* TABLEAU */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <LoadingSpinner />
            </div>
          ) : paginatedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <IoMailOutline className="text-4xl text-indigo-300 dark:text-indigo-600" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("messages.noMessages")}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                    {t("table.headers.sender")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                    {t("table.headers.type")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                    {t("table.headers.message")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                    {t("table.headers.status")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                    {t("table.headers.date")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                    {t("table.headers.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {paginatedMessages.map((msg) => {
                  // Vérifier si l'utilisateur a une image de profil
                  const hasProfileImage = msg.userId && (msg as any).userProfilePictureUrl && !imageErrors[msg.id];
                  const profileImageUrl = (msg as any).userProfilePictureUrl 
                    ? getProfileImageUrl((msg as any).userProfilePictureUrl)
                    : "";
                  
                  return (
                    <tr
                      key={msg.id}
                      onClick={() => handleRowClick(msg.id)}
                      className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 cursor-pointer transition-colors group"
                    >
                      {/* Expéditeur */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {/* Avatar avec image si utilisateur connecté */}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {msg.userId && profileImageUrl && !imageErrors[msg.id] ? (
                              <img
                                src={profileImageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={() => handleImageError(msg.id)}
                              />
                            ) : (
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                {getInitials(msg.fullName)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight">
                              {msg.fullName}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                              {msg.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            msg.userId
                              ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {msg.userId ? t("userType") : t("visitorType")}
                        </span>
                      </td>

                      {/* Message */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                          {msg.message.length > 80
                            ? msg.message.substring(0, 80) + "..."
                            : msg.message}
                        </p>
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-3.5">
                        {msg.status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            {t("statusNew")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            {t("statusReplied")}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(msg.createdAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleRowClick(msg.id)}
                          className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                          title={t("viewAndReply")}
                        >
                          <IoChatbubbleOutline className="text-base" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-indigo-50 dark:border-indigo-900/30 px-4 py-3">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={paginatedMessages.length}
              pageSize={10}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}