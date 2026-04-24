// app/[locale]/search/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import { useSearch, categories, allAmenities } from "./hooks/useSearch";
import {
  FaHome,
  FaCity,
  FaSearch,
  FaStar,
  FaBed,
  FaHeart,
  FaRegHeart,
  FaBath,
  FaMapMarkedAlt,
  FaFilter,
  FaTimes,
  FaGem,
  FaFire,
  FaClock,
  FaComments,
  FaUser,
  FaTh,
  FaList,
  FaTree,
  FaWifi,
  FaTv,
  FaUtensils,
  FaParking,
  FaSwimmer,
  FaDumbbell,
  FaHotTub,
} from "react-icons/fa";
import {
  MdOutlineVilla,
  MdOutlinePeople,
  MdOutlineLocationOn,
} from "react-icons/md";
import { TbAirConditioning, TbBuildingCommunity } from "react-icons/tb";
import { GiModernCity } from "react-icons/gi";
import {
  IoChatbubbleOutline,
  IoHomeOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoSearchOutline,
} from "react-icons/io5";
import AlertBanner from "@/components/ui/Alert";
import Pagination from "@/components/ui/Pagination";
import { ChatDrawer } from "@/components/ui/chat/ChatDrawer";
import { TenantHeader } from "@/components/ui/header/TenantHeader";

