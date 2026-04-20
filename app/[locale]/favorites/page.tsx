"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  IoHeart,
  IoStar,
  IoLocationOutline,
  IoCheckmarkCircle,
  IoGitCompare,
  IoGridOutline,
  IoListOutline,
  IoBedOutline,
  IoWaterOutline,
  IoCloseOutline,
  IoTrashOutline,
  IoShareOutline,
  IoHeartDislikeOutline,
} from "react-icons/io5";
import { FaHome, FaCity } from "react-icons/fa";
import { MdOutlineVilla } from "react-icons/md";
import { TbBuildingCommunity } from "react-icons/tb";
import { GiModernCity } from "react-icons/gi";
import { useFavorites } from "./hooks/useFavorites";
import AlertBanner from "@/components/ui/Alert";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const FALLBACK_IMAGE =
  "https://placehold.co/600x400/e2e8f0/1e90ff?text=NestHub";

// Style dégradé pour les boutons
const gradientButton =
  "bg-gradient-to-r from-sky-500 via-sky-400 to-purple-600 hover:from-sky-600 hover:via-sky-500 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300";

// Catégories pour les filtres
const categories = [
  { id: "all", name: "Tous", icon: FaHome },
  { id: "villa", name: "Villas", icon: MdOutlineVilla },
  { id: "appartement", name: "Appartements", icon: TbBuildingCommunity },
  { id: "maison", name: "Maisons", icon: FaHome },
  { id: "studio", name: "Studios", icon: FaCity },
  { id: "duplex", name: "Duplex", icon: GiModernCity },
];

