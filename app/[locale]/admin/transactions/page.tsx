// app/[locale]/admin/transactions/page.tsx
"use client";
import { useState } from "react";  

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import {
  IoSearchOutline,
  IoDownloadOutline,
  IoRefreshOutline,
  IoReceiptOutline,
  IoHomeOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoHourglassOutline,
  IoStatsChartOutline,
  IoRefreshCircleOutline,
  IoPersonOutline,
  IoMailOutline,
  IoAlertCircleOutline,
} from "react-icons/io5";
import { MdOutlinePercent, MdOutlinePayment } from "react-icons/md";
import { BsFiletypeCsv, BsFiletypePdf, BsBank2 } from "react-icons/bs";
import { FiChevronDown } from "react-icons/fi";
import { TbBrandStripe } from "react-icons/tb";
import { PiCurrencyCircleDollarBold } from "react-icons/pi";
import { useAdminTransactions } from "./hooks/useAdminTransactions";

const pip = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

// Composant Modal de confirmation de remboursement
function RefundModal({
  isOpen,
  transaction,
  amount,
  onConfirm,
  onCancel,
  onAmountChange,
  onReasonChange,
  isLoading,
  t,
}: {
  isOpen: boolean;
  transaction: any;
  amount: number;
  onConfirm: () => void;
  onCancel: () => void;
  onAmountChange: (amount: number) => void;
  onReasonChange: (reason: string) => void;
  isLoading: boolean;
  t: any;
}) {
  const [showFullRefund, setShowFullRefund] = useState(true);
  const [customAmount, setCustomAmount] = useState(amount);
  const [reason, setReason] = useState("");

  if (!isOpen || !transaction) return null;

  const handleFullRefund = () => {
    setShowFullRefund(true);
    onAmountChange(transaction.amount);
  };

  const handlePartialRefund = () => {
    setShowFullRefund(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val <= transaction.amount && val > 0) {
      setCustomAmount(val);
      onAmountChange(val);
    }
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(e.target.value);
    onReasonChange(e.target.value);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <IoRefreshCircleOutline className="text-red-600 dark:text-red-400 text-xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("refundModalTitle")}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Transaction Info */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500 dark:text-slate-400">
                {t("refundTransactionRef")}
              </span>
              <span className="font-mono text-xs text-gray-700 dark:text-slate-300">
                {transaction.reference}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500 dark:text-slate-400">
                {t("refundOriginalAmount")}
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {transaction.amount.toFixed(2)} TND
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-slate-400">
                {t("refundProperty")}
              </span>
              <span className="text-gray-700 dark:text-slate-300 truncate max-w-[200px]">
                {transaction.property.title}
              </span>
            </div>
          </div>

          {/* Refund Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              {t("refundTypeLabel")}
            </label>
            <div className="flex gap-3">
              <button
                onClick={handleFullRefund}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  showFullRefund
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200"
                }`}
              >
                {t("refundFull")}
              </button>
              <button
                onClick={handlePartialRefund}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  !showFullRefund
                    ? "bg-amber-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200"
                }`}
              >
                {t("refundPartial")}
              </button>
            </div>
          </div>

          {/* Partial Refund Amount */}
          {!showFullRefund && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {t("refundAmountLabel")}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400">
                  TND
                </span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={handleAmountChange}
                  min="0.01"
                  max={transaction.amount}
                  step="0.01"
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                {t("refundMaxAmount")}: {transaction.amount.toFixed(2)} TND
              </p>
            </div>
          )}

          {/* Refund Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              {t("refundReasonLabel")}{" "}
              <span className="text-gray-400">({t("optional")})</span>
            </label>
            <textarea
              value={reason}
              onChange={handleReasonChange}
              placeholder={t("refundReasonPlaceholder")}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Warning Message */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <IoAlertCircleOutline className="text-amber-600 dark:text-amber-400 text-base mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {t("refundWarning")}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || (!showFullRefund && customAmount <= 0)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <IoRefreshCircleOutline className="text-lg" />
            )}
            {t("confirmRefund")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTransactionsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("AdminTransactions");

  const {
    transactions,
    kpis,
    loading,
    search,
    statusFilter,
    typeFilter,
    currentPage,
    totalPages,
    totalCount,
    dateRange,
    showDatePicker,
    showExport,
    toast,
    refundModal,
    refundLoading,
    PAGE_SIZE,
    setSearch,
    setStatusFilter,
    setTypeFilter,
    setCurrentPage,
    setDateRange,
    setShowDatePicker,
    setShowExport,
    fetchTransactions,
    handleExport,
    openRefundModal,
    closeRefundModal,
    confirmRefund,
    resetFilters,
  } = useAdminTransactions(locale);

  const formatAmount = (n: number) =>
    n.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      locale === "fr" ? "fr-FR" : "en-US",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString(
      locale === "fr" ? "fr-FR" : "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<
      string,
      { label: string; dot: string; cls: string; icon: React.ReactNode }
    > = {
      SUCCESS: {
        label: t("statusSuccessLabel"),
        dot: "bg-emerald-500",
        cls: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700",
        icon: <IoCheckmarkCircleOutline className="text-emerald-500 text-xs" />,
      },
      PENDING: {
        label: t("statusPendingLabel"),
        dot: "bg-amber-500",
        cls: "bg-amber-100 dark:bg-amber-950/40 text-amber-700",
        icon: <IoHourglassOutline className="text-amber-500 text-xs" />,
      },
      REFUNDED: {
        label: t("statusRefundedLabel"),
        dot: "bg-red-500",
        cls: "bg-red-100 dark:bg-red-950/40 text-red-700",
        icon: <IoCloseCircleOutline className="text-red-500 text-xs" />,
      },
      FAILED: {
        label: t("statusFailedLabel"),
        dot: "bg-red-700",
        cls: "bg-red-100 dark:bg-red-950/40 text-red-800",
        icon: <IoCloseCircleOutline className="text-red-700 text-xs" />,
      },
    };
    const { label, dot, cls, icon } = map[status] || map.PENDING;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cls}`}
      >
        {icon}
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {label}
      </span>
    );
  };

  const TypeBadge = ({ type }: { type: string }) => {
    const map: Record<
      string,
      { label: string; icon: React.ReactNode; cls: string }
    > = {
      PAYMENT: {
        label: t("typePaymentLabel"),
        icon: <MdOutlinePayment className="text-emerald-500 text-xs" />,
        cls: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700",
      },
      REFUND: {
        label: t("typeRefundLabel"),
        icon: <IoArrowDownOutline className="text-red-500 text-xs" />,
        cls: "bg-red-100 dark:bg-red-950/40 text-red-700",
      },
    };
    const { label, icon, cls } = map[type] || map.PAYMENT;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}
      >
        {icon}
        {label}
      </span>
    );
  };

  const StripeLogo = () => (
    <div className="flex items-center gap-1">
      <TbBrandStripe className="text-[#635BFF] text-sm" />
      <span className="text-xs text-slate-500 dark:text-slate-400">Stripe</span>
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
              onClick={fetchTransactions}
              className="ml-2 hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      <RefundModal
        isOpen={refundModal.isOpen}
        transaction={refundModal.transaction}
        amount={refundModal.amount}
        onConfirm={confirmRefund}
        onCancel={closeRefundModal}
        onAmountChange={(amount) => {
          const modal = refundModal;
          modal.amount = amount;
        }}
        onReasonChange={(reason) => {
          const modal = refundModal;
          modal.reason = reason;
        }}
        isLoading={refundLoading}
        t={t}
      />

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
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransactions}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all text-sm font-medium"
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
              <div
                className={`absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 z-50 overflow-hidden ${block3d}`}
              >
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-3 transition-colors"
                >
                  <BsFiletypeCsv className="text-emerald-500 text-lg" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t("exportCSV")}
                    </p>
                    <p className="text-xs text-slate-400">{t("csvFormat")}</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-3 border-t border-indigo-50 dark:border-indigo-900/20 transition-colors"
                >
                  <BsFiletypePdf className="text-red-500 text-lg" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t("exportPDF")}
                    </p>
                    <p className="text-xs text-slate-400">{t("pdfFormat")}</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards Top */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 flex-shrink-0">
        <div
          className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-4 flex items-center gap-4 ${card3d}`}
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <IoReceiptOutline className="text-white text-xl" />
          </div>
          <div>
            <p className="text-2xl font-black leading-none text-indigo-600 dark:text-indigo-400">
              {kpis.totalTransactions}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium leading-tight">
              {t("statsTotal")}
            </p>
          </div>
        </div>

        <div
          className={`bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 p-4 flex items-center gap-4 ${card3d}`}
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm flex-shrink-0">
            <IoCheckmarkCircleOutline className="text-white text-xl" />
          </div>
          <div>
            <p className="text-2xl font-black leading-none text-emerald-600 dark:text-emerald-400">
              {kpis.totalTransactions > 0
                ? Math.round(
                    (kpis.successfulCount / kpis.totalTransactions) * 100,
                  )
                : 0}
              %
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium leading-tight">
              {t("statsSuccess")}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {kpis.successfulCount} {t("transactionsCount")}
            </p>
          </div>
        </div>

        <div
          className={`bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-900/40 p-4 flex items-center gap-4 ${card3d}`}
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-sm flex-shrink-0">
            <IoArrowDownOutline className="text-white text-xl" />
          </div>
          <div>
            <p className="text-2xl font-black leading-none text-red-600 dark:text-red-400">
              {kpis.refundsCount}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium leading-tight">
              {t("statsRefunded")}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {formatAmount(kpis.totalRefunds)} TND
            </p>
          </div>
        </div>

        <div
          className={`bg-white dark:bg-slate-900 rounded-2xl border border-amber-100 dark:border-amber-900/40 p-4 flex items-center gap-4 ${card3d}`}
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm flex-shrink-0">
            <IoHourglassOutline className="text-white text-xl" />
          </div>
          <div>
            <p className="text-2xl font-black leading-none text-amber-600 dark:text-amber-400">
              {kpis.pendingCount}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium leading-tight">
              {t("statsPending")}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {formatAmount(kpis.pendingPayouts)} TND
            </p>
          </div>
        </div>

        <div
          className={`bg-gradient-to-br from-sky-500 to-purple-600 rounded-2xl p-4 flex items-center gap-4 ${card3d}`}
        >
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shadow-sm flex-shrink-0">
            <IoStatsChartOutline className="text-white text-xl" />
          </div>
          <div>
            <p className="text-2xl font-black leading-none text-white">
              {kpis.successRate.toFixed(1)}%
            </p>
            <p className="text-xs text-white/80 mt-0.5 font-medium leading-tight">
              {t("statsSuccessRate")}
            </p>
            <p className="text-[10px] text-white/60 mt-0.5">
              +{kpis.volumeGrowth}% {t("vsLastMonth")}
            </p>
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t("searchPlaceholder")}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-700"
              />
            </div>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:border-indigo-400 transition-colors"
            >
              <IoCalendarOutline />
              {new Date(dateRange.start).toLocaleDateString()} -{" "}
              {new Date(dateRange.end).toLocaleDateString()}
            </button>
            {showDatePicker && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                  className="px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition-colors"
                >
                  {t("apply")}
                </button>
              </div>
            )}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">{t("allStatus")}</option>
              <option value="SUCCESS">{t("statusSuccess")}</option>
              <option value="PENDING">{t("statusPending")}</option>
              <option value="REFUNDED">{t("statusRefunded")}</option>
              <option value="FAILED">{t("statusFailed")}</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">{t("allTypes")}</option>
              <option value="PAYMENT">{t("typePayment")}</option>
              <option value="REFUND">{t("typeRefund")}</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <LoadingSpinner />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-indigo-300 dark:text-indigo-700">
              <IoReceiptOutline className="text-5xl" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("noTransactions")}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                    {t("tableDate")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                    {t("tableAmount")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                    {t("tableStatus")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                    {t("tablePaymentMethod")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                    {t("tableDescription")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                    {t("tableCustomer")}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                    {t("tableActions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(tx.date)} {t("at")} {formatTime(tx.date)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {tx.type === "REFUND" ? "-" : ""}
                        {formatAmount(tx.amount)} TND
                      </div>
                      {tx.commission > 0 && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {t("commission")}: {formatAmount(tx.commission)} TND
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      {tx.provider === "STRIPE" ? (
                        <StripeLogo />
                      ) : (
                        <div className="flex items-center gap-1">
                          <BsBank2 className="text-slate-400 text-xs" />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {tx.provider}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {tx.property.image ? (
                            <img
                              src={pip(tx.property.image)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <IoHomeOutline className="text-indigo-400 dark:text-indigo-500" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {tx.type === "PAYMENT"
                              ? t("booking")
                              : t("typeRefundLabel")}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                            {tx.property.title}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        {tx.tenantName && (
                          <div className="flex items-center gap-1">
                            <IoPersonOutline className="text-slate-400 text-[10px]" />
                            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                              {tx.tenantName}
                            </span>
                          </div>
                        )}
                        {tx.tenantEmail && (
                          <div className="flex items-center gap-1">
                            <IoMailOutline className="text-slate-400 text-[10px]" />
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {tx.tenantEmail}
                            </span>
                          </div>
                        )}
                        {!tx.tenantName && !tx.tenantEmail && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            -
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        {tx.status === "SUCCESS" && tx.type === "PAYMENT" && (
                          <button
                            onClick={() => openRefundModal(tx)}
                            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-left flex items-center gap-1"
                          >
                            <IoRefreshCircleOutline className="text-xs" />{" "}
                            {t("refundButton")}
                          </button>
                        )}
                        {tx.provider === "STRIPE" && tx.paymentIntentId && (
                          <a
                            href={`https://dashboard.stripe.com/payments/${tx.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            {t("viewOnStripe")}
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-indigo-50 dark:border-indigo-900/30">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Stats Cards Bottom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/40 ${card3d}`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {t("totalVolume")}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("totalVolumeDesc")}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
              <PiCurrencyCircleDollarBold className="text-white text-2xl" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatAmount(kpis.totalVolume)}
            </span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              TND
            </span>
          </div>
          <div className="mt-3 flex items-center text-green-600 dark:text-green-400 text-xs font-semibold">
            <IoArrowUpOutline className="text-sm mr-1" />+{kpis.volumeGrowth}%{" "}
            {t("vsLastMonth")}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {t("successfulTransactions")}
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {kpis.successfulCount}
              </span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-slate-500 dark:text-slate-400">
                {t("conversionRate")}
              </span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {kpis.successRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div
          className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/40 ${card3d}`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {t("commissions")}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("commissionsDesc")}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm">
              <MdOutlinePercent className="text-white text-2xl" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatAmount(kpis.totalCommissions)}
            </span>
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
              TND
            </span>
          </div>
          <div className="mt-3 flex items-center text-green-600 dark:text-green-400 text-xs font-semibold">
            <IoArrowUpOutline className="text-sm mr-1" />+
            {kpis.commissionsGrowth}% {t("vsLastMonth")}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {t("averageCommission")}
              </span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {kpis.totalTransactions > 0
                  ? `${formatAmount(kpis.totalCommissions / kpis.totalTransactions)} TND`
                  : "0 TND"}
              </span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-slate-500 dark:text-slate-400">
                {t("commissionRate")}
              </span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                10%
              </span>
            </div>
          </div>
        </div>

        <div
          className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/40 ${card3d}`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {t("refunds")}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("refundsDesc")}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-sm">
              <IoRefreshCircleOutline className="text-white text-2xl" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatAmount(kpis.totalRefunds)}
            </span>
            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
              TND
            </span>
          </div>
          <div className="mt-3 flex flex-col">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {kpis.refundsCount} {t("transactionsCount")}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {t("averageRefund")}
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {kpis.refundsCount > 0
                  ? `${formatAmount(kpis.totalRefunds / kpis.refundsCount)} TND`
                  : "0 TND"}
              </span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-slate-500 dark:text-slate-400">
                {t("refundRate")}
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {kpis.totalTransactions > 0
                  ? (
                      (kpis.refundsCount / kpis.totalTransactions) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
