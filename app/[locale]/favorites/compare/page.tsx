"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  IoChevronForwardOutline,
  IoTrashOutline,
  IoSendOutline,
} from "react-icons/io5";
import {
  MdOutlineSquareFoot,
  MdOutlineBalcony,
  MdOutlineKitchen,
} from "react-icons/md";
import {
  ChartColumn,
  Crown,
  ArrowRight,
  Ban,
  Bath,
  ShieldCheck,
  Maximize2,
  Heart,
  Copy,
  Sparkles,
  Star,
  BedDouble,
  Users,
  MapPin,
  X,
  CheckCircle2,
  Eye,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import { useCompare, computeScore } from "./hooks/useCompare";

const gradientButton = `
  bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 
  hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const gradientText =
  "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent";

function getAmenityKey(amenity: string): string {
  const keyMap: Record<string, string> = {
    wifi: "wifi",
    parking: "parking",
    garage: "garage",
    airConditioning: "airConditioning",
    ac: "airConditioning",
    heating: "heating",
    kitchen: "kitchen",
    washingMachine: "washingMachine",
    washer: "washingMachine",
    tv: "tv",
    balcony: "balcony",
    garden: "garden",
    pool: "pool",
    gym: "gym",
    elevator: "elevator",
    petsAllowed: "petsAllowed",
    workspace: "workspace",
    seaView: "seaView",
    mountainView: "mountainView",
  };
  return keyMap[amenity.toLowerCase()] || amenity.toLowerCase();
}
function ScorePill({
  score,
  isAiScore = false,
}: {
  score: number;
  isAiScore?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold backdrop-blur-md dark:bg-slate-900/90">
      <div
        className={`h-2 w-2 rounded-full ${score >= 90 ? "bg-emerald-500" : score >= 80 ? "bg-amber-500" : "bg-rose-500"}`}
      />
      <span className="text-slate-800 dark:text-white">{score}/100</span>
      {isAiScore && <Sparkles className="h-2.5 w-2.5 text-indigo-500" />}
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

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  const t = useTranslations("ComparePage");  
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
              <AlertTriangle className="h-7 w-7 text-rose-600 dark:text-rose-400" />
            </div>
          </div>

          <h3 className="text-center text-xl font-bold text-slate-900 dark:text-white mb-3">
            {title}  {/* ← Sera traduit via t() */}
          </h3>

          <p className="text-center text-slate-600 dark:text-slate-300">
            {message}  {/* ← Sera traduit via t() */}
          </p>
        </div>

        <div className="flex gap-3 border-t border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t("modalCancel")}  {/* ← AJOUTE */}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-rose-700"
          >
            {t("modalDelete")}  {/* ← AJOUTE */}
          </button>
        </div>
      </div>
    </div>
  );
}
export default function ComparePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("ComparePage");
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // ============================================
  // ÉTAT POUR LE MODAL DE CONFIRMATION INDIVIDUEL
  // ============================================
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    listingId: string;
    listingTitle: string;
  }>({
    isOpen: false,
    listingId: "",
    listingTitle: "",
  });

  // ============================================
  // ÉTAT POUR LE MODAL CLEAR ALL
  // ============================================
  const [clearAllModal, setClearAllModal] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const {
    mounted,
    listings,
    loading,
    error,
    imageErrors,
    sortKey,
    allAmenities,
    bestListing,
    avgPrice,
    avgRating,
    avgBeds,
    aiAnalysis,
    aiLoading,
    showAiPanel,
    userPrompt,
    aiRecommendedId,
    aiScores,
    setSortKey,
    setShowAiPanel,
    setUserPrompt,
    removeFromCompare,
    clearAll,
    copyLink,
    handleImageError,
    analyzeWithAI,
    getListingScore,
    isRecommendedByAI,
    dynamicReview,
  } = useCompare();

  useEffect(() => {
    if (error) showToast("error", error);
  }, [error]);

  // ============================================
  // FONCTIONS POUR LE MODAL INDIVIDUEL
  // ============================================
  const openConfirmModal = (id: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      listingId: id,
      listingTitle: title,
    });
  };

  const confirmRemove = () => {
    removeFromCompare(confirmModal.listingId);
    showToast("info", t("alertRemoved", { title: confirmModal.listingTitle }));
    setConfirmModal({ isOpen: false, listingId: "", listingTitle: "" });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, listingId: "", listingTitle: "" });
  };

  // ============================================
  // FONCTIONS POUR LE MODAL CLEAR ALL
  // ============================================
  const openClearAllModal = () => {
    setClearAllModal({ isOpen: true });
  };

  const confirmClearAll = () => {
    clearAll();
    showToast("info", t("alertClearedAll"));
    setClearAllModal({ isOpen: false });
  };

  const closeClearAllModal = () => {
    setClearAllModal({ isOpen: false });
  };

  const handleShareDirect = () => {
    copyLink();
    showToast("success", t("shareSuccess"));
  };

  const handleAnalyze = async (prompt: string) => {
    const result = await analyzeWithAI(prompt);
    if (result?.success) {
      showToast("success", result.message);
    } else if (result?.message) {
      showToast("error", result.message);
    }
  };

  const getSortedListings = useCallback(() => {
    let sorted = [...listings];
    if (aiRecommendedId) {
      const idx = sorted.findIndex((l) => l.id === aiRecommendedId);
      if (idx > 0) {
        const [rec] = sorted.splice(idx, 1);
        sorted = [rec, ...sorted];
      }
    }
    switch (sortKey) {
      case "price":
        return sorted.sort((a, b) => a.pricePerNight - b.pricePerNight);
      case "beds":
        return sorted.sort((a, b) => b.bedrooms - a.bedrooms);
      case "guests":
        return sorted.sort((a, b) => b.maxGuests - a.maxGuests);
      default:
        return sorted.sort((a, b) => {
          const sa = getListingScore(a.id, a.rating || 0);
          const sb = getListingScore(b.id, b.rating || 0);
          return sb - sa;
        });
    }
  }, [listings, sortKey, aiRecommendedId, getListingScore]);

  const sorted = getSortedListings();
  const expertChoice = aiRecommendedId
    ? listings.find((l) => l.id === aiRecommendedId)
    : bestListing;

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
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-600/10 backdrop-blur-sm mx-auto animate-pulse">
            <Maximize2 className="h-12 w-12 text-sky-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {t("noListings")}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {t("noListingsDesc")}
          </p>
          <Link
            href={`/${locale}/favorites`}
            className={`mt-8 inline-flex items-center gap-2 rounded-full ${gradientButton} px-7 py-3.5 text-sm font-bold shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02]`}
          >
            <Heart className="h-4 w-4" /> {t("viewFavorites")}{" "}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <TenantHeader />

      {/* MODAL DE CONFIRMATION INDIVIDUEL */}
     <ConfirmModal
  isOpen={confirmModal.isOpen}
  onClose={closeConfirmModal}
  onConfirm={confirmRemove}
  title={t("modalConfirmTitle")}
  message={t("modalConfirmMessage", { title: confirmModal.listingTitle })}
/>


      {/* MODAL DE CONFIRMATION CLEAR ALL */}
      <ConfirmModal
  isOpen={clearAllModal.isOpen}
  onClose={closeClearAllModal}
  onConfirm={confirmClearAll}
  title={t("modalConfirmTitle")}
  message={t("modalClearAllMessage")}
/>

      {/* Toast */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500 text-white" : toast.type === "error" ? "bg-red-500 text-white" : "bg-sky-500 text-white"}`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
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

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6">
          <Link
            href={`/${locale}/search`}
            className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition"
          >
            {t("breadcrumbHome")}
          </Link>
          <IoChevronForwardOutline className="text-[10px] text-slate-400" />
          <Link
            href={`/${locale}/favorites`}
            className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition"
          >
            {t("breadcrumbFavorites")}
          </Link>
          <IoChevronForwardOutline className="text-[10px] text-slate-400" />
          <span className="text-slate-900 dark:text-white">
            {t("breadcrumbCompare")}
          </span>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70 dark:text-indigo-300">
              <ChartColumn className="h-3.5 w-3.5" /> {t("badge")}
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-6xl">
              {t("title")}{" "}
              <span className={gradientText}>{t("titleGradient")}</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
              {t("description")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleShareDirect}
              className="flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200"
            >
              <Copy className="h-3.5 w-3.5" /> {t("share")}
            </button>
            <button
              onClick={openClearAllModal}
              className="flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2.5 text-xs font-bold text-rose-600 shadow-sm backdrop-blur-md transition-all hover:bg-rose-50 dark:border-white/10 dark:bg-slate-900/80 dark:text-rose-400"
            >
              <IoTrashOutline className="h-3.5 w-3.5" /> {t("clearAll")}
            </button>
          </div>
        </div>

        {/* IA COMPARISON PANEL */}
        <div className="mb-8 rounded-3xl border border-white/70 bg-gradient-to-r from-indigo-50/50 via-purple-50/50 to-pink-50/50 p-5 backdrop-blur-md dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Image
                src="/images/House.png"
                alt="AI"
                width={48}
                height={48}
                className="rounded-xl"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t("aiTitle")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("aiDescription")}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className="rounded-full p-1.5 text-slate-500 hover:bg-white/50 dark:text-slate-400"
            >
              {showAiPanel ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>

          {showAiPanel && (
            <div className="flex flex-col gap-3 mt-2">
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder={t("aiPlaceholder")}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-800/90 dark:text-slate-200"
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => handleAnalyze(userPrompt)}
                  disabled={
                    aiLoading || !userPrompt.trim() || listings.length === 0
                  }
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    aiLoading || !userPrompt.trim() || listings.length === 0
                      ? "cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-700"
                      : gradientButton
                  }`}
                >
                  {aiLoading ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {t("analyzing")}
                    </>
                  ) : (
                    <>
                      {t("analyze")}
                      <IoSendOutline className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>

                {aiAnalysis && (
                  <button
                    onClick={() => setUserPrompt("")}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-100 dark:border-white/10 dark:text-slate-300"
                  >
                    {t("clear")}
                  </button>
                )}
              </div>

              {aiAnalysis && (
                <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                      {t("aiRecommendation")}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {aiAnalysis.recommendation ||
                        aiAnalysis.analysis?.substring(0, 300)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Metrics row */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: t("listingsCompared"),
              value: String(listings.length),
              icon: ChartColumn,
              grad: "from-sky-500 to-indigo-600",
            },
            {
              label: t("avgRating"),
              value: `${avgRating}/5`,
              icon: Star,
              grad: "from-amber-400 to-orange-500",
            },
            {
              label: t("avgPrice"),
              value: `${avgPrice.toLocaleString()} TND`,
              icon: Crown,
              grad: "from-purple-500 to-pink-500",
            },
            {
              label: t("avgBeds"),
              value: String(avgBeds),
              icon: BedDouble,
              grad: "from-emerald-500 to-teal-600",
            },
          ].map(({ label, value, icon: Icon, grad }) => (
            <div
              key={label}
              className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80"
            >
              <div className="flex items-center gap-3 p-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-white shadow-md`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                    {label}
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sort */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            {t("sortBy")}
          </span>
          {[
            { key: "rating", label: t("sortRating") },
            { key: "price", label: t("sortPrice") },
            { key: "beds", label: t("sortBeds") },
            { key: "guests", label: t("sortGuests") },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortKey(key as any)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${sortKey === key ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/15" : "bg-white/70 text-slate-600 hover:bg-white dark:bg-slate-900/70 dark:text-slate-300"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <div className="mb-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((listing, idx) => {
            const isBest = idx === 0 && sorted.length > 1;
            const isAiRecommended = isRecommendedByAI(listing.id);
            const score = getListingScore(
              listing.id,
              listing.trustScore || computeScore(listing),
            );
            const isAiScore = !!aiScores[listing.id];
            const imgSrc = imageErrors[listing.id]
              ? "https://placehold.co/600x400/e2e8f0/6366f1?text=NestHub"
              : listing.image;

            return (
              <div
                key={listing.id}
                id={`listing-${listing.id}`}
                className={`overflow-hidden rounded-3xl border transition-all duration-300 scroll-mt-24 ${isAiRecommended ? "ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/20" : ""} ${isBest ? "border-transparent bg-gradient-to-br from-sky-50 to-indigo-50 shadow-[0_24px_70px_rgba(79,70,229,0.18)] ring-2 ring-indigo-500/30 dark:from-sky-950/30 dark:to-indigo-950/30" : "border-white/70 bg-white/85 shadow-[0_16px_45px_rgba(15,23,42,0.07)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80"}`}
              >
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={imgSrc}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                    onError={() => handleImageError(listing.id)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    {isAiRecommended && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-2.5 py-1 text-[10px] font-bold uppercase text-white shadow-md">
                        <Sparkles className="h-2.5 w-2.5" />{" "}
                        {t("aiRecommended")}
                      </span>
                    )}
                    {isBest && !isAiRecommended && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600/95 px-3 py-1 text-[10px] font-bold uppercase text-white">
                        <Crown className="h-3 w-3" /> {t("bestChoice")}
                      </span>
                    )}
                    {listing.isVerified && !isBest && !isAiRecommended && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-bold uppercase text-white">
                        <ShieldCheck className="h-3 w-3" /> {t("verified")}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => openConfirmModal(listing.id, listing.title)}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-lg backdrop-blur-md hover:scale-110 dark:bg-slate-900/90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-extrabold tracking-tight text-white">
                        {listing.title}
                      </h3>
                      <p className="inline-flex items-center gap-1 text-[11px] text-white/80">
                        <MapPin className="h-3 w-3" /> {listing.location}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/90 px-3 py-2 text-right shadow-lg backdrop-blur-md dark:bg-slate-900/90">
                      <p className="text-base font-extrabold text-slate-900 dark:text-white">
                        {listing.pricePerNight.toLocaleString()} TND
                      </p>
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        / {t("night")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    {listing.rating > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{" "}
                        {listing.rating}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {listing.viewCount}{" "}
                      {t("views")}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {listing.favoriteCount}{" "}
                      {t("favs")}
                    </span>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 dark:bg-white/5">
                      <BedDouble className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {listing.bedrooms} {t("bedrooms")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 dark:bg-white/5">
                      <Bath className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {listing.bathrooms} {t("bathrooms")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 dark:bg-white/5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {listing.maxGuests} {t("guests")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 dark:bg-white/5">
                      <MdOutlineSquareFoot className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {listing.surfaceArea} m²
                      </span>
                    </div>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {listing.hasBalcony && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {t("balcony")}
                      </span>
                    )}
                    {listing.hasGarden && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {t("garden")}
                      </span>
                    )}
                    {listing.hasGarage && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {t("garage")}
                      </span>
                    )}
                    {listing.hasElevator && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {t("elevator")}
                      </span>
                    )}
                    {listing.isFurnished && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {t("furnished")}
                      </span>
                    )}
                    {listing.petsAllowed && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {t("petsAllowed")}
                      </span>
                    )}
                    {listing.numberOfKitchens > 1 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {listing.numberOfKitchens} {t("kitchens")}
                      </span>
                    )}
                  </div>

                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {t("score")}
                      {isAiScore && (
                        <span className="ml-1 text-indigo-500">
                          ({t("aiScore")})
                        </span>
                      )}
                    </span>
                    <ScorePill score={score} isAiScore={isAiScore} />
                  </div>
                  <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600"
                      style={{ width: `${score}%` }}
                    />
                  </div>

                  <div className="space-y-0 divide-y divide-slate-100 dark:divide-white/5">
                    {allAmenities.slice(0, 8).map((amenity) => {
                      const has =
                        listing.amenities?.some((a) =>
                          a.toLowerCase().includes(amenity.toLowerCase()),
                        ) || listing.amenities?.includes(amenity);
                      return (
                        <div
                          key={amenity}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="text-xs text-slate-600 dark:text-slate-300">
                            {t(`amenities.${getAmenityKey(amenity)}`)}
                          </span>
                          <CheckCell has={has} />
                        </div>
                      );
                    })}
                  </div>

                  <Link href={`/${locale}/listings/${listing.id}`}>
                    <button
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${isBest || isAiRecommended ? gradientButton : "border border-indigo-300 bg-white text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:bg-transparent dark:text-indigo-300"}`}
                    >
                      {isBest || isAiRecommended ? (
                        <Crown className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5" />
                      )}
                      {isBest || isAiRecommended
                        ? t("reserveBest")
                        : t("viewDetails")}
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Add more card */}
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center dark:border-white/10 dark:bg-slate-900/50">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-md dark:bg-slate-800">
              <Maximize2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-200">
              {t("addMore")}
            </p>
            <p className="max-w-[160px] text-xs text-slate-400 dark:text-slate-500">
              {t("addMoreDesc")}
            </p>
            <Link href={`/${locale}/favorites`}>
              <button
                className={`mt-2 rounded-full ${gradientButton} px-4 py-2 text-xs font-bold`}
              >
                <Heart className="h-3.5 w-3.5 inline mr-1" />{" "}
                {t("backToFavorites")}
              </button>
            </Link>
          </div>
        </div>

        {/* Expert Choice */}
        {sorted.length > 0 && expertChoice && (
          <div className="mb-8 grid gap-5 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-r from-indigo-50/50 via-purple-50/50 to-pink-50/50 p-6 shadow-[0_16px_45px_rgba(15,23,42,0.07)] backdrop-blur-md dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t("expertChoice")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("expertChoiceDesc")}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-100/50 p-5 dark:border-amber-500/20 dark:bg-amber-500/10">
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-200 shadow-md dark:bg-slate-800">
                    <img
                      src={
                        imageErrors[expertChoice.id]
                          ? "https://placehold.co/600x400/e2e8f0/6366f1?text=NestHub"
                          : expertChoice.image
                      }
                      alt={expertChoice.title}
                      className="h-full w-full object-cover"
                      onError={() => handleImageError(expertChoice.id)}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      {expertChoice.title}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="h-3.5 w-3.5" /> {expertChoice.location}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{" "}
                        {expertChoice.rating}/5
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5" />{" "}
                        {expertChoice.bedrooms} ch.
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />{" "}
                        {expertChoice.maxGuests} pers.
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {expertChoice.pricePerNight.toLocaleString()} TND
                      </span>
                      <span className="text-xs text-slate-400">
                        / {t("night")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Link href={`/${locale}/listings/${expertChoice.id}`}>
                <button
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-all ${gradientButton}`}
                >
                  <Crown className="h-4 w-4" /> {t("bookExpertChoice")}
                </button>
              </Link>
            </div>

            <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-50/50 via-purple-50/50 to-pink-50/50 p-6 shadow-[0_16px_45px_rgba(15,23,42,0.07)] backdrop-blur-md dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t("reviewTitle")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("reviewDesc")}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-100/50 p-5 dark:border-sky-500/20 dark:bg-sky-500/10">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i <= Math.round(dynamicReview?.rating || expertChoice?.rating || 4.5) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200 dark:fill-gray-700"}`}
                    />
                  ))}
                  <span className="ml-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {expertChoice?.reviewCount || 0} {t("reviews")}
                  </span>
                </div>

                <p className="text-sm leading-relaxed italic text-slate-600 dark:text-slate-300">
                  "
                  {dynamicReview?.comment ||
                    (expertChoice?.reviewCount && expertChoice.reviewCount > 0
                      ? t("reviewTextReal", {
                          title: expertChoice.title,
                          rating: expertChoice.rating,
                        })
                      : t("reviewTextDefault", {
                          title: expertChoice?.title,
                          rating: expertChoice?.rating || 4.5,
                        }))}
                  "
                </p>

                <div className="mt-5 flex items-center gap-3">
                  {dynamicReview?.profilePicture ? (
                    <img
                      src={dynamicReview.profilePicture}
                      alt={dynamicReview.author}
                      className="h-10 w-10 rounded-xl object-cover shadow-md"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md">
                      {dynamicReview?.initial ||
                        expertChoice?.title?.charAt(0).toUpperCase() ||
                        "C"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      @{dynamicReview?.author || t("verifiedGuest")}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {t("verifiedReview")} ·{" "}
                      {dynamicReview?.date || new Date().getFullYear()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