export default function FavoritesPage() {
  const {
    favorites,
    selectedForCompare,
    loading,
    removeFavorite,
    toggleCompare,
    compareCount,
    categoryCounts,
    clearAllFavorites, // Ajoutez cette ligne
  } = useFavorites();

  const [isMounted, setIsMounted] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showAlert = (
    type: "success" | "error" | "info" | "warning",
    message: string,
  ) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleImageError = (listingId: string) => {
    setImgErrors((prev) => ({ ...prev, [listingId]: true }));
  };

  const handleRemoveFavorite = (id: string, title: string) => {
    removeFavorite(id);
    showAlert("success", `${title} a été retiré de vos favoris`);
  };

  // Remplacer la fonction handleClearAllFavorites par celle-ci :

  const handleClearAllFavorites = () => {
    clearAllFavorites(); // Utiliser la nouvelle fonction du hook
    setShowClearModal(false);
    showAlert("info", "Tous vos favoris ont été supprimés");
    // Rafraîchir la page après 1 seconde pour permettre à l'alerte de s'afficher
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };
  const handleShare = async () => {
    try {
      await navigator.share({
        title: "Mes favoris NestHub",
        text: "Découvrez ma sélection de propriétés sur NestHub",
        url: window.location.href,
      });
    } catch (err) {
      navigator.clipboard.writeText(window.location.href);
      showAlert("success", "Lien copié dans le presse-papier !");
    }
  };

  const getFilteredFavorites = () => {
    if (selectedCategory === "all") return favorites;
    return favorites.filter((fav) => fav.type === selectedCategory);
  };

  const getSortedFavorites = () => {
    const filtered = getFilteredFavorites();
    const sorted = [...filtered];
    switch (sortBy) {
      case "price_asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "price_desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "rating":
        return sorted.sort((a, b) => b.rating - a.rating);
      default:
        return sorted;
    }
  };

  const sortedFavorites = getSortedFavorites();
  const hasFavorites = favorites.length > 0;
  const canCompare = favorites.length >= 2;

  if (!isMounted || loading) {
    return (
      <LoadingSpinner
        fullScreen={true}
        variant="spinner"
        size="lg"
        color="primary"
        text="Chargement de vos favoris..."
        speed="normal"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-800 dark:to-purple-900">
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

      {/* Modal Confirmation Suppression Tout */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <IoTrashOutline className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Supprimer tous les favoris ?
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Cette action est irréversible. Vous perdrez tous vos favoris.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleClearAllFavorites}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition"
                >
                  Supprimer tout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="pt-24 pb-32 max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
                Mes favoris
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              {sortedFavorites.length} propriété
              {sortedFavorites.length > 1 ? "s" : ""} affichée
              {sortedFavorites.length > 1 ? "s" : ""}
              {favorites.length !== sortedFavorites.length &&
                ` (sur ${favorites.length} total)`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {hasFavorites && (
              <>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  title="Partager"
                >
                  <IoShareOutline className="text-xl text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setShowClearModal(true)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                  title="Tout supprimer"
                >
                  <IoTrashOutline className="text-xl text-gray-600 dark:text-gray-400 hover:text-red-500 transition" />
                </button>
              </>
            )}

            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition ${
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-sky-500 to-purple-600 text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <IoGridOutline className="text-xl" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition ${
                  viewMode === "list"
                    ? "bg-gradient-to-r from-sky-500 to-purple-600 text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <IoListOutline className="text-xl" />
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="relevance">Pertinence</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="rating">Meilleures notes</option>
            </select>
          </div>
        </section>

        {/* Categories Filter - visible seulement si des favoris existent */}
        {hasFavorites && (
          <section className="max-w-7xl mx-auto mb-12">
            <div className="flex items-center gap-8 overflow-x-auto no-scrollbar py-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                const countData = categoryCounts.find((c) => c.id === cat.id);
                const count = countData?.count || 0;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex flex-col items-center gap-2 min-w-fit pb-2 transition-all duration-200 ${
                      isActive
                        ? "border-b-2 border-sky-500 dark:border-sky-400"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Icon
                      className={`text-2xl transition-colors duration-200 ${
                        isActive
                          ? "text-sky-500 dark:text-sky-400"
                          : "text-gray-600 dark:text-gray-400 hover:text-sky-500 dark:hover:text-sky-400"
                      }`}
                    />
                    <span
                      className={`text-sm transition-colors duration-200 ${
                        isActive
                          ? "font-semibold text-sky-500 dark:text-sky-400"
                          : "font-medium text-gray-600 dark:text-gray-400 hover:text-sky-500 dark:hover:text-sky-400"
                      }`}
                    >
                      {cat.name}
                    </span>
                    {count > 0 && (
                      <span
                        className={`text-xs ${
                          isActive
                            ? "text-sky-500 dark:text-sky-400"
                            : "text-gray-400"
                        }`}
                      >
                        ({count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Listings */}
        {!hasFavorites ? (
          <div className="text-center py-20">
            <div className="flex justify-center mb-4">
              <IoHeartDislikeOutline className="text-7xl text-sky-400 dark:text-sky-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Aucun favori
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              Vous n'avez pas encore ajouté de propriétés à vos favoris.
              Commencez à explorer et sauvegardez vos coups de cœur !
            </p>
            <Link
              href="/fr/search"
              className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold transition ${gradientButton}`}
            >
              <IoHeart className="text-lg" />
              Découvrir des annonces
            </Link>
          </div>
        ) : sortedFavorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex justify-center mb-4">
              <IoHeartDislikeOutline className="text-6xl text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Aucun résultat
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Aucune propriété de type "{selectedCategory}" dans vos favoris
            </p>
            <button
              onClick={() => setSelectedCategory("all")}
              className={`inline-block px-6 py-3 rounded-full font-semibold transition ${gradientButton}`}
            >
              Voir tous les favoris
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedFavorites.map((listing) => {
              const imageUrl = imgErrors[listing.id]
                ? FALLBACK_IMAGE
                : listing.image;

              return (
                <div
                  key={listing.id}
                  className="group flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      alt={listing.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      src={imageUrl}
                      onError={() => handleImageError(listing.id)}
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={() =>
                          handleRemoveFavorite(listing.id, listing.title)
                        }
                        className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-red-500 shadow-sm hover:scale-110 transition-all"
                      >
                        <IoHeart className="text-xl" />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      {listing.isVerified && (
                        <span className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-1 rounded-lg text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center gap-1">
                          <IoCheckmarkCircle className="text-sm" />
                          VÉRIFIÉ
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <Link href={`/fr/listings/${listing.id}`}>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition-colors line-clamp-1">
                          {listing.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                        <IoStar className="text-yellow-500 text-sm" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {listing.rating}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 flex items-center gap-1">
                      <IoLocationOutline className="text-sm" />
                      {listing.location}
                    </p>
                    <div className="flex gap-3 mb-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <IoBedOutline className="text-sm" /> {listing.bedrooms}{" "}
                        lit{listing.bedrooms > 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <IoWaterOutline className="text-sm" />{" "}
                        {listing.bathrooms} SDB
                      </span>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
                          {listing.price.toLocaleString()}
                        </span>
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                          TND
                        </span>
                      </div>
                      {canCompare && (
                        <button
                          onClick={() => {
                            toggleCompare(listing.id);
                            showAlert(
                              "info",
                              selectedForCompare.includes(listing.id)
                                ? `"${listing.title}" retiré de la comparaison`
                                : `"${listing.title}" ajouté à la comparaison`,
                            );
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                            selectedForCompare.includes(listing.id)
                              ? "bg-gradient-to-r from-sky-500 to-purple-600 text-white border-transparent shadow-md"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          Comparer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        ) : (
          <div className="space-y-4">
            {sortedFavorites.map((listing) => {
              const imageUrl = imgErrors[listing.id]
                ? FALLBACK_IMAGE
                : listing.image;

              return (
                <div
                  key={listing.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition p-4 flex gap-4"
                >
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <img
                      src={imageUrl}
                      alt={listing.title}
                      className="w-full h-full object-cover rounded-lg"
                      onError={() => handleImageError(listing.id)}
                    />
                    <button
                      onClick={() =>
                        handleRemoveFavorite(listing.id, listing.title)
                      }
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition"
                    >
                      <IoHeart className="text-red-500 text-sm" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Link href={`/fr/listings/${listing.id}`}>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition line-clamp-1">
                            {listing.title}
                          </h3>
                        </Link>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center gap-1">
                          <IoLocationOutline className="text-sm" />
                          {listing.location}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <IoBedOutline className="text-sm" />{" "}
                            {listing.bedrooms} lit
                            {listing.bedrooms > 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <IoWaterOutline className="text-sm" />{" "}
                            {listing.bathrooms} SDB
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
                          {listing.price.toLocaleString()} TND
                        </div>
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <IoStar className="text-yellow-500 text-sm" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {listing.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex gap-1">
                        {listing.isVerified && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                            ✓ Vérifié
                          </span>
                        )}
                      </div>
                      {canCompare && (
                        <button
                          onClick={() => {
                            toggleCompare(listing.id);
                            showAlert(
                              "info",
                              selectedForCompare.includes(listing.id)
                                ? `"${listing.title}" retiré de la comparaison`
                                : `"${listing.title}" ajouté à la comparaison`,
                            );
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                            selectedForCompare.includes(listing.id)
                              ? "bg-gradient-to-r from-sky-500 to-purple-600 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          <IoGitCompare className="text-sm" />
                          Comparer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Compare Button - n'apparaît que si plus de 1 élément est sélectionné */}
      {compareCount > 1 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <Link href="/fr/favorites/compare">
            <button
              className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-2xl hover:scale-105 transition-all ${gradientButton}`}
            >
              <IoGitCompare className="text-lg" />
              Comparer ({compareCount})
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
