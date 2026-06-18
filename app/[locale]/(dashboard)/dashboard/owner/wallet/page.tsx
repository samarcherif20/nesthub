// app/[locale]/dashboard/owner/wallet/page.tsx
"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Pagination from "@/components/ui/Pagination";
import { useOwnerWallet } from "./hooks/useOwnerWallet";
import {
  IoWalletOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoCardOutline,
  IoRefreshOutline,
  IoInformationCircleOutline,
  IoLockClosedOutline,
  IoCashOutline,
  IoCalendarClearOutline,
  IoAlertCircleOutline,
  IoCloseOutline,
} from "react-icons/io5";

const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";

export default function OwnerWalletPage() {
  const {
    walletData,
    transactions,
    loading,
    currentPage,
    totalPages,
    totalCount,
    statusFilter,
    dateFilter,
    toast,
    locale,
    setCurrentPage,
    setStatusFilter,
    setDateFilter,
    handleRefresh,
    setToast,
    formatDate,
    PAGE_SIZE,  
  } = useOwnerWallet();

  const t = useTranslations("OwnerWallet");

  const statsCards = [
    {
      title: t("stats.available"),
      value: `${walletData?.availableBalance?.toLocaleString(locale) || 0} TND`,
      icon: IoWalletOutline,
      grad: "from-indigo-500 to-blue-600",
      bg: "border-indigo-100 dark:border-indigo-900/40",
      text: "text-indigo-600 dark:text-indigo-400",
    },
    {
      title: t("stats.pending"),
      value: `${walletData?.pendingBalance?.toLocaleString(locale) || 0} TND`,
      icon: IoTimeOutline,
      grad: "from-amber-400 to-orange-500",
      bg: "border-amber-100 dark:border-amber-900/40",
      text: "text-amber-600 dark:text-amber-400",
    },
    {
      title: t("stats.totalEarned"),
      value: `${walletData?.totalEarned?.toLocaleString(locale) || 0} TND`,
      icon: IoCashOutline,
      grad: "from-emerald-400 to-teal-500",
      bg: "border-emerald-100 dark:border-emerald-900/40",
      text: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  const tabs = [
    { id: "all" as const, label: t("tabs.all"), icon: IoCardOutline },
    { id: "paid" as const, label: t("tabs.paid"), icon: IoCheckmarkCircleOutline },
    { id: "pending" as const, label: t("tabs.pending"), icon: IoTimeOutline },
  ];

  const dateOptions = [
    { value: "all", label: t("dateOptions.all") },
    { value: "week", label: t("dateOptions.week") },
    { value: "month", label: t("dateOptions.month") },
    { value: "year", label: t("dateOptions.year") },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto p-6 gap-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl backdrop-blur-sm ${
            toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          }`}>
            {toast.type === "success" ? <IoCheckmarkCircleOutline className="w-5 h-5" /> : <IoAlertCircleOutline className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
              <IoCloseOutline className="w-4 h-4" />
            </button>
          </div>
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
          {/* Filtre par date */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
            <IoCalendarOutline size={12} className="text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="text-xs font-medium bg-transparent focus:outline-none text-slate-700 dark:text-slate-300"
            >
              {dateOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {/* Filtre par statut */}
          <div className="flex p-1 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon size={12} /> {tab.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-500 hover:text-indigo-600 transition-colors"
            aria-label={t("actions.refresh")}
          >
            <IoRefreshOutline size={15} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading && !walletData ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 animate-pulse">
              <div className="h-4 w-20 bg-slate-100 dark:bg-slate-700 rounded mb-3" />
              <div className="h-7 w-28 bg-slate-100 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statsCards.map(({ title, value, icon: Icon, grad, bg, text }) => (
            <div key={title} className={`bg-white dark:bg-slate-900 rounded-2xl border ${bg} p-4 relative ${card3d} hover:shadow-md transition-all`}>
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <Icon className="text-white text-xl" />
                </div>
                <div>
                  <p className={`text-2xl font-black leading-none ${text}`}>{value}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium leading-tight">{title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bloc sécurité */}
      <div className={`bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 ${block3d}`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
            <IoLockClosedOutline className="text-emerald-600 dark:text-emerald-400 text-lg" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">{t("security.title")}</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-500/70 mt-1">{t("security.description")}</p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden ${block3d}`}>
        <div className="px-6 py-4 border-b border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{t("history.title")}</h3>
            <span className="text-xs text-slate-500">
              {totalCount} {totalCount > 1 ? t("history.transactions_plural") : t("history.transactions_singular")}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                    <div><div className="h-4 w-32 bg-slate-100 dark:bg-slate-700 rounded mb-2" /><div className="h-3 w-24 bg-slate-100 dark:bg-slate-700 rounded" /></div>
                  </div>
                  <div className="text-right"><div className="h-5 w-20 bg-slate-100 dark:bg-slate-700 rounded mb-2" /><div className="h-3 w-16 bg-slate-100 dark:bg-slate-700 rounded" /></div>
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 dark:from-sky-950/50 dark:to-purple-950/50 flex items-center justify-center shadow-lg">
                <IoWalletOutline size={48} className="text-sky-500 dark:text-sky-400" />
              </div>
            </div>
            <h3 className="text-2xl font-headline font-bold bg-gradient-to-r from-sky-600 to-purple-600 dark:from-sky-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
              {t("emptyState.title")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">{t("emptyState.description")}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((transaction, index) => (
              <motion.div key={transaction.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="p-4 hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${transaction.status === "paid" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                      {transaction.status === "paid" ? <IoCheckmarkCircleOutline className="text-emerald-600 dark:text-emerald-400 text-base" /> : <IoTimeOutline className="text-amber-600 dark:text-amber-400 text-base" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{transaction.reference || t("history.booking")}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1">
                          <IoCalendarClearOutline size={11} className="text-slate-400" />
                          <span className="text-xs text-slate-400">{formatDate(transaction.date)}</span>
                        </div>
                        {transaction.nights && (
                          <>
                            <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-xs text-slate-400">
                              {transaction.nights} {transaction.nights > 1 ? t("history.nights_plural") : t("history.nights_singular")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      +{transaction.amount?.toLocaleString(locale)} TND
                    </p>
                    <p className={`text-xs ${transaction.status === "paid" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {transaction.status === "paid" ? t("history.paid") : t("history.pending")}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && transactions.length > 0 && (
        <div className="mt-2">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            totalItems={totalCount} 
            pageSize={PAGE_SIZE} 
            onPageChange={setCurrentPage} 
          />
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <IoInformationCircleOutline className="text-slate-400 text-lg flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 dark:text-slate-400">{t("footer.info")}</p>
        </div>
      </div>
    </div>
  );
}