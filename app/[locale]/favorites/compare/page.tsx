"use client";

import Link from "next/link";
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
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertBanner from "@/components/ui/Alert";
import {
  useCompare,
  formatAmenityName,
  computeScore,
} from "./hooks/useCompare";

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-sky-500 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function CheckCell({ has }: { has: boolean }) {
  return has ? (
    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center flex-shrink-0">
      <IoCheckmarkCircle className="text-emerald-600 dark:text-emerald-400 text-sm" />
    </div>
  ) : (
    <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
      <IoCloseOutline className="text-red-500 text-sm" />
    </div>
  );
}

function ListingCard({
  listing,
  isBest,
  score,
  imageSrc,
  onRemove,
  onImageError,
  isRemoving,
  allAmenities,
  characteristicsHeight,
  formatAmenityName: formatName,
}: {
  listing: any;
  isBest: boolean;
  score: number;
  imageSrc: string;
  onRemove: () => void;
  onImageError: () => void;
  isRemoving: boolean;
  allAmenities: string[];
  characteristicsHeight: number;
  formatAmenityName: (amenity: string) => string;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
        isRemoving ? "opacity-0 scale-95" : "opacity-100 scale-100"
      } ${
        isBest
          ? "ring-2 ring-sky-500 shadow-xl shadow-sky-100 dark:shadow-sky-900/20"
          : "border border-gray-100 dark:border-slate-700 shadow-sm"
      } bg-white dark:bg-slate-900`}
    >
      {/* Card hero */}
      <div className="relative flex-shrink-0">
        <img
          src={imageSrc}
          alt={listing.title}
          className="w-full h-48 object-cover"
          onError={onImageError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {isBest && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-gradient-to-r from-sky-500 to-purple-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
            <IoSparklesOutline className="text-xs" />
            Meilleur choix
          </div>
        )}

        {listing.isVerified && !isBest && (
          <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-sky-600 dark:text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <IoCheckmarkCircle className="text-xs" />
            Vérifié
          </div>
        )}

        <button
          onClick={onRemove}
          className="absolute top-3 right-3 w-7 h-7 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
          title="Retirer"
        >
          <IoCloseOutline className="text-base" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <Link href={`/fr/listings/${listing.id}`}>
            <h3 className="text-white font-bold text-sm leading-snug hover:underline line-clamp-2">
              {listing.title}
            </h3>
          </Link>
          <p className="text-white/70 text-[11px] mt-0.5">{listing.type}</p>
        </div>
      </div>

      {/* Data rows */}
      <div className="flex flex-col divide-y divide-gray-100 dark:divide-slate-800 px-3 flex-1">
        <div className="flex items-center h-12 gap-1">
          <span className="text-xl font-extrabold bg-gradient-to-r from-sky-500 to-purple-600 bg-clip-text text-transparent">
            {listing.pricePerNight.toLocaleString("fr-FR")}
          </span>
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
            TND/nuit
          </span>
        </div>

        <div className="flex items-center h-12 gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
              listing.rating >= 4.8
                ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                : listing.rating >= 4.5
                  ? "bg-sky-100 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400"
                  : "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
            }`}
          >
            <IoStar className="text-[10px]" />
            {listing.rating}
          </span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            ({listing.reviewCount} avis)
          </span>
        </div>

        <div className="flex flex-col justify-center h-12 gap-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              Score
            </span>
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
              {score}/100
            </span>
          </div>
          <ScoreBar value={score} />
        </div>

        {/* Caractéristiques */}
        <div
          className="flex flex-col"
          style={{ minHeight: `${characteristicsHeight}px` }}
        >
          {/* Ligne des caractéristiques de base */}
          <div className="flex flex-wrap items-center h-12 gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <IoBedOutline className="text-sky-500 text-sm" />
              {listing.bedrooms} chambre{listing.bedrooms > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <IoPeopleOutline className="text-sky-500 text-sm" />
              {listing.maxGuests} personne{listing.maxGuests > 1 ? "s" : ""}
            </span>
            {listing.surfaceArea > 0 && (
              <span className="flex items-center gap-1">
                <MdOutlineSquareFoot className="text-sky-500 text-sm" />
                {listing.surfaceArea} m²
              </span>
            )}
          </div>

          {/* Équipements */}
          {allAmenities.map((amenity) => {
            const has = listing.amenities.includes(amenity);
            return (
              <div
                key={amenity}
                className="flex items-center justify-between h-12 gap-2"
              >
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {formatName(amenity)}
                </span>
                <CheckCell has={has} />
              </div>
            );
          })}
        </div>

        <div className="flex items-center h-12 gap-1.5">
          <IoLocationOutline className="text-purple-500 text-sm flex-shrink-0" />
          <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {listing.location}
          </span>
        </div>

        <div className="flex items-center h-12">
          <Link href={`/fr/listings/${listing.id}`} className="w-full">
            <button
              className={`w-full h-8 rounded-full text-xs font-bold transition-all active:scale-95 ${
                isBest
                  ? "bg-gradient-to-r from-sky-500 to-purple-600 text-white shadow-md hover:opacity-90"
                  : "border border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30"
              }`}
            >
              Voir détails
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ComparePage() {
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

  if (!mounted || loading) {
    return (
      <LoadingSpinner
        fullScreen
        variant="spinner"
        size="lg"
        color="primary"
        text="Chargement de la comparaison..."
        speed="normal"
      />
    );
  }

  if (listings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-800 dark:to-purple-900 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center mx-auto mb-6">
            <IoBarChartOutline className="text-4xl text-sky-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Aucune propriété à comparer
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            Ajoutez des logements depuis vos favoris pour les analyser côte à
            côte.
          </p>
          <Link
            href="/fr/favorites"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-sky-500 to-purple-600 hover:opacity-90 transition shadow-lg"
          >
            Voir mes favoris
            <IoChevronForwardOutline />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-800 dark:to-purple-900">
      {alert && (
        <div className="fixed top-24 right-8 z-[60] animate-in slide-in-from-top-2 fade-in duration-300">
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      <main className="pt-24 pb-32 px-4 md:px-6 max-w-7xl mx-auto">
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-8">
          <Link
            href="/fr"
            className="hover:text-sky-600 dark:hover:text-sky-400 transition"
          >
            Accueil
          </Link>
          <IoChevronForwardOutline className="text-[10px]" />
          <Link
            href="/fr/favorites"
            className="hover:text-sky-600 dark:hover:text-sky-400 transition"
          >
            Favoris
          </Link>
          <IoChevronForwardOutline className="text-[10px]" />
          <span className="text-sky-600 dark:text-sky-400 font-semibold uppercase tracking-wider">
            Comparer
          </span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
              Comparer vos{" "}
              <span className="bg-gradient-to-r from-sky-500 to-purple-600 bg-clip-text text-transparent">
                sélections
              </span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {listings.length} logement{listings.length > 1 ? "s" : ""} ·
              Analyse côte à côte
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="rating">Trier par note</option>
              <option value="price">Trier par prix croissant</option>
              <option value="beds">Trier par chambres</option>
              <option value="guests">Trier par capacité</option>
            </select>

            <div className="relative">
              <button
                onClick={() => setShowShareMenu((p) => !p)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-400 transition"
              >
                <IoShareOutline className="text-sm" />
                Partager
              </button>
              {showShareMenu && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden">
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-2 w-full px-4 py-3 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                  >
                    <IoCopyOutline className="text-sky-500" />
                    Copier le lien
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition"
            >
              <IoTrashOutline className="text-sm" />
              Tout effacer
            </button>
          </div>
        </div>

        {/* Summary metrics cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Logements", value: listings.length, unit: "" },
            { label: "Note moyenne", value: avgRating, unit: "/ 5" },
            {
              label: "Prix moyen",
              value: avgPrice.toLocaleString("fr-FR"),
              unit: "TND/nuit",
            },
            { label: "Chambres moy.", value: avgBeds, unit: "ch." },
          ].map(({ label, value, unit }) => (
            <div
              key={label}
              className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-3 shadow-sm"
            >
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                {label}
              </p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                {value}{" "}
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                  {unit}
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* Main comparison table */}
        <div className="overflow-x-auto rounded-2xl">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `180px repeat(${listings.length}, minmax(240px, 1fr)) 120px`,
              minWidth: `${180 + listings.length * 240 + 120}px`,
            }}
          >
            {/* Labels column */}
            <div className="flex flex-col">
              <div className="h-[190px]" />

              <div className="flex items-center h-12 px-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-t border-gray-100 dark:border-slate-800">
                Tarif
              </div>

              <div className="flex items-center h-12 px-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-t border-gray-100 dark:border-slate-800">
                Note
              </div>

              <div className="flex items-center h-12 px-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-t border-gray-100 dark:border-slate-800">
                Score
              </div>

              <div
                className="flex items-center px-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-t border-gray-100 dark:border-slate-800"
                style={{ height: `${characteristicsHeight}px` }}
              >
                Caractéristiques
              </div>

              <div className="flex items-center h-12 px-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-t border-gray-100 dark:border-slate-800">
                Emplacement
              </div>

              <div className="flex items-center h-12 px-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-t border-gray-100 dark:border-slate-800">
                Action
              </div>
            </div>

            {/* Listing columns */}
            {listings.map((listing) => {
              const isBest = bestListing?.id === listing.id;
              const score = computeScore(listing);
              const imgSrc = imageErrors[listing.id]
                ? "https://placehold.co/600x400/e2e8f0/6366f1?text=NestHub"
                : listing.image;

              return (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isBest={isBest}
                  score={score}
                  imageSrc={imgSrc}
                  onRemove={() => removeFromCompare(listing.id, listing.title)}
                  onImageError={() => handleImageError(listing.id)}
                  isRemoving={removingId === listing.id}
                  allAmenities={allAmenities}
                  characteristicsHeight={characteristicsHeight}
                  formatAmenityName={formatAmenityName}
                />
              );
            })}

            {/* Add more column */}
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30 min-h-[500px] p-4">
              <Link
                href="/fr/favorites"
                className="w-full flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                  <IoAddOutline className="text-2xl text-sky-500" />
                </div>
                <span className="text-xs font-bold text-sky-500 text-center">
                  Ajouter
                </span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 text-center leading-relaxed">
                  Depuis favoris
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom insight section */}
        {bestListing && (
          <div className="mt-10 grid md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center flex-shrink-0">
                  <IoDiamondOutline className="text-xl text-sky-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    Choix de l'expert
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Basé sur note, prix et équipements
                  </p>
                </div>
              </div>

              <div className="bg-sky-50 dark:bg-sky-950/20 rounded-xl p-4 mb-5">
                <p className="text-sm font-bold text-sky-700 dark:text-sky-300 mb-1">
                  {bestListing.title}
                </p>
                <p className="text-xs text-sky-500 dark:text-sky-400 flex items-center gap-1">
                  <IoLocationOutline className="text-sm" />
                  {bestListing.location}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <IoStar className="text-amber-400" />
                    {bestListing.rating}/5
                  </span>
                  <span>·</span>
                  <span>
                    {bestListing.pricePerNight.toLocaleString("fr-FR")} TND/nuit
                  </span>
                  <span>·</span>
                  <span>{bestListing.reviewCount} avis</span>
                </div>
              </div>

              <Link href={`/fr/listings/${bestListing.id}`}>
                <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-purple-600 text-white text-xs font-bold hover:opacity-90 transition shadow-md">
                  Réserver
                </button>
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-start gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <IoStar key={i} className="text-amber-400 text-sm" />
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed mb-4">
                "Une expérience de comparaison transparente et fiable. J'ai
                trouvé ma villa idéale en moins de 5 minutes grâce à NestHub."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  SM
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    Sonia M.
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    Voyageuse vérifiée · 12 séjours
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
