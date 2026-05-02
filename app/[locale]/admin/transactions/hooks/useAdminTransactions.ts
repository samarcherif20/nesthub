// app/[locale]/admin/transactions/hooks/useAdminTransactions.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

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

export function useAdminTransactions() {
  const { getToken } = useAuth();
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
  const [alert, setAlert] = useState<{
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
        setAlert({
          type: "error",
          message: error.error || "Erreur de chargement",
        });
      }
    } catch (error) {
      console.error(error);
      setAlert({ type: "error", message: "Erreur de connexion" });
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
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  const handleExport = async (format: "csv" | "pdf") => {
    setShowExport(false);
    try {
      const token = await getToken({ template: "my-app-template" });

      // ✅ Construire les paramètres
      const params = new URLSearchParams({
        format,
        ...(statusFilter !== "ALL" && { status: statusFilter }),
        ...(typeFilter !== "ALL" && { type: typeFilter }),
        ...(search && { search }),
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end }),
      });

      // ✅ Appel à l'API avec les paramètres dans l'URL
      const response = await authFetch(
        `/api/admin/transactions/export?${params}`,
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        // ✅ Extraire le nom du fichier du header Content-Disposition
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

        setAlert({ type: "success", message: "Export généré avec succès" });
      } else {
        const data = await response.json().catch(() => ({}));
        setAlert({
          type: "error",
          message: data.error || "Export non disponible",
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      setAlert({ type: "error", message: "Erreur lors de l'export" });
    }
  };
  const handleRefund = async (transactionId: string) => {
    if (!confirm("Voulez-vous vraiment rembourser cette transaction ?")) return;

    try {
      const res = await authFetch(
        `/api/admin/transactions/${transactionId}/refund`,
        {
          method: "POST",
        },
      );
      if (res.ok) {
        setAlert({
          type: "success",
          message: "Remboursement effectué avec succès",
        });
        fetchTransactions();
      } else {
        const error = await res.json();
        setAlert({
          type: "error",
          message: error.error || "Erreur lors du remboursement",
        });
      }
    } catch {
      setAlert({ type: "error", message: "Erreur de connexion" });
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
    alert,
    PAGE_SIZE,
    // Setters
    setSearch,
    setStatusFilter,
    setTypeFilter,
    setCurrentPage,
    setDateRange,
    setShowDatePicker,
    setShowExport,
    setAlert,
    // Actions
    fetchTransactions,
    handleExport,
    handleRefund,
    resetFilters,
  };
}
