// hooks/useOwnerWallet.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

const PAGE_SIZE = 5;

export function useOwnerWallet() {
  const params = useParams();
  const locale = params?.locale as string || 'fr';
  const t = useTranslations("OwnerWallet");
  
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "week" | "month" | "year">("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/wallet/stats?page=${currentPage}&limit=${PAGE_SIZE}&status=${statusFilter}&dateFilter=${dateFilter}&locale=${locale}`);
      const data = await res.json();
      if (data.success) {
        setWalletData(data.stats);
        setTransactions(data.transactions);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);
      } else {
        setToast({ message: data.message || t("errors.loadFailed"), type: "error" });
        setTimeout(() => setToast(null), 4000);
      }
    } catch (error) {
      console.error("Erreur:", error);
      setToast({ message: t("errors.loadFailed"), type: "error" });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, dateFilter, locale, t]);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchWalletData();
    setToast({ message: t("messages.refreshed"), type: "success" });
    setTimeout(() => setToast(null), 4000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  return {
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

  };
}