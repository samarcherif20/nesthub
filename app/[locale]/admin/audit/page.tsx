"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoWarningOutline,
  IoShieldOutline,
  IoPeopleOutline,
  IoDownloadOutline,
  IoDocumentTextOutline,
  IoTrendingUpOutline,
  IoServerOutline,
  IoCodeOutline,
} from "react-icons/io5";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import { useAuditLog } from "./hooks/useAuditLog";

const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

interface ToastState {
  type: "success" | "error";
  message: string;
}

function getAvatarUrl(url: string | null): string {
  if (!url) return "";
  return `/api/users/avatar?url=${encodeURIComponent(url)}`;
}

function formatDateTime(date: string | Date, locale: Locale) {
  return format(new Date(date), "dd MMMM yyyy à HH:mm", { locale });
}

function getActionBadge(action: string, t: any) {
  const config: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    DELETE_LISTING: { label: t("actions.deleteListing"), color: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400", icon: <IoWarningOutline className="text-xs" /> },
    REVIEW_DELETED: { label: t("actions.reviewDeleted"), color: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400", icon: <IoWarningOutline className="text-xs" /> },
    USER_SUSPENSION: { label: t("actions.userSuspension"), color: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400", icon: <IoShieldOutline className="text-xs" /> },
    ESCALATE_USER: { label: t("actions.escalateUser"), color: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400", icon: <IoWarningOutline className="text-xs" /> },
    BAN_USER: { label: t("actions.banUser"), color: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400", icon: <IoWarningOutline className="text-xs" /> },
    LOCK_USER: { label: t("actions.lockUser"), color: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400", icon: <IoShieldOutline className="text-xs" /> },
    REJECT_VERIFICATION: { label: t("actions.rejectVerification"), color: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400", icon: <IoWarningOutline className="text-xs" /> },
    ACTIVATE_USER: { label: t("actions.activateUser"), color: "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400", icon: <IoShieldOutline className="text-xs" /> },
    REVIEW_SHOWN: { label: t("actions.reviewShown"), color: "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400", icon: <IoShieldOutline className="text-xs" /> },
    VALIDATE_VERIFICATION: { label: t("actions.validateVerification"), color: "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400", icon: <IoShieldOutline className="text-xs" /> },
    VERIFICATION_VALIDATED: { label: t("actions.verificationValidated"), color: "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400", icon: <IoShieldOutline className="text-xs" /> },
    REVIEW_HIDDEN: { label: t("actions.reviewHidden"), color: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400", icon: <IoShieldOutline className="text-xs" /> },
    REVIEW_VISIBILITY_CHANGED: { label: t("actions.reviewVisibilityChanged"), color: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400", icon: <IoShieldOutline className="text-xs" /> },
    ADD_NOTE: { label: t("actions.addNote"), color: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400", icon: <IoCodeOutline className="text-xs" /> },
    REPLY_TO_CONTACT: { label: t("actions.replyToContact"), color: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400", icon: <IoCodeOutline className="text-xs" /> },
    UPDATE_STATIC_PAGE: { label: t("actions.updateStaticPage"), color: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400", icon: <IoCodeOutline className="text-xs" /> },
    RESTORE_VERSION: { label: t("actions.restoreVersion"), color: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400", icon: <IoCodeOutline className="text-xs" /> },
    REVIEW_REPORTED: { label: t("actions.reviewReported"), color: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400", icon: <IoWarningOutline className="text-xs" /> },
    VERIFICATION_REMINDER_SENT: { label: t("actions.verificationReminderSent"), color: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400", icon: <IoCodeOutline className="text-xs" /> },
    LOGIN_SUCCESS: { label: t("actions.loginSuccess"), color: "bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400", icon: <IoShieldOutline className="text-xs" /> },
    DB_BACKUP: { label: t("actions.dbBackup"), color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400", icon: <IoServerOutline className="text-xs" /> },
    MODERATION: { label: t("actions.moderation"), color: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400", icon: <IoShieldOutline className="text-xs" /> },
  };
  
  const c = config[action] || { 
    label: action.replace(/_/g, " "), 
    color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400", 
    icon: <IoCodeOutline className="text-xs" /> 
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${c.color}`}>
      {c.icon}
      <span className="hidden sm:inline">{c.label}</span>
    </span>
  );
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase() || "AD";
}

function formatDetails(action: string, details: any, t: any) {
  if (!details) return null;
  
  switch (action) {
    case "REVIEW_REPORTED":
      const reasonMap: Record<string, string> = {
        inappropriate: t("reasons.inappropriate"),
        fake: t("reasons.fake"),
        offensive: t("reasons.offensive"),
        spam: t("reasons.spam"),
        other: t("reasons.other")
      };
      return (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-medium text-gray-500">{t("details.reason")}:</span>
            <span className="text-[10px] text-gray-700 dark:text-gray-300">
              {reasonMap[details.reason] || details.reason}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-medium text-gray-500">{t("details.reportedBy")}:</span>
            <code className="text-[10px] font-mono">{details.reportedBy?.slice(-8)}</code>
          </div>
        </div>
      );
      
    case "REVIEW_VISIBILITY_CHANGED":
      return (
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-medium text-gray-500">{t("details.status")}:</span>
          <span className={`text-[10px] font-bold ${details.isPublished ? "text-green-600" : "text-red-600"}`}>
            {details.isPublished ? t("details.visible") : t("details.hidden")}
          </span>
        </div>
      );
      
    case "REVIEW_DELETED":
      return (
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-medium text-gray-500">{t("details.rating")}:</span>
          <span className="text-[10px] font-bold">{details.rating}/5 ⭐</span>
        </div>
      );
      
    case "ESCALATE_USER":
      return (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-medium text-gray-500">{t("details.level")}:</span>
            <span className="text-[10px] font-bold text-orange-600">{t("details.levelValue", { level: details.level })}</span>
          </div>
          {details.reason && (
            <div>
              <span className="text-[10px] font-medium text-gray-500">{t("details.reason")}:</span>
              <p className="text-[10px] mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                {details.reason.replace(/<[^>]*>/g, '')}
              </p>
            </div>
          )}
        </div>
      );
      
    case "REPLY_TO_CONTACT":
      return (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-medium text-gray-500">{t("details.visitor")}:</span>
            <span className="text-[10px]">{details.visitorName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-medium text-gray-500">{t("details.email")}:</span>
            <span className="text-[10px]">{details.visitorEmail}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-medium text-gray-500">{t("details.replyLength")}:</span>
            <span className="text-[10px]">{details.replyLength} {t("details.characters")}</span>
          </div>
        </div>
      );
      
    case "ADD_NOTE":
      return (
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-medium text-gray-500">{t("details.level")}:</span>
          <span className="text-[10px]">{details.level || t("details.standard")}</span>
        </div>
      );
      
    case "VERIFICATION_REMINDER_SENT":
      return (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-medium text-gray-500">{t("details.message")}:</span>
            <span className="text-[10px]">{details.message}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-medium text-gray-500">{t("details.adminsNotified")}:</span>
            <span className="text-[10px]">{details.adminsNotified}</span>
          </div>
        </div>
      );
      
    default:
      return (
        <pre className="text-[10px] font-mono text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-2 rounded">
          {JSON.stringify(details, null, 2)}
        </pre>
      );
  }
}

function DetailModal({ log, isOpen, onClose, t, locale }: any) {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 flex items-center justify-center">
                <IoDocumentTextOutline className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("modal.title")}</h3>
                <p className="text-[10px] text-gray-400">{t("modal.id")}: {log.id?.slice(-8)}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-bold uppercase text-gray-400">{t("modal.date")}</p>
              <p className="text-sm font-medium">{formatDateTime(log.createdAt, locale === "fr" ? fr : enUS)}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase text-gray-400">{t("modal.action")}</p>
              {getActionBadge(log.action, t)}
            </div>
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase text-gray-400">{t("modal.admin")}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 overflow-hidden flex-shrink-0">
                {log.adminAvatar ? (
                  <img src={getAvatarUrl(log.adminAvatar)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-[8px]">
                    {getInitials(log.adminName.split(" ")[0], log.adminName.split(" ")[1] || "")}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{log.adminName}</p>
                <p className="text-[10px] text-gray-400">{log.adminEmail}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-bold uppercase text-gray-400">{t("modal.targetType")}</p>
              <p className="text-sm font-medium">{log.targetType}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase text-gray-400">{t("modal.targetId")}</p>
              <code className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{log.targetId}</code>
            </div>
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase text-gray-400">{t("modal.ipAddress")}</p>
            <p className="text-sm font-mono">{log.ipAddress || "-"}</p>
          </div>

          {log.details && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <p className="text-[9px] font-bold uppercase text-gray-400 mb-3">{t("modal.details")}</p>
              {formatDetails(log.action, log.details, t)}
            </div>
          )}

          {log.motif && (
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
              <p className="text-[9px] font-bold uppercase text-amber-600 mb-2">{t("modal.motif")}</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">{log.motif.replace(/<[^>]*>/g, '')}</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200">
              {t("modal.close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuditLogPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("AuditLog");
  const [toast, setToast] = useState<ToastState | null>(null);
  
  const {
    loading,
    logs,
    pagination,
    stats,
    availableAdmins,
    availableActions,
    filterAdmin,
    setFilterAdmin,
    filterAction,
    setFilterAction,
    filterTarget,
    setFilterTarget,
    dateRange,
    setDateRange,
    searchTerm,
    setSearchTerm,
    selectedLog,
    showDetailModal,
    openDetailModal,
    closeDetailModal,
    handlePageChange,
    exportCSV,
     exportPDF,
  exporting
  } = useAuditLog();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Override exportCSV pour ajouter un toast
  const handleExportCSV = async () => {
    try {
      await exportCSV();
      showToast("success", t("toasts.exportSuccess"));
    } catch (error) {
      showToast("error", t("errors.export"));
    }
  };
const handleExportPDF = async () => {
  try {
    await exportPDF();
    showToast("success", t("toasts.pdfExportSuccess"));
  } catch (error) {
    showToast("error", t("errors.export"));
  }
};
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex">
          <main className="flex-1 p-10">
            <div className="flex items-center justify-center h-96">
              <LoadingSpinner size="lg" color="primary" variant="spinner" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
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

      <div className="flex">
        <main className="flex-1 p-10">
          {/* Header */}
          <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                  {t("badge")}
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {t("title")}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl mt-1">
                {t("description")}
              </p>
            </div>
            <div className="flex gap-3 ml-auto">
  <button
    onClick={handleExportCSV}
    disabled={exporting}
    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
  >
    {exporting ? (
      <Loader2 className="w-4 h-4 animate-spin" />
    ) : (
      <IoDownloadOutline className="text-lg" />
    )}
    {t("exportCSV")}
  </button>
  <button
    onClick={handleExportPDF}
    disabled={exporting}
    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
  >
    {exporting ? (
      <Loader2 className="w-4 h-4 animate-spin" />
    ) : (
      <IoDocumentTextOutline className="text-lg" />
    )}
    {t("exportPDF")}
  </button>
</div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`bg-white dark:bg-gray-800 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/40 ${card3d}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <IoTrendingUpOutline className="text-emerald-600 dark:text-emerald-400 text-xl" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                  {stats.trend}
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase text-gray-400">{t("stats.totalEvents")}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalEvents}</p>
            </div>

            <div className={`bg-white dark:bg-gray-800 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/40 ${card3d}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <IoShieldOutline className="text-amber-600 dark:text-amber-400 text-xl" />
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                  {t("stats.highPriority")}
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase text-gray-400">{t("stats.securityFlags")}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.securityFlags}</p>
            </div>

            <div className={`bg-white dark:bg-gray-800 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/40 ${card3d}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <IoPeopleOutline className="text-indigo-600 dark:text-indigo-400 text-xl" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                  {t("stats.stable")}
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase text-gray-400">{t("stats.activeAdmins")}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.activeAdmins}</p>
            </div>
          </div>

          {/* Filters Panel */}
          <div className={`bg-white dark:bg-gray-800 rounded-2xl mb-8 overflow-hidden border border-indigo-100 dark:border-indigo-900/40 ${block3d}`}>
            <div className="p-5 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5 border-b border-indigo-100 dark:border-indigo-900/30">
              <div className="flex flex-wrap items-end gap-4">
                {/* Date Range */}
                <div className="flex-1 min-w-[180px]">
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">{t("filters.dateRange")}</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="all">{t("filters.allDates")}</option>
                    <option value="24h">{t("filters.last24h")}</option>
                    <option value="7days">{t("filters.last7days")}</option>
                    <option value="30days">{t("filters.last30days")}</option>
                  </select>
                </div>

                {/* Admin User - DYNAMIQUE */}
                <div className="flex-1 min-w-[180px]">
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">{t("filters.adminUser")}</label>
                  <select
                    value={filterAdmin}
                    onChange={(e) => setFilterAdmin(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="all">{t("filters.allAdmins")}</option>
                    {availableAdmins.map((admin: any) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Category - DYNAMIQUE */}
                <div className="flex-1 min-w-[180px]">
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">{t("filters.actionCategory")}</label>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="all">{t("filters.allCategories")}</option>
                    {availableActions.map((action: string) => (
                      <option key={action} value={action}>
                        {action.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Type */}
                <div className="flex-1 min-w-[180px]">
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">{t("filters.targetType")}</label>
                  <select
                    value={filterTarget}
                    onChange={(e) => setFilterTarget(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="all">{t("filters.allTypes")}</option>
                    <option value="REVIEW">{t("types.review")}</option>
                    <option value="USER">{t("types.user")}</option>
                    <option value="LISTING">{t("types.listing")}</option>
                    <option value="BOOKING">{t("types.booking")}</option>
                    <option value="CONTACT_MESSAGE">{t("types.contactMessage")}</option>
                    <option value="VERIFICATION_REQUEST">{t("types.verificationRequest")}</option>
                  </select>
                </div>

                <button className="bg-indigo-500 hover:bg-indigo-600 text-white p-2.5 rounded-xl transition-all">
                  <IoFilterOutline className="text-lg" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-5">
              <div className="relative">
                <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-lg" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className={`bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-indigo-100 dark:border-indigo-900/40 ${block3d}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-indigo-50/50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase text-gray-500">{t("table.timestamp")}</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase text-gray-500">{t("table.administrator")}</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase text-gray-500">{t("table.actionType")}</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase text-gray-500">{t("table.resourceId")}</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase text-gray-500">{t("table.ipAddress")}</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold uppercase text-gray-500">{t("table.details")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-gray-400">{t("empty")}</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{format(new Date(log.createdAt), "dd MMM yyyy", { locale: locale === "fr" ? fr : enUS })}</div>
                          <div className="text-[10px] text-gray-400">{format(new Date(log.createdAt), "HH:mm:ss")}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 overflow-hidden flex-shrink-0">
                              {log.adminAvatar ? (
                                <img src={getAvatarUrl(log.adminAvatar)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-[9px]">
                                  {getInitials(log.adminName.split(" ")[0], log.adminName.split(" ")[1] || "")}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">{log.adminName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getActionBadge(log.action, t)}</td>
                        <td className="px-6 py-4">
                          <code className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{log.targetId?.slice(-8)}</code>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-gray-500">{log.ipAddress || "-"}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => openDetailModal(log)}
                            className="text-indigo-500 hover:text-indigo-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {t("table.viewDetails")}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-900/10">
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
        </main>
      </div>

      {/* Detail Modal */}
      <DetailModal log={selectedLog} isOpen={showDetailModal} onClose={closeDetailModal} t={t} locale={locale} />
    </div>
  );
}