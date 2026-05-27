// app/[locale]/admin/properties/hooks/useAdminProperties.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";

export interface AdminAlert {
  id: string;
  type: "DISPUTE" | "VALIDATION" | "MODIFICATION";
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  createdAt: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  listingId?: string;
  listingTitle?: string;
  time?: string;
}

export type SortField = "createdAt" | "price" | "title" | "status" | "type";
export type SortOrder = "asc" | "desc";

export function useAdminProperties(locale: string = "fr") {
  const { getToken } = useAuth();
  const PAGE_SIZE = 10;

  // États existants (version qui marche)
  const [listings, setListings] = useState<any[]>([]);
  const [filteredListings, setFilteredListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [adminAlerts, setAdminAlerts] = useState<AdminAlert[]>([]);
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
  
  // NOUVEAUX ÉTATS (ajoutés sans casser l'existant)
  const [ownerEmail, setOwnerEmail] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [previewListing, setPreviewListing] = useState<any | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    rejected: 0,
    inactive: 0,
    archived: 0,
    draft: 0,
    suspended: 0,
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

  // Appliquer tous les filtres (version qui marche)
  const applyFilters = useCallback(
    (items: any[]) => {
      let filtered = [...items];

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((l) =>
          l.title?.toLowerCase().includes(query),
        );
      }

      if (statusFilter !== "ALL") {
        filtered = filtered.filter((l) => l.status === statusFilter);
      }

      if (typeFilter !== "ALL") {
        filtered = filtered.filter((l) => l.type === typeFilter);
      }

      if (priceMin) {
        const min = parseFloat(priceMin);
        filtered = filtered.filter((l) => {
          const price = l.pricePerNight ?? l.pricePerMonth;
          return price && price >= min;
        });
      }

      if (priceMax) {
        const max = parseFloat(priceMax);
        filtered = filtered.filter((l) => {
          const price = l.pricePerNight ?? l.pricePerMonth;
          return price && price <= max;
        });
      }

      if (governorate.trim()) {
        const gov = governorate.toLowerCase();
        filtered = filtered.filter((l) =>
          l.governorate?.toLowerCase().includes(gov),
        );
      }

      // NOUVEAU : filtre par email propriétaire
      if (ownerEmail.trim()) {
        const email = ownerEmail.toLowerCase();
        filtered = filtered.filter((l) =>
          l.owner?.email?.toLowerCase().includes(email),
        );
      }

      // NOUVEAU : filtre par date
      if (dateFrom) {
        const from = new Date(dateFrom);
        filtered = filtered.filter((l) => new Date(l.createdAt) >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        filtered = filtered.filter((l) => new Date(l.createdAt) <= to);
      }

      // NOUVEAU : tri
      filtered.sort((a, b) => {
        let aVal: any = a[sortField];
        let bVal: any = b[sortField];
        
        if (sortField === "price") {
          aVal = a.pricePerNight ?? a.pricePerMonth ?? 0;
          bVal = b.pricePerNight ?? b.pricePerMonth ?? 0;
        }
        
        if (typeof aVal === "string") {
          return sortOrder === "asc" 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });

      return filtered;
    },
    [searchQuery, statusFilter, typeFilter, priceMin, priceMax, governorate, ownerEmail, dateFrom, dateTo, sortField, sortOrder],
  );

  // Fetch listings (version qui marche)
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
      if (ownerEmail) params.append("ownerEmail", ownerEmail);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (locale) params.append("locale", locale);

      const res = await authFetch(`/api/listings?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items: any[] = data.listings ?? [];

      setListings(items);
      setFilteredListings(applyFilters(items));
      setTotalPages(Math.max(1, data.pagination?.totalPages ?? 1));
      setTotalCount(Math.max(0, data.pagination?.totalCount ?? 0));

      setStats({
        total: data.stats?.total ?? Math.max(0, data.pagination?.totalCount ?? 0),
        active: data.stats?.active ?? items.filter((l) => l.status === "ACTIVE").length,
        pending: data.stats?.pending ?? items.filter((l) => l.status === "PENDING_REVIEW").length,
        rejected: data.stats?.rejected ?? items.filter((l) => l.status === "REJECTED").length,
        inactive: data.stats?.inactive ?? items.filter((l) => l.status === "INACTIVE").length,
        archived: data.stats?.archived ?? items.filter((l) => l.status === "ARCHIVED").length,
        draft: data.stats?.draft ?? items.filter((l) => l.status === "DRAFT").length,
        suspended: data.stats?.suspended ?? items.filter((l) => l.status === "SUSPENDED").length,
      });

      const withCoords = items.find((l) => l.latitude && l.longitude);
      if (withCoords) {
        setMapCenter({ lat: withCoords.latitude, lng: withCoords.longitude });
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
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
    ownerEmail,
    dateFrom,
    dateTo,
    locale,
    applyFilters,
  ]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchListings();
      }, 30000);
      return () => {
        if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      };
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }
  }, [autoRefresh, fetchListings]);

  const fetchAdminAlerts = useCallback(async () => {
    try {
      const res = await authFetch(`/api/admin/alerts?locale=${locale}`);
      if (res.ok) {
        const data = await res.json();
        const alerts = data.alerts || [];

        const formattedAlerts: AdminAlert[] = alerts.map((alert: any) => ({
          id: alert.id,
          type: alert.type,
          title: alert.title,
          description: alert.description,
          priority: alert.priority,
          createdAt: alert.createdAt,
          status: alert.status,
          listingId: alert.listingId,
          listingTitle: alert.listingTitle,
          time: new Date(alert.createdAt).toLocaleString(locale, {
            hour: "2-digit",
            minute: "2-digit",
            day: "numeric",
            month: "short",
          }),
        }));

        setAdminAlerts(formattedAlerts);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setAdminAlerts([]);
    }
  }, [authFetch, locale]);

  useEffect(() => {
    fetchListings();
    fetchAdminAlerts();
  }, [fetchListings, fetchAdminAlerts]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuState({ listing: null, position: { top: 0, left: 0 } });
        setShowExport(false);
        setPreviewListing(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  // Actions admin
  const handleAction = async (
    type: string,
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    if (!id || id === "undefined") {
      console.error("ID invalide:", id);
      return { success: false, message: "ID de propriété invalide" };
    }

    console.log(`🔧 Action: ${type} sur l'ID: ${id}`);

    if (type === "valider" || type === "rejeter") {
      window.open(`/${locale}/admin/listings/validation/${id}`, "_blank");
      return { success: true, message: "" };
    }

    const endpoint = `/api/listings/${id}`;
    const actionMap: Record<
      string,
      { status?: string; method?: string; message: string }
    > = {
      activer: { status: "ACTIVE", method: "PATCH", message: "Propriété activée" },
      desactiver: { status: "INACTIVE", method: "PATCH", message: "Propriété désactivée" },
      archiver: { status: "ARCHIVED", method: "PATCH", message: "Propriété archivée" },
      supprimer: { method: "DELETE", message: "Propriété supprimée" },
    };

    const actionConfig = actionMap[type];
    if (!actionConfig) {
      return { success: false, message: "Action inconnue" };
    }

    try {
      let res;
      if (actionConfig.method === "DELETE") {
        res = await authFetch(endpoint, { method: "DELETE" });
      } else {
        res = await authFetch(endpoint, {
          method: "PATCH",
          body: JSON.stringify({ status: actionConfig.status }),
        });
      }

      if (res.ok) {
        fetchListings();
        fetchAdminAlerts();
        return { success: true, message: actionConfig.message };
      } else {
        const data = await res.json().catch(() => ({}));
        return {
          success: false,
          message: data.error || `Erreur lors de l'action: ${type}`,
        };
      }
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur de connexion" };
    }
  };

  // Action batch
  const handleBatchAction = async (type: string): Promise<{ success: boolean; message: string }> => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      return { success: false, message: "Aucune annonce sélectionnée" };
    }

    const results = await Promise.all(ids.map(id => handleAction(type, id)));
    const failed = results.filter(r => !r.success);
    
    if (failed.length === 0) {
      setSelectedIds(new Set());
      const actionText = type === "activer" ? "activées" : type === "desactiver" ? "désactivées" : "archivées";
      return { success: true, message: `${ids.length} annonce(s) ${actionText}` };
    } else {
      return { success: false, message: `${failed.length} échec(s) sur ${ids.length}` };
    }
  };

const handleExport = async (format: "csv" | "pdf") => {
  setShowExport(false);
  try {
    const filters = {
      search: searchQuery || undefined,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      type: typeFilter !== "ALL" ? typeFilter : undefined,
      minPrice: priceMin || undefined,
      maxPrice: priceMax || undefined,
      governorate: governorate || undefined,
      ownerEmail: ownerEmail || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      locale,
    };

    const response = await authFetch(
      `/api/admin/listings/export?format=${format}`,
      {
        method: "POST",
        body: JSON.stringify({ filters }),
      },
    );

    if (response.ok) {
      const blob = await response.blob();
      
      // Téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `export_proprietes_${new Date().toISOString().slice(0, 19)}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Optionnel: retourner un message de succès
      return { success: true, message: `Export ${format.toUpperCase()} généré` };
    } else {
      const data = await response.json().catch(() => ({}));
      return { success: false, message: data.error || "Export non disponible" };
    }
  } catch (error) {
    console.error("Export error:", error);
    return { success: false, message: "Erreur lors de l'export" };
  }
};
  const getMainImage = (listing: any) => {
    const photos = listing.photos ?? [];
    const main = photos.find((x: any) => x.isMain) ?? photos[0];
    return main?.url
      ? `/api/listings/image?url=${encodeURIComponent(main.url)}`
      : null;
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setPriceMin("");
    setPriceMax("");
    setGovernorate("");
    setOwnerEmail("");
    setDateFrom("");
    setDateTo("");
    setSortField("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  // Sélection multiple
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === listings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(listings.map(l => l.id)));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const mapListings = listings.filter((l) => l.latitude && l.longitude);

  return {
    listings: filteredListings,
    allListings: listings,
    loading,
    searchQuery,
    statusFilter,
    typeFilter,
    currentPage,
    totalPages,
    totalCount,
    showFilters,
    showExport,
    recentAlerts: adminAlerts,
    adminAlerts,
    menuState,
    mapCenter,
    priceMin,
    priceMax,
    governorate,
    ownerEmail,
    dateFrom,
    dateTo,
    stats,
    mapListings,
    selectedIds,
    sortField,
    sortOrder,
    autoRefresh,
    previewListing,
    PAGE_SIZE,
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    setCurrentPage,
    setShowFilters,
    setShowExport,
    setMenuState,
    setPriceMin,
    setPriceMax,
    setGovernorate,
    setOwnerEmail,
    setDateFrom,
    setDateTo,
    setAutoRefresh,
    setPreviewListing,
    fetchListings,
    handleAction,
    handleBatchAction,
    handleExport,
    getMainImage,
    resetFilters,
    toggleSelect,
    toggleSelectAll,
    handleSort,
  };
}