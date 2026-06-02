"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  IoWalletOutline,
  IoLockClosedOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoRefreshOutline,
  IoCloseOutline,
  IoReceiptOutline,
  IoCalendarOutline,
  IoCashOutline,
  IoCheckmarkDoneOutline,
  IoWarningOutline,
  IoHomeOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoBedOutline,
  IoChevronForwardOutline,
  IoCopyOutline,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { X, TrendingDown, Clock, Calendar } from "lucide-react";
import { useWallet } from "./hooks/useWallet";

const GRADIENT_TEXT = "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent";

const proxyImage = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;

function fmtPrice(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TND";
}

function formatDate(date: string | Date) {
  return format(new Date(date), "dd MMMM yyyy", { locale: fr });
}

function formatDateTime(date: string | Date) {
  return format(new Date(date), "dd MMMM yyyy à HH:mm", { locale: fr });
}

function formatTimeAgo(date: string | Date) {
  const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `Il y a ${diff} secondes`;
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} minutes`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} heures`;
  return `Il y a ${Math.floor(diff / 86400)} jours`;
}

function StayCard({ stay, variant = "compact" }: { stay: any; variant?: "compact" | "full" }) {
  if (!stay || !stay.listingId) return null;
  const link = stay.bookingId ? `/fr/bookings/${stay.bookingId}` : `/fr/listings/${stay.listingId}`;

  if (variant === "compact") {
    return (
      <Link href={link} className="block group">
        <div className="flex items-center gap-3">
          {stay.listingImage && (
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
              <img src={proxyImage(stay.listingImage)} alt={stay.listingTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{stay.listingTitle}</p>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><IoCalendarOutline className="text-xs" /> {formatDate(stay.checkIn)}</span>
              <IoChevronForwardOutline className="text-[8px]" />
              <span>{formatDate(stay.checkOut)}</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">{stay.nights} nuits</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={link} className="block group">
      <div className="bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-sky-100 dark:border-sky-800 hover:border-sky-300 transition-all">
        <div className="flex gap-4">
          {stay.listingImage && (
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-sm">
              <img src={proxyImage(stay.listingImage)} alt={stay.listingTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-base font-bold text-gray-900 dark:text-white">{stay.listingTitle}</p>
            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
              <IoLocationOutline className="text-xs" /> {stay.location || "Tunisie"}
            </p>
            <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1"><IoCalendarOutline className="text-xs" /> {formatDate(stay.checkIn)} → {formatDate(stay.checkOut)}</span>
              <span className="flex items-center gap-1"><IoBedOutline className="text-xs" /> {stay.nights} nuits</span>
              <span className="flex items-center gap-1"><IoPersonOutline className="text-xs" /> {stay.guests} voyageurs</span>
            </div>
            {stay.reference && <p className="text-[9px] text-gray-400 font-mono mt-2">Réf: {stay.reference}</p>}
          </div>
          <IoChevronForwardOutline className="text-gray-400 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  );
}

function TxStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    COMPLETED: { label: "Terminé", color: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", icon: <IoCheckmarkCircleOutline className="text-emerald-500 text-xs" /> },
    PAID: { label: "Payé", color: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", icon: <IoCheckmarkCircleOutline className="text-emerald-500 text-xs" /> },
    PENDING: { label: "En attente", color: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800", icon: <IoTimeOutline className="text-amber-500 text-xs" /> },
    FAILED: { label: "Échoué", color: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800", icon: <IoWarningOutline className="text-rose-500 text-xs" /> },
    REFUNDED: { label: "Remboursé", color: "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800", icon: <IoRefreshOutline className="text-sky-500 text-xs" /> },
    RELEASED: { label: "Libéré", color: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", icon: <IoCheckmarkDoneOutline className="text-emerald-500 text-xs" /> },
  };
  const c = config[status] || config.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${c.color}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

function DepositStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    AUTHORIZED: { label: "Autorisée", color: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
    CHARGED: { label: "Prélevée", color: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800" },
    RELEASED: { label: "Libérée", color: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
    DISPUTED: { label: "Litige", color: "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" },
    FAILED: { label: "Échouée", color: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800" },
  };
  const c = config[status] || config.AUTHORIZED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${c.color}`}>
      {c.label}
    </span>
  );
}

export default function TenantWalletPage() {
  const t = useTranslations("Wallet");
  const {
    loading,
    balance,
    deposits,
    upcomingPayments,
    filteredTransactions,
    allFilteredCount,
    stats,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    showAllTx,
    setShowAllTx,
    selectedTransaction,
    setSelectedTransaction,
    dateRange,
    setDateRange,
    searchTerm,
    setSearchTerm,
    copyToClipboard,
  } = useWallet();

  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <TenantHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
          <LoadingSpinner size="lg" color="primary" variant="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <TenantHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70 dark:text-indigo-300">
            <IoWalletOutline className="h-3.5 w-3.5" />
            {t("badge")}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-6xl">
            {t("title")} <span className={GRADIENT_TEXT}>{t("titleHighlight")}</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
            {t("subtitle")}
          </p>
        </div>

        {/* Stats Cards - Light Purple */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="bg-purple-50/80 dark:bg-purple-950/40 backdrop-blur-sm rounded-2xl border border-purple-100 dark:border-purple-800 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">{t("stats.available")}</span>
              <IoCashOutline className="text-purple-500 text-lg" />
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{fmtPrice(balance.available)}</p>
            <p className="text-[10px] text-purple-400 mt-1">{t("stats.creditAvailable")}</p>
          </div>

          <div className="bg-purple-50/80 dark:bg-purple-950/40 backdrop-blur-sm rounded-2xl border border-purple-100 dark:border-purple-800 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">{t("stats.totalSpent")}</span>
              <TrendingDown className="text-purple-500 w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{fmtPrice(balance.totalSpent)}</p>
            <p className="text-[10px] text-purple-400 mt-1">{t("stats.totalSpentDesc")}</p>
          </div>

          <div className="bg-purple-50/80 dark:bg-purple-950/40 backdrop-blur-sm rounded-2xl border border-purple-100 dark:border-purple-800 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">{t("stats.transactions")}</span>
              <IoReceiptOutline className="text-purple-500 text-lg" />
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{filteredTransactions.length}</p>
            <p className="text-[10px] text-purple-400 mt-1">{t("stats.total")}</p>
            <div className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-800">
              <div className="flex justify-between text-[9px]">
                <span className="text-purple-500">{t("stats.average")}</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">{fmtPrice(stats.avgTransaction)}</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50/80 dark:bg-purple-950/40 backdrop-blur-sm rounded-2xl border border-purple-100 dark:border-purple-800 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">{t("stats.deposits")}</span>
              <IoLockClosedOutline className="text-purple-500 text-lg" />
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{stats.pendingDeposits}</p>
            <p className="text-[10px] text-purple-400 mt-1">{t("stats.activeGuarantees")}</p>
            <div className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-800">
              <div className="flex justify-between text-[9px]">
                <span className="text-purple-500">{t("stats.released")}</span>
                <span className="font-bold text-emerald-600">{stats.releasedDeposits}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl border border-white/70 dark:border-gray-800 p-4 mb-8">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {(["all", "payments", "deposits"] as const).map((type) => (
                <button key={type} onClick={() => setFilterType(type)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === type ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                  {t(`filters.${type}`)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-800 border-0">
                <option value="all">{t("filters.allStatus")}</option>
                <option value="completed">{t("filters.completed")}</option>
                <option value="pending">{t("filters.pending")}</option>
                <option value="failed">{t("filters.failed")}</option>
              </select>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value as any)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-800 border-0">
                <option value="all">{t("filters.allDates")}</option>
                <option value="month">{t("filters.last30Days")}</option>
                <option value="quarter">{t("filters.last3Months")}</option>
                <option value="year">{t("filters.last12Months")}</option>
              </select>
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t("filters.search")} className="px-3 py-1.5 rounded-lg text-xs bg-gray-100 dark:bg-gray-800 border-0 w-40" />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-white/70 dark:border-gray-800 overflow-hidden shadow-sm mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">{t("table.date")}</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">{t("table.stay")}</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">{t("table.reference")}</th>
                  <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">{t("table.amount")}</th>
                  <th className="text-center px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">{t("table.status")}</th>
                  <th className="text-center px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredTransactions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-gray-400">{t("empty")}</td></tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600 dark:text-gray-400">{formatDateTime(tx.date)}</div>
                        <div className="text-[9px] text-gray-400 mt-0.5">{formatTimeAgo(tx.date)}</div>
                      </td>
                      <td className="px-6 py-4">
                        {tx.stay ? <StayCard stay={tx.stay} variant="compact" /> : <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.description}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded cursor-pointer hover:bg-gray-200" onClick={() => handleCopy(tx.reference)}>
                          {tx.reference?.slice(-8)}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">-{fmtPrice(tx.amount)}</span>
                      </td>
                      <td className="px-6 py-4 text-center"><TxStatusBadge status={tx.status} /></td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => setSelectedTransaction(tx)} className="text-indigo-500 hover:text-indigo-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          {t("table.details")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {allFilteredCount > 10 && (
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-gray-800 text-center">
              <button onClick={() => setShowAllTx(!showAllTx)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                {showAllTx ? t("showLess") : t("showMore", { count: allFilteredCount - 10 })}
              </button>
            </div>
          )}
        </div>

        {/* Security Deposits */}
        {deposits.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-white/70 dark:border-gray-800 overflow-hidden shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <IoLockClosedOutline className="text-amber-500 text-lg" />
                <h2 className="text-lg font-black text-gray-900 dark:text-white">{t("deposits.title")}</h2>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">{deposits.length} {t("deposits.count")}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{t("deposits.subtitle")}</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {deposits.map((deposit) => (
                <div key={deposit.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{deposit.listingTitle}</p>
                      <DepositStatusBadge status={deposit.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {t("deposits.checkout")}: {formatDate(deposit.checkOutDate)}</span>
                      {deposit.authorizedAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t("deposits.authorized")}: {formatDate(deposit.authorizedAt)}</span>}
                    </div>
                  </div>
                  <div className="text-right sm:text-left">
                    <p className="text-xl font-black text-gray-900 dark:text-white">{fmtPrice(deposit.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Payments */}
        {upcomingPayments.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-white/70 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <IoTimeOutline className="text-amber-500 text-lg" />
                <h2 className="text-lg font-black text-gray-900 dark:text-white">{t("upcoming.title")}</h2>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">{upcomingPayments.length} {t("upcoming.count")}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{t("upcoming.subtitle")}</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {upcomingPayments.map((payment) => (
                <div key={payment.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {payment.listingImage && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={proxyImage(payment.listingImage)} alt={payment.listingTitle} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{payment.listingTitle}</p>
                        <p className="text-[10px] text-gray-400">{payment.location}</p>
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-400">
                          <span className="flex items-center gap-1"><IoCalendarOutline /> {formatDate(payment.checkIn)} → {formatDate(payment.checkOut)}</span>
                          <span className="flex items-center gap-1"><IoBedOutline /> {payment.nights} {t("upcoming.nights")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right sm:text-left">
                    <p className="text-xl font-black text-gray-900 dark:text-white">{fmtPrice(payment.amount)}</p>
                    <p className="text-[9px] text-rose-500">{t("upcoming.payBefore")} {formatDate(payment.dueDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction Details Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-900 p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("modal.title")}</h3>
                    <p className="text-[10px] text-gray-400">ID: {selectedTransaction.id}</p>
                  </div>
                  <button onClick={() => setSelectedTransaction(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-6 space-y-5">
                {selectedTransaction.stay && (
                  <div>
                    <p className="text-[9px] font-bold uppercase text-gray-400 mb-2">{t("modal.stay")}</p>
                    <StayCard stay={selectedTransaction.stay} variant="full" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[9px] font-bold uppercase text-gray-400">{t("modal.date")}</p><p className="text-sm">{formatDateTime(selectedTransaction.date)}</p></div>
                  <div><p className="text-[9px] font-bold uppercase text-gray-400">{t("modal.status")}</p><TxStatusBadge status={selectedTransaction.status} /></div>
                </div>
                {!selectedTransaction.stay && <div><p className="text-[9px] font-bold uppercase text-gray-400">{t("modal.description")}</p><p className="text-sm">{selectedTransaction.description}</p></div>}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase text-gray-400">{t("modal.amount")}</span>
                    <span className="text-2xl font-black text-gray-900 dark:text-white">-{fmtPrice(selectedTransaction.amount)}</span>
                  </div>
                </div>
                <div><p className="text-[9px] font-bold uppercase text-gray-400">{t("modal.reference")}</p><code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{selectedTransaction.reference}</code></div>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                  <button onClick={() => handleCopy(selectedTransaction.reference)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200">
                    <IoCopyOutline className="text-sm" /> {copied ? t("modal.copied") : t("modal.copy")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}