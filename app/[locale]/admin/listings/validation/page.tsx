// app/[locale]/admin/listings/validation/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  IoSearchOutline,
  IoHourglassOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoHomeOutline,
  IoTrendingUpOutline,
  IoCheckmarkCircle,
  IoTimeOutline as IoTimeIcon,
  IoEyeOutline,
  IoGitBranchOutline,
  IoCreateOutline,
  IoCloseOutline,
} from "react-icons/io5";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertBanner from "@/components/ui/Alert";
import Pagination from "@/components/ui/Pagination";

const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

interface ListingValidation {
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

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface StatsData {
  total: number;
  pending: number;
  revisions: number;
  processedToday: number;
  avgResponseTime: number;
}

const getAvatarUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  return `/api/admin/serve-image?url=${encodeURIComponent(url)}`;
};

const getListingImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return "";
  return `/api/listings/image?url=${encodeURIComponent(imageUrl)}`;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ListingsValidationPage() {
  const { getToken } = useAuth();
  const [listings, setListings] = useState<ListingValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "revisions">(
    "all",
  );
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [tempSearch, setTempSearch] = useState(""); // Pour la recherche temporaire
  const debouncedSearch = useDebounce(search, 500);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    pending: 0,
    revisions: 0,
    processedToday: 0,
    avgResponseTime: 0,
  });
  const isInitialMount = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const showAlert = (type: "success" | "error" | "info", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  // Fetch statistics
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
    // Annuler la requête précédente si elle existe
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
        throw new Error(errorData.error || "Erreur lors du chargement");
      }

      const data = await response.json();
      setListings(data.listings || []);
      setPagination(
        data.pagination || {
          page: 1,
          limit: 10,
          totalCount: 0,
          totalPages: 1,
        },
      );
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error(error);
        showAlert("error", "Erreur lors du chargement des annonces");
        setListings([]);
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, activeTab, debouncedSearch]);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchListings();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle tab change
  const handleTabChange = (tab: typeof activeTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearch("");
    setTempSearch("");
  };

  // Handle search submit
  const handleSearchSubmit = () => {
    setSearch(tempSearch);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchClear = () => {
    setTempSearch("");
    setSearch("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page === pagination.page) return;
    setPagination((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset page when search changes
  useEffect(() => {
    if (!isInitialMount.current && debouncedSearch !== "") {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [debouncedSearch]);

  // Fetch when dependencies change
  useEffect(() => {
    if (!isInitialMount.current) {
      fetchListings();
    }
    isInitialMount.current = false;
  }, [fetchListings, pagination.page, activeTab, debouncedSearch]);

  const getListingTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      APARTMENT: "Appartement",
      VILLA: "Villa",
      HOUSE: "Maison",
      STUDIO: "Studio",
      DUPLEX: "Duplex",
      LAND: "Terrain",
      COMMERCIAL: "Commercial",
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string, hasPendingRevision: boolean) => {
    if (status === "PENDING_REVIEW" && !hasPendingRevision) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 flex items-center gap-1">
          <IoHourglassOutline size={10} />
          Nouvelle
        </span>
      );
    }
    if (status === "ACTIVE" && hasPendingRevision) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1">
          <IoGitBranchOutline size={10} />
          Modification
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        En attente
      </span>
    );
  };

  const handleImageError = (listingId: string) =>
    setImageErrors((prev) => ({ ...prev, [listingId]: true }));

  const tabs = [
    {
      id: "all" as const,
      label: "Toutes",
      icon: IoHourglassOutline,
      count: stats.total,
    },
    {
      id: "pending" as const,
      label: "Nouvelles annonces",
      icon: IoCreateOutline,
      count: stats.pending,
    },
    {
      id: "revisions" as const,
      label: "Modifications",
      icon: IoGitBranchOutline,
      count: stats.revisions,
    },
  ];

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 overflow-x-hidden">
      {alert && (
        <div className="fixed top-20 right-8 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      <div className="flex-1">
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Validation des annonces
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                Gérez et validez les annonces en attente de publication
              </p>
            </div>
          </div>

          {/* Cartes KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div
              className={`bg-white dark:bg-slate-900 rounded-2xl border border-orange-100 dark:border-orange-900/40 p-4 ${card3d}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <IoHourglassOutline className="text-orange-600 dark:text-orange-400 text-lg" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    En attente
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.total}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center text-orange-500 text-[11px] font-semibold">
                  <IoTrendingUpOutline className="text-sm mr-1" />
                  <span>
                    {stats.pending} nouvelles, {stats.revisions} modifications
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 p-4 ${card3d}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <IoCheckmarkCircle className="text-emerald-600 dark:text-emerald-400 text-lg" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Traités aujourd'hui
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.processedToday}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-purple-900/40 p-4 ${card3d}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <IoTimeOutline className="text-purple-600 dark:text-purple-400 text-lg" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Temps moyen
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.avgResponseTime}h
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center text-slate-500 text-[11px] font-semibold">
                  <IoTimeIcon className="text-sm mr-1" />
                  <span>Objectif: &lt; 4 heures</span>
                </div>
              </div>
            </div>
          </div>

          {/* Onglets */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filtres */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
                  <input
                    type="text"
                    value={tempSearch}
                    onChange={(e) => setTempSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                    placeholder="Rechercher par titre, propriétaire..."
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100"
                  />
                  {tempSearch && (
                    <button
                      onClick={handleSearchClear}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <IoCloseOutline size={18} />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearchSubmit}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Chargement..." : "Appliquer"}
                </button>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {pagination.totalCount > 0 ? (
                <>
                  Affichage de{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {listings.length}
                  </span>{" "}
                  sur{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {pagination.totalCount}
                  </span>{" "}
                  annonces
                </>
              ) : (
                "Aucune annonce trouvée"
              )}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500 dark:text-slate-400">
                Afficher:
              </label>
              <select
                value={pagination.limit}
                onChange={(e) => {
                  const newLimit = parseInt(e.target.value);
                  setPagination((prev) => ({
                    ...prev,
                    limit: newLimit,
                    page: 1,
                  }));
                }}
                className="px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm text-slate-900 dark:text-slate-100"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Tableau */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden w-full max-w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      Propriétaire
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      Annonce
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      Prix
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading && listings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <LoadingSpinner size="md" color="primary" />
                      </td>
                    </tr>
                  ) : listings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <IoHomeOutline className="w-12 h-12 text-slate-400 mb-3" />
                          <p className="text-slate-500 dark:text-slate-400">
                            Aucune annonce trouvée
                          </p>
                          {(search || activeTab !== "all") && (
                            <button
                              onClick={() => {
                                setSearch("");
                                setTempSearch("");
                                setActiveTab("all");
                              }}
                              className="mt-3 text-sm text-indigo-600 hover:text-indigo-700"
                            >
                              Réinitialiser les filtres
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    listings.map((listing) => {
                      const listingImageUrl = listing.images?.[0];
                      const proxiedUrl = getListingImageUrl(listingImageUrl);
                      const hasImageError = imageErrors[listing.id];
                      const displayPrice =
                        listing.pricePerNight || listing.pricePerMonth;
                      const priceUnit = listing.pricePerNight
                        ? "/nuit"
                        : "/mois";

                      return (
                        <tr
                          key={listing.id}
                          className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors"
                        >
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 overflow-hidden flex items-center justify-center">
                                {listing.owner.profilePictureUrl ? (
                                  <img
                                    src={getAvatarUrl(
                                      listing.owner.profilePictureUrl,
                                    )}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) =>
                                      (e.currentTarget.style.display = "none")
                                    }
                                  />
                                ) : (
                                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                    {listing.owner.firstName?.charAt(0) || "P"}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                  {listing.owner.firstName}{" "}
                                  {listing.owner.lastName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {listing.owner.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                                {listingImageUrl && !hasImageError ? (
                                  <img
                                    src={proxiedUrl}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                    onError={() => handleImageError(listing.id)}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                    <IoHomeOutline className="w-5 h-5 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px]">
                                  {listing.title}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <IoLocationOutline className="text-[9px]" />
                                  <span className="truncate max-w-[150px]">
                                    {listing.governorate}, {listing.delegation}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {getListingTypeLabel(listing.type)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {displayPrice ? (
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">
                                  {displayPrice.toLocaleString()} TND
                                </p>
                                <p className="text-[9px] text-slate-400">
                                  {priceUnit}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <p className="text-sm text-slate-900 dark:text-white">
                              {format(
                                new Date(listing.createdAt),
                                "dd MMM yyyy",
                                { locale: fr },
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formatDistanceToNow(
                                new Date(listing.createdAt),
                                {
                                  addSuffix: true,
                                  locale: fr,
                                },
                              )}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {getStatusBadge(
                              listing.status,
                              listing.hasPendingRevision,
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <Link
                              href={`/admin/listings/${listing.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-all"
                            >
                              <IoEyeOutline className="text-sm" />
                              Traiter
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="border-t border-indigo-50 dark:border-indigo-900/30 px-4 py-3">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalCount}
                  pageSize={pagination.limit}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
