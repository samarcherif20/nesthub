"use client";
import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
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
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false },
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

// Style dégradé
const gradientButton =
  "bg-gradient-to-r from-sky-500 via-sky-400 to-purple-600 hover:from-sky-600 hover:via-sky-500 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300";

// Fonction proxy pour les images
const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return "https://placehold.co/600x400/e2e8f0/1e90ff?text=NestHub";
  if (url.includes("vercel-storage.com")) {
    return `/api/listings/image?url=${encodeURIComponent(url)}`;
  }
  return url;
};

export default function MapPage() {
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
    showAlert("success", isFav ? "Ajouté aux favoris" : "Retiré des favoris");
  };

  const handleResetFilters = () => {
    resetFilters();
    showAlert("info", "Tous les filtres ont été réinitialisés");
  };

  const handleApplyFilters = () => {
    showAlert("success", "Filtres appliqués");
  };

  if (!L || loading) {
    return (
      <LoadingSpinner
        fullScreen={true}
        variant="spinner"
        size="lg"
        color="primary"
        text="Chargement de la map..."
        speed="normal"
      />
    );
  }

  const center: [number, number] = [36.8065, 10.1815];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-800 dark:to-purple-900">
      {/* Alert Banner */}
      {alert && (
        <div className="fixed top-24 right-8 z-[60] animate-in slide-in-from-top-2 fade-in duration-300">
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* Compteur flottant sur la carte */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full px-5 py-2.5 shadow-lg border border-gray-200 dark:border-slate-800">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <IoHomeOutline className="dark:text-white text-slate-900 text-sm" />
            <span>{filteredCount} logements</span>
          </span>
          <span className="w-px h-4 bg-gray-300 dark:bg-gray-600"></span>
          <span className="flex items-center gap-1.5">
            <IoHeart className="text-red-500 text-sm" />
            <span>{favoritesCount} favoris</span>
          </span>
        </span>
      </div>

      {/* Carte */}
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
          <Circle
            key={listing.id}
            center={[listing.latitude, listing.longitude]}
            radius={2000}
            pathOptions={{
              color: "#ef4444",
              fillColor: "#ef4444",
              fillOpacity: 0.25,
              weight: 2.5,
            }}
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
                      <IoHeartOutline className="text-gray-600 dark:text-gray-400 text-lg" />
                    )}
                  </button>
                  {listing.isVerified && (
                    <span className="absolute bottom-2 left-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center gap-1">
                      <IoCheckmarkCircle className="text-sm" />
                      VÉRIFIÉ
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm mt-2 line-clamp-1 text-gray-800 dark:text-white">
                  {listing.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                  <IoLocationOutline className="text-sm" />
                  {listing.governorate}, {listing.delegation}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <IoBedOutline className="text-sm" /> {listing.bedrooms}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <IoWaterOutline className="text-sm" /> {listing.bathrooms}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <FaStar className="text-yellow-500 text-xs" />
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    {listing.rating || 4.5}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({listing.reviewCount || 0} avis)
                  </span>
                </div>
                <p className="text-sm font-bold bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent mt-2">
                  {listing.pricePerNight} TND / nuit
                </p>
                <Link
                  href={`/fr/listings/${listing.id}`}
                  className={`block mt-3 text-center text-white text-xs py-2 rounded-lg transition-all duration-300 ${gradientButton}`}
                >
                  Voir l'annonce
                </Link>
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>

      {/* Sidebar avec la liste et recherche */}
      <div className="absolute top-4 left-4 bottom-4 w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden z-10 flex flex-col border border-gray-200 dark:border-slate-700">
        {/* Header avec recherche */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-slate-900 dark:to-purple-900/50">
          {/* Bouton retour */}
          <Link
            href="/fr/search"
            className="flex items-center justify-center gap-2 w-full mb-3 px-3 py-2 bg-white dark:bg-slate-900 rounded-lg hover:shadow-md transition-all duration-300 group"
          >
            <IoArrowBackOutline className="text-gray-500 group-hover:text-sky-600 dark:group-hover:text-sky-400 group-hover:-translate-x-1 transition-all duration-300" />
            <span className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300 group-hover:text-sky-600 dark:group-hover:text-sky-400">
              RETOUR À LA RECHERCHE
            </span>
          </Link>

          {/* Barre de recherche */}
          <div className="relative">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Rechercher par titre, gouvernorat, délégation..."
              value={filters.searchTerm}
              onChange={(e) => updateSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 text-gray-700 dark:text-gray-200"
            />
            {filters.searchTerm && (
              <button
                onClick={() => updateSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <IoCloseOutline className="text-gray-400 hover:text-gray-600 text-sm" />
              </button>
            )}
          </div>

          {/* Bouton filtres */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 mt-3 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-900 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition w-full justify-center"
          >
            <IoFilterOutline className="text-sm" />
            {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
          </button>

          {/* Panneau des filtres */}
          {showFilters && (
            <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-lg space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Prix max: {filters.priceRange[1]} TND
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
                  className="w-full h-2 bg-sky-200 dark:bg-sky-900 rounded-lg cursor-pointer accent-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Type de logement
                </label>
                <select
                  value={filters.selectedType}
                  onChange={(e) => updateSelectedType(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="all">Tous</option>
                  <option value="villa">Villa</option>
                  <option value="appartement">Appartement</option>
                  <option value="maison">Maison</option>
                  <option value="studio">Studio</option>
                  <option value="duplex">Duplex</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Note minimale: {filters.minRating}+ ⭐
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => updateMinRating(Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value={0}>Toutes</option>
                  <option value={4}>4+ étoiles</option>
                  <option value={4.5}>4.5+ étoiles</option>
                </select>
              </div>

              <button
                onClick={handleResetFilters}
                className="w-full px-3 py-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-950/50 transition"
              >
                Réinitialiser les filtres
              </button>

              <button
                onClick={handleApplyFilters}
                className={`w-full px-3 py-1.5 text-xs font-medium rounded-lg transition ${gradientButton}`}
              >
                Appliquer les filtres
              </button>
            </div>
          )}
        </div>

        {/* Liste des logements */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredCount === 0 ? (
            <div className="text-center py-10">
              <IoHomeOutline className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucun logement trouvé
              </p>
              <button
                onClick={handleResetFilters}
                className={`mt-3 px-4 py-1.5 text-xs rounded-lg ${gradientButton}`}
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            filteredListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/fr/listings/${listing.id}`}
                className="block transition-all duration-300"
              >
                <div className="p-3 rounded-xl transition-all duration-300 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 shadow-sm hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5">
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
                        <div className="absolute -top-1 -right-1 bg-sky-500 rounded-full p-0.5">
                          <IoCheckmarkCircle className="text-white text-xs" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <h3 className="font-semibold text-sm line-clamp-1 text-gray-900 dark:text-white">
                          {listing.title}
                        </h3>
                        <button
                          onClick={(e) => handleToggleFavorite(listing.id, e)}
                          className="flex-shrink-0 transition-transform duration-200 hover:scale-110"
                        >
                          {favorites.includes(listing.id) ? (
                            <IoHeart className="text-red-500 text-sm" />
                          ) : (
                            <IoHeartOutline className="text-gray-400 dark:text-gray-500 text-sm" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                        <IoLocationSharp className="text-xs" />
                        <span className="truncate">
                          {listing.governorate}, {listing.delegation}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <IoBedOutline className="text-xs" />{" "}
                          {listing.bedrooms}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <IoWaterOutline className="text-xs" />{" "}
                          {listing.bathrooms}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <FaStar className="text-yellow-500 text-xs" />
                          {listing.rating || 4.5}
                        </span>
                      </div>
                      <p className="font-bold bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent text-sm mt-1">
                        {listing.pricePerNight} TND{" "}
                        <span className="text-xs text-gray-400">/ nuit</span>
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pied de la sidebar */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <IoEyeOutline className="text-xs" />
              {filteredCount} / {totalListings} biens
            </span>
            <span className="flex items-center gap-1">
              <IoHeart className="text-red-500 text-xs" />
              {favoritesCount} favoris
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
