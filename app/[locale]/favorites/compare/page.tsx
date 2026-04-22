// app/[locale]/favorites/compare/page.tsx
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
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertBanner from "@/components/ui/Alert";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import {
  useCompare,
  formatAmenityName,
  computeScore,
} from "./hooks/useCompare";

const gradientButton = `
  bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 
  hover:from-sky-500 hover:via-indigo-500 hover:to-purple-600
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const gradientText = "bg-gradient-to-r from-indigo-600 via-sky-500 to-purple-600 bg-clip-text text-transparent";

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-indigo-500 transition-all duration-700"
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
  t,
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
  t: any;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl overflow-hidden transition-all duration-300 ${
        isRemoving ? "opacity-0 scale-95" : "opacity-100 scale-100"
      } ${
        isBest
          ? "ring-2 ring-indigo-500 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20"
          : "border border-slate-200 dark:border-slate-700 shadow-sm"
      } bg-white dark:bg-slate-900`}
    >
      {/* Card hero */}
      <div className="relative flex-shrink-0">
        <img
          src={imageSrc}
          alt={listing.title}
          className="w-full h-40 object-cover"
          onError={onImageError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {isBest && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
            <IoSparklesOutline className="text-xs" />
            {t("bestChoice")}
          </div>
        )}

        {listing.isVerified && !isBest && (
          <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <IoCheckmarkCircle className="text-xs" />
            {t("verified")}
          </div>
        )}

        <button
          onClick={onRemove}
          className="absolute top-3 right-3 w-7 h-7 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
          title={t("remove")}
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
      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800 px-3 flex-1">
        <div className="flex items-center h-12 gap-1">
          <span className={`text-xl font-extrabold ${gradientText}`}>
            {listing.pricePerNight.toLocaleString("fr-FR")}
          </span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
            TND/nuit
          </span>
        </div>

        <div className="flex items-center h-12 gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
              listing.rating >= 4.8
                ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                : listing.rating >= 4.5
                  ? "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400"
                  : "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
            }`}
          >
            <IoStar className="text-[10px]" />
            {listing.rating}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            ({listing.reviewCount} {t("reviews")})
          </span>
        </div>

        <div className="flex flex-col justify-center h-12 gap-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {t("score")}
            </span>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
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
          <div className="flex flex-wrap items-center h-12 gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <IoBedOutline className="text-indigo-500 text-sm" />
              {listing.bedrooms} {t("beds", { count: listing.bedrooms })}
            </span>
            <span className="flex items-center gap-1">
              <IoPeopleOutline className="text-indigo-500 text-sm" />
              {listing.maxGuests} {t("guests", { count: listing.maxGuests })}
            </span>
            {listing.surfaceArea > 0 && (
              <span className="flex items-center gap-1">
                <MdOutlineSquareFoot className="text-indigo-500 text-sm" />
                {listing.surfaceArea} m²
              </span>
            )}
          </div>

          {allAmenities.map((amenity) => {
            const has = listing.amenities.includes(amenity);
            return (
              <div
                key={amenity}
                className="flex items-center justify-between h-12 gap-2"
              >
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {formatName(amenity)}
                </span>
                <CheckCell has={has} />
              </div>
            );
          })}
        </div>

        <div className="flex items-center h-12 gap-1.5">
          <IoLocationOutline className="text-purple-500 text-sm flex-shrink-0" />
          <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {listing.location}
          </span>
        </div>

        <div className="flex items-center h-12">
          <Link href={`/fr/listings/${listing.id}`} className="w-full">
            <button
              className={`w-full h-8 rounded-full text-xs font-bold transition-all active:scale-95 ${
                isBest
                  ? gradientButton
                  : "border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
              }`}
            >
              {t("viewDetails")}
            </button>
          </Link>
        </div>
      </div>
    </div>
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
        text={t("loading")}
        speed="normal"
      />
    );
  }

  if (listings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-800 dark:to-purple-900">
        <TenantHeader />
        <main className="pt-24 pb-32 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center mx-auto mb-6">
              <IoBarChartOutline className="text-4xl text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              {t("empty.title")}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              {t("empty.message")}
            </p>
            <Link
              href="/fr/favorites"
              className={`inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition shadow-lg ${gradientButton}`}
            >
              {t("empty.button")}
              <IoChevronForwardOutline />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-800 dark:to-purple-900">
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

      <main className="pt-6 pb-16 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6">
          <Link href="/fr" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            {t("breadcrumb.home")}
          </Link>
          <IoChevronForwardOutline className="text-[10px]" />
          <Link href="/fr/favorites" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            {t("breadcrumb.favorites")}
          </Link>
          <IoChevronForwardOutline className="text-[10px]" />
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">
            {t("breadcrumb.compare")}
          </span>
        </nav>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t("title")}{" "}
              <span className={gradientText}>
                {t("highlight")}
              </span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {listings.length} {t("count", { count: listings.length })} · {t("subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="rating">{t("sort.rating")}</option>
              <option value="price">{t("sort.price")}</option>
              <option value="beds">{t("sort.beds")}</option>
              <option value="guests">{t("sort.guests")}</option>
            </select>

            <div className="relative">
              <button
                onClick={() => setShowShareMenu((p) => !p)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <IoShareOutline className="text-sm" />
                {t("share")}
              </button>
              {showShareMenu && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden">
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-2 w-full px-4 py-3 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    <IoCopyOutline className="text-indigo-500" />
                    {t("copyLink")}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition"
            >
              <IoTrashOutline className="text-sm" />
              {t("clearAll")}
            </button>
          </div>
        </div>

        {/* Summary metrics cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: t("metrics.listings"), value: listings.length, unit: "" },
            { label: t("metrics.avgRating"), value: avgRating, unit: "/5" },
            {
              label: t("metrics.avgPrice"),
              value: avgPrice.toLocaleString("fr-FR"),
              unit: "TND/nuit",
            },
            { label: t("metrics.avgBeds"), value: avgBeds, unit: t("metrics.bedsUnit") },
          ].map(({ label, value, unit }) => (
            <div
              key={label}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm"
            >
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                {label}
              </p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                {value}{" "}
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {unit}
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* Main comparison table */}
        <div className="overflow-x-auto rounded-xl">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `180px repeat(${listings.length}, minmax(240px, 1fr)) 120px`,
              minWidth: `${180 + listings.length * 240 + 120}px`,
            }}
          >
            {/* Labels column */}
            <div className="flex flex-col">
              <div className="h-[168px]" />

              <div className="flex items-center h-12 px-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-t border-slate-100 dark:border-slate-800">
                {t("labels.price")}
              </div>

              <div className="flex items-center h-12 px-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-t border-slate-100 dark:border-slate-800">
                {t("labels.rating")}
              </div>

              <div className="flex items-center h-12 px-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-t border-slate-100 dark:border-slate-800">
                {t("labels.score")}
              </div>

              <div
                className="flex items-center px-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-t border-slate-100 dark:border-slate-800"
                style={{ height: `${characteristicsHeight}px` }}
              >
                {t("labels.features")}
              </div>

              <div className="flex items-center h-12 px-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-t border-slate-100 dark:border-slate-800">
                {t("labels.location")}
              </div>

              <div className="flex items-center h-12 px-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-t border-slate-100 dark:border-slate-800">
                {t("labels.action")}
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
                  t={t}
                />
              );
            })}

            {/* Add more column */}
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 min-h-[500px] p-4">
              <Link
                href="/fr/favorites"
                className="w-full flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                  <IoAddOutline className="text-2xl text-indigo-500" />
                </div>
                <span className="text-xs font-bold text-indigo-500 text-center">
                  {t("add")}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                  {t("addHint")}
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom insight section */}
        {bestListing && (
          <div className="mt-8 grid md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0">
                  <IoDiamondOutline className="text-xl text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {t("expertChoice.title")}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {t("expertChoice.subtitle")}
                  </p>
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-xl p-4 mb-4">
                <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                  {bestListing.title}
                </p>
                <p className="text-xs text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                  <IoLocationOutline className="text-sm" />
                  {bestListing.location}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <IoStar className="text-amber-400" />
                    {bestListing.rating}/5
                  </span>
                  <span>·</span>
                  <span>
                    {bestListing.pricePerNight.toLocaleString("fr-FR")} TND/nuit
                  </span>
                  <span>·</span>
                  <span>{bestListing.reviewCount} {t("reviews")}</span>
                </div>
              </div>

              <Link href={`/fr/listings/${bestListing.id}`}>
                <button className={`w-full py-2.5 rounded-xl text-xs font-bold transition shadow-md ${gradientButton}`}>
                  {t("expertChoice.book")}
                </button>
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex items-start gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <IoStar key={i} className="text-amber-400 text-sm" />
                ))}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed mb-4">
                {t("testimonial.text")}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  SM
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {t("testimonial.author")}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {t("testimonial.role")}
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