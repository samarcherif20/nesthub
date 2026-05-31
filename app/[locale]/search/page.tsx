"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { useUser } from "@clerk/nextjs";
import { useSearch, categories, allAmenities } from "./hooks/useSearch";
import NexusCard from "@/components/ui/NexusCard";
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
  FaShieldAlt,
  FaCamera,
  FaCompass,
} from "react-icons/fa";
import {
  MdOutlineVilla,
  MdOutlinePeople,
  MdOutlineLocationOn,
  MdOutlineKeyboardDoubleArrowUp,
} from "react-icons/md";
import { TbBuildingCommunity } from "react-icons/tb";
import { GiModernCity } from "react-icons/gi";
import {
  IoCalendarOutline,
  IoSearchOutline,
  IoSparkles,
  IoCompass,
  IoShieldCheckmarkOutline,
  IoFlashOutline,
} from "react-icons/io5";
import { CheckCircle, AlertCircle, X, ArrowUp } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { ChatDrawer } from "@/components/ui/chat/ChatDrawer";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const gradientButton = `
  bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 
  hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const gradientText =
  "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent";

const HERO_SLIDES = [
  {
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=80",
    titleKey: "heroSlide1Title",
    subtitleKey: "heroSlide1Subtitle",
    labelKey: "heroSlide1Label",
  },
  {
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1800&q=80",
    titleKey: "heroSlide2Title",
    subtitleKey: "heroSlide2Subtitle",
    labelKey: "heroSlide2Label",
  },
  {
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1800&q=80",
    titleKey: "heroSlide3Title",
    subtitleKey: "heroSlide3Subtitle",
    labelKey: "heroSlide3Label",
  },
];

// Category icon helper
const getCategoryIcon = (catId: string, isActive: boolean) => {
  const baseClass = "text-2xl transition-all duration-300";
  const activeClass = "text-white";
  const inactiveClass =
    "text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400";

  switch (catId) {
    case "all":
      return (
        <IoCompass
          className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
        />
      );
    case "Villa":
      return (
        <MdOutlineVilla
          className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
        />
      );
    case "Appartement":
      return (
        <TbBuildingCommunity
          className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
        />
      );
    case "Maison":
      return (
        <FaHome
          className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
        />
      );
    case "Studio":
      return (
        <FaCity
          className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
        />
      );
    case "Duplex":
      return (
        <GiModernCity
          className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
        />
      );
    default:
      return (
        <FaHome
          className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
        />
      );
  }
};

export default function SearchPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("SearchPage");
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [bedroomsFilter, setBedroomsFilter] = useState<number | null>(null);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [showNexusCard, setShowNexusCard] = useState(false);
  const [showGoUpButton, setShowGoUpButton] = useState(false);
  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };
  useEffect(() => {
    const handleScroll = () => {
      setShowGoUpButton(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.querySelector("section");
      if (heroSection) {
        const heroBottom = heroSection.getBoundingClientRect().bottom;
        setShowNexusCard(heroBottom < 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

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

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id, e);
    const isFav = favorites.includes(id);
    showToast("success", isFav ? t("favoriteRemoved") : t("favoriteAdded"));
  };

  const handleResetFilters = () => {
    resetFilters();
    setRatingFilter(null);
    setBedroomsFilter(null);
    showToast("info", t("filtersReset"));
  };

  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    selectedAmenities.length +
    (ratingFilter ? 1 : 0) +
    (bedroomsFilter ? 1 : 0);

  let filteredListings = [...listings];

  // Appliquer les filtres de note et chambres
  if (ratingFilter)
    filteredListings = filteredListings.filter(
      (l) => (l.rating || 0) >= ratingFilter,
    );
  if (bedroomsFilter)
    filteredListings = filteredListings.filter(
      (l) => l.bedrooms >= bedroomsFilter,
    );

  // Appliquer le tri (SORT) selon sortBy
  if (sortBy === "price_asc") {
    filteredListings.sort((a, b) => {
      const priceA = a.pricePerNight || a.price || a.pricePerMonth || 0;
      const priceB = b.pricePerNight || b.price || b.pricePerMonth || 0;
      return priceA - priceB;
    });
  } else if (sortBy === "price_desc") {
    filteredListings.sort((a, b) => {
      const priceA = a.pricePerNight || a.price || a.pricePerMonth || 0;
      const priceB = b.pricePerNight || b.price || b.pricePerMonth || 0;
      return priceB - priceA;
    });
  } else if (sortBy === "rating") {
    filteredListings.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortBy === "relevance") {
    // Pour "Les mieux évalués" = tri par note décroissante
    filteredListings.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  if (!mounted || (loading && listings.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Toast Notification */}
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

      {showNexusCard && (
        <div className="hidden xl:block fixed right-8 top-1/2 -translate-y-1/2 z-30">
          <NexusCard />
        </div>
      )}

      <TenantHeader />

      <main>
        {/* Hero Section */}
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0">
            {HERO_SLIDES.map((slide, index) => (
              <div
                key={slide.titleKey}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  heroIndex === index ? "opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={slide.image}
                  alt={t(slide.titleKey)}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-slate-950/30 to-indigo-950/60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.28),transparent_24%)]" />

          <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-28 sm:px-6">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white/90 backdrop-blur-md">
                <IoSparkles className="h-3.5 w-3.5" />
                {t(HERO_SLIDES[heroIndex].labelKey)}
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight text-white md:text-7xl">
                {t(HERO_SLIDES[heroIndex].titleKey)}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">
                {t(HERO_SLIDES[heroIndex].subtitleKey)}
              </p>
            </div>

            {/* Search Bar */}
            <div className="mt-10 overflow-hidden rounded-[34px] border border-white/20 bg-white/12 p-3 shadow-[0_28px_120px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
              <div className="rounded-[28px] bg-white/92 p-4 dark:bg-slate-950/88">
                <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_0.9fr_auto]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
                      {t("destination")}
                    </label>
                    <div className="relative">
                      <MdOutlineLocationOn className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={searchDestination}
                        onChange={(e) => setSearchDestination(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSearch();
                          }
                        }}
                        className="w-full bg-transparent py-1 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                        placeholder={t("searchPlaceholder")}
                        type="text"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
                      {t("dates")}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <IoCalendarOutline className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="date"
                          value={searchDates.checkIn}
                          onChange={(e) =>
                            setSearchDates({
                              ...searchDates,
                              checkIn: e.target.value,
                            })
                          }
                          className="w-full bg-transparent py-1 pl-10 pr-2 text-sm font-semibold text-slate-900 outline-none dark:text-white dark:[color-scheme:dark]"
                          placeholder={t("arrival")}
                        />
                      </div>
                      <div className="relative">
                        <IoCalendarOutline className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="date"
                          value={searchDates.checkOut}
                          onChange={(e) =>
                            setSearchDates({
                              ...searchDates,
                              checkOut: e.target.value,
                            })
                          }
                          className="w-full bg-transparent py-1 pl-10 pr-2 text-sm font-semibold text-slate-900 outline-none dark:text-white dark:[color-scheme:dark]"
                          placeholder={t("departure")}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
                      {t("travelers")}
                    </label>
                    <div className="relative">
                      <MdOutlinePeople className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        value={searchGuests}
                        onChange={(e) =>
                          setSearchGuests(parseInt(e.target.value))
                        }
                        className="w-full bg-transparent py-1 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none dark:text-white"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? t("traveler") : t("travelersPlural")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSearch()}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold transition-all hover:scale-[1.01] ${gradientButton}`}
                  >
                    <IoSearchOutline className="h-4 w-4" /> {t("searchBtn")}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-12 flex items-center justify-center gap-8">
              {[
                { value: "250+", labelKey: "statsProperties" },
                { value: "98%", labelKey: "statsCustomers" },
                { value: "15+", labelKey: "statsDestinations" },
              ].map((stat) => (
                <div key={stat.labelKey} className="text-center">
                  <p className={`text-2xl font-extrabold ${gradientText}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs font-medium text-white/60 mt-0.5">
                    {t(stat.labelKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Badges Section */}
        <section className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 pb-4 sm:px-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                icon: IoShieldCheckmarkOutline,
                titleKey: "trustBadge1Title",
                textKey: "trustBadge1Text",
              },
              {
                icon: IoSparkles,
                titleKey: "trustBadge2Title",
                textKey: "trustBadge2Text",
              },
              {
                icon: IoCompass,
                titleKey: "trustBadge3Title",
                textKey: "trustBadge3Text",
              },
              {
                icon: IoFlashOutline,
                titleKey: "trustBadge4Title",
                textKey: "trustBadge4Text",
              },
            ].map((badge) => (
              <div
                key={badge.titleKey}
                className="rounded-[26px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/78"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                  <badge.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {t(badge.titleKey)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {t(badge.textKey)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Categories Section */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-500/20 dark:bg-slate-900/70 dark:text-indigo-300">
                <IoSparkles className="h-3.5 w-3.5" /> {t("universAmbiances")}
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                {t("collectionsStory")}{" "}
                <span className={gradientText}>
                  {t("collectionsStoryGradient")}
                </span>
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
                {t("categoriesDescription")}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;

              // Déterminer le nom et la description selon la catégorie
              let categoryName = "";
              let categoryDesc = "";

              switch (cat.id) {
                case "all":
                  categoryName = t("categoryAll");
                  categoryDesc = t("categoryAllDesc");
                  break;
                case "Villa":
                  categoryName = t("categoryVilla");
                  categoryDesc = t("categoryVillaDesc");
                  break;
                case "Appartement":
                  categoryName = t("categoryAppartement");
                  categoryDesc = t("categoryAppartementDesc");
                  break;
                case "Maison":
                  categoryName = t("categoryMaison");
                  categoryDesc = t("categoryMaisonDesc");
                  break;
                case "Studio":
                  categoryName = t("categoryStudio");
                  categoryDesc = t("categoryStudioDesc");
                  break;
                case "Duplex":
                  categoryName = t("categoryDuplex");
                  categoryDesc = t("categoryDuplexDesc");
                  break;
                default:
                  categoryName = cat.id;
                  categoryDesc = t("categoryDesc");
              }

              return (
                <button
                  key={cat.id}
                  onClick={() => selectCategory(cat.id)}
                  className={`group rounded-[28px] border px-5 py-6 text-left transition-all duration-300 ${
                    isActive
                      ? "border-transparent bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20 scale-[1.02]"
                      : "border-white/70 bg-white/85 shadow-[0_16px_40px_rgba(15,23,42,0.06)] hover:-translate-y-1 hover:border-indigo-200 dark:border-white/10 dark:bg-slate-900/75 dark:hover:border-indigo-500/30"
                  }`}
                >
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
                      isActive
                        ? "bg-white/20"
                        : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20"
                    }`}
                  >
                    {getCategoryIcon(cat.id, isActive)}
                  </div>
                  <h3
                    className={`text-sm font-bold ${
                      isActive ? "text-white" : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {categoryName}
                  </h3>
                  <p
                    className={`mt-2 text-xs ${
                      isActive
                        ? "text-white/80"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {categoryDesc}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Results Section */}
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-500/20 dark:bg-slate-900/70 dark:text-indigo-300">
                <IoSparkles className="h-3.5 w-3.5" /> {t("exceptionalResults")}
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                {t("premiumEditorial")}{" "}
                <span className={gradientText}>
                  {t("premiumEditorialGradient")}
                </span>
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
                {t("resultsDescription")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-slate-800">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-lg p-2 transition-all ${
                    viewMode === "grid"
                      ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                  title={t("gridView")}
                >
                  <FaTh className="text-lg" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg p-2 transition-all ${
                    viewMode === "list"
                      ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                  title={t("listView")}
                >
                  <FaList className="text-lg" />
                </button>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="relevance">{t("sortBestRated")}</option>
                <option value="price_asc">{t("sortPriceAsc")}</option>
                <option value="price_desc">{t("sortPriceDesc")}</option>
                <option value="rating">{t("sortRating")}</option>
              </select>
              <button
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
              >
                <FaFilter className="text-lg" />
                {t("filterBtn")}
                {activeFiltersCount > 0 && (
                  <span className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-1.5 py-0.5 text-xs text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {selectedCategory !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                  {selectedCategory}
                  <button onClick={() => selectCategory("all")}>
                    <FaTimes className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedAmenities.map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                >
                  {amenity}
                  <button onClick={() => toggleAmenity(amenity)}>
                    <FaTimes className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {ratingFilter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  <FaStar className="h-3 w-3" />
                  {ratingFilter}+ étoiles
                  <button onClick={() => setRatingFilter(null)}>
                    <FaTimes className="h-3 w-3" />
                  </button>
                </span>
              )}
              {bedroomsFilter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <FaBed className="h-3 w-3" />
                  {bedroomsFilter}+ chambres
                  <button onClick={() => setBedroomsFilter(null)}>
                    <FaTimes className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-400 transition hover:text-indigo-600"
              >
                {t("clearAll")}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Filters Sidebar - Desktop */}
            <aside className="hidden lg:block lg:w-80 flex-shrink-0">
              <div className="sticky top-24 rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-500">
                      {t("refinement")}
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                      {t("customize")}
                    </h3>
                  </div>
                  <button
                    onClick={handleResetFilters}
                    className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                  >
                    {t("resetBtn")}
                  </button>
                </div>

                <div className="space-y-7">
                  {/* Price Range */}
                  <div>
                    <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {t("maxBudget")} — {priceRange[1]} TND
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
                      className="w-full accent-indigo-500"
                    />
                    <div className="mt-2 flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
                      <span>0</span>
                      <span>1250</span>
                      <span>2500</span>
                      <span>3750</span>
                      <span>5000+</span>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {t("minRating")}
                    </h4>
                    <div className="flex gap-2">
                      {[
                        { value: null, label: t("all") },
                        { value: 4, label: t("stars4") },
                        { value: 4.5, label: t("stars45") },
                      ].map((option) => (
                        <button
                          key={option.value ?? "all"}
                          onClick={() => setRatingFilter(option.value)}
                          className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                            ratingFilter === option.value
                              ? gradientButton
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                          }`}
                        >
                          {option.value && (
                            <FaStar className="mr-1 inline h-3 w-3" />
                          )}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bedrooms Filter */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {t("bedroomsCount")}
                    </h4>
                    <div className="flex gap-2">
                      {[null, 1, 2, 3, 4].map((value) => (
                        <button
                          key={value ?? "all"}
                          onClick={() => setBedroomsFilter(value)}
                          className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                            bedroomsFilter === value
                              ? gradientButton
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                          }`}
                        >
                          {value ? `${value}+` : t("all")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {t("amenitiesList")}
                      {selectedAmenities.length > 0 && (
                        <span className="ml-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-2 py-0.5 text-xs text-white">
                          {selectedAmenities.length}
                        </span>
                      )}
                    </h4>
                    <div className="max-h-60 space-y-2 overflow-y-auto">
                      {allAmenities.map((amenity) => (
                        <label
                          key={amenity}
                          className="group flex cursor-pointer items-center gap-3"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAmenities.includes(amenity)}
                            onChange={() => toggleAmenity(amenity)}
                            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
                          />
                          <span className="inline-flex items-center gap-2 text-sm text-gray-700 transition group-hover:text-indigo-600 dark:text-gray-300 dark:group-hover:text-indigo-400">
                            {amenity}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSearch}
                    className={`w-full rounded-2xl py-3.5 text-sm font-bold transition-all hover:scale-[1.01] ${gradientButton}`}
                  >
                    {t("applyBtn")}
                  </button>
                </div>
              </div>
            </aside>

            {/* Listings Grid/List */}
            <main className="min-w-0 flex-1">
              {loading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="mb-4 aspect-[4/3] rounded-xl bg-gray-200 dark:bg-slate-800" />
                      <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-800" />
                      <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-slate-800" />
                    </div>
                  ))}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="flex min-h-[805px] flex-col items-center justify-center rounded-[30px] border border-white/70 bg-white/85 py-20 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
                  <div className="flex max-w-md flex-col items-center gap-6 px-6">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-600/10 backdrop-blur-sm mx-auto animate-pulse">
                      <IoSearchOutline className="h-22 w-12 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {t("noResults")}
                    </h3>
                    <div className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                      <p className="flex items-center justify-center gap-2">
                        <span>{t("noResultsDesc1")}</span>
                      </p>
                      <p className="flex items-center justify-center gap-2">
                        <span>{t("noResultsDesc2")}</span>
                      </p>
                      <p className="flex items-center justify-center gap-2">
                        <span>{t("noResultsDesc3")}</span>
                      </p>
                    </div>
                    <button
                      onClick={handleResetFilters}
                      className={`mt-2 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all hover:scale-[1.02] ${gradientButton}`}
                    >
                      <FaTimes className="h-3.5 w-3.5" />
                      {t("resetFiltersBtn")}
                    </button>
                  </div>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      isFavorite={favorites.includes(listing.id)}
                      onToggleFavorite={handleToggleFavorite}
                      gradientButton={gradientButton}
                      t={t}
                      gradientText={gradientText}
                      locale={locale}
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
                      locale={locale}
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

        {/* Why This Search Feels Different */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="rounded-[34px] border border-white/70 bg-white/85 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-500/20 dark:bg-slate-900/70 dark:text-indigo-300">
                  <IoSparkles className="h-3.5 w-3.5" />{" "}
                  {t("excellenceInAction")}
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                  {t("interfaceSublimes")}{" "}
                  <span className={gradientText}>
                    {t("interfaceSublimesGradient")}
                  </span>
                </h2>
              </div>
              <div className="max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {t("ambitionText")}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: FaShieldAlt,
                  titleKey: "absoluteReliability",
                  textKey: "absoluteReliabilityText",
                },
                {
                  icon: FaCamera,
                  titleKey: "editorialExperience",
                  textKey: "editorialExperienceText",
                },
                {
                  icon: FaCompass,
                  titleKey: "luxuryAmbassador",
                  textKey: "luxuryAmbassadorText",
                },
              ].map((item) => (
                <div
                  key={item.titleKey}
                  className="rounded-[26px] bg-slate-50 p-5 dark:bg-white/5"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t(item.titleKey)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {t(item.textKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-indigo-100/20 py-10 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/70">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                {t("footerTitle")}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 whitespace-pre-line">
                {t("footerText")}
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              {[
                { key: "footerPrivacy", href: `/${locale}/privacy` },
                { key: "footerTerms", href: `/${locale}/terms` },
                { key: "footerContact", href: `/${locale}/#contact-support` },
              ].map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  className="cursor-pointer transition-colors hover:text-slate-700 dark:hover:text-white"
                >
                  {t(link.key)}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </main>

      {/* Map Button - Floating Animation */}
      <div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-5 duration-500">
        <Link href={`/${locale}/map`}>
          <button
            className={`group inline-flex items-center gap-2 rounded-full ${gradientButton} px-6 py-3 text-sm font-bold shadow-2xl shadow-indigo-500/25 transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/40 active:scale-95 animate-float`}
            style={{
              animation: "float 3s ease-in-out infinite",
            }}
          >
            <FaMapMarkedAlt className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            <span className="transition-all duration-300 group-hover:tracking-wider">
              {t("exploreCarte")}{" "}
            </span>
          </button>
        </Link>
      </div>

      {/* Go Up Button */}
      <div
        className={`fixed bottom-24 right-6 z-40 transition-all duration-300 ${
          showGoUpButton
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`rounded-full p-3 shadow-2xl transition-all hover:scale-105 active:scale-95 ${gradientButton}`}
          aria-label="Remonter en haut"
          title="Remonter en haut"
        >
          <MdOutlineKeyboardDoubleArrowUp className="text-xl" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-3xl bg-white/80 px-4 pb-6 pt-2 backdrop-blur-xl dark:bg-slate-900/80 md:hidden shadow-lg">
        <Link
          href={`/${locale}/search`}
          className="flex flex-col items-center justify-center rounded-2xl bg-indigo-50 px-5 py-2 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
        >
          <IoSearchOutline className="text-xl" />
          <span className="mt-1 text-[11px] font-medium">{t("explore")}</span>
        </Link>
        <Link
          href={`/${locale}/favorites`}
          className="flex flex-col items-center justify-center px-5 py-2 text-slate-500 dark:text-slate-400"
        >
          <FaRegHeart className="text-xl" />
          <span className="mt-1 text-[11px] font-medium">{t("favorites")}</span>
        </Link>
        <button
          onClick={() => setIsChatDrawerOpen(true)}
          className="flex flex-col items-center justify-center px-5 py-2 text-slate-500 dark:text-slate-400"
        >
          <FaComments className="text-xl" />
          <span className="mt-1 text-[11px] font-medium">{t("messages")}</span>
        </button>
        <Link
          href={`/${locale}/profile`}
          className="flex flex-col items-center justify-center px-5 py-2 text-slate-500 dark:text-slate-400"
        >
          <FaUser className="text-xl" />
          <span className="mt-1 text-[11px] font-medium">{t("profile")}</span>
        </Link>
      </nav>

      <ChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        userRole={userRole}
      />
    </div>
  );
} // ListingCard Component - Version améliorée
function ListingCard({
  listing,
  isFavorite,
  onToggleFavorite,
  gradientButton,
  t,
  gradientText,
  locale,
}: any) {
  const displayPrice =
    listing.pricePerNight || listing.price || listing.pricePerMonth || 0;
  const priceUnit = t("perNight");

  const getImageUrl = (url: string) => {
    if (!url) return "/images/placeholder.jpg";
    if (url.includes("vercel-storage.com"))
      return `/api/listings/image?url=${encodeURIComponent(url)}`;
    return url;
  };

  const [imgSrc, setImgSrc] = useState(getImageUrl(listing.image));

  // Badges dynamiques
  const isNew =
    listing.createdAt &&
    new Date(listing.createdAt) >
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isPopular = (listing.viewCount || 0) > 100;
  const isPremium = listing.isVerified;

  // Couleur du badge de confiance - basée sur le score
  const getTrustBadgeColor = (score: number) => {
    if (score >= 80)
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    if (score >= 60)
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    if (score >= 40)
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    if (score >= 20)
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  };

  const getAmenitiesArray = (listing: any) => {
    if (Array.isArray(listing.amenities)) return listing.amenities;
    if (typeof listing.amenities === "string")
      return listing.amenities.split(",");
    return [];
  };

  // Fonction pour afficher les étoiles
  const renderStars = (rating: number) => {
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

  return (
    <Link
      href={`/${locale}/listings/${listing.id}`}
      className="group cursor-pointer"
    >
      <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900">
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={imgSrc}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgSrc("/images/placeholder.jpg")}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Badges supérieurs */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {isPremium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                <FaGem className="h-2.5 w-2.5" /> {t("premium")}
              </span>
            )}
            {isPopular && !isPremium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                <FaFire className="h-2.5 w-2.5" /> {t("trending")}
              </span>
            )}
            {isNew && !isPopular && !isPremium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                <FaClock className="h-2.5 w-2.5" /> {t("new")}
              </span>
            )}
          </div>

          {/* Bouton favoris */}
          <button
            onClick={(e) => onToggleFavorite(listing.id, e)}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all hover:scale-110 active:scale-95 dark:bg-slate-800/90"
          >
            {isFavorite ? (
              <FaHeart className="h-4 w-4 fill-red-500 text-red-500" />
            ) : (
              <FaHeart className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            )}
          </button>

          {/* Prix flottant */}
          <div className="absolute bottom-3 right-3 rounded-xl bg-white/95 px-3 py-1.5 text-right shadow-lg backdrop-blur-sm dark:bg-slate-900/95">
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {displayPrice.toLocaleString()}
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              TND {priceUnit}
            </p>
          </div>

          {/* Titre et localisation */}
          <div className="absolute bottom-3 left-3 right-24">
            <h3 className="text-base font-bold text-white line-clamp-1 drop-shadow-md">
              {listing.title}
            </h3>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-white/80">
              <MdOutlineLocationOn className="h-3 w-3" /> {listing.location}
            </p>
          </div>
        </div>

        {/* Détails de la carte */}
        <div className="p-4">
          {/* Note avec étoiles et caractéristiques - AFFICHAGE CONDITIONNEL */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/*  ÉTOILES - seulement si rating existe */}
              {listing.rating ? (
                <div className="flex items-center gap-2">
                  {renderStars(listing.rating)}
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {listing.rating.toFixed(1)}
                  </span>
                  {listing.reviewCount > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ({listing.reviewCount})
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className="h-3 w-3 text-slate-300 dark:text-slate-600"
                    />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">
                    {t("new")}
                  </span>
                </div>
              )}
            </div>

            {/* Caractéristiques - n'afficher que si les valeurs existent */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {listing.bedrooms > 0 && (
                <span className="inline-flex items-center gap-1">
                  <FaBed className="h-3 w-3" /> {listing.bedrooms}
                </span>
              )}
              {listing.bathrooms > 0 && (
                <span className="inline-flex items-center gap-1">
                  <FaBath className="h-3 w-3" /> {listing.bathrooms}
                </span>
              )}
              {listing.maxGuests > 0 && (
                <span className="inline-flex items-center gap-1">
                  <MdOutlinePeople className="h-3 w-3" /> {listing.maxGuests}
                </span>
              )}
            </div>
          </div>

          {/* Description courte */}
          <p className="mb-3 text-xs leading-relaxed text-slate-600 line-clamp-2 dark:text-slate-400">
            {listing.description || t("defaultDescription")}
          </p>

          {/* Équipements - seulement si disponibles */}
          {listing.amenities && getAmenitiesArray(listing).length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {getAmenitiesArray(listing)
                .slice(0, 3)
                .map((amenity: string) => (
                  <span
                    key={amenity}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  >
                    {amenity}
                  </span>
                ))}
              {getAmenitiesArray(listing).length > 3 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-500">
                  +{getAmenitiesArray(listing).length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer avec SCORE DE CONFIANCE (chiffre clair) et bouton */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
            {listing.trustScore && (
              <div
                className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 ${getTrustBadgeColor(listing.trustScore)}`}
              >
                <span className="text-[11px] font-bold">✓</span>
                <span className="text-[11px] font-semibold">
                  {t("trustScore")} : {listing.trustScore}%
                </span>
              </div>
            )}

            <button className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition-all hover:gap-2 dark:text-indigo-400">
              {t("discover")}
              <FaTimes className="h-2.5 w-2.5 rotate-45 transition-transform group-hover:rotate-0" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ListingRow Component - Version corrigée
function ListingRow({
  listing,
  isFavorite,
  onToggleFavorite,
  gradientButton,
  t,
  gradientText,
  locale,
}: any) {
  const displayPrice =
    listing.pricePerNight || listing.price || listing.pricePerMonth || 0;
  const priceUnit = t("perNight");

  const getImageUrl = (url: string) => {
    if (!url) return "/images/placeholder.jpg";
    if (url.includes("vercel-storage.com"))
      return `/api/listings/image?url=${encodeURIComponent(url)}`;
    return url;
  };

  const [imgSrc, setImgSrc] = useState(getImageUrl(listing.image));

  const getAmenitiesArray = (listing: any) => {
    if (Array.isArray(listing.amenities)) return listing.amenities;
    if (typeof listing.amenities === "string")
      return listing.amenities.split(",");
    return [];
  };

  // Fonction pour afficher les étoiles selon la note (rating)
  const renderStars = (rating: number) => {
    const roundedRating = Math.round(rating * 2) / 2;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {/* Étoiles pleines */}
        {[...Array(fullStars)].map((_, i) => (
          <FaStar
            key={`full-${i}`}
            className="h-3 w-3 fill-amber-400 text-amber-400"
          />
        ))}

        {/* Demi-étoile */}
        {hasHalfStar && (
          <div className="relative">
            <FaStar className="h-3 w-3 text-amber-400" />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: "50%" }}
            >
              <FaStar className="h-3 w-3 fill-amber-400 text-amber-400" />
            </div>
          </div>
        )}

        {/* Étoiles vides */}
        {[...Array(emptyStars)].map((_, i) => (
          <FaStar
            key={`empty-${i}`}
            className="h-3 w-3 text-slate-300 dark:text-slate-600"
          />
        ))}

        {/* Affichage de la note en chiffre */}
        <span className="ml-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };
  // Couleur du badge de confiance - basée sur le score
  const getTrustBadgeColor = (score: number) => {
    if (score >= 80)
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    if (score >= 60)
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    if (score >= 40)
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    if (score >= 20)
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  };

  return (
    <Link href={`/${locale}/listings/${listing.id}`}>
      <div className="group rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-md transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-900/80">
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          {/* Image */}
          <div className="relative h-48 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
            <img
              src={imgSrc}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => setImgSrc("/images/placeholder.jpg")}
            />
            <button
              onClick={(e) => onToggleFavorite(listing.id, e)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur-md dark:bg-slate-900/90 dark:text-white"
            >
              {isFavorite ? (
                <FaHeart className="h-4 w-4 fill-rose-500 text-rose-500" />
              ) : (
                <FaHeart className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Contenu */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                  {listing.collection || t("collection")}
                </span>
                {listing.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                    <FaGem className="h-3 w-3" /> {t("certified")}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {listing.title}
              </h3>

              {/* NOTE AVEC ÉTOILES - AFFICHAGE CONDITIONNEL */}
              <div className="flex items-center gap-2">
                {listing.rating ? (
                  <>
                    {renderStars(listing.rating)}
                    {listing.reviewCount > 0 && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({listing.reviewCount} {t("reviews")})
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className="h-3 w-3 text-slate-300 dark:text-slate-600"
                      />
                    ))}
                    <span className="text-xs text-slate-400 ml-1">
                      {t("new")}
                    </span>
                  </div>
                )}

                {/* Localisation - seulement si existe */}
                {listing.location && (
                  <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <MdOutlineLocationOn className="h-4 w-4" />{" "}
                    {listing.location}
                  </span>
                )}

                {/* Nombre de voyageurs - seulement si défini */}
                {listing.maxGuests > 0 && (
                  <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <MdOutlinePeople className="h-4 w-4" /> {listing.maxGuests}{" "}
                    {t("guests")}
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                {listing.description || listing.tagline}
              </p>

              {/* Équipements */}
              {listing.amenities && getAmenitiesArray(listing).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {getAmenitiesArray(listing)
                    .slice(0, 5)
                    .map((amenity: string) => (
                      <span
                        key={amenity}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                      >
                        {amenity}
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Prix et bouton */}
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {displayPrice.toLocaleString()} TND
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {priceUnit}
                </p>
              </div>
              <button
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.01] ${gradientButton}`}
              >
                {t("book")} <FaTimes className="h-3 w-3 rotate-45" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
