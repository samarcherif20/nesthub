"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export interface Transaction {
  id: string;
  amount: number;
  type: "PAYMENT" | "DEPOSIT" | "REFUND";
  status: string;
  description: string;
  date: string;
  reference: string;
  stripePaymentIntentId?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  bookingId?: string;
  stay?: {
    bookingId: string;
    listingId: string;
    listingTitle: string;
    listingImage: string | null;
    location: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    guests: number;
    status: string;
    reference: string;
  };
}

export interface SecurityDeposit {
  id: string;
  amount: number;
  status: string;
  releaseDate: string | null;
  listingId: string;
  listingTitle: string;
  location: string;
  checkInDate: string;
  checkOutDate: string;
  authorizedAt: string | null;
  expiresAt: string | null;
  nights: number;
  bookingReference: string;
}

export interface UpcomingPayment {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  description: string;
  listingId: string;
  listingTitle: string;
  listingImage: string | null;
  location: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  bookingReference: string;
}

export function useWallet() {
  const t = useTranslations("Wallet");
  const tCommon = useTranslations("Common");
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ available: 0, pending: 0, totalSpent: 0 });
  const [deposits, setDeposits] = useState<SecurityDeposit[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<"all" | "payments" | "deposits">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [showAllTx, setShowAllTx] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [dateRange, setDateRange] = useState<"all" | "month" | "quarter" | "year">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/stripe/wallet", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance || { available: 0, pending: 0, totalSpent: 0 });
        setDeposits(data.securityDeposits || []);
        setUpcomingPayments(data.upcomingPayments || []);
        setTransactions(data.transactions || []);
      } else {
        toast.error(tCommon("error.loading"));
      }
    } catch (error) {
      console.error(error);
      toast.error(tCommon("error.loading"));
    } finally {
      setLoading(false);
    }
  }, [getToken, tCommon]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("toasts.referenceCopied"));
  };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (filterType === "payments") {
      filtered = filtered.filter((t) => t.type === "PAYMENT");
    } else if (filterType === "deposits") {
      filtered = filtered.filter((t) => t.type === "DEPOSIT");
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((t) => {
        if (filterStatus === "completed") return t.status === "COMPLETED" || t.status === "PAID";
        if (filterStatus === "pending") return t.status === "PENDING";
        if (filterStatus === "failed") return t.status === "FAILED";
        return true;
      });
    }

    if (dateRange !== "all") {
      const now = new Date();
      let startDate = new Date();
      if (dateRange === "month") startDate.setMonth(now.getMonth() - 1);
      if (dateRange === "quarter") startDate.setMonth(now.getMonth() - 3);
      if (dateRange === "year") startDate.setFullYear(now.getFullYear() - 1);
      filtered = filtered.filter((t) => new Date(t.date) >= startDate);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((t) =>
        t.description?.toLowerCase().includes(term) ||
        t.reference?.toLowerCase().includes(term) ||
        t.stay?.listingTitle?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [transactions, filterType, filterStatus, dateRange, searchTerm]);

  const displayedTransactions = showAllTx ? filteredTransactions : filteredTransactions.slice(0, 10);

  const stats = {
    totalPayments: transactions.filter((t) => t.type === "PAYMENT").length,
    totalDeposits: deposits.length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    avgTransaction: transactions.length > 0 ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0,
    pendingDeposits: deposits.filter((d) => d.status === "AUTHORIZED").length,
    releasedDeposits: deposits.filter((d) => d.status === "RELEASED").length,
  };

  return {
    loading,
    balance,
    deposits,
    upcomingPayments,
    transactions,
    filteredTransactions: displayedTransactions,
    allFilteredCount: filteredTransactions.length,
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
    t,
    tCommon,
  };
}