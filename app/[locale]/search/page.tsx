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
  FaShieldAlt,
  FaCamera,
  FaCompass,
} from "react-icons/fa";
import {
  MdOutlineVilla,
  MdOutlinePeople,
  MdOutlineLocationOn,
  MdOutlineWaves,
} from "react-icons/md";
import { TbAirConditioning, TbBuildingCommunity } from "react-icons/tb";
import { GiModernCity } from "react-icons/gi";
import {
  IoChatbubbleOutline,
  IoHomeOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoSearchOutline,
  IoSparkles,
  IoCompass,
  IoShieldCheckmarkOutline,
  IoCameraOutline,
  IoFlashOutline,
} from "react-icons/io5";
import AlertBanner from "@/components/ui/Alert";
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
    title: "Séjours d'exception en Tunisie",
    subtitle:
      "Des demeures d'exception et des refuges authentiques pour des vacances inoubliables",
    label: "Moteur de recherche premium",
  },
  {
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1800&q=80",
    title: "Expériences uniques, souvenirs impérissables",
    subtitle:
      "Chaque propriété fait l'objet d'une vérification rigoureuse pour votre tranquillité",
    label: "Découverte certifiée",
  },
  {
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1800&q=80",
    title: "L'élégance discrète, à portée de clic",
    subtitle:
      "Affinez votre recherche par destination, équipements et budget pour dénicher la perle rare",
    label: "Sélection curatée",
  },
];

const TRUST_BADGES = [
  {
    icon: IoShieldCheckmarkOutline,
    title: "Propriétés authentifiées",
    text: "Chaque logement est rigoureusement validé par notre équipe",
  },
  {
    icon: IoSparkles,
    title: "Esthétique curatoriale",
    text: "Une sélection éditoriale des demeures les plus remarquables",
  },
  {
    icon: IoCompass,
    title: "Navigation premium",
    text: "Fluidité, élégance et efficacité redéfinies",
  },
  {
    icon: IoFlashOutline,
    title: "Indice de confiance",
    text: "Des indicateurs transparents pour réserver l'esprit serein",
  },
];

const WHY_DIFFERENT = [
  {
    icon: FaShieldAlt,
    title: "Confiabilité absolue",
    text: "Scores de fiabilité, badges d'authentification et hiérarchie visuelle éliminent toute hésitation.",
  },
  {
    icon: FaCamera,
    title: "Expérience éditoriale",
    text: "Photographies immersives, espacement aéré et narration captivante éveillent le désir avant toute comparaison tarifaire.",
  },
  {
    icon: FaCompass,
    title: "Ambassadeur du luxe",
    text: "Une interface qui se veut curatoriale, distinctive — l'incarnation parfaite d'une recherche d'exception.",
  },
];

const FOOTER_LINKS = [
  "Confidentialité",
  "Conditions générales",
  "Assistance",
  "Presse",
  "Carrières",
  "Communauté",
];

// Category icon helper with inspiration styling
const getCategoryIcon = (catId: string, isActive: boolean) => {
  const baseClass = "text-2xl transition-all duration-300";
  const activeClass = "text-white";
  const inactiveClass = "text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400";

  switch (catId) {
    case "all":
      return <IoCompass className={`${baseClass} ${isActive ? activeClass : inactiveClass}`} />;
    case "Villa":
      return <MdOutlineVilla className={`${baseClass} ${isActive ? activeClass : inactiveClass}`} />;
    case "Appartement":
      return <TbBuildingCommunity className={`${baseClass} ${isActive ? activeClass : inactiveClass}`} />;
    case "Maison":
      return <FaHome className={`${baseClass} ${isActive ? activeClass : inactiveClass}`} />;
    case "Studio":
      return <FaCity className={`${baseClass} ${isActive ? activeClass : inactiveClass}`} />;
    case "Duplex":
      return <GiModernCity className={`${baseClass} ${isActive ? activeClass : inactiveClass}`} />;
    default:
      return <FaHome className={`${baseClass} ${isActive ? activeClass : inactiveClass}`} />;
  }
};

const getAmenityIcon = (amenity: string) => {
  return amenity;
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
  const [heroIndex, setHeroIndex] = useState(0);
  const [showMapPreview, setShowMapPreview] = useState(false);

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
      isFav ? "Retiré de vos favoris" : "Ajouté à vos favoris",
    );
  };

  const handleResetFilters = () => {
    resetFilters();
    setRatingFilter(null);
    setBedroomsFilter(null);
    showAlert("info", "Tous les critères ont été réinitialisés");
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

  const featuredMatch = filteredListings[0];

  const getAmenitiesArray = (listing: any) => {
    if (Array.isArray(listing.amenities)) return listing.amenities;
    if (typeof listing.amenities === "string") return listing.amenities.split(",");
    return [];
  };
if (loading && listings.length === 0) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner />
        <p className="text-sm  text-slate-500 dark:text-slate-400">
          Chargement des propriétés...
        </p>
      </div>
    </div>
  );
}
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {alert && (
        <div className="fixed top-24 right-8 z-[60] animate-in slide-in-from-top-2 fade-in duration-300">
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      <TenantHeader />

      <main>
        {/* Hero Section */}
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0">
            {HERO_SLIDES.map((slide, index) => (
              <div
                key={slide.title}
                className={`absolute inset-0 transition-opacity duration-1000 ${heroIndex === index ? "opacity-100" : "opacity-0"}`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-slate-950/30 to-indigo-950/60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.28),transparent_24%)]" />

          <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-28 sm:px-6">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white/90 backdrop-blur-md">
                <IoSparkles className="h-3.5 w-3.5" />
                {HERO_SLIDES[heroIndex].label}
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight text-white md:text-7xl">
                {HERO_SLIDES[heroIndex].title}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">
                {HERO_SLIDES[heroIndex].subtitle}
              </p>
            </div>

            {/* Search Bar */}
            <div className="mt-10 overflow-hidden rounded-[34px] border border-white/20 bg-white/12 p-3 shadow-[0_28px_120px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
              <div className="rounded-[28px] bg-white/92 p-4 dark:bg-slate-950/88">
                <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_0.9fr_auto]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
                      Destination
                    </label>
                    <div className="relative">
                      <MdOutlineLocationOn className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={searchDestination}
                        onChange={(e) => setSearchDestination(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        className="w-full bg-transparent py-1 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                        placeholder="Sidi Bou Saïd, Hammamet, Djerba..."
                        type="text"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
                      Dates
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
                          placeholder="Arrivée"
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
                          placeholder="Départ"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
                      Voyageurs
                    </label>
                    <div className="relative">
                      <MdOutlinePeople className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        value={searchGuests}
                        onChange={(e) => setSearchGuests(parseInt(e.target.value))}
                        className="w-full bg-transparent py-1 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none dark:text-white"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? "voyageur" : "voyageurs"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleSearch}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold transition-all hover:scale-[1.01] ${gradientButton}`}
                  >
                    <IoSearchOutline className="h-4 w-4" /> Rechercher
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-12 flex items-center justify-center gap-8">
              {[
                { value: "250+", label: "Propriétés d'exception" },
                { value: "98%", label: "Clients conquis" },
                { value: "15+", label: "Destinations exclusives" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className={`text-2xl font-extrabold ${gradientText}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs font-medium text-white/60 mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Badges Section */}
        <section className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 pb-4 sm:px-6">
          <div className="grid gap-4 md:grid-cols-4">
            {TRUST_BADGES.map((badge) => (
              <div
                key={badge.title}
                className="rounded-[26px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/78"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                  <badge.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {badge.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {badge.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Categories Section */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-500/20 dark:bg-slate-900/70 dark:text-indigo-300">
                <IoSparkles className="h-3.5 w-3.5" /> Univers et ambiances
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                Bien plus que des filtres.{" "}
                <span className={gradientText}>
                  Des collections qui racontent une histoire.
                </span>
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
                Chaque catégorie incarne un univers distinct : rivages
                méditerranéens, héritage ancestral, éclats contemporains,
                quiétude absolue. C'est ainsi qu'une page de recherche
                transcende l'ordinaire pour devenir mémorable.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:text-indigo-300">
              Parcourir l'intégralité des ambiances <FaTimes className="h-3 w-3 rotate-45" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
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
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
                    isActive 
                      ? "bg-white/20" 
                      : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20"
                  }`}>
                    {getCategoryIcon(cat.id, isActive)}
                  </div>
                  <h3 className={`text-sm font-bold ${isActive ? "text-white" : "text-slate-900 dark:text-white"}`}>
                    {cat.id === "all" ? "Toutes" : cat.id}
                  </h3>
                  <p className={`mt-2 text-xs ${isActive ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
                    {cat.id === "all" 
                      ? "L'intégralité des expériences NESTHUB"
                      : "Un univers esthétique pleinement assumé"}
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
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-500/20 dark:bg-slate-900/70 dark:text-indigo-300">
                <IoSparkles className="h-3.5 w-3.5" /> Résultats d'exception
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                Une recherche qui mérite un{" "}
                <span className={gradientText}>écrin éditorial premium.</span>
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
                Narration immersive, hiérarchisation tarifaire affirmée,
                indicateurs de confiance et rythme visuel — chaque résultat est
                conçu pour captiver votre regard.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-slate-800">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-lg p-2 transition-all ${viewMode === "grid" ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}`}
                >
                  <FaTh className="text-lg" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg p-2 transition-all ${viewMode === "list" ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}`}
                >
                  <FaList className="text-lg" />
                </button>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="relevance">Les mieux évalués</option>
                <option value="price_asc">Tarif croissant</option>
                <option value="price_desc">Tarif décroissant</option>
                <option value="rating">Notes les plus élevées</option>
              </select>
              <button
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
              >
                <FaFilter className="text-lg" />
                Filtrer
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
                Tout effacer
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
                      Affinement
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                      Personnalisez votre quête
                    </h3>
                  </div>
                  <button
                    onClick={handleResetFilters}
                    className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                  >
                    Réinitialiser
                  </button>
                </div>

                <div className="space-y-7">
                  {/* Price Range */}
                  <div>
                    <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Budget maximum — {priceRange[1]} TND
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
                      Note minimale
                    </h4>
                    <div className="flex gap-2">
                      {[
                        { value: null, label: "Toutes" },
                        { value: 4, label: "4 étoiles +" },
                        { value: 4.5, label: "4.5 étoiles +" },
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
                          {option.value && <FaStar className="mr-1 inline h-3 w-3" />}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bedrooms Filter */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Chambres à coucher
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
                          {value ? `${value}+` : "Toutes"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Équipements et prestations
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
                    Appliquer les critères
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
                <div className="rounded-[30px] border border-white/70 bg-white/85 py-20 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
                  <IoSearchOutline className="mx-auto mb-4 h-14 w-14 text-slate-300 dark:text-slate-600" />
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Aucune propriété trouvée
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Ajustez vos critères de recherche ou explorez une autre
                    destination
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className={`mt-5 rounded-full px-6 py-3 text-sm font-bold text-white ${gradientButton}`}
                  >
                    Réinitialiser la recherche
                  </button>
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
                      getAmenityIcon={getAmenityIcon}
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
                      getAmenityIcon={getAmenityIcon}
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
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-500/20 dark:bg-slate-900/70 dark:text-indigo-300">
                  <IoSparkles className="h-3.5 w-3.5" /> L'excellence en action
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                  Une interface qui sublime{" "}
                  <span className={gradientText}>la plateforme elle-même.</span>
                </h2>
              </div>
              <div className="max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Notre ambition dépasse le simple filtrage d'inventaire. Nous
                souhaitons rendre chaque résultat de recherche fiable, désirable
                et profondément persuasif.
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {WHY_DIFFERENT.map((item) => (
                <div key={item.title} className="rounded-[26px] bg-slate-50 p-5 dark:bg-white/5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white/70 py-10 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/70">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                NESTHUB Recherche
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                L'art de découvrir les séjours les plus remarquables de Tunisie.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              {FOOTER_LINKS.map((link) => (
                <button key={link} className="transition-colors hover:text-slate-700 dark:hover:text-white">
                  {link}
                </button>
              ))}
            </div>
          </div>
        </footer>
      </main>
     {/* Map Button - Floating Animation */}
<div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-5 duration-500">
  <Link href="/fr/map">
    <button
      className={`group inline-flex items-center gap-2 rounded-full ${gradientButton} px-6 py-3 text-sm font-bold shadow-2xl shadow-indigo-500/25 transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/40 active:scale-95 animate-float`}
      style={{
        animation: 'float 3s ease-in-out infinite'
      }}
    >
      <FaMapMarkedAlt className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
      <span className="transition-all duration-300 group-hover:tracking-wider">
        Explorer la carte
      </span>
    </button>
  </Link>
</div>

     

      {/* Map Preview */}
      {showMapPreview && (
        <div className="fixed inset-x-6 bottom-40 z-40 overflow-hidden rounded-[30px] border border-white/70 bg-white/85 shadow-[0_24px_70px_rgba(15,23,42,0.16)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/85">
          <div className="relative h-80 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1800&q=80"
              alt="Aperçu carte"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/30 to-indigo-950/35" />
            {filteredListings.slice(0, 4).map((listing, index) => (
              <button
                key={listing.id}
                className={`absolute rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow-lg dark:bg-slate-900 dark:text-white ${
                  [
                    "left-[18%] top-[32%]",
                    "left-[45%] top-[20%]",
                    "left-[62%] top-[48%]",
                    "left-[78%] top-[30%]",
                  ][index]
                }`}
              >
                {listing.pricePerNight || listing.price || 0} TND
              </button>
            ))}
            <div className="absolute left-6 top-6 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-slate-900 shadow-md backdrop-blur-md dark:bg-slate-900/90 dark:text-white">
              Aperçu cartographique en direct
            </div>
          </div>
        </div>
      )}

      {/* Chat Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <button
          onClick={() => setIsChatDrawerOpen(true)}
          className={`rounded-full p-3 shadow-2xl transition-all hover:scale-105 active:scale-95 ${gradientButton}`}
        >
          <FaComments className="text-xl" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-3xl bg-white/80 px-4 pb-6 pt-2 backdrop-blur-xl dark:bg-slate-900/80 md:hidden shadow-lg">
        <Link
          href="/fr/search"
          className="flex flex-col items-center justify-center rounded-2xl bg-indigo-50 px-5 py-2 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
        >
          <IoSearchOutline className="text-xl" />
          <span className="mt-1 text-[11px] font-medium">Explorer</span>
        </Link>
        <Link
          href="/fr/favorites"
          className="flex flex-col items-center justify-center px-5 py-2 text-slate-500 dark:text-slate-400"
        >
          <FaRegHeart className="text-xl" />
          <span className="mt-1 text-[11px] font-medium">Favoris</span>
        </Link>
        <button
          onClick={() => setIsChatDrawerOpen(true)}
          className="flex flex-col items-center justify-center px-5 py-2 text-slate-500 dark:text-slate-400"
        >
          <FaComments className="text-xl" />
          <span className="mt-1 text-[11px] font-medium">Messages</span>
        </button>
        <Link
          href="/fr/profile"
          className="flex flex-col items-center justify-center px-5 py-2 text-slate-500 dark:text-slate-400"
        >
          <FaUser className="text-xl" />
          <span className="mt-1 text-[11px] font-medium">Profil</span>
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

// ListingCard Component
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
  const priceUnit = "par nuit";

  const getImageUrl = (url: string) => {
    if (!url) return "/images/placeholder.jpg";
    if (url.includes("vercel-storage.com"))
      return `/api/listings/image?url=${encodeURIComponent(url)}`;
    return url;
  };

  const [imgSrc, setImgSrc] = useState(getImageUrl(listing.image));
  const isNew =
    listing.createdAt &&
    new Date(listing.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isPopular = (listing.viewCount || 0) > 100;
  const isPremium = listing.isVerified;
  
  const getAmenitiesArray = (listing: any) => {
    if (Array.isArray(listing.amenities)) return listing.amenities;
    if (typeof listing.amenities === "string") return listing.amenities.split(",");
    return [];
  };

  return (
    <Link href={`/fr/listings/${listing.id}`} className="group cursor-pointer">
<div className="group overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-md transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_26px_70px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-slate-900/80">        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={imgSrc}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgSrc("/images/placeholder.jpg")}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {isPremium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                <FaGem className="h-3 w-3" /> Prestige
              </span>
            )}
            {isPopular && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                <FaFire className="h-3 w-3" /> Tendance
              </span>
            )}
            {isNew && !isPopular && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                <FaClock className="h-3 w-3" /> Nouveauté
              </span>
            )}
          </div>

          <button
            onClick={(e) => onToggleFavorite(listing.id, e)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur-md transition-all hover:scale-105 dark:bg-slate-900/90 dark:text-white"
          >
            {isFavorite ? (
              <FaHeart className="h-5 w-5 fill-rose-500 text-rose-500" />
            ) : (
              <FaHeart className="h-5 w-5" />
            )}
          </button>

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                {listing.collection || "Sélection"}
              </p>
              <h3 className="text-xl font-extrabold tracking-tight text-white">
                {listing.title}
              </h3>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-white/80">
                <MdOutlineLocationOn className="h-3.5 w-3.5" /> {listing.location}
              </p>
            </div>
            <div className="rounded-2xl bg-white/92 px-4 py-3 text-right shadow-lg backdrop-blur-md dark:bg-slate-900/92">
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                {displayPrice.toLocaleString()}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                TND {priceUnit}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <FaBed className="h-3.5 w-3.5" /> {listing.bedrooms}
              </span>
              <span className="inline-flex items-center gap-1">
                <FaBath className="h-3.5 w-3.5" /> {listing.bathrooms}
              </span>
              <span className="inline-flex items-center gap-1">
                <MdOutlinePeople className="h-3.5 w-3.5" /> {listing.maxGuests}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-white/5 dark:text-slate-200">
              <FaStar className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {listing.rating || 4.5}
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
            {listing.description || listing.tagline || "Une propriété d'exception vous attend"}
          </p>

          {listing.amenities && (
            <div className="mt-4 flex flex-wrap gap-2">
              {getAmenitiesArray(listing).slice(0, 4).map((amenity: string) => (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                >
                  {getAmenityIcon(amenity)}
                  {amenity}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
              Score de confiance {listing.trustScore || 95}/100
            </p>
            <button
              className={`inline-flex items-center gap-1 text-sm font-bold text-indigo-600 transition-all hover:gap-2 dark:text-indigo-300`}
            >
              Découvrir <FaTimes className="h-3 w-3 rotate-45" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ListingRow Component
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
  const priceUnit = "par nuit";

  const getImageUrl = (url: string) => {
    if (!url) return "/images/placeholder.jpg";
    if (url.includes("vercel-storage.com"))
      return `/api/listings/image?url=${encodeURIComponent(url)}`;
    return url;
  };

  const [imgSrc, setImgSrc] = useState(getImageUrl(listing.image));
  
  const getAmenitiesArray = (listing: any) => {
    if (Array.isArray(listing.amenities)) return listing.amenities;
    if (typeof listing.amenities === "string") return listing.amenities.split(",");
    return [];
  };

  return (
    <Link href={`/fr/listings/${listing.id}`}>
<div className="group rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-md transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-900/80">        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
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

          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                  {listing.collection || "Sélection"}
                </span>
                {listing.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                    <FaGem className="h-3 w-3" /> Certifié
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {listing.title}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <MdOutlineLocationOn className="h-4 w-4" /> {listing.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <FaStar className="h-4 w-4 fill-amber-400 text-amber-400" />{" "}
                  {listing.rating || 4.5} ({listing.reviewCount || 0} avis)
                </span>
                <span className="inline-flex items-center gap-1">
                  <MdOutlinePeople className="h-4 w-4" /> {listing.maxGuests}{" "}
                  voyageurs
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                {listing.description || listing.tagline}
              </p>
              {listing.amenities && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {getAmenitiesArray(listing).slice(0, 5).map((amenity: string) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    >
                      {getAmenityIcon(amenity)} {amenity}
                    </span>
                  ))}
                </div>
              )}
            </div>

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
                Réserver <FaTimes className="h-3 w-3 rotate-45" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}