const gradientButton = `
  bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 
  hover:from-sky-500 hover:via-indigo-500 hover:to-purple-600
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const gradientText =
  "bg-gradient-to-r from-indigo-600 via-sky-500 to-purple-600 bg-clip-text text-transparent";

// Category icon helper
const getCategoryIcon = (catId: string, isActive: boolean) => {
  const iconClass = isActive
    ? "text-indigo-600 dark:text-indigo-400"
    : "text-gray-600 dark:text-gray-400";
  switch (catId) {
    case "all":
      return <FaHome className={`text-2xl ${iconClass}`} />;
    case "Villa":
      return <MdOutlineVilla className={`text-2xl ${iconClass}`} />;
    case "Appartement":
      return <TbBuildingCommunity className={`text-2xl ${iconClass}`} />;
    case "Maison":
      return <FaHome className={`text-2xl ${iconClass}`} />;
    case "Studio":
      return <FaCity className={`text-2xl ${iconClass}`} />;
    case "Duplex":
      return <GiModernCity className={`text-2xl ${iconClass}`} />;
    default:
      return <FaHome className={`text-2xl ${iconClass}`} />;
  }
};

export default function SearchPage() {
  const t = useTranslations("SearchPage");
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [bedroomsFilter, setBedroomsFilter] = useState<number | null>(null);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  const userRole =
    user?.publicMetadata?.role === "PROPERTY_OWNER"
      ? "PROPERTY_OWNER"
      : "TENANT";

  const {
    listings,
    favorites,
    loading,
    viewMode,
    priceRange,
    selectedCategory,
    selectedAmenities,
    sortBy,
    isFilterOpen,
    currentPage,
    totalPages,
    searchDestination,
    searchDates,
    searchGuests,
    setViewMode,
    setPriceRange,
    setSortBy,
    setIsFilterOpen,
    setSearchDestination,
    setSearchDates,
    setSearchGuests,
    resetFilters,
    toggleAmenity,
    toggleFavorite,
    handleSearch,
    goToPage,
    totalCount,
    startIndex,
    endIndex,
    selectCategory,
  } = useSearch();

  useEffect(() => {
    setMounted(true);
  }, []);

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
    toggleFavorite(id, e);
    const isFav = favorites.includes(id);
    showAlert(
      "success",
      isFav ? t("alerts.removedFromFavorites") : t("alerts.addedToFavorites"),
    );
  };

  const handleResetFilters = () => {
    resetFilters();
    setRatingFilter(null);
    setBedroomsFilter(null);
    showAlert("info", t("alerts.filtersReset"));
  };

  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    selectedAmenities.length +
    (ratingFilter ? 1 : 0) +
    (bedroomsFilter ? 1 : 0);

  let filteredListings = [...listings];
  if (ratingFilter)
    filteredListings = filteredListings.filter(
      (l) => (l.rating || 0) >= ratingFilter,
    );
  if (bedroomsFilter)
    filteredListings = filteredListings.filter(
      (l) => l.bedrooms >= bedroomsFilter,
    );

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

      <main className="pt-8 pb-32">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 mb-10">
          <div className="relative h-[400px] w-full rounded-2xl overflow-hidden mb-[-80px] shadow-xl">
            <img
              className="w-full h-full object-cover"
              src="https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg"
              alt="hero"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center max-w-3xl w-full px-4">
              <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
                {t("hero.title")}
              </h1>
              <p className="text-white/80 text-lg hidden md:block mb-2">
                {t("hero.subtitle")}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative z-10 max-w-4xl mx-auto mt-7">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl p-4 flex flex-col md:flex-row items-center gap-2 border border-white/40 dark:border-slate-700/40">
              <div className="flex-1 w-full px-4 py-1">
                <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                  {t("search.location")}
                </label>
                <input
                  value={searchDestination}
                  onChange={(e) => setSearchDestination(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full bg-transparent border-none p-0 text-gray-900 dark:text-white font-semibold focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                  placeholder={t("search.locationPlaceholder")}
                  type="text"
                />
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />
              <div className="flex-1 w-full px-4 py-1">
                <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                  {t("search.dates")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={searchDates.checkIn}
                    onChange={(e) =>
                      setSearchDates({
                        ...searchDates,
                        checkIn: e.target.value,
                      })
                    }
                    className="w-full bg-transparent text-sm text-gray-900 dark:text-white font-semibold focus:ring-0 dark:[color-scheme:dark]"
                  />
                  <span className="text-gray-400 dark:text-gray-500 text-sm">
                    →
                  </span>
                  <input
                    type="date"
                    value={searchDates.checkOut}
                    onChange={(e) =>
                      setSearchDates({
                        ...searchDates,
                        checkOut: e.target.value,
                      })
                    }
                    className="w-full bg-transparent text-sm text-gray-900 dark:text-white font-semibold focus:ring-0 dark:[color-scheme:dark]"
                  />
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />
              <div className="flex-1 w-full px-4 py-1">
                <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                  {t("search.guests")}
                </label>
                <select
                  value={searchGuests}
                  onChange={(e) => setSearchGuests(parseInt(e.target.value))}
                  className="w-full bg-transparent text-gray-900 dark:text-white font-semibold focus:ring-0 text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      {n}{" "}
                      {n === 1
                        ? t("search.guestSingular")
                        : t("search.guestPlural")}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSearch}
                className={`w-full md:w-auto px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${gradientButton}`}
              >
                <IoSearchOutline className="text-base" /> {t("search.button")}
              </button>
            </div>
          </div>
        </section>

        {/* Categories - Centrées */}
        <section className="max-w-7xl mx-auto px-6 mb-6 mt-2">
          <div className="flex items-center justify-center gap-8 overflow-x-auto no-scrollbar py-4 flex-wrap">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => selectCategory(cat.id)}
                  className={`flex flex-col items-center gap-2 min-w-fit pb-2 transition-all ${isActive ? "border-b-2 border-indigo-600 dark:border-indigo-400" : "opacity-60 hover:opacity-100"}`}
                >
                  {getCategoryIcon(cat.id, isActive)}
                  <span
                    className={`text-sm ${isActive ? "font-semibold text-indigo-600 dark:text-indigo-400" : "font-medium text-gray-700 dark:text-gray-300"}`}
                  >
                    {t(`categories.${cat.id}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Results Section */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
            <div>
              <h2 className="font-headline text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {searchDestination
                  ? t("results.titleWithDestination", {
                      destination: searchDestination,
                    })
                  : t("results.title")}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                {filteredListings.length}{" "}
                {filteredListings.length === 1
                  ? t("results.listingSingular")
                  : t("results.listingPlural")}
                {filteredListings.length > 0 &&
                  ` · ${startIndex}-${Math.min(endIndex, filteredListings.length)}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}`}
                >
                  <FaTh className="text-lg" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}`}
                >
                  <FaList className="text-lg" />
                </button>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              >
                <option value="relevance">{t("sort.relevance")}</option>
                <option value="price_asc">{t("sort.priceAsc")}</option>
                <option value="price_desc">{t("sort.priceDesc")}</option>
                <option value="rating">{t("sort.rating")}</option>
              </select>
              <button
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm flex items-center gap-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300"
              >
                <FaFilter className="text-lg" />
                {t("filters.title")}
                {activeFiltersCount > 0 && (
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs rounded-full px-1.5 py-0.5">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedCategory !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                  {t(`categories.${selectedCategory}`)}
                  <button onClick={() => selectCategory("all")}>
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedAmenities.map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"
                >
                  {amenity}
                  <button onClick={() => toggleAmenity(amenity)}>
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {ratingFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                  <FaStar className="w-3 h-3" />
                  {ratingFilter}+
                  <button onClick={() => setRatingFilter(null)}>
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              )}
              {bedroomsFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  <FaBed className="w-3 h-3" />
                  {bedroomsFilter}+
                  <button onClick={() => setBedroomsFilter(null)}>
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-400 hover:text-indigo-600 transition"
              >
                {t("filters.clearAll")}
              </button>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar - Desktop */}
            <aside className="hidden lg:block lg:w-80 flex-shrink-0">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-800/30 p-6 sticky top-24 border border-gray-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {t("filters.title")}
                  </h3>
                  <button
                    onClick={handleResetFilters}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {t("filters.reset")}
                  </button>
                </div>

                {/* Price Range */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    {t("filters.maxPrice")} {priceRange[1]} TND
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="50"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], parseInt(e.target.value)])
                    }
                    className="w-full h-2 bg-indigo-200 dark:bg-indigo-900 rounded-lg cursor-pointer accent-indigo-600 dark:accent-indigo-400"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <span>0</span>
                    <span>1250</span>
                    <span>2500</span>
                    <span>3750</span>
                    <span>5000+</span>
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="mb-8">
                  <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    {t("filters.rating")}
                  </h4>
                  <div className="flex gap-2">
                    {[
                      { value: null, label: t("filters.all") },
                      { value: 4, label: "4+" },
                      { value: 4.5, label: "4.5+" },
                    ].map((option) => (
                      <button
                        key={option.value ?? "all"}
                        onClick={() => setRatingFilter(option.value)}
                        className={`px-3 py-1 rounded-full text-sm transition flex items-center gap-1 ${
                          ratingFilter === option.value
                            ? gradientButton
                            : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {option.value && <FaStar className="w-3 h-3" />}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bedrooms Filter */}
                <div className="mb-8">
                  <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    {t("filters.bedrooms")}
                  </h4>
                  <div className="flex gap-2">
                    {[null, 1, 2, 3, 4].map((value) => (
                      <button
                        key={value ?? "all"}
                        onClick={() => setBedroomsFilter(value)}
                        className={`px-3 py-1 rounded-full text-sm transition flex items-center gap-1 ${
                          bedroomsFilter === value
                            ? gradientButton
                            : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {value ? (
                          <>
                            <FaBed className="w-3 h-3" /> {value}
                          </>
                        ) : (
                          t("filters.all")
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Amenities */}
                <div className="mb-8">
                  <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    {t("filters.amenities")}
                    {selectedAmenities.length > 0 && (
                      <span className="ml-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs rounded-full px-2 py-0.5">
                        {selectedAmenities.length}
                      </span>
                    )}
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {allAmenities.map((amenity) => (
                      <label
                        key={amenity}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAmenities.includes(amenity)}
                          onChange={() => toggleAmenity(amenity)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          {amenity}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSearch}
                  className={`w-full py-3 rounded-xl font-semibold transition ${gradientButton}`}
                >
                  {t("filters.apply")}
                </button>
              </div>
            </aside>

            {/* Listings Grid/List */}
            <main className="flex-1">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 dark:bg-slate-800 rounded-xl aspect-[4/3] mb-4" />
                      <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl">
                  <IoSearchOutline className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    {t("results.noResults")}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {t("results.noResultsHint")}
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className={`px-6 py-2 rounded-xl transition ${gradientButton}`}
                  >
                    {t("filters.resetAll")}
                  </button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      isFavorite={favorites.includes(listing.id)}
                      onToggleFavorite={handleToggleFavorite}
                      gradientButton={gradientButton}
                      t={t}
                      gradientText={gradientText}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredListings.map((listing) => (
                    <ListingRow
                      key={listing.id}
                      listing={listing}
                      isFavorite={favorites.includes(listing.id)}
                      onToggleFavorite={handleToggleFavorite}
                      gradientButton={gradientButton}
                      t={t}
                      gradientText={gradientText}
                    />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-12">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    pageSize={6}
                    onPageChange={goToPage}
                  />
                </div>
              )}
            </main>
          </div>
        </section>
      </main>

      {/* Map Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
        <Link href="/fr/map">
          <button
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-2xl hover:scale-105 transition-transform active:scale-95 ${gradientButton}`}
          >
            <FaMapMarkedAlt className="text-lg" /> {t("map.show")}
          </button>
        </Link>
      </div>

      {/* Chat Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <button
          onClick={() => setIsChatDrawerOpen(true)}
          className={`p-3 rounded-full shadow-2xl hover:scale-105 transition-transform active:scale-95 ${gradientButton}`}
        >
          <FaComments className="text-xl" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl md:hidden z-50 rounded-t-3xl shadow-lg">
        <Link
          href="/fr/search"
          className="flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-2xl px-5 py-2"
        >
          <IoSearchOutline className="text-xl" />
          <span className="text-[11px] font-medium mt-1">
            {t("mobile.explore")}
          </span>
        </Link>
        <Link
          href="/fr/favorites"
          className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-5 py-2"
        >
          <FaRegHeart className="text-xl" />
          <span className="text-[11px] font-medium mt-1">
            {t("mobile.favorites")}
          </span>
        </Link>
        <button
          onClick={() => setIsChatDrawerOpen(true)}
          className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-5 py-2"
        >
          <FaComments className="text-xl" />
          <span className="text-[11px] font-medium mt-1">
            {t("mobile.messages")}
          </span>
        </button>
        <Link
          href="/fr/profile"
          className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-5 py-2"
        >
          <FaUser className="text-xl" />
          <span className="text-[11px] font-medium mt-1">
            {t("mobile.profile")}
          </span>
        </Link>
      </nav>

      <ChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        userRole={userRole}
      />
    </div>
  );
}

// ListingCard Component (inchangé)
function ListingCard({
  listing,
  isFavorite,
  onToggleFavorite,
  gradientButton,
  t,
  gradientText,
  getAmenityIcon,
}: any) {
  const displayPrice =
    listing.pricePerNight || listing.price || listing.pricePerMonth || 0;
  const priceUnit = listing.pricePerNight
    ? t("price.perNight")
    : listing.pricePerMonth
      ? t("price.perMonth")
      : t("price.perNight");

  const getImageUrl = (url: string) => {
    if (!url) return "/images/placeholder.jpg";
    if (url.includes("vercel-storage.com"))
      return `/api/listings/image?url=${encodeURIComponent(url)}`;
    return url;
  };

  const [imgSrc, setImgSrc] = useState(getImageUrl(listing.image));
  const isNew =
    new Date(listing.createdAt) >
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isPopular = (listing.viewCount || 0) > 100;
  const isPremium = listing.isVerified;

  return (
    <Link href={`/fr/listings/${listing.id}`} className="group cursor-pointer">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 mb-4 shadow-sm group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
        <img
          src={imgSrc}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setImgSrc("/images/placeholder.jpg")}
        />

        <div className="absolute top-3 left-3 flex gap-2">
          {isPremium && (
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
              <FaGem className="w-3 h-3" /> {t("badges.premium")}
            </span>
          )}
          {isPopular && (
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
              <FaFire className="w-3 h-3" /> {t("badges.popular")}
            </span>
          )}
          {isNew && !isPopular && (
            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
              <FaClock className="w-3 h-3" /> {t("badges.new")}
            </span>
          )}
        </div>

        <button
          onClick={(e) => onToggleFavorite(listing.id, e)}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/40 transition"
        >
          {isFavorite ? (
            <FaHeart className="text-red-500 text-xl" />
          ) : (
            <FaRegHeart className="text-xl" />
          )}
        </button>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="flex items-center gap-1 text-white/90 text-xs font-medium">
            <MdOutlineLocationOn className="w-3 h-3" />
            <span className="truncate">{listing.location}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 mr-2">
          <h3 className="font-headline text-lg font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
            {listing.title}
          </h3>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs mt-1">
            <FaStar className="text-amber-500 text-sm" />
            <span className="font-semibold">{listing.rating || 4.5}</span>
            <span className="text-slate-400">
              ({listing.reviewCount || 0} {t("reviews")})
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className={`text-xl font-extrabold ${gradientText}`}>
            {displayPrice.toLocaleString()}
          </span>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">
            TND {priceUnit}
          </span>
        </div>

        {listing.amenities && listing.amenities.length > 0 && (
          <div className="flex gap-1">
            {listing.amenities.slice(0, 2).map((a: string) => (
              <span
                key={a}
                className="text-[9px] bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 flex items-center gap-0.5"
              >
                {getAmenityIcon(a)}
                <span className="hidden sm:inline">{a}</span>
              </span>
            ))}
            {listing.amenities.length > 2 && (
              <span className="text-[9px] text-slate-400">
                +{listing.amenities.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      <button
        className={`w-full mt-3 py-2 rounded-lg text-sm font-semibold transition-all ${gradientButton} opacity-0 group-hover:opacity-100`}
      >
        {t("buttons.bookNow")}
      </button>
    </Link>
  );
}

// ListingRow Component (inchangé)
function ListingRow({
  listing,
  isFavorite,
  onToggleFavorite,
  gradientButton,
  t,
  gradientText,
  getAmenityIcon,
}: any) {
  const displayPrice =
    listing.pricePerNight || listing.price || listing.pricePerMonth || 0;
  const priceUnit = listing.pricePerNight
    ? t("price.perNight")
    : listing.pricePerMonth
      ? t("price.perMonth")
      : t("price.perNight");

  const getImageUrl = (url: string) => {
    if (!url) return "/images/placeholder.jpg";
    if (url.includes("vercel-storage.com"))
      return `/api/listings/image?url=${encodeURIComponent(url)}`;
    return url;
  };

  const [imgSrc, setImgSrc] = useState(getImageUrl(listing.image));

  return (
    <Link href={`/fr/listings/${listing.id}`}>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-800/30 hover:shadow-md transition-all duration-300 p-4 flex gap-4 group hover:-translate-y-0.5">
        <div className="relative flex-shrink-0 w-36 h-36 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={imgSrc}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgSrc("/images/placeholder.jpg")}
          />
          <button
            onClick={(e) => onToggleFavorite(listing.id, e)}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/40 transition"
          >
            {isFavorite ? (
              <FaHeart className="text-red-500 text-sm" />
            ) : (
              <FaRegHeart className="text-sm" />
            )}
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                {listing.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                  <FaStar className="text-amber-500 text-sm" />
                  <span className="font-semibold">{listing.rating || 4.5}</span>
                  <span className="text-slate-400">
                    ({listing.reviewCount || 0} {t("reviews")})
                  </span>
                </div>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                  <MdOutlineLocationOn className="w-3 h-3" />
                  <span>{listing.location}</span>
                </div>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <FaBed className="w-3 h-3" /> {listing.bedrooms}{" "}
                  {t("details.beds")}
                </span>
                <span className="flex items-center gap-1">
                  <FaBath className="w-3 h-3" /> {listing.bathrooms}{" "}
                  {t("details.baths")}
                </span>
                <span className="flex items-center gap-1">
                  <MdOutlinePeople className="w-3 h-3" /> {listing.maxGuests}{" "}
                  {t("details.guests")}
                </span>
              </div>
              {listing.amenities && listing.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {listing.amenities.slice(0, 4).map((a: string) => (
                    <span
                      key={a}
                      className="text-xs bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400 flex items-center gap-1"
                    >
                      {getAmenityIcon(a)}
                      {a}
                    </span>
                  ))}
                  {listing.amenities.length > 4 && (
                    <span className="text-xs text-slate-400">
                      +{listing.amenities.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`text-xl font-bold ${gradientText}`}>
                {displayPrice.toLocaleString()} TND
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {priceUnit}
              </div>
              <button
                className={`mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${gradientButton} opacity-0 group-hover:opacity-100`}
              >
                {t("buttons.book")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
