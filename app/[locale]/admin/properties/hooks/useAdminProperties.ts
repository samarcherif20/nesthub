// app/[locale]/admin/properties/hooks/useAdminProperties.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

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

export function useAdminProperties() {
  const { getToken } = useAuth();
  const PAGE_SIZE = 10;

  // États
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
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
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

  // Appliquer tous les filtres
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

      return filtered;
    },
    [searchQuery, statusFilter, typeFilter, priceMin, priceMax, governorate],
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
      setFilteredListings(items);
      setTotalPages(Math.max(1, data.pagination?.totalPages ?? 1));
      setTotalCount(Math.max(0, data.pagination?.totalCount ?? 0));

      // ✅ CORRECTION STATS: Utiliser les vraies stats depuis l'API ou calculer correctement
      setStats({
        total:
          data.stats?.total ?? Math.max(0, data.pagination?.totalCount ?? 0),
        active:
          data.stats?.active ??
          items.filter((l) => l.status === "ACTIVE").length,
        pending:
          data.stats?.pending ??
          items.filter((l) => l.status === "PENDING_REVIEW").length,
        rejected:
          data.stats?.rejected ??
          items.filter((l) => l.status === "REJECTED").length,
        inactive:
          data.stats?.inactive ??
          items.filter((l) => l.status === "INACTIVE").length,
        archived:
          data.stats?.archived ??
          items.filter((l) => l.status === "ARCHIVED").length,
        draft:
          data.stats?.draft ?? items.filter((l) => l.status === "DRAFT").length,
        suspended:
          data.stats?.suspended ??
          items.filter((l) => l.status === "SUSPENDED").length,
      });

      const withCoords = items.find((l) => l.latitude && l.longitude);
      if (withCoords) {
        setMapCenter({ lat: withCoords.latitude, lng: withCoords.longitude });
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
      setAlert({
        type: "error",
        message: "Erreur lors du chargement des annonces",
      });
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

  // Dans useAdminProperties.ts, remplacez fetchAdminAlerts par :

  const fetchAdminAlerts = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/alerts");
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
          time: new Date(alert.createdAt).toLocaleString("fr-FR", {
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
  }, [authFetch]);

  useEffect(() => {
    fetchListings();
    fetchAdminAlerts();
  }, [fetchListings, fetchAdminAlerts]);

  useEffect(() => {
    if (listings.length > 0) {
      const filtered = applyFilters(listings);
      setFilteredListings(filtered);
      setTotalCount(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
    }
  }, [applyFilters, listings, PAGE_SIZE]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuState({ listing: null, position: { top: 0, left: 0 } });
        setShowExport(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  // Actions admin
  const handleAction = async (type: string, id: string) => {
    if (!id || id === "undefined") {
      console.error("ID invalide:", id);
      setAlert({
        type: "error",
        message: "Erreur: ID de propriété invalide",
      });
      return;
    }

    console.log(`🔧 Action: ${type} sur l'ID: ${id}`);

    const endpoint = `/api/listings/${id}`;
    const actionMap: Record<
      string,
      { status?: string; method?: string; message: string }
    > = {
      valider: {
        status: "ACTIVE",
        method: "PATCH",
        message: "Propriété validée avec succès",
      },
      rejeter: {
        status: "REJECTED",
        method: "PATCH",
        message: "Propriété rejetée",
      },
      activer: {
        status: "ACTIVE",
        method: "PATCH",
        message: "Propriété activée",
      },
      desactiver: {
        status: "INACTIVE",
        method: "PATCH",
        message: "Propriété désactivée",
      },
      archiver: {
        status: "ARCHIVED",
        method: "PATCH",
        message: "Propriété archivée",
      },
      supprimer: { method: "DELETE", message: "Propriété supprimée" },
    };

    const actionConfig = actionMap[type];
    if (!actionConfig) {
      setAlert({ type: "error", message: "Action inconnue" });
      return;
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
        setAlert({ type: "success", message: actionConfig.message });
        fetchListings();
        fetchAdminAlerts();
      } else {
        const data = await res.json().catch(() => ({}));
        setAlert({
          type: "error",
          message: data.error || `Erreur lors de l'action: ${type}`,
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      setAlert({ type: "error", message: "Erreur de connexion" });
    }
  };

  // ✅ CORRECTION EXPORT
  const handleExport = async (format: "csv" | "pdf") => {
    setShowExport(false);
    try {
      // Construire les filtres
      const filters = {
        search: searchQuery || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        type: typeFilter !== "ALL" ? typeFilter : undefined,
        minPrice: priceMin || undefined,
        maxPrice: priceMax || undefined,
        governorate: governorate || undefined,
      };

      // Envoyer format dans l'URL et filters dans le body
      const response = await authFetch(
        `/api/admin/listings/export?format=${format}`,
        {
          method: "POST",
          body: JSON.stringify({ filters }),
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        // Extraire le nom du fichier du header Content-Disposition
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = `proprietes_${new Date().toISOString().split("T")[0]}.${format}`;
        if (contentDisposition) {
          const match = contentDisposition.match(
            /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
          );
          if (match && match[1]) {
            filename = match[1].replace(/['"]/g, "");
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
    setCurrentPage(1);
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
    alert,
    recentAlerts: adminAlerts,
    adminAlerts,
    menuState,
    mapCenter,
    priceMin,
    priceMax,
    governorate,
    stats,
    mapListings,
    PAGE_SIZE,
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
    fetchListings,
    handleAction,
    handleExport,
    getMainImage,
    resetFilters,
  };
}
