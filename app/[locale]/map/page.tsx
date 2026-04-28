// app/[locale]/map/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { AnimatedCircle } from "@/components/ui/maps/AnimatedCircle";
import "leaflet/dist/leaflet.css";
import {
  IoHeartOutline,
  IoHeart,
  IoBedOutline,
  IoWaterOutline,
  IoLocationOutline,
  IoCheckmarkCircle,
  IoArrowBackOutline,
  IoLocationSharp,
  IoHomeOutline,
  IoEyeOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoCloseOutline,
} from "react-icons/io5";
import { FaStar } from "react-icons/fa";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertBanner from "@/components/ui/Alert";
import { useMapData } from "./hooks/useMapData";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

const gradientButton = `
  bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 
  hover:from-sky-500 hover:via-indigo-500 hover:to-purple-600
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const gradientText =
  "bg-gradient-to-r from-indigo-600 via-sky-500 to-purple-600 bg-clip-text text-transparent";

const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return "https://placehold.co/600x400/e2e8f0/1e90ff?text=NestHub";
  if (url.includes("vercel-storage.com")) {
    return `/api/listings/image?url=${encodeURIComponent(url)}`;
  }
  return url;
};

export default function MapPage() {
  const t = useTranslations("MapPage");
  const {
    filteredListings,
    loading,
    favorites,
    L,
    imageErrors,
    filters,
    showFilters,
    setShowFilters,
    toggleFavorite,
    updateSearchTerm,
    updatePriceRange,
    updateSelectedType,
    updateMinRating,
    resetFilters,
    handleImageError,
    totalListings,
    filteredCount,
    favoritesCount,
  } = useMapData();

  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);

  const showAlert = (
    type: "success" | "error" | "info" | "warning",
    message: string,
  ) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isFav = !favorites.includes(id);
    toggleFavorite(id);
    showAlert("success", isFav ? t("alerts.added") : t("alerts.removed"));
  };

  const handleResetFilters = () => {
    resetFilters();
    showAlert("info", t("alerts.reset"));
  };

  const handleApplyFilters = () => {
    showAlert("success", t("alerts.applied"));
  };

  if (!L || loading) {
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
    <div className="relative min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-800 dark:to-purple-900">
      {alert && (
        <div className="fixed top-20 right-8 z-[60] animate-in slide-in-from-top-2 fade-in duration-300">
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* Counter floating on map */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full px-5 py-2.5 shadow-lg border border-slate-200 dark:border-slate-700">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <IoHomeOutline className="dark:text-white text-slate-900 text-sm" />
            <span>
              {filteredCount} {t("listings")}
            </span>
          </span>
          <span className="w-px h-4 bg-slate-300 dark:bg-slate-600"></span>
          <span className="flex items-center gap-1.5">
            <IoHeart className="text-red-500 text-sm" />
            <span>
              {favoritesCount} {t("favorites")}
            </span>
          </span>
        </span>
      </div>

      {/* Map */}
      <MapContainer
        center={center}
        zoom={7}
        style={{ height: "100vh", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {filteredListings.map((listing) => (
          <AnimatedCircle
            key={listing.id}
            center={[listing.latitude, listing.longitude]}
            radius={2000}
            color="#ef4444"
            fillColor="#ef4444"
            fillOpacity={0.25}
            weight={2.5}
          >
            <Popup>
              <div className="min-w-[260px] p-3 bg-white dark:bg-slate-900 rounded-xl">
                <div className="relative">
                  <img
                    src={
                      imageErrors[listing.id]
                        ? "https://placehold.co/600x400/e2e8f0/1e90ff?text=NestHub"
                        : getImageUrl(listing.image)
                    }
                    alt={listing.title}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                    onError={() => handleImageError(listing.id)}
                  />
                  <button
                    onClick={(e) => handleToggleFavorite(listing.id, e)}
                    className="absolute top-2 right-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:scale-110 transition-transform duration-200"
                  >
                    {favorites.includes(listing.id) ? (
                      <IoHeart className="text-red-500 text-lg" />
                    ) : (
                      <IoHeartOutline className="text-slate-600 dark:text-slate-400 text-lg" />
                    )}
                  </button>
                  {listing.isVerified && (
                    <span className="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1">
                      <IoCheckmarkCircle className="text-sm" />
                      {t("verified")}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm mt-2 line-clamp-1 text-slate-800 dark:text-white">
                  {listing.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                  <IoLocationOutline className="text-sm" />
                  {listing.governorate}, {listing.delegation}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <IoBedOutline className="text-sm" /> {listing.bedrooms}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <IoWaterOutline className="text-sm" /> {listing.bathrooms}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <FaStar className="text-yellow-500 text-xs" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {listing.rating || 4.5}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({listing.reviewCount || 0} {t("reviews")})
                  </span>
                </div>
                <p className={`text-sm font-bold mt-2 ${gradientText}`}>
                  {listing.pricePerNight} TND / {t("perNight")}
                </p>
                <Link
                  href={`/fr/listings/${listing.id}`}
                  className={`block mt-3 text-center text-white text-xs py-2 rounded-lg transition-all duration-300 ${gradientButton}`}
                >
                  {t("viewListing")}
                </Link>
              </div>
            </Popup>
          </AnimatedCircle>
        ))}
      </MapContainer>

      {/* Sidebar with listings and search */}
      <div className="absolute top-4 left-4 bottom-4 w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden z-10 flex flex-col border border-slate-200 dark:border-slate-700">
        {/* Header with search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-slate-900 dark:to-purple-900/50">
          {/* Back button */}
          <Link
            href="/fr/search"
            className="flex items-center justify-center gap-2 w-full mb-3 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-all duration-300 group"
          >
            <IoArrowBackOutline className="text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:-translate-x-1 transition-all duration-300" />
            <span className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              {t("backToSearch")}
            </span>
          </Link>

          {/* Search bar */}
          <div className="relative">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={filters.searchTerm}
              onChange={(e) => updateSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
            />
            {filters.searchTerm && (
              <button
                onClick={() => updateSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <IoCloseOutline className="text-slate-400 hover:text-slate-600 text-sm" />
              </button>
            )}
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 mt-3 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition w-full justify-center"
          >
            <IoFilterOutline className="text-sm" />
            {showFilters ? t("hideFilters") : t("showFilters")}
          </button>

          {/* Filters panel */}
          {showFilters && (
            <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-lg space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  {t("maxPrice")} {filters.priceRange[1]} TND
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
                  className="w-full h-2 bg-indigo-200 dark:bg-indigo-900 rounded-lg cursor-pointer accent-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  {t("propertyType")}
                </label>
                <select
                  value={filters.selectedType}
                  onChange={(e) => updateSelectedType(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">{t("allTypes")}</option>
                  <option value="villa">{t("villa")}</option>
                  <option value="appartement">{t("apartment")}</option>
                  <option value="maison">{t("house")}</option>
                  <option value="studio">{t("studio")}</option>
                  <option value="duplex">{t("duplex")}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  {t("minRating")} {filters.minRating}+ ⭐
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => updateMinRating(Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={0}>{t("allRatings")}</option>
                  <option value={4}>4+ {t("stars")}</option>
                  <option value={4.5}>4.5+ {t("stars")}</option>
                </select>
              </div>

              <button
                onClick={handleResetFilters}
                className="w-full px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition"
              >
                {t("resetFilters")}
              </button>

              <button
                onClick={handleApplyFilters}
                className={`w-full px-3 py-1.5 text-xs font-medium rounded-lg transition ${gradientButton}`}
              >
                {t("applyFilters")}
              </button>
            </div>
          )}
        </div>

        {/* Listings list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredCount === 0 ? (
            <div className="text-center py-10">
              <IoHomeOutline className="text-4xl text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("noListings")}
              </p>
              <button
                onClick={handleResetFilters}
                className={`mt-3 px-4 py-1.5 text-xs rounded-lg ${gradientButton}`}
              >
                {t("resetFilters")}
              </button>
            </div>
          ) : (
            filteredListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/fr/listings/${listing.id}`}
                className="block transition-all duration-300"
              >
                <div className="p-3 rounded-xl transition-all duration-300 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5">
                  <div className="flex gap-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          imageErrors[listing.id]
                            ? "https://placehold.co/600x400/e2e8f0/1e90ff?text=NestHub"
                            : getImageUrl(listing.image)
                        }
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
                          onClick={(e) => handleToggleFavorite(listing.id, e)}
                          className="flex-shrink-0 transition-transform duration-200 hover:scale-110"
                        >
                          {favorites.includes(listing.id) ? (
                            <IoHeart className="text-red-500 text-sm" />
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
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <FaStar className="text-yellow-500 text-xs" />
                          {listing.rating || 4.5}
                        </span>
                      </div>
                      <p className={`font-bold text-sm mt-1 ${gradientText}`}>
                        {listing.pricePerNight} TND{" "}
                        <span className="text-xs text-slate-400">
                          {t("perNight")}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <IoEyeOutline className="text-xs" />
              {filteredCount} / {totalListings} {t("properties")}
            </span>
            <span className="flex items-center gap-1">
              <IoHeart className="text-red-500 text-xs" />
              {favoritesCount} {t("favorites")}
            </span>
          </div>
        </div>
      </div>

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
        .leaflet-circle {
          transition: none;
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #ef4444;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #dc2626;
        }
        .dark ::-webkit-scrollbar-track {
          background: #1e293b;
        }
        .dark ::-webkit-scrollbar-thumb {
          background: #ef4444;
        }
      `}</style>
    </div>
  );
}
