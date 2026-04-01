"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

export interface VerificationRequest {
  id: string;
  status: string;
  submittedAt: string;
  processedAt?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    profilePictureUrl?: string;
  };
  adminComment?: string;
  rejectionMotif?: string;
  validatedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface GlobalStats {
  totalCount:     number;
  validatedCount: number;
  rejectedCount:  number;
}

interface UseVerificationsHistoryProps {
  itemsPerPage?: number;
}

export function useVerificationsHistory({
  itemsPerPage = 10,
}: UseVerificationsHistoryProps = {}) {
  const { getToken } = useAuth();

  const [requests,     setRequests]     = useState<VerificationRequest[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [search,       setSearch]       = useState("");
  const [currentPage,  setCurrentPage]  = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalItems,   setTotalItems]   = useState(0);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VALIDATED" | "REJECTED">("ALL");
  const [globalStats,  setGlobalStats]  = useState<GlobalStats>({
    totalCount:     0,
    validatedCount: 0,
    rejectedCount:  0,
  });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken({ template: "my-app-template" });
      if (!token) throw new Error("Non authentifié");

      const qs = new URLSearchParams({
        page:   currentPage.toString(),
        limit:  itemsPerPage.toString(),
        status: statusFilter,           // "ALL" | "VALIDATED" | "REJECTED"
        ...(search.trim() && { search: search.trim() }),
      });

      const res = await fetch(`/api/admin/verifications/history?${qs}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Erreur lors du chargement");

      const data = await res.json();

      setRequests(data.requests ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotalItems(data.pagination?.totalCount ?? 0);

      // The API always returns global stats regardless of the active filter
      if (data.stats) {
        setGlobalStats({
          totalCount:     data.stats.totalCount     ?? 0,
          validatedCount: data.stats.validatedCount ?? 0,
          rejectedCount:  data.stats.rejectedCount  ?? 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, search, itemsPerPage, getToken]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Changing filter resets to page 1
  const changeStatusFilter = useCallback((filter: "ALL" | "VALIDATED" | "REJECTED") => {
    setStatusFilter(filter);
    setCurrentPage(1);
  }, []);

  // Changing search resets to page 1
  const changeSearch = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const changePage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const refresh = useCallback(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    requests,
    loading,
    error,
    search,
    currentPage,
    totalPages,
    totalItems,
    statusFilter,
    globalStats,
    refresh,
    changePage,
    changeStatusFilter,
    changeSearch,
    setError,
  };
}