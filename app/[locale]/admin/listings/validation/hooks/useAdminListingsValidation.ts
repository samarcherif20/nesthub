// app/[locale]/admin/listings/validation/hooks/useAdminListingsValidation.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

export interface ListingValidation {
  id: string;
  title: string;
  description: string;
  type: string;
  governorate: string;
  delegation: string;
  street: string;
  pricePerNight: number | null;
  pricePerMonth: number | null;
  images: string[];
  rooms: number;
  bathrooms: number;
  surfaceArea: number;
  floorNumber: number;
  maxGuests: number;
  hasElevator: boolean;
  hasBalcony: boolean;
  hasGarden: boolean;
  hasGarage: boolean;
  isFurnished: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  status: string;
  hasPendingRevision: boolean;
  rejectionReason?: string | null;
  validatedAt?: Date | null;
  rejectedAt?: Date | null;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePictureUrl: string | null;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface StatsData {
  total: number;
  pending: number;
  revisions: number;
  processedToday: number;
  avgResponseTime: number;
  validated: number;
  rejected: number;
}

export type ActiveTab = "all" | "pending" | "revisions" | "history";

export function useAdminListingsValidation(locale: string = "fr") {
  const { getToken } = useAuth();
  const PAGE_SIZE = 10;

  const [listings, setListings] = useState<ListingValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [tempSearch, setTempSearch] = useState("");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    pending: 0,
    revisions: 0,
    processedToday: 0,
    avgResponseTime: 0,
    validated: 0,
    rejected: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialMount = useRef(true);

  // Debounce search
  const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
  };
  const debouncedSearch = useDebounce(search, 500);

  const getAvatarUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    return `/api/admin/serve-image?url=${encodeURIComponent(url)}`;
  };

  const getListingImageUrl = (imageUrl: string | undefined): string => {
    if (!imageUrl) return "";
    return `/api/listings/image?url=${encodeURIComponent(imageUrl)}`;
  };

  const fetchStats = useCallback(async () => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch(`/api/admin/listings/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [getToken]);

  const fetchListings = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        type: activeTab,
        search: debouncedSearch,
      });

      const response = await fetch(`/api/admin/listings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load listings");
      }

      const data = await response.json();
      setListings(data.listings || []);
      setPagination(
        data.pagination || { page: 1, limit: 10, totalCount: 0, totalPages: 1 },
      );
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error(error);
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, activeTab, debouncedSearch]);

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearch("");
    setTempSearch("");
  };

  const handleSearchSubmit = () => {
    setSearch(tempSearch);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchClear = () => {
    setTempSearch("");
    setSearch("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    if (page === pagination.page) return;
    setPagination((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLimitChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleImageError = (listingId: string) =>
    setImageErrors((prev) => ({ ...prev, [listingId]: true }));

  const getListingTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      APARTMENT: "APARTMENT",
      VILLA: "VILLA",
      HOUSE: "HOUSE",
      STUDIO: "STUDIO",
      DUPLEX: "DUPLEX",
      LAND: "LAND",
      COMMERCIAL: "COMMERCIAL",
    };
    return types[type] || type;
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: "TND",
      minimumFractionDigits: 0,
    }).format(price);
  };

  useEffect(() => {
    fetchStats();
    fetchListings();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (!isInitialMount.current && debouncedSearch !== "") {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (!isInitialMount.current) {
      fetchListings();
    }
    isInitialMount.current = false;
  }, [fetchListings, pagination.page, activeTab, debouncedSearch]);

  return {
    listings,
    loading,
    initialLoading,
    activeTab,
    pagination,
    search,
    tempSearch,
    stats,
    imageErrors,
    setTempSearch,
    handleTabChange,
    handleSearchSubmit,
    handleSearchClear,
    handlePageChange,
    handleLimitChange,
    handleImageError,
    getAvatarUrl,
    getListingImageUrl,
    getListingTypeLabel,
    formatPrice,
    fetchListings,
    fetchStats,
  };
}