"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  IoStarSharp,
  IoStarOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoLinkOutline,
  IoWarningOutline,
  IoTrashOutline,
  IoCloseOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoEyeOutline,
  IoEyeOffOutline,
} from "react-icons/io5";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAdminReviews } from "./hooks/useAdminReviews";

const GRADIENT_BUTTON = "bg-gradient-to-r from-[#005cab] to-[#712ae2]";

function formatDate(date: string | Date) {
  return format(new Date(date), "dd MMMM yyyy", { locale: fr });
}

function formatDateTime(date: string | Date) {
  return format(new Date(date), "dd MMMM yyyy à HH:mm", { locale: fr });
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <IoStarSharp
          key={s}
          className={`text-sm ${s <= rating ? "text-yellow-500 fill-yellow-500" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  const isLow = rating <= 2;
  const isHigh = rating >= 4;
  return (
    <span className={`text-[10px] font-bold uppercase tracking-tighter ${isLow ? "text-error" : isHigh ? "text-emerald-600" : "text-outline"}`}>
      {rating}.0 Rating
    </span>
  );
}

function StatusBadge({ isFlagged, isPublished }: { isFlagged: boolean; isPublished: boolean }) {
  if (isFlagged) {
    return (
      <span className="bg-error text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide flex items-center gap-1">
        <IoWarningOutline className="text-xs" /> Flagged
      </span>
    );
  }
  if (!isPublished) {
    return (
      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide flex items-center gap-1">
        <IoEyeOffOutline className="text-xs" /> Hidden
      </span>
    );
  }
  return (
    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide flex items-center gap-1">
      <IoCheckmarkCircleOutline className="text-xs" /> Active
    </span>
  );
}

function ReviewCard({ review, onToggleVisibility, onDelete, t }: any) {
  const [isHidden, setIsHidden] = useState(!review.isPublished);
  
  const handleToggle = () => {
    const newHidden = !isHidden;
    setIsHidden(newHidden);
    onToggleVisibility(review.id, newHidden);
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl p-6 flex items-start gap-8 shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)] transition-all hover:translate-x-1 border ${review.isFlagged ? "border-l-4 border-l-error" : "border-transparent hover:border-primary/10"}`}>
      {/* Rating Column */}
      <div className="flex flex-col items-center gap-1 w-24 flex-shrink-0">
        <Stars rating={review.rating} />
        <RatingBadge rating={review.rating} />
      </div>

      {/* Content Column */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-gray-900 dark:text-white">
              {review.reviewer.firstName} {review.reviewer.lastName}
            </span>
            <IoStarOutline className="text-outline text-xs" />
            <span className="text-sm font-semibold text-primary">
              {review.booking.listing.title}
            </span>
          </div>
          <span className="text-xs text-outline font-medium">
            {formatDateTime(review.createdAt)}
          </span>
        </div>

        <div className={review.isFlagged ? "bg-error-container/10 p-3 rounded-lg border border-error/5" : ""}>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-3xl italic">
            &ldquo;{review.comment || "Aucun commentaire"}&rdquo;
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <StatusBadge isFlagged={review.isFlagged} isPublished={review.isPublished} />
          {review.flagReason && (
            <span className="text-[10px] text-error font-bold flex items-center gap-1">
              <IoWarningOutline className="text-sm" /> {review.flagReason}
            </span>
          )}
          <a
            href={`/fr/bookings/${review.booking.id}`}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 ml-auto"
          >
            <IoLinkOutline className="text-sm" /> View Context (Booking #{review.booking.reference?.slice(-6)})
          </a>
        </div>
      </div>

      {/* Actions Column */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1">
          <span className="text-[10px] font-bold px-3 py-1 text-gray-500">Hide</span>
          <button
            onClick={handleToggle}
            className={`w-8 h-4 rounded-full relative transition-colors shadow-inner ${!isHidden ? "bg-primary" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${!isHidden ? "right-0.5" : "left-0.5"}`} />
          </button>
        </div>
        <button
          onClick={() => onDelete(review)}
          className="p-3 rounded-xl bg-error-container/20 text-error hover:bg-error-container transition-colors group"
        >
          <IoTrashOutline className="group-active:scale-90 transition-transform text-sm" />
        </button>
      </div>
    </div>
  );
}

export default function AdminReviewsPage() {
  const {
    loading,
    reviews,
    allReviewsCount,
    stats,
    filterType,
    setFilterType,
    ratingFilter,
    setRatingFilter,
    searchTerm,
    setSearchTerm,
    showDeleteModal,
    deleting,
    selectedReview,
    handleToggleVisibility,
    handleDeleteReview,
    openDeleteModal,
    closeDeleteModal,
    t,
  } = useAdminReviews();

  if (loading) {
    return (
      <div className="min-h-screen ">
        <div className="flex">
          <main className="flex-1  p-10">
            <div className="flex items-center justify-center h-96">
              <LoadingSpinner size="lg" color="primary" variant="spinner" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  font-body">

      <div className="flex">

        <main className="flex-1  p-10">
          {/* Header Section */}
          <div className="mb-12 flex justify-between items-end flex-wrap gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">
                {t("badge")}
              </span>
              <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
                {t("title")}
              </h1>
            </div>
            <div className="flex gap-4">
              <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm">
                {(["all", "flagged", "pending"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      filterType === type
                        ? "bg-white dark:bg-gray-900 shadow-sm text-primary"
                        : "text-gray-500 hover:text-primary"
                    }`}
                  >
                    {t(`filters.${type}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filters & Stats Bento */}
          <div className="grid grid-cols-12 gap-6 mb-10">
            <div className="col-span-8 bg-white dark:bg-gray-800/50 rounded-xl p-6 flex items-center justify-between flex-wrap gap-4 shadow-sm">
              <div className="flex gap-6 flex-wrap">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{t("stats.total")}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{allReviewsCount}</p>
                </div>
                <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{t("stats.avgRating")}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.averageRating.toFixed(1)}
                    </p>
                    <IoStarSharp className="text-yellow-500 text-lg fill-yellow-500" />
                  </div>
                </div>
                <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{t("stats.flagged")}</p>
                  <p className="text-2xl font-bold text-error">{stats.flaggedCount}</p>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm px-4 py-2 focus:ring-2 focus:ring-primary/20 shadow-sm"
                >
                  <option value="all">{t("filters.allRatings")}</option>
                  <option value="low">{t("filters.lowRatings")}</option>
                  <option value="high">{t("filters.highRatings")}</option>
                  <option value="5">5 {t("filters.stars")}</option>
                  <option value="4">4 {t("filters.stars")}</option>
                  <option value="3">3 {t("filters.stars")}</option>
                  <option value="2">2 {t("filters.stars")}</option>
                  <option value="1">1 {t("filters.stars")}</option>
                </select>
              </div>
            </div>

            <div className="col-span-4 bg-gradient-to-br from-[#005cab] to-[#712ae2] rounded-xl p-6 text-white flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start">
                <IoStarOutline className="text-3xl text-white/80" />
                <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full font-bold">AI ASSIST</span>
              </div>
              <div className="mt-4">
                <p className="text-lg font-bold leading-tight">{t("aiMessage")}</p>
                <p className="text-xs opacity-80 mt-1">{t("aiSubmessage")}</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-12 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
              />
              <IoFilterOutline className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
                <IoStarOutline className="text-4xl text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t("empty")}</p>
              </div>
            ) : (
              reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onToggleVisibility={handleToggleVisibility}
                  onDelete={openDeleteModal}
                  t={t}
                />
              ))
            )}
          </div>
        </main>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl w-[450px] shadow-xl transform transition-all scale-100 opacity-100 duration-300">
            <div className="w-16 h-16 bg-error-container/20 text-error rounded-full flex items-center justify-center mb-6 mx-auto">
              <IoWarningOutline className="text-4xl" />
            </div>
            <h3 className="text-2xl font-headline font-bold text-center mb-2 text-gray-900 dark:text-white">
              {t("modal.title")}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
              {t("modal.message")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 py-4 rounded-xl font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t("modal.cancel")}
              </button>
              <button
                onClick={handleDeleteReview}
                disabled={deleting}
                className="flex-1 py-4 bg-error text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : t("modal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}