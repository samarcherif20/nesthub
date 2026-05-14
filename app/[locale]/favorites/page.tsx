"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Ban,
  Bath,
  BedDouble,
  Building2,
  Compass,
  Crown,
  Grid2x2,
  Heart,
  Home,
  List,
  MapPin,
  ShieldCheck,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { useFavorites } from "./hooks/useFavorites";
import AlertBanner from "@/components/ui/Alert";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import { IoHeartDislikeOutline } from "react-icons/io5";

const GRADIENT_BUTTON = `
  bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 
  hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const GRADIENT_TEXT = "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent";

const CATEGORIES = [
  { id: "all", label: "Tous", icon: Compass },
  { id: "VILLA", label: "Villas de luxe", icon: Home },
  { id: "HOUSE", label: "Dars & maisons", icon: Building2 },
  { id: "APARTMENT", label: "Appartements", icon: Building2 },
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

  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("featured");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 2600);
    return () => clearTimeout(timer);
  }, [alert]);

  const showAlert = (
    type: "success" | "error" | "info" | "warning",
    message: string,
  ) => {
    setAlert({ type, message });
  };

  const handleImageError = (id: string) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
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
        return sorted.sort((a, b) => (a.price || a.pricePerNight || 0) - (b.price || b.pricePerNight || 0));
      case "price_desc":
        return sorted.sort((a, b) => (b.price || b.pricePerNight || 0) - (a.price || a.pricePerNight || 0));
      case "rating":
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default:
        return sorted;
    }
  };

  const sortedFavorites = getSortedFavorites();
  const hasFavorites = favorites.length > 0;
  const canCompare = favorites.length >= 2;

  const handleRemoveFavorite = (id: string, title: string) => {
    removeFavorite(id);
    showAlert("success", `« ${title} » retiré des favoris`);
  };

  const handleClearAllFavorites = () => {
    clearAllFavorites();
    setShowClearModal(false);
    showAlert("info", "Tous les favoris ont été supprimés");
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showAlert("success", "Lien copié dans le presse-papiers !");
    } catch {
      showAlert("error", "Partage non disponible");
    }
  };

  const handleToggleCompare = (id: string, title: string) => {
    toggleCompare(id);
    showAlert(
      "info",
      selectedForCompare.includes(id)
        ? `« ${title} » retiré de la comparaison`
        : `« ${title} » ajouté à la comparaison`
    );
  };

  if (!mounted || loading) {
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

      {/* Clear All Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/10">
              <Trash2 className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Vider tous les favoris ?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Cette action est irréversible. Tous vos logements sauvegardés seront définitivement supprimés.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleClearAllFavorites}
                className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02]"
              >
                Supprimer tout
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70 dark:text-indigo-300">
              <Heart className="h-3.5 w-3.5 fill-indigo-600 text-indigo-600 dark:fill-indigo-300 dark:text-indigo-300" />
              Collection personnelle
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-6xl">
              Vos <span className={GRADIENT_TEXT}>favoris</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
              Retrouvez ici tous les logements que vous avez aimés. Comparez-les, partagez-les, et passez à la réservation en un clic.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur-md dark:bg-slate-900/70">
                <span className="text-slate-400">Total</span>
                <span className="text-indigo-600 dark:text-indigo-300">{favorites.length} logements</span>
              </div>
              {compareCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur-md dark:bg-slate-900/70">
                  <span className="text-slate-400">En comparaison</span>
                  <span className="text-indigo-600 dark:text-indigo-300">{compareCount}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-600 shadow-sm backdrop-blur-md transition-all hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200"
            >
              <Share2 className="h-4 w-4" />
            </button>
            {hasFavorites && (
              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-600 shadow-sm backdrop-blur-md transition-all hover:border-rose-200 hover:text-rose-500 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            <div className="flex rounded-xl bg-white/80 p-1 shadow-sm backdrop-blur-md dark:bg-slate-900/80">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-all ${
                  viewMode === "grid"
                    ? GRADIENT_BUTTON
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                <Grid2x2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-all ${
                  viewMode === "list"
                    ? GRADIENT_BUTTON
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-11 rounded-full border border-white/70 bg-white/80 px-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md outline-none dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200"
            >
              <option value="featured">Mis en avant</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="rating">Mieux notés</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        {hasFavorites && (
          <div className="mb-8 overflow-x-auto pb-1">
            <div className="flex items-center gap-2">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id;
                const Icon = cat.icon;
                const countData = categoryCounts.find((c) => c.id === cat.id);
                const count = countData?.count || 0;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-all ${
                      active
                        ? "border-transparent bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                        : "border-white/70 bg-white/80 text-slate-600 shadow-sm backdrop-blur-md hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-400"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-white" : "text-slate-400"}`} />
                    {cat.label}
                    {count > 0 && (
                      <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-white/5"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

       {/* Empty State with Crossed-out Heart Icon - Simple */}
{!hasFavorites ? (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-600/10 backdrop-blur-sm mx-auto animate-pulse">
<IoHeartDislikeOutline className="h-14 w-14 text-slate-400" />    </div>
    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
      Aucun favori pour le moment
    </h2>
    <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
      Explorez les plus belles demeures de Tunisie et sauvegardez celles qui vous inspirent.
      Elles apparaîtront ici, prêtes à être comparées ou réservées.
    </p>
    <Link
      href="/fr/search"
      className={`mt-8 inline-flex items-center gap-2 rounded-full ${GRADIENT_BUTTON} px-7 py-3.5 text-sm font-bold shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02]`}
    >
      <Sparkles className="h-4 w-4" /> Découvrir des logements
    </Link>
  </div>
) : sortedFavorites.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-600/10 backdrop-blur-sm mx-auto animate-pulse">
      <IoHeartDislikeOutline className="h-14 w-14 text-slate-400" />
    </div>
    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
      Aucun résultat dans cette catégorie
    </h3>
    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
      Essayez une autre catégorie pour voir vos favoris.
    </p>
    <button
      type="button"
      onClick={() => setSelectedCategory("all")}
      className={`mt-6 rounded-full ${GRADIENT_BUTTON} px-6 py-3 text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]`}
    >
      Voir tous les favoris
    </button>
  </div>

        ) : viewMode === "grid" ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sortedFavorites.map((listing) => {
              const displayPrice = listing.price || listing.pricePerNight || 0;
              const imageUrl = imgErrors[listing.id] ? "/images/placeholder.jpg" : (listing.image || "/images/placeholder.jpg");
              const isInCompare = selectedForCompare.includes(listing.id);

              return (
                <div
                  key={listing.id}
                  className="group overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-md transition-all hover:scale-[1.01] hover:shadow-[0_26px_70px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-slate-900/80"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={imageUrl}
                      alt={listing.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
                      onError={() => handleImageError(listing.id)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      {listing.isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                          <ShieldCheck className="h-3 w-3" /> Vérifié
                        </span>
                      )}
                      {listing.collection && (
                        <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                          {listing.collection}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFavorite(listing.id, listing.title)}
                      className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-lg backdrop-blur-md transition-all hover:scale-110 dark:bg-slate-900/90"
                    >
                      <Heart className="h-5 w-5 fill-rose-500" />
                    </button>

                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-extrabold tracking-tight text-white">
                          {listing.title}
                        </h3>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-white/80">
                          <MapPin className="h-3.5 w-3.5" /> {listing.location}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/92 px-4 py-3 text-right shadow-lg backdrop-blur-md dark:bg-slate-900/92">
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                          {displayPrice.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          TND / nuit
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {listing.rating || 4.5}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <BedDouble className="h-3.5 w-3.5" /> {listing.bedrooms} ch.
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {listing.maxGuests} pers.
                        </span>
                      </div>
                      <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        Score {listing.trustScore || 95}/100
                      </div>
                    </div>

                    {listing.amenities && listing.amenities.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {listing.amenities.slice(0, 4).map((a: string) => (
                          <span
                            key={a}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      {canCompare && (
                        <button
                          type="button"
                          onClick={() => handleToggleCompare(listing.id, listing.title)}
                          className={`rounded-full px-3.5 py-1.5 text-[10px] font-bold transition-all ${
                            isInCompare
                              ? GRADIENT_BUTTON
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                          }`}
                        >
                          {isInCompare ? "✓ Comparé" : "+ Comparer"}
                        </button>
                      )}
                      <Link
                        href={`/fr/listings/${listing.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 transition-all hover:gap-2 dark:text-indigo-300"
                      >
                        Voir la fiche <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedFavorites.map((listing) => {
              const displayPrice = listing.price || listing.pricePerNight || 0;
              const imageUrl = imgErrors[listing.id] ? "/images/placeholder.jpg" : (listing.image || "/images/placeholder.jpg");
              const isInCompare = selectedForCompare.includes(listing.id);

              return (
                <div
                  key={listing.id}
                  className="overflow-hidden rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-md transition-all hover:scale-[1.005] hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-900/80"
                >
                  <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                    <div className="relative h-48 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                      <img
                        src={imageUrl}
                        alt={listing.title}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-102"
                        onError={() => handleImageError(listing.id)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                      <button
                        type="button"
                        onClick={() => handleRemoveFavorite(listing.id, listing.title)}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-lg backdrop-blur-md dark:bg-slate-900/90"
                      >
                        <Heart className="h-4 w-4 fill-rose-500" />
                      </button>
                      {listing.collection && (
                        <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[9px] font-bold text-slate-800 shadow-md backdrop-blur-md dark:bg-slate-900/90 dark:text-slate-100">
                          {listing.collection}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {listing.isVerified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white">
                              <ShieldCheck className="h-3 w-3" /> Vérifié
                            </span>
                          )}
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            Score {listing.trustScore || 95}/100
                          </span>
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                          {listing.title}
                        </h3>
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="h-3.5 w-3.5" /> {listing.location}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {listing.rating || 4.5} ({listing.reviewCount || 0})
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <BedDouble className="h-3.5 w-3.5" /> {listing.bedrooms} ch.
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Bath className="h-3.5 w-3.5" /> {listing.bathrooms} sdb
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> {listing.maxGuests} pers.
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                            {displayPrice.toLocaleString()} TND
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            / nuit
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {canCompare && (
                            <button
                              type="button"
                              onClick={() => handleToggleCompare(listing.id, listing.title)}
                              className={`rounded-full px-3.5 py-1.5 text-[10px] font-bold transition-all ${
                                isInCompare
                                  ? GRADIENT_BUTTON
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                              }`}
                            >
                              {isInCompare ? "✓ Comparé" : "+ Comparer"}
                            </button>
                          )}
                          <Link
                            href={`/fr/listings/${listing.id}`}
                            className={`inline-flex items-center gap-2 rounded-full ${GRADIENT_BUTTON} px-5 py-2 text-xs font-bold shadow-md shadow-indigo-500/15 transition-all hover:scale-[1.02]`}
                          >
                            Réserver <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Compare Button */}
        {compareCount > 1 && (
          <div className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <Link href="/fr/favorites/compare">
              <button
                className={`inline-flex items-center gap-2 rounded-full ${GRADIENT_BUTTON} px-7 py-4 text-sm font-bold shadow-2xl shadow-indigo-500/30 transition-all hover:scale-[1.03]`}
              >
                <Crown className="h-4 w-4" />
                Comparer {compareCount} logements
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}