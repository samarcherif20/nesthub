"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
// @ts-ignore
import "leaflet/dist/leaflet.css";
import {
  IoHeartOutline,
  IoHeart,
  IoBedOutline,
  IoWaterOutline,
  IoCheckmarkCircle,
  IoArrowBackOutline,
  IoLocationSharp,
  IoHomeOutline,
  IoEyeOutline,
  IoSearchOutline,
  IoLocation,
} from "react-icons/io5";
import { FaStar, FaGoogle } from "react-icons/fa";
import {
  Crown,
  ShieldCheck,
  MapPin,
  Users,
  Bath,
  BedDouble,
  X,
  ArrowRight,
  Ban,
  SlidersHorizontal,
} from "lucide-react";
import { CheckCircle, AlertCircle } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useMapData } from "./hooks/useMapData";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

// Imports dynamiques pour Leaflet (SSR: false)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);

const gradientButton = `
  bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 
  hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const gradientText =
  "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent";

const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return "https://placehold.co/600x400/e2e8f0/6366f1?text=NestHub";
  if (url.includes("vercel-storage.com")) {
    return `/api/listings/image?url=${encodeURIComponent(url)}`;
  }
  return url;
};

// Composant pour afficher les étoiles
const StarRating = ({ rating }: { rating?: number }) => {
  if (!rating) return null;

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <FaStar
          key={`full-${i}`}
          className="h-3 w-3 fill-amber-400 text-amber-400"
        />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <FaStar className="h-3 w-3 text-amber-400" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <FaStar className="h-3 w-3 fill-amber-400 text-amber-400" />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <FaStar
          key={`empty-${i}`}
          className="h-3 w-3 text-slate-300 dark:text-slate-600"
        />
      ))}
    </div>
  );
};

export default function MapPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("MapPage");
  const mapRef = useRef<any>(null);

  const [leafletReady, setLeafletReady] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const initLeaflet = async () => {
      const L = await import("leaflet");
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
      setLeafletReady(true);
    };

    initLeaflet();
  }, []);

  const {
    filteredListings,
    loading,
    error,
    favorites,
    imageErrors,
    filters,
    showFilters,
    setShowFilters,
    toggleFavorite,
    updateSearchTerm,
    updatePriceRange,
    updateSelectedType,
    updateMinRating,
    updateSortBy,
    resetFilters,
    handleImageError,
    getUserLocation,
    openInGoogleMaps,
    totalListings,
    filteredCount,
    favoritesCount,
  } = useMapData();

  if (error) {
    showToast("error", error);
  }

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isFav = !favorites.includes(id);
    toggleFavorite(id);
    showToast("success", isFav ? t("alerts.added") : t("alerts.removed"));
  };

  const handleResetFilters = () => {
    resetFilters();
    showToast("info", t("alerts.reset"));
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
    showToast("success", t("alerts.applied"));
  };

  const selectedListing = filteredListings.find((l) => l.id === selectedId);

  if (!leafletReady || loading) {
    return (
      <LoadingSpinner
        fullScreen={true}
        variant="spinner"
        size="lg"
        color="primary"
        text={t("loading")}
        speed="normal"
      />
    );
  }

  const center: [number, number] = [36.8065, 10.1815];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#f8fafe] text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : toast.type === "error"
                  ? "bg-red-500 text-white"
                  : "bg-sky-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <MapContainer
        ref={mapRef}
        center={center}
        zoom={8}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredListings.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.latitude, listing.longitude]}
            eventHandlers={{
              click: () => {
                setSelectedId(selectedId === listing.id ? null : listing.id);
              },
            }}
          />
        ))}
      </MapContainer>

      {/* ZOOM CONTROLS */}
      <div className="absolute right-6 bottom-24 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          title={t("zoomIn")}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-700 shadow-lg backdrop-blur-xl transition-all hover:scale-105 dark:border-white/10 dark:bg-slate-900/85 dark:text-white"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          title={t("zoomOut")}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-700 shadow-lg backdrop-blur-xl transition-all hover:scale-105 dark:border-white/10 dark:bg-slate-900/85 dark:text-white"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => getUserLocation(mapRef.current)}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-700 shadow-lg backdrop-blur-xl transition-all hover:scale-105 dark:border-white/10 dark:bg-slate-900/85 dark:text-white"
          title={t("myLocation")}
        >
          <IoLocation className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setSidebarOpen((p) => !p)}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-700 shadow-lg backdrop-blur-xl transition-all hover:scale-105 dark:border-white/10 dark:bg-slate-900/85 dark:text-white"
          title={sidebarOpen ? t("hideSidebar") : t("showSidebar")}
        >
          {sidebarOpen ? (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          )}
        </button>
      </div>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <div className="absolute left-4 top-4 bottom-4 z-20 flex w-[400px] flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/82 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-transform duration-300 dark:border-white/10 dark:bg-slate-950/82">
          <div className="flex-shrink-0 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-purple-50 p-4 dark:border-white/10 dark:from-slate-900 dark:to-purple-900/50">
            <Link
              href={`/${locale}/search`}
              className="mb-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-slate-800"
              title={t("backToSearch")}
            >
              <IoIosArrowBack className="text-slate-500 transition-all group-hover:-translate-x-1 dark:text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                {t("backToSearch")}
              </span>
            </Link>

            <div className="relative">
              <IoSearchOutline className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => updateSearchTerm(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
              />
              {filters.searchTerm && (
                <button
                  type="button"
                  onClick={() => updateSearchTerm("")}
                  className="absolute right-2 top-1/2 cursor-pointer -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                  title={t("clearSearch")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((p) => !p)}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title={showFilters ? t("hideFilters") : t("showFilters")}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {showFilters ? t("hideFilters") : t("showFilters")}
              {(filters.priceRange[1] < 5000 ||
                filters.minRating > 0 ||
                filters.selectedType !== "all") && (
                <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                  {t("active")}
                </span>
              )}
            </button>

            <div className="mt-2">
              <select
                value={filters.sortBy}
                onChange={(e) => updateSortBy(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
                title={t("sortBy")}
              >
                <option value="relevance">{t("sortBestRated")}</option>
                <option value="price_asc">{t("sortPriceAsc")}</option>
                <option value="price_desc">{t("sortPriceDesc")}</option>
                <option value="rating">{t("sortRating")}</option>
              </select>
            </div>

            {showFilters && (
              <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-800">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {t("maxPrice")} — {filters.priceRange[1]} TND
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={filters.priceRange[1]}
                    onChange={(e) =>
                      updatePriceRange([
                        filters.priceRange[0],
                        parseInt(e.target.value),
                      ])
                    }
                    className="h-2 w-full cursor-pointer rounded-lg bg-indigo-200 accent-indigo-500 dark:bg-indigo-900"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {t("propertyType")}
                  </label>
                  <select
                    value={filters.selectedType}
                    onChange={(e) => updateSelectedType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-slate-700 dark:text-slate-200"
                  >
                    <option value="all">{t("allTypes")}</option>
                    <option value="VILLA">{t("villa")}</option>
                    <option value="HOUSE">{t("house")}</option>
                    <option value="APARTMENT">{t("apartment")}</option>
                    <option value="STUDIO">{t("studio")}</option>
                    <option value="DUPLEX">{t("duplex")}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {t("minRating")} —{" "}
                    {filters.minRating > 0
                      ? `${filters.minRating}+ stars`
                      : t("allRatings")}
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => updateMinRating(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-slate-700 dark:text-slate-200"
                  >
                    <option value={0}>{t("allRatings")}</option>
                    <option value={4}>4+ stars</option>
                    <option value={4.5}>4.5+ stars</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex-1 cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-indigo-600 transition-all hover:bg-indigo-50 dark:border-white/10 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                    title={t("resetFilters")}
                  >
                    {t("reset")}
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className={`flex-1 cursor-pointer rounded-xl ${gradientButton} px-4 py-2.5 text-xs font-bold shadow-md shadow-blue-500/15 transition-all hover:scale-[1.01]`}
                    title={t("applyFilters")}
                  >
                    {t("apply")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {filteredCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Ban className="mb-4 h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {t("noListings")}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className={`mt-3 cursor-pointer rounded-full ${gradientButton} px-5 py-2 text-xs font-bold text-white`}
                  title={t("resetAllFilters")}
                >
                  {t("resetAll")}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredListings.map((listing) => {
                  const isSelected = selectedId === listing.id;
                  const imageUrl = imageErrors[listing.id]
                    ? "https://placehold.co/600x400/e2e8f0/6366f1?text=NestHub"
                    : getImageUrl(listing.image);

                  return (
                    <div
                      key={listing.id}
                      onClick={() => {
                        setSelectedId(isSelected ? null : listing.id);
                        if (mapRef.current && !isSelected) {
                          mapRef.current.setView(
                            [listing.latitude, listing.longitude],
                            14,
                          );
                        }
                      }}
                      className={`cursor-pointer p-3 rounded-xl transition-all duration-300 bg-white dark:bg-slate-900 border ${
                        isSelected
                          ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30"
                          : "border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={imageUrl}
                            alt={listing.title}
                            className="w-20 h-20 object-cover rounded-lg"
                            onError={() => handleImageError(listing.id)}
                          />
                          {listing.isVerified && (
                            <div className="absolute -top-1 -right-1 bg-indigo-500 rounded-full p-0.5">
                              <IoCheckmarkCircle className="text-white text-xs" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <h3 className="font-semibold text-sm line-clamp-1 text-slate-900 dark:text-white">
                              {listing.title}
                            </h3>
                            <button
                              type="button"
                              onClick={(e) =>
                                handleToggleFavorite(listing.id, e)
                              }
                              className="flex-shrink-0 cursor-pointer transition-transform duration-200 hover:scale-110"
                              title={
                                favorites.includes(listing.id)
                                  ? t("removeFromFavorites")
                                  : t("addToFavorites")
                              }
                            >
                              {favorites.includes(listing.id) ? (
                                <IoHeart className="text-rose-500 text-sm" />
                              ) : (
                                <IoHeartOutline className="text-slate-400 dark:text-slate-500 text-sm" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                            <IoLocationSharp className="text-xs" />
                            <span className="truncate">
                              {listing.governorate}, {listing.delegation}
                            </span>
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <IoBedOutline className="text-xs" />{" "}
                              {listing.bedrooms}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <IoWaterOutline className="text-xs" />{" "}
                              {listing.bathrooms}
                            </span>
                            {listing.rating && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <StarRating rating={listing.rating} />
                              </span>
                            )}
                          </div>
                          <p
                            className={`font-bold text-sm mt-1 ${gradientText}`}
                          >
                            {listing.pricePerNight} TND{" "}
                            <span className="text-xs text-slate-400">
                              {t("perNight")}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 border-t border-slate-100 px-4 py-3 dark:border-white/10">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <IoEyeOutline className="text-xs" />
                {filteredCount} / {totalListings}
              </span>
              <span className="flex items-center gap-1">
                <IoHeart className="h-3 w-3 fill-rose-500 text-rose-500" />{" "}
                {favoritesCount}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
        <div className="flex items-center gap-4 rounded-full border border-white/70 bg-white/85 px-5 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/85">
          <span className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            <IoHomeOutline className="h-4 w-4 text-indigo-500" />{" "}
            {filteredCount} {t("results")}
          </span>
          <span className="h-5 w-px bg-slate-200 dark:bg-white/10" />
          <span className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            <IoHeart className="h-4 w-4 fill-rose-500 text-rose-500" />{" "}
            {favoritesCount} {t("favorites")}
          </span>
        </div>
      </div>

      {selectedListing && (
        <div className="absolute right-6 top-24 z-20 w-[380px] overflow-hidden rounded-3xl border border-white/70 bg-white/92 shadow-[0_28px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-slate-950/92">
          <div className="relative h-52 overflow-hidden">
            <img
              src={
                imageErrors[selectedListing.id]
                  ? "https://placehold.co/600x400/e2e8f0/6366f1?text=NestHub"
                  : getImageUrl(selectedListing.image)
              }
              alt={selectedListing.title}
              className="h-full w-full object-cover"
              onError={() => handleImageError(selectedListing.id)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur-md transition-all hover:scale-110 dark:bg-slate-900/90 dark:text-white"
              title={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {selectedListing.isVerified && (
                <span className="rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-bold text-white">
                  <ShieldCheck className="inline h-3 w-3" /> {t("verified")}
                </span>
              )}
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-2xl font-extrabold text-white">
                  {selectedListing.title}
                </h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
                  <MapPin className="h-3.5 w-3.5" />{" "}
                  {selectedListing.governorate}, {selectedListing.delegation}
                </p>
              </div>
              <div className="rounded-2xl bg-white/90 px-5 py-3 text-right shadow-lg backdrop-blur-md dark:bg-slate-900/90">
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {selectedListing.pricePerNight} TND
                </p>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  / {t("night")}
                </p>
              </div>
            </div>
          </div>
          <div className="p-5">
            {selectedListing.trustScore && (
              <div className="mb-4 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t("nesthubScore")} : {selectedListing.trustScore}%
                </span>
                <div className="ml-auto h-2 max-w-[120px] flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600"
                    style={{ width: `${selectedListing.trustScore}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mb-4 grid grid-cols-4 gap-2">
              {selectedListing.rating && (
                <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 px-2 py-3 dark:bg-white/5">
                  <FaStar className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300">
                    {selectedListing.rating}
                  </span>
                </div>
              )}
              {selectedListing.bedrooms > 0 && (
                <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 px-2 py-3 dark:bg-white/5">
                  <BedDouble className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300">
                    {selectedListing.bedrooms} {t("bedrooms")}
                  </span>
                </div>
              )}
              {selectedListing.bathrooms > 0 && (
                <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 px-2 py-3 dark:bg-white/5">
                  <Bath className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300">
                    {selectedListing.bathrooms} {t("bathrooms")}
                  </span>
                </div>
              )}
              {selectedListing.maxGuests && selectedListing.maxGuests > 0 && (
                <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 px-2 py-3 dark:bg-white/5">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300">
                    {selectedListing.maxGuests} {t("guests")}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => openInGoogleMaps(selectedListing)}
                className="flex-1 cursor-pointer rounded-xl bg-red-500 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.01] hover:bg-red-700 flex items-center justify-center gap-2"
                title={t("openInGoogleMaps")}
              >
                <FaGoogle className="h-3.5 w-3.5" />
                {t("openInGoogleMaps")}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => handleToggleFavorite(selectedListing.id, e)}
                className={`flex-1 cursor-pointer rounded-xl py-3 text-xs font-bold transition-all ${
                  favorites.includes(selectedListing.id)
                    ? "border-2 border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                }`}
                title={
                  favorites.includes(selectedListing.id)
                    ? t("removeFromFavorites")
                    : t("addToFavorites")
                }
              >
                <span className="inline-flex items-center gap-1.5">
                  {favorites.includes(selectedListing.id) ? (
                    <IoHeart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                  ) : (
                    <IoHeartOutline className="h-3.5 w-3.5" />
                  )}
                  {favorites.includes(selectedListing.id)
                    ? t("favorite")
                    : t("save")}
                </span>
              </button>
              <Link
                href={`/${locale}/listings/${selectedListing.id}`}
                className={`flex-1 cursor-pointer rounded-xl ${gradientButton} py-3 text-xs font-bold shadow-md shadow-blue-500/15 transition-all hover:scale-[1.01]`}
                title={t("viewDetails")}
              >
                <span className="flex items-center justify-center gap-1.5 w-full text-center">
                  <span>{t("viewDetails")}</span>
                  <IoIosArrowForward className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          border-radius: 16px;
          padding: 0;
          background: transparent;
          box-shadow: none;
        }
        .leaflet-popup-content {
          margin: 0;
        }
        .leaflet-popup-tip {
          background: white;
        }
        .dark .leaflet-popup-tip {
          background: rgb(30, 41, 59);
        }
        .leaflet-container {
          font-family: "Inter", sans-serif;
          background: #f0f9ff;
        }
        .dark .leaflet-container {
          background: #0f172a;
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #8b5cf6;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #7c3aed;
        }
        .dark ::-webkit-scrollbar-thumb {
          background: #8b5cf6;
        }
        .dark ::-webkit-scrollbar-track {
          background: #1e293b;
        }
      `}</style>
    </div>
  );
}
