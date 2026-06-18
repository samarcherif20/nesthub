// hooks/useDisputes.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";

export type DisputeStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED";
export type DisputePriority = "HIGH" | "MEDIUM" | "LOW";
export type SortOption = "newest" | "oldest" | "priority";

export interface Dispute {
  id: string;
  reference: string;
  type: string;
  description: string;
  status: DisputeStatus;
  priority: DisputePriority;
  amount: number | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  booking: {
    id: string;
    reference: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    listing: {
      id: string;
      title: string;
      governorate: string;
      delegation: string;
    };
    tenant: {
      id: string;
      username: string;
      name: string;
      email?: string;
      phone?: string;
      avatar?: string | null;
    };
    owner?: {
      id: string;
      username: string;
      name: string;
    };
  };
  evidence: string[];
}

interface UseDisputesReturn {
  disputes: Dispute[];
  selectedDispute: Dispute | null;
  loading: boolean;
  refreshing: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: DisputeStatus | "all";
  setStatusFilter: (value: DisputeStatus | "all") => void;
  priorityFilter: DisputePriority | "all";
  setPriorityFilter: (value: DisputePriority | "all") => void;
  sort: SortOption;
  setSort: (value: SortOption) => void;
  activeFilters: number;
  filteredDisputes: Dispute[];
  stats: { open: number; inReview: number; resolved: number; total: number };
  avgResolutionDays: number;
  trend: number;
  handleSelectDispute: (id: string) => void;
  handleRefresh: () => void;
  handleClearFilters: () => void;
  handlePreview: (urls: string[], index: number) => void;
  previewData: { urls: string[]; index: number } | null;
  setPreviewData: (data: { urls: string[]; index: number } | null) => void;
  toast: { message: string; type: "success" | "error" } | null;
  setToast: (
    toast: { message: string; type: "success" | "error" } | null,
  ) => void;
}

export function useDisputes(t: any): UseDisputesReturn {
  const { user } = useUser();

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "all">(
    "all",
  );
  const [priorityFilter, setPriorityFilter] = useState<DisputePriority | "all">(
    "all",
  );
  const [sort, setSort] = useState<SortOption>("newest");
  const [previewData, setPreviewData] = useState<{
    urls: string[];
    index: number;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const stats = useMemo(
    () => ({
      open: disputes.filter((d) => d.status === "OPEN").length,
      inReview: disputes.filter((d) => d.status === "IN_REVIEW").length,
      resolved: disputes.filter((d) => d.status === "RESOLVED").length,
      total: disputes.length,
    }),
    [disputes],
  );
  const avgResolutionDays = useMemo(() => {
    const resolved = disputes.filter(
      (d) => d.status === "RESOLVED" && d.createdAt && d.updatedAt,
    );
    if (resolved.length === 0) return 0;
    const totalDays = resolved.reduce((sum, d) => {
      const days =
        (new Date(d.updatedAt).getTime() - new Date(d.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    return Math.round((totalDays / resolved.length) * 10) / 10;
  }, [disputes]);

  const trend = useMemo(() => {
    if (disputes.length === 0) return 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const thisMonth = disputes.filter((d) => {
      const date = new Date(d.createdAt);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    }).length;

    const lastMonthCount = disputes.filter((d) => {
      const date = new Date(d.createdAt);
      return (
        date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
      );
    }).length;

    if (lastMonthCount === 0) return thisMonth > 0 ? 100 : 0;
    return Math.round(((thisMonth - lastMonthCount) / lastMonthCount) * 100);
  }, [disputes]);
  const activeFilters =
    (statusFilter !== "all" ? 1 : 0) +
    (priorityFilter !== "all" ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const filteredDisputes = useMemo(() => {
    let out = disputes.filter((d) => {
      const matchesSearch =
        !searchQuery ||
        (d.reference || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.booking.listing.title || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (d.booking.tenant.username || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || d.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
    const prioRank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    if (sort === "newest")
      out.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    else if (sort === "oldest")
      out.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    else out.sort((a, b) => prioRank[a.priority] - prioRank[b.priority]);
    return out;
  }, [disputes, searchQuery, statusFilter, priorityFilter, sort]);

  const selectedDispute = disputes.find((d) => d.id === selectedId) || null;

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/disputes");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDisputes(data);
      } else {
        setDisputes([]);
      }
    } catch (error) {
      console.error("Erreur chargement litiges:", error);
      setToast({ type: "error", message: t("alerts.loadError") });
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDisputes().finally(() => setRefreshing(false));
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  const handleSelectDispute = (id: string) => {
    setSelectedId(id);
  };

  const handlePreview = (urls: string[], index: number) => {
    setPreviewData({ urls, index });
  };

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  return {
    disputes,
    selectedDispute,
    loading,
    refreshing,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    sort,
    setSort,
    activeFilters,
    filteredDisputes,
    stats,
    handleSelectDispute,
    handleRefresh,
    handleClearFilters,
    handlePreview,
    previewData,
    setPreviewData,
    toast,
    setToast,
    avgResolutionDays,
    trend,
  };
}
