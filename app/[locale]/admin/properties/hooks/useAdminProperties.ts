// app/[locale]/admin/properties/hooks/useAdminProperties.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

export function useAdminProperties() {
  const { getToken } = useAuth();
  const PAGE_SIZE = 10;

  // États
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [menuState, setMenuState] = useState<{
    listing: any | null;
    position: { top: number; left: number };
  }>({
    listing: null,
    position: { top: 0, left: 0 },
  });
  const [mapCenter, setMapCenter] = useState({ lat: 36.8065, lng: 10.1815 });
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
    archived: 0,
    draft: 0,
  });

  // Auth fetch
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

  // Fetch listings
  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: PAGE_SIZE.toString(),
      });
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (typeFilter !== "ALL") params.append("type", typeFilter);
      if (priceMin) params.append("minPrice", priceMin);
      if (priceMax) params.append("maxPrice", priceMax);
      if (governorate) params.append("governorate", governorate);

      const res = await authFetch(`/api/listings?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items: any[] = data.listings ?? [];

      setListings(items);
      setTotalPages(Math.max(1, data.pagination?.totalPages ?? 1));
      setTotalCount(Math.max(0, data.pagination?.totalCount ?? 0));
      setStats({
        total: Math.max(0, data.pagination?.totalCount ?? 0),
        active: items.filter((l) => l.status === "ACTIVE").length,
        pending: items.filter((l) => l.status === "PENDING_REVIEW").length,
        inactive: items.filter((l) => l.status === "INACTIVE").length,
        archived: items.filter((l) => l.status === "ARCHIVED").length,
        draft: items.filter((l) => l.status === "DRAFT").length,
      });

      const withCoords = items.find((l) => l.latitude && l.longitude);
      if (withCoords)
        setMapCenter({ lat: withCoords.latitude, lng: withCoords.longitude });
    } catch {
      setAlert({
        type: "error",
        message: "Erreur lors du chargement des annonces",
      });
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    authFetch,
    currentPage,
    searchQuery,
    statusFilter,
    typeFilter,
    priceMin,
    priceMax,
    governorate,
  ]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Close menu on escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuState({ listing: null, position: { top: 0, left: 0 } });
        setShowExport(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Actions
  const handleAction = async (type: string, id: string) => {
    const endpointMap: Record<string, string> = {
      activate: `/api/admin/listings/${id}/activate`,
      deactivate: `/api/admin/listings/${id}/deactivate`,
      archive: `/api/admin/listings/${id}/archive`,
      delete: `/api/admin/listings/${id}`,
    };
    try {
      const res = await authFetch(endpointMap[type], {
        method: type === "delete" ? "DELETE" : "PATCH",
      });
      if (res.ok) {
        setAlert({ type: "success", message: `Action "${type}" effectuée` });
        fetchListings();
      } else {
        const data = await res.json().catch(() => ({}));
        setAlert({ type: "error", message: data.error ?? "Erreur" });
      }
    } catch {
      setAlert({ type: "error", message: "Erreur de connexion" });
    }
  };

  // Export
  const handleExport = async (format: "csv" | "pdf") => {
    setShowExport(false);
    try {
      const res = await authFetch(
        `/api/admin/listings/export?format=${format}&status=${statusFilter}&type=${typeFilter}&search=${searchQuery}`,
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `listings-export.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        setAlert({ type: "error", message: "Export non disponible" });
      }
    } catch {
      setAlert({ type: "error", message: "Erreur lors de l'export" });
    }
  };

  // Getters
  const getMainImage = (listing: any) => {
    const p = listing.photos?.find((x: any) => x.isMain) ?? listing.photos?.[0];
    return p?.url
      ? `/api/listings/image?url=${encodeURIComponent(p.url)}`
      : null;
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setPriceMin("");
    setPriceMax("");
    setGovernorate("");
    setCurrentPage(1);
  };

  const mapListings = listings.filter((l) => l.latitude && l.longitude);

  return {
    // Data
    listings,
    loading,
    searchQuery,
    statusFilter,
    typeFilter,
    currentPage,
    totalPages,
    totalCount,
    showFilters,
    showExport,
    alert,
    menuState,
    mapCenter,
    priceMin,
    priceMax,
    governorate,
    stats,
    mapListings,
    PAGE_SIZE,
    // Setters
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    setCurrentPage,
    setShowFilters,
    setShowExport,
    setMenuState,
    setAlert,
    setPriceMin,
    setPriceMax,
    setGovernorate,
    // Actions
    fetchListings,
    handleAction,
    handleExport,
    getMainImage,
    resetFilters,
  };
}
