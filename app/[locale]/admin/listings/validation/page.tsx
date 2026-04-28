// app/[locale]/admin/listings/validation/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
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
  pricePerNight: number;
  images: string[];
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePictureUrl: string | null;
    email: string;
  };
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
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
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 5,
    totalCount: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const isInitialMount = useRef(true);

  const showAlert = (type: "success" | "error" | "info", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: "PENDING_REVIEW",
        search: debouncedSearch,
      });

      const response = await fetch(`/api/admin/listings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setListings(data.listings);
      setPagination(data.pagination);
    } catch (error) {
      console.error(error);
      showAlert("error", "Erreur lors du chargement des annonces");
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, debouncedSearch]);

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchListings();
  }, [debouncedSearch]);

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

  const getStatusBadge = () => {
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
        En attente
      </span>
    );
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    fetchListings();
  };

  const handleImageError = (listingId: string) =>
    setImageErrors((prev) => ({ ...prev, [listingId]: true }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  const totalPending = pagination.totalCount;
  const processedToday = 0;
  const avgResponseTime = 3.4;

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

          {/* Cartes KPIs avec indicateurs de performance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Carte 1 - Total en attente */}
            <div
              className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-4 ${card3d}`}
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
                    {totalPending}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center text-red-500 text-[11px] font-semibold">
                  <IoTrendingUpOutline className="text-sm mr-1" />
                  <span>12% plus qu'hier</span>
                </div>
              </div>
            </div>

            {/* Carte 2 - Traités aujourd'hui */}
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
                    {processedToday}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center text-emerald-600 text-[11px] font-semibold">
                  <IoCheckmarkCircle className="text-sm mr-1" />
                  <span>85% taux de complétion</span>
                </div>
              </div>
            </div>

            {/* Carte 3 - Temps moyen de réponse */}
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
                    {avgResponseTime}h
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

          {/* Filtres */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par titre, propriétaire..."
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  onClick={() => fetchListings()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold shadow-sm transition-all"
                >
                  Appliquer
                </button>
              </div>
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
                      Date de soumission
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
                  {listings.map((listing) => {
                    const listingImageUrl = listing.images?.[0];
                    const proxiedUrl = getListingImageUrl(listingImageUrl);
                    const hasImageError = imageErrors[listing.id];
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
                                Propriétaire
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
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
                          <p className="text-sm text-slate-900 dark:text-white">
                            {format(
                              new Date(listing.createdAt),
                              "dd MMM yyyy",
                              { locale: fr },
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatDistanceToNow(new Date(listing.createdAt), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getStatusBadge()}
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
                  })}
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
