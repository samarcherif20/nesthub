// hooks/useListings.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

interface Listing {
  id: string;
  title: string;
  type: string;
  governorate: string;
  delegation: string;
  pricePerNight: number | null;
  pricePerMonth: number | null;
  status: "ACTIVE" | "INACTIVE" | "DRAFT" | "ARCHIVED";
  viewCount: number;
  bookingCount: number;
  favoriteCount?: number;
  photos: Array<{ url: string; isMain: boolean }>;
  publishedAt: string | null;
  createdAt: string;
}

interface TabCounts {
  all: number;
  active: number;
  inactive: number;
  draft: number;
  archived: number;
}

interface GlobalStats {
  totalRevenue: number;
  activeCount: number;
  totalViews: number;
  occupancyRate: number;
  revenueGrowth: number;
  viewsGrowth: number;
  occupancyGrowth: number;
}

interface PriceRange {
  min: number;
  max: number;
}

interface Filters {
  minPrice: string;
  maxPrice: string;
  minRooms: string;
  governorate: string;
}

export function useListings(pageSize: number = 6) {
  const { getToken } = useAuth();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive" | "draft" | "archived">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [tabCounts, setTabCounts] = useState<TabCounts>({ all: 0, active: 0, inactive: 0, draft: 0, archived: 0 });
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalRevenue: 0,
    activeCount: 0,
    totalViews: 0,
    occupancyRate: 0,
    revenueGrowth: 0,
    viewsGrowth: 0,
    occupancyGrowth: 0,
  });
  const [filters, setFilters] = useState<Filters>({ minPrice: '', maxPrice: '', minRooms: '', governorate: '' });
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 10000 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = await getToken({ template: "my-app-template" });
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  }, [getToken]);

  const showAlert = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }, []);

  const buildListingsUrl = useCallback(() => {
    const status = activeTab === "all" ? "ALL" : activeTab.toUpperCase();
    let url = `/api/listings/my?status=${status}&page=${currentPage}&pageSize=${pageSize}&search=${encodeURIComponent(searchQuery)}`;
    
    if (filters.minPrice && filters.minPrice !== '') {
      url += `&minPrice=${parseFloat(filters.minPrice)}`;
    }
    if (filters.maxPrice && filters.maxPrice !== '') {
      url += `&maxPrice=${parseFloat(filters.maxPrice)}`;
    }
    if (filters.minRooms && filters.minRooms !== '') {
      url += `&minRooms=${parseInt(filters.minRooms)}`;
    }
    if (filters.governorate && filters.governorate !== '') {
      url += `&governorate=${encodeURIComponent(filters.governorate)}`;
    }
    
    return url;
  }, [activeTab, currentPage, pageSize, searchQuery, filters]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const url = buildListingsUrl();
      const res = await authFetch(url);
      
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotalCount(data.pagination?.totalCount ?? 0);
        if (data.priceRange) {
          setPriceRange(data.priceRange);
        }
      } else {
        const error = await res.json();
        showAlert('error', error.error || "Erreur lors du chargement");
      }
    } catch (e) {
      showAlert('error', "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [authFetch, buildListingsUrl, showAlert]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const statuses = ["ALL", "ACTIVE", "INACTIVE", "DRAFT", "ARCHIVED"];
      const results = await Promise.all(
        statuses.map(status => 
          authFetch(`/api/listings/my?status=${status}&page=1&pageSize=1`)
            .then(res => res.json())
            .catch(() => ({ pagination: { totalCount: 0 } }))
        )
      );
      
      const [allData, activeData, inactiveData, draftData, archivedData] = results;
      
      setTabCounts({
        all: allData.pagination?.totalCount ?? 0,
        active: activeData.pagination?.totalCount ?? 0,
        inactive: inactiveData.pagination?.totalCount ?? 0,
        draft: draftData.pagination?.totalCount ?? 0,
        archived: archivedData.pagination?.totalCount ?? 0,
      });

      const allListingsRes = await authFetch(`/api/listings/my?status=ALL&page=1&pageSize=100`);
      if (allListingsRes.ok) {
        const data = await allListingsRes.json();
        const items: Listing[] = data.listings || [];
        
        const totalRevenue = items.reduce((s, l) => s + ((l.pricePerNight ?? l.pricePerMonth ?? 0) * (l.bookingCount ?? 0)), 0);
        const totalViews = items.reduce((s, l) => s + (l.viewCount ?? 0), 0);
        const totalBookings = items.reduce((s, l) => s + (l.bookingCount ?? 0), 0);
        const occupancyRate = items.length > 0 ? Math.min(Math.round((totalBookings / (items.length * 30)) * 100), 100) : 0;
        
        setGlobalStats({
          totalRevenue,
          activeCount: activeData.pagination?.totalCount ?? 0,
          totalViews,
          occupancyRate,
          revenueGrowth: totalRevenue > 0 ? 12.5 : 0,
          viewsGrowth: totalViews > 0 ? 8.2 : 0,
          occupancyGrowth: occupancyRate > 0 ? 2.1 : 0,
        });
      }
    } catch (e) {
      console.error("❌ Erreur stats:", e);
    } finally {
      setStatsLoading(false);
    }
  }, [authFetch]);

  // hooks/useListings.ts - CORRECTION de updateStatus

const updateStatus = useCallback(async (id: string, status: string, successMessage: string) => {
  console.log(`🔄 updateStatus appelé: id=${id}, status=${status}`);
  setActionLoading(id);
  try {
    // Utilisez la route dédiée [id]/route.ts avec PATCH
    const res = await authFetch(`/api/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),  // Envoyez directement le status
    });
    
    console.log(`📡 Réponse status: ${res.status}`);
    
    if (res.ok) {
      showAlert('success', successMessage);
      await Promise.all([fetchListings(), fetchStats()]);
    } else {
      const error = await res.json();
      console.error("❌ Erreur détaillée:", error);
      showAlert('error', error.error || "Une erreur est survenue");
    }
  } catch (e) {
    console.error("❌ Erreur réseau:", e);
    showAlert('error', "Erreur de connexion");
  } finally {
    setActionLoading(null);
  }
}, [authFetch, fetchListings, fetchStats, showAlert]);

  const handleDelete = useCallback(async (id: string, cancelBookings: boolean = false) => {
    setActionLoading(id);
    try {
      const url = `/api/listings/${id}?id=${id}&permanent=true&cancelBookings=${cancelBookings}`;
      const res = await authFetch(url, { method: "DELETE" });
      if (res.ok) {
        showAlert('success', cancelBookings ? "Annonce supprimée avec annulation des réservations" : "Annonce supprimée définitivement");
        await Promise.all([fetchListings(), fetchStats()]);
      } else {
        const error = await res.json();
        showAlert('error', error.error || "Impossible de supprimer l'annonce");
      }
    } catch (e) {
      showAlert('error', "Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  }, [authFetch, fetchListings, fetchStats, showAlert]);

  const resetFilters = useCallback(() => {
    setFilters({ minPrice: '', maxPrice: '', minRooms: '', governorate: '' });
    setCurrentPage(1);
  }, []);

  const refreshData = useCallback(() => {
    fetchListings();
    fetchStats();
  }, [fetchListings, fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, filters.minPrice, filters.maxPrice, filters.minRooms, filters.governorate]);

  return {
    listings,
    loading,
    statsLoading,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount,
    tabCounts,
    globalStats,
    filters,
    setFilters,
    priceRange,
    actionLoading,
    alert,
    setAlert,
    updateStatus,
    handleDelete,
    resetFilters,
    refreshData,
  };
}