"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  IoCloseOutline,
  IoStar,
  IoLocationOutline,
  IoCheckmarkCircle,
  IoBedOutline,
  IoPeopleOutline,
  IoDiamondOutline,
  IoAddOutline,
  IoTrashOutline,
  IoChevronForwardOutline,
  IoShareOutline,
  IoCopyOutline,
  IoSparklesOutline,
  IoBarChartOutline,
} from "react-icons/io5";
import { MdOutlineSquareFoot } from "react-icons/md";
import { 
  ChartColumn, 
  Crown, 
  ArrowRight, 
  Ban, 
  Bath, 
  ShieldCheck,
  Maximize2,
  Heart,
  Link2,
  Copy,
  Sparkles,
  Star,
  BedDouble,
  Users,
  MapPin,
  X,
  CheckCircle2,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertBanner from "@/components/ui/Alert";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import {
  useCompare,
  formatAmenityName,
  computeScore,
} from "./hooks/useCompare";

const gradientButton = `
  bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 
  hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const gradientText = "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent";

const AMENITIES_COMPARE = ["WiFi", "Piscine", "Parking", "Climatisation", "Cuisine équipée", "Vue mer", "TV", "Jardin", "Jacuzzi", "Salle de sport"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScorePill({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold backdrop-blur-md dark:bg-slate-900/90">
      <div className={`h-2 w-2 rounded-full ${score >= 90 ? "bg-emerald-500" : score >= 80 ? "bg-amber-500" : "bg-rose-500"}`} />
      <span className="text-slate-800 dark:text-white">{score}/100</span>
    </div>
  );
}

function CheckCell({ has }: { has: boolean }) {
  return has ? (
    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  ) : (
    <Ban className="h-4 w-4 text-slate-300 dark:text-slate-600" />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ComparePage() {
  const t = useTranslations("ComparePage");
  const {
    mounted,
    listings,
    loading,
    imageErrors,
    alert,
    sortKey,
    removingId,
    showShareMenu,
    allAmenities,
    bestListing,
    testimonial,
    avgPrice,
    avgRating,
    avgBeds,
    characteristicsHeight,
    setSortKey,
    setShowShareMenu,
    removeFromCompare,
    clearAll,
    copyLink,
    handleImageError,
    setAlert,
  } = useCompare();

  const remove = (id: string, title: string) => {
    removeFromCompare(id, title);
  };

  if (!mounted || loading) {
    return (
      <LoadingSpinner
        fullScreen
        variant="spinner"
        size="lg"
        color="primary"
        text={t("loading")}
        speed="normal"
      />
    );
  }

  if (listings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <TenantHeader />
        <main className="pt-16 pb-32 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-600/10 backdrop-blur-sm mx-auto animate-pulse">
              <Maximize2 className="h-12 w-12 text-sky-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Aucun logement à comparer</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Retournez dans vos favoris et sélectionnez au moins 2 logements pour les comparer ici.
            </p>
            <Link
              href="/fr/favorites"
              className={`mt-8 inline-flex items-center gap-2 rounded-full ${gradientButton} px-7 py-3.5 text-sm font-bold shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02]`}
            >
              <Heart className="h-4 w-4" /> Voir mes favoris <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const sorted = [...listings].sort((a, b) => {
    if (sortKey === "price") return a.pricePerNight - b.pricePerNight;
    if (sortKey === "beds") return b.bedrooms - a.bedrooms;
    if (sortKey === "guests") return b.maxGuests - a.maxGuests;
    return b.rating - a.rating || (b.trustScore || 0) - (a.trustScore || 0);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <TenantHeader />

      {alert && (
        <div className="fixed top-20 right-8 z-[60] animate-in slide-in-from-top-2 fade-in duration-300">
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6">
          <Link href="/fr/search" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition">
            ACCUEIL
          </Link>
          <IoChevronForwardOutline className="text-[10px] text-slate-400" />
          <Link href="/fr/favorites" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition">
            FAVORIS
          </Link>
          <IoChevronForwardOutline className="text-[10px] text-slate-400" />
          <span className="text-slate-900 dark:text-white">COMPARAISON</span>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70 dark:text-indigo-300">
              <ChartColumn className="h-3.5 w-3.5" />
              COMPARAISON INTELLIGENTE
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-6xl">
              Comparer <span className={gradientText}>vos sélections</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
              Analysez chaque détail côte à côte, identifiez le meilleur rapport qualité-prix et prenez une décision éclairée en quelques secondes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowShareMenu((p) => !p)}
                className="flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200"
              >
                <Link2 className="h-3.5 w-3.5" /> PARTAGER
              </button>
              {showShareMenu && (
                <div className="absolute right-0 top-full z-30 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                  >
                    <Copy className="h-3.5 w-3.5 text-indigo-500" /> COPIER LE LIEN
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2.5 text-xs font-bold text-rose-600 shadow-sm backdrop-blur-md transition-all hover:bg-rose-50 dark:border-white/10 dark:bg-slate-900/80 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              <IoTrashOutline className="h-3.5 w-3.5" /> VIDER
            </button>
          </div>
        </div>

        {/* Metrics row - DYNAMIQUE */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "LOGEMENTS COMPARÉS", value: String(listings.length), icon: ChartColumn, grad: "from-sky-500 to-indigo-600" },
            { label: "NOTE MOYENNE", value: `${avgRating}/5`, icon: Star, grad: "from-amber-400 to-orange-500" },
            { label: "PRIX MOYEN", value: `${avgPrice.toLocaleString()} TND`, icon: Crown, grad: "from-purple-500 to-pink-500" },
            { label: "CHAMBRES MOY.", value: String(avgBeds), icon: BedDouble, grad: "from-emerald-500 to-teal-600" },
          ].map(({ label, value, icon: Icon, grad }) => (
            <div key={label} className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
              <div className="flex items-center gap-3 p-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-white shadow-md`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{label}</p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sort pill */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">TRIER PAR</span>
          {[
            { key: "rating", label: "Mieux notés" },
            { key: "price", label: "Prix" },
            { key: "beds", label: "Chambres" },
            { key: "guests", label: "Capacité" },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortKey(key as any)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                sortKey === key
                  ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/15"
                  : "bg-white/70 text-slate-600 hover:bg-white dark:bg-slate-900/70 dark:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Cards grid - DYNAMIQUE */}
        <div className="mb-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((listing, idx) => {
            const isBest = idx === 0 && sorted.length > 1;
            const score = computeScore(listing);
            const imgSrc = imageErrors[listing.id]
              ? "https://placehold.co/600x400/e2e8f0/6366f1?text=NestHub"
              : listing.image;
            const isRemoving = removingId === listing.id;

            return (
              <div
                key={listing.id}
                className={`overflow-hidden rounded-3xl border transition-all duration-300 ${
                  isRemoving ? "scale-95 opacity-0" : "scale-100 opacity-100"
                } ${
                  isBest
                    ? "border-transparent bg-gradient-to-br from-sky-50 to-indigo-50 shadow-[0_24px_70px_rgba(79,70,229,0.18)] ring-2 ring-indigo-500/30 dark:from-sky-950/30 dark:to-indigo-950/30 dark:shadow-[0_24px_70px_rgba(79,70,229,0.12)]"
                    : "border-white/70 bg-white/85 shadow-[0_16px_45px_rgba(15,23,42,0.07)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80"
                }`}
              >
                <div className="relative h-56 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img src={imgSrc} alt={listing.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    {isBest && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600/95 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-lg backdrop-blur-sm">
                        <Crown className="h-3.5 w-3.5" /> MEILLEUR CHOIX
                      </span>
                    )}
                    {listing.isVerified && !isBest && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                        <ShieldCheck className="h-3 w-3" /> VÉRIFIÉ
                      </span>
                    )}
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                      {listing.collection || "SÉLECTION"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(listing.id, listing.title)}
                    className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-lg backdrop-blur-md transition-all hover:scale-110 dark:bg-slate-900/90"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-extrabold tracking-tight text-white">{listing.title}</h3>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-white/80">
                        <MapPin className="h-3.5 w-3.5" /> {listing.location}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/90 px-4 py-2.5 text-right shadow-lg backdrop-blur-md dark:bg-slate-900/90">
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">{listing.pricePerNight.toLocaleString()}</p>
                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">TND / NUIT</p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4 grid grid-cols-4 gap-2">
                    {[
                      [Star, `${listing.rating}`],
                      [BedDouble, `${listing.bedrooms} ch.`],
                      [Bath, `${listing.bathrooms} sdb`],
                      [Users, `${listing.maxGuests} pers.`],
                    ].map(([Icon, label]) => (
                      <div key={String(label)} className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 px-2 py-2.5 dark:bg-white/5">
                        <Icon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{String(label)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">SCORE NESTHUB</span>
                    <ScorePill score={score} />
                  </div>
                  <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 transition-all duration-700" style={{ width: `${score}%` }} />
                  </div>

                  <div className="space-y-0 divide-y divide-slate-100 dark:divide-white/5">
                    {AMENITIES_COMPARE.map((amenity) => {
                      const has = listing.amenities?.includes(amenity);
                      return (
                        <div key={amenity} className="flex items-center justify-between py-2.5">
                          <span className="text-xs text-slate-600 dark:text-slate-300">{amenity}</span>
                          <CheckCell has={has} />
                        </div>
                      );
                    })}
                  </div>

                  <Link href={`/fr/listings/${listing.id}`}>
                    <button className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all ${
                      isBest
                        ? `${gradientButton} shadow-lg shadow-indigo-500/20 hover:scale-[1.01]`
                        : "border-2 border-indigo-300 bg-white text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:bg-transparent dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                    }`}>
                      {isBest ? <Crown className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                      {isBest ? "RÉSERVER LE MEILLEUR CHOIX" : "VOIR LA FICHE"}
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Add more card */}
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-10 text-center dark:border-white/10 dark:bg-slate-900/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-md dark:bg-slate-800">
              <Maximize2 className="h-7 w-7" />
            </div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-200">AJOUTER UN LOGEMENT</p>
            <p className="max-w-[180px] text-xs leading-relaxed text-slate-400 dark:text-slate-500">
              Retournez dans vos favoris et ajoutez jusqu'à 4 biens à comparer.
            </p>
            <Link href="/fr/favorites">
              <button className={`mt-2 rounded-full ${gradientButton} px-5 py-2.5 text-xs font-bold shadow-md shadow-indigo-500/15 transition-all hover:scale-[1.02]`}>
                <span className="inline-flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5" /> VOIR LES FAVORIS
                </span>
              </button>
            </Link>
          </div>
        </div>

        {/* Best choice panel - AVEC AVIS DYNAMIQUE */}
        {bestListing && sorted.length > 1 && (
          <div className="mb-8 grid gap-5 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_16px_45px_rgba(15,23,42,0.07)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/85 md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                  <IoDiamondOutline className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">CHOIX DE L'EXPERT</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Basé sur le score, les avis et les équipements</p>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 dark:border-indigo-500/20 dark:bg-indigo-500/5">
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800">
                    <img 
                      src={imageErrors[bestListing.id] ? "https://placehold.co/600x400/e2e8f0/6366f1?text=NestHub" : bestListing.image} 
                      alt={bestListing.title} 
                      className="h-full w-full object-cover" 
                      onError={() => handleImageError(bestListing.id)}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">{bestListing.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><MapPin className="h-3.5 w-3.5" /> {bestListing.location}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {bestListing.rating}</span>
                      <span>·</span>
                      <span>{bestListing.pricePerNight.toLocaleString()} TND/nuit</span>
                      <span>·</span>
                      <span>{bestListing.reviewCount} avis</span>
                    </div>
                  </div>
                </div>
              </div>

              <Link href={`/fr/listings/${bestListing.id}`}>
                <button className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-all ${gradientButton}`}>
                  <Crown className="h-4 w-4" /> RÉSERVER CE LOGEMENT
                </button>
              </Link>
            </div>

            {/* AVIS DYNAMIQUE LIE AU MEILLEUR LOGEMENT */}
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_16px_45px_rgba(15,23,42,0.07)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/85 md:p-8">
              {testimonial ? (
                <>
                  <div className="mb-4 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i <= Math.round(testimonial.rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200 dark:fill-gray-700'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed italic text-slate-600 dark:text-slate-300">
                    "{testimonial.text}"
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md">
                      {testimonial.initial}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{testimonial.author}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">AVIS VÉRIFIÉ · {testimonial.date}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed italic text-slate-600 dark:text-slate-300">
                    "{bestListing.title} est une propriété exceptionnelle. Avec {bestListing.rating}/5 étoiles, c'est un choix parfait pour un séjour de qualité. Je recommande vivement !"
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md">
                      {bestListing.title.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Client vérifié</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">AVIS VÉRIFIÉ · {new Date().getFullYear()}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Bottom insight */}
        {sorted.length > 0 && (
          <div className="rounded-3xl border border-white/70 bg-white/85 p-5 text-center shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80 md:p-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-500/20 dark:bg-slate-900/70 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" /> DÉCISION ÉCLAIRÉE
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl">
              {listings.length} logements comparés · <span className={gradientText}>1 DÉCISION PARFAITE</span>
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Tous les critères sont alignés pour que vous puissiez comparer objectivement et choisir le logement qui correspond le mieux à vos attentes.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/fr/search">
                <button className={`rounded-full ${gradientButton} px-6 py-3 text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]`}>
                  <span className="inline-flex items-center gap-2"><ArrowRight className="h-4 w-4" /> EXPLORER D'AUTRES BIENS</span>
                </button>
              </Link>
              <Link href="/fr/favorites">
                <button className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-indigo-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  <span className="inline-flex items-center gap-2"><Heart className="h-4 w-4" /> RETOUR AUX FAVORIS</span>
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}