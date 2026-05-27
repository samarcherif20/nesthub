// app/[locale]/admin/transactions/hooks/useAdminTransactions.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

export interface Transaction {
  id: string;
  reference: string;
  date: string;
  amount: number;
  commission: number;
  netAmount: number;
  property: {
    id: string;
    title: string;
    image?: string;
  };
  status: "SUCCESS" | "PENDING" | "REFUNDED" | "FAILED";
  provider: string;
  tenantName?: string;
  tenantEmail?: string;
  ownerName?: string;
  type: "PAYMENT" | "REFUND";
  paymentIntentId?: string;
  bookingId?: string;
}

export interface Kpis {
  totalVolume: number;
  totalCommissions: number;
  pendingPayouts: number;
  pendingCount: number;
  volumeGrowth: number;
  commissionsGrowth: number;
  totalRefunds: number;
  refundsCount: number;
  successRate: number;
  totalTransactions: number;
  successfulCount: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface RefundModalState {
  isOpen: boolean;
  transaction: Transaction | null;
  amount: number;
  reason: string;
}

export function useAdminTransactions(locale: string = "fr") {
  const { getToken } = useAuth();
  const t = useTranslations("AdminTransactions");
  const PAGE_SIZE = 10;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kpis, setKpis] = useState<Kpis>({
    totalVolume: 0,
    totalCommissions: 0,
    pendingPayouts: 0,
    pendingCount: 0,
    volumeGrowth: 0,
    commissionsGrowth: 0,
    totalRefunds: 0,
    refundsCount: 0,
    successRate: 100,
    totalTransactions: 0,
    successfulCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // États pour la modale de remboursement
  const [refundModal, setRefundModal] = useState<RefundModalState>({
    isOpen: false,
    transaction: null,
    amount: 0,
    reason: "",
  });
  const [refundLoading, setRefundLoading] = useState(false);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = await getToken({ template: "my-app-template" });
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers ?? {}),
        },
      });
    },
    [getToken],
  );

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: PAGE_SIZE.toString(),
        startDate: dateRange.start,
        endDate: dateRange.end,
        ...(search && { search }),
        ...(statusFilter !== "ALL" && { status: statusFilter }),
        ...(typeFilter !== "ALL" && { type: typeFilter }),
      });

      const res = await authFetch(`/api/admin/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotalCount(data.pagination?.totalCount ?? 0);
        if (data.kpis) setKpis(data.kpis);
      } else {
        const error = await res.json();
        showToast("error", error.error || t("loadError"));
      }
    } catch (error) {
      console.error(error);
      showToast("error", t("connectionError"));
    } finally {
      setLoading(false);
    }
  }, [
    authFetch,
    currentPage,
    search,
    statusFilter,
    typeFilter,
    dateRange,
    PAGE_SIZE,
    t,
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleExport = async (format: "csv" | "pdf") => {
    setShowExport(false);
    try {
      const params = new URLSearchParams({
        format,
        ...(statusFilter !== "ALL" && { status: statusFilter }),
        ...(typeFilter !== "ALL" && { type: typeFilter }),
        ...(search && { search }),
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end }),
      });

      const response = await authFetch(
        `/api/admin/transactions/export?${params}`,
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = `transactions_${new Date().toISOString().split("T")[0]}.${format}`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+)"/);
          if (match && match[1]) {
            filename = match[1];
          }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast("success", t("exportSuccess"));
      } else {
        const data = await response.json().catch(() => ({}));
        showToast("error", data.error || t("exportError"));
      }
    } catch (error) {
      console.error("Export error:", error);
      showToast("error", t("exportFailed"));
    }
  };

  // Ouvrir la modale de remboursement
  const openRefundModal = (transaction: Transaction) => {
     console.log("💰 Transaction:", transaction); // ✅ AJOUTE CE LOG
  console.log("💰 Montant original:", transaction.amount); // ✅ AJOUTE CE LOG
    setRefundModal({
      isOpen: true,
      transaction,
      amount: transaction.amount,
      reason: "",
    });
  };

  // Fermer la modale de remboursement
  const closeRefundModal = () => {
    setRefundModal({
      isOpen: false,
      transaction: null,
      amount: 0,
      reason: "",
    });
  };

  // Confirmer le remboursement
  const confirmRefund = async () => {
    if (!refundModal.transaction) return;

    setRefundLoading(true);
    try {
      const res = await authFetch(
        `/api/admin/transactions/${refundModal.transaction.id}/refund`,
        {
          method: "POST",
          body: JSON.stringify({
            reason: refundModal.reason || t("refundDefaultReason"),
            amount: refundModal.amount,
          }),
        }
      );

      if (res.ok) {
        showToast("success", t("refundSuccess"));
        fetchTransactions();
        closeRefundModal();
      } else {
        const error = await res.json();
        showToast("error", error.error || t("refundError"));
      }
    } catch {
      showToast("error", t("connectionError"));
    } finally {
      setRefundLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setDateRange({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      end: new Date().toISOString().split("T")[0],
    });
    setCurrentPage(1);
  };

  return {
    // Data
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
    // Setters
    setSearch,
    setStatusFilter,
    setTypeFilter,
    setCurrentPage,
    setDateRange,
    setShowDatePicker,
    setShowExport,
    // Actions
    fetchTransactions,
    handleExport,
    openRefundModal,
    closeRefundModal,
    confirmRefund,
    resetFilters,
    showToast,
  };
}