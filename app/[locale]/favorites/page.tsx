// app/[locale]/favorites/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
  IoTrashOutline,
  IoShareOutline,
  IoHeartDislikeOutline,
  IoCloseOutline,
} from "react-icons/io5";
import { FaHome, FaCity } from "react-icons/fa";
import { MdOutlineVilla } from "react-icons/md";
import { TbBuildingCommunity } from "react-icons/tb";
import { GiModernCity } from "react-icons/gi";
import { useFavorites } from "./hooks/useFavorites";
import AlertBanner from "@/components/ui/Alert";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { TenantHeader } from "@/components/ui/header/TenantHeader";

const FALLBACK_IMAGE = "/images/placeholder.jpg";

const gradientButton = `
  bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 
  hover:from-sky-500 hover:via-indigo-500 hover:to-purple-600
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const gradientText =
  "bg-gradient-to-r from-indigo-600 via-sky-500 to-purple-600 bg-clip-text text-transparent";

const categories = [
  { id: "all", name: "Tous", icon: FaHome },
  { id: "villa", name: "Villas", icon: MdOutlineVilla },
  { id: "appartement", name: "Appartements", icon: TbBuildingCommunity },
  { id: "maison", name: "Maisons", icon: FaHome },
  { id: "studio", name: "Studios", icon: FaCity },
  { id: "duplex", name: "Duplex", icon: GiModernCity },
];

export default function FavoritesPage() {
  const t = useTranslations("FavoritesPage");
  const {
    favorites,
    selectedForCompare,
    loading,
    removeFavorite,
    toggleCompare,
    compareCount,
    categoryCounts,
    clearAllFavorites,
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
    showAlert("success", `${title} ${t("alerts.removed")}`);
  };

  const handleClearAllFavorites = () => {
    clearAllFavorites();
    setShowClearModal(false);
    showAlert("info", t("alerts.allRemoved"));
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: t("share.title"),
        text: t("share.text"),
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      showAlert("success", t("share.copied"));
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
        text={t("loading")}
        speed="normal"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-800 dark:to-purple-900">
      {alert && (
        <div className="fixed top-20 right-8 z-[60] animate-in slide-in-from-top-2 fade-in duration-300">
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      <TenantHeader />

      {/* Clear All Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <IoTrashOutline className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {t("modal.title")}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                {t("modal.message")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  {t("modal.cancel")}
                </button>
                <button
                  onClick={handleClearAllFavorites}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition"
                >
                  {t("modal.confirm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="pt-6 pb-16 max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {sortedFavorites.length}{" "}
              {t("count", { count: sortedFavorites.length })}
              {favorites.length !== sortedFavorites.length &&
                ` (${t("total", { total: favorites.length })})`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasFavorites && (
              <>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm"
                  title={t("share.title")}
                >
                  <IoShareOutline className="text-xl text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  onClick={() => setShowClearModal(true)}
                  className="p-2 rounded-full bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition shadow-sm"
                  title={t("clearAll")}
                >
                  <IoTrashOutline className="text-xl text-slate-600 dark:text-slate-400 hover:text-red-500 transition" />
                </button>
              </>
            )}

            <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition ${
                  viewMode === "grid"
                    ? gradientButton
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <IoGridOutline className="text-lg" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition ${
                  viewMode === "list"
                    ? gradientButton
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <IoListOutline className="text-lg" />
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="relevance">{t("sort.relevance")}</option>
              <option value="price_asc">{t("sort.priceAsc")}</option>
              <option value="price_desc">{t("sort.priceDesc")}</option>
              <option value="rating">{t("sort.rating")}</option>
            </select>
          </div>
        </div>

        {/* Categories Filter */}
        {hasFavorites && (
          <div className="flex items-center justify-center gap-6 overflow-x-auto no-scrollbar py-4 mb-6 flex-wrap">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              const countData = categoryCounts.find((c) => c.id === cat.id);
              const count = countData?.count || 0;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center gap-1 min-w-fit pb-1 transition-all ${
                    isActive
                      ? "border-b-2 border-indigo-500 dark:border-indigo-400"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Icon
                    className={`text-xl transition-colors ${
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  />
                  <span
                    className={`text-xs transition-colors ${
                      isActive
                        ? "font-semibold text-indigo-600 dark:text-indigo-400"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {t(`categories.${cat.id}`)}
                  </span>
                  {count > 0 && (
                    <span className={`text-[10px] text-slate-400`}>
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!hasFavorites ? (
          <div className="text-center py-16">
            <IoHeartDislikeOutline className="text-6xl text-indigo-300 dark:text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {t("empty.title")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto text-sm">
              {t("empty.message")}
            </p>
            <Link
              href="/fr/search"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition ${gradientButton}`}
            >
              <IoHeart className="text-base" />
              {t("empty.button")}
            </Link>
          </div>
        ) : sortedFavorites.length === 0 ? (
          <div className="text-center py-16">
            <IoHeartDislikeOutline className="text-5xl text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {t("empty.noResults")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
              {t("empty.noResultsHint", {
                category: t(`categories.${selectedCategory}`),
              })}
            </p>
            <button
              onClick={() => setSelectedCategory("all")}
              className={`inline-block px-5 py-2 rounded-full text-sm font-semibold transition ${gradientButton}`}
            >
              {t("empty.viewAll")}
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedFavorites.map((listing) => {
              const imageUrl = imgErrors[listing.id]
                ? FALLBACK_IMAGE
                : listing.image;
              const displayPrice = listing.price || listing.pricePerNight || 0;

              return (
                <div
                  key={listing.id}
                  className="group bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <Link href={`/fr/listings/${listing.id}`}>
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        alt={listing.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        src={imageUrl}
                        onError={() => handleImageError(listing.id)}
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemoveFavorite(listing.id, listing.title);
                        }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-red-500 shadow-sm hover:scale-110 transition-all"
                      >
                        <IoHeart className="text-lg" />
                      </button>
                      {listing.isVerified && (
                        <div className="absolute bottom-3 left-3">
                          <span className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2 py-1 rounded-lg text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center gap-1">
                            <IoCheckmarkCircle className="text-xs" />
                            {t("badges.verified")}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/fr/listings/${listing.id}`}>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base hover:text-indigo-600 dark:hover:text-indigo-400 transition line-clamp-1">
                        {listing.title}
                      </h3>
                    </Link>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 flex items-center gap-1">
                      <IoLocationOutline className="text-xs" />
                      {listing.location}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <IoStar className="text-amber-400 text-sm" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {listing.rating || 4.5}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({listing.reviewCount || 0} {t("reviews")})
                      </span>
                    </div>
                    <div className="flex gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <IoBedOutline className="text-xs" /> {listing.bedrooms}{" "}
                        {t("details.beds")}
                      </span>
                      <span className="flex items-center gap-1">
                        <IoWaterOutline className="text-xs" />{" "}
                        {listing.bathrooms} {t("details.baths")}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`text-xl font-extrabold ${gradientText}`}
                        >
                          {displayPrice.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
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
                                ? `${listing.title} ${t("alerts.removedFromCompare")}`
                                : `${listing.title} ${t("alerts.addedToCompare")}`,
                            );
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                            selectedForCompare.includes(listing.id)
                              ? gradientButton
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          <IoGitCompare className="text-xs inline mr-1" />
                          {t("buttons.compare")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedFavorites.map((listing) => {
              const imageUrl = imgErrors[listing.id]
                ? FALLBACK_IMAGE
                : listing.image;
              const displayPrice = listing.price || listing.pricePerNight || 0;

              return (
                <div
                  key={listing.id}
                  className="bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-md transition p-3 flex gap-3"
                >
                  <Link
                    href={`/fr/listings/${listing.id}`}
                    className="relative w-24 h-24 flex-shrink-0"
                  >
                    <img
                      src={imageUrl}
                      alt={listing.title}
                      className="w-full h-full object-cover rounded-lg"
                      onError={() => handleImageError(listing.id)}
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveFavorite(listing.id, listing.title);
                      }}
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-red-500 hover:scale-110 transition"
                    >
                      <IoHeart className="text-xs" />
                    </button>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/fr/listings/${listing.id}`}>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm hover:text-indigo-600 transition line-clamp-1">
                        {listing.title}
                      </h3>
                    </Link>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                      <IoLocationOutline className="text-xs" />
                      {listing.location}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5">
                        <IoStar className="text-amber-400 text-xs" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {listing.rating || 4.5}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {listing.reviewCount || 0} {t("reviews")}
                      </span>
                      <div className="flex gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-0.5">
                          <IoBedOutline className="text-xs" />{" "}
                          {listing.bedrooms}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <IoWaterOutline className="text-xs" />{" "}
                          {listing.bathrooms}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`text-base font-extrabold ${gradientText}`}
                        >
                          {displayPrice.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
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
                                ? `${listing.title} ${t("alerts.removedFromCompare")}`
                                : `${listing.title} ${t("alerts.addedToCompare")}`,
                            );
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[9px] font-semibold transition-all ${
                            selectedForCompare.includes(listing.id)
                              ? gradientButton
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          <IoGitCompare className="text-[10px] inline mr-0.5" />
                          {t("buttons.compare")}
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

      {/* Floating Compare Button */}
      {compareCount > 1 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <Link href="/fr/favorites/compare">
            <button
              className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-2xl hover:scale-105 transition-all ${gradientButton}`}
            >
              <IoGitCompare className="text-base" />
              {t("buttons.compareCount", { count: compareCount })}
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
