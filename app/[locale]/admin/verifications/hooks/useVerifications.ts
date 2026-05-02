// app/[locale]/admin/verifications/hooks/useVerifications.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useUser, useAuth } from "@clerk/nextjs";

export interface VerificationRequest {
  id: string;
  status: string;
  submittedAt: string;
  documentFrontUrl: string;
  documentBackUrl: string | null;
  extractedData: any;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
    role: string;
    createdAt: string;
  };
}

export interface StatsData {
  pendingCount: number;
  estimatedWaitTime: number;
  processedToday: number;
  averageProcessingTime: number;
}

export interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export function useVerifications() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();

  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const isInitialized = useRef(false);

  // Vérification des droits admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!isUserLoaded || !user) {
        setIsAdmin(false);
        return;
      }
      try {
        const token = await getToken({ template: "my-app-template" });
        if (!token) {
          setIsAdmin(false);
          return;
        }
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setIsAdmin(decoded?.role === "ADMIN");
      } catch (err) {
        console.error("Erreur vérification admin:", err);
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [isUserLoaded, user, getToken]);

  // Debounce pour la recherche
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (pagination.page !== 1) {
        setPagination((prev) => ({ ...prev, page: 1 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Chargement des demandes
  const fetchRequests = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: "my-app-template" });
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/verifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur chargement");
      }

      const data = await res.json();
      setRequests(data.requests || []);
      setPagination((prev) => ({
        ...prev,
        totalCount: data.pagination?.totalCount || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
      setStats(data.stats || null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [
    isAdmin,
    getToken,
    pagination.page,
    pagination.limit,
    debouncedSearch,
    statusFilter,
  ]);

  // Déclencher le chargement
  useEffect(() => {
    if (isAdmin && !isInitialized.current) {
      isInitialized.current = true;
      fetchRequests();
    }
  }, [isAdmin, fetchRequests]);

  // Recharger quand la page, la recherche ou le filtre change
  useEffect(() => {
    if (isAdmin && isInitialized.current) {
      fetchRequests();
    }
  }, [pagination.page, debouncedSearch, statusFilter, isAdmin, fetchRequests]);

  // Fonctions d'interaction
  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const refresh = useCallback(() => {
    fetchRequests();
  }, [fetchRequests]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("ALL");
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  return {
    // États
    requests,
    stats,
    pagination,
    loading,
    error,
    search,
    statusFilter,
    isAdmin,
    isUserLoaded,
    // Actions
    setSearch,
    setStatusFilter,
    setPage,
    refresh,
    setError,
    resetFilters,
  };
}
