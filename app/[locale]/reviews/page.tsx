"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  IoSearchOutline,
  IoChevronDownOutline,
  IoStarSharp,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoCloseOutline,
  IoFilterOutline,
  IoSparklesOutline,
  IoStarOutline,
  IoStarHalfSharp,
  IoShieldCheckmarkOutline,
  IoHomeOutline,
  IoFlagOutline,
  IoChatbubbleOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import { Loader2, X, CheckCircle, AlertCircle } from "lucide-react";

import { TenantHeader } from "@/components/ui/header/TenantHeader";
import { ReviewModal } from "@/components/ui/modals/ReviewModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useReviews } from "./hooks/useReviews";

const GRADIENT_BUTTON = `
  bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 
  hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const GRADIENT_TEXT =
  "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent";

const proxyImage = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;
const proxyAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function memberSince(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => {
        if (rating >= s)
          return <IoStarSharp key={s} className="text-amber-400 text-sm" />;
        if (rating >= s - 0.5)
          return <IoStarHalfSharp key={s} className="text-amber-400 text-sm" />;
        return (
          <IoStarOutline
            key={s}
            className="text-gray-300 dark:text-gray-600 text-sm"
          />
        );
      })}
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="w-full sm:w-36 h-28 rounded-xl bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  tab,
  onCreateReview,
  t,
}: {
  tab: "received" | "given";
  onCreateReview: () => void;
  t: any;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-600/10 backdrop-blur-sm flex items-center justify-center mb-4">
        <IoStarOutline className="text-sky-400 dark:text-sky-500 text-2xl" />
      </div>
      <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">
        {tab === "received"
          ? t("emptyState.noReviewsReceived")
          : t("emptyState.noReviewsGiven")}
      </h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
        {tab === "received"
          ? t("emptyState.receivedDescription")
          : t("emptyState.givenDescription")}
      </p>
      {tab === "given" && (
        <button
          onClick={onCreateReview}
          className={`mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white ${GRADIENT_BUTTON} shadow-sm transition-all hover:scale-[1.02]`}
        >
          <IoSparklesOutline className="text-sm" />
          {t("emptyState.simulateReview")}
        </button>
      )}
    </div>
  );
}

function StatsSection({
  reviews,
  userProfile,
  userStats,
  selectedFilterRating,
  onSelectFilterRating,
  t,
}: any) {
  const [avatarErr, setAvatarErr] = useState(false);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
      : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r: any) => Math.floor(r.rating) === star).length,
    pct:
      reviews.length > 0
        ? (reviews.filter((r: any) => Math.floor(r.rating) === star).length /
            reviews.length) *
          100
        : 0,
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-white/70 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] text-sky-500 dark:text-sky-400 uppercase tracking-widest font-semibold">
            {t("stats.globalRating")}
          </p>
          <IoStarSharp className="text-amber-400 text-lg" />
        </div>
        <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
          {avgRating > 0 ? avgRating.toFixed(2) : "—"}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t("stats.basedOn", { count: reviews.length })}
        </p>
        {reviews.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {ratingDistribution.map(({ star, count, pct }) => (
              <button
                key={star}
                onClick={() =>
                  onSelectFilterRating(
                    selectedFilterRating === star ? null : star,
                  )
                }
                className="w-full flex items-center gap-2 group cursor-pointer"
              >
                <span
                  className={`text-[10px] w-3 transition-colors ${selectedFilterRating === star ? "text-amber-600 dark:text-amber-400 font-bold" : "text-gray-400 dark:text-gray-500 group-hover:text-amber-500"}`}
                >
                  {star}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] w-4 text-right transition-colors ${selectedFilterRating === star ? "text-amber-600 dark:text-amber-400 font-bold" : "text-gray-400 dark:text-gray-500"}`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-white/70 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] text-sky-500 dark:text-sky-400 uppercase tracking-widest font-semibold">
            {t("stats.reliability")}
          </p>
          <IoShieldCheckmarkOutline className="text-sky-500 dark:text-sky-400 text-lg" />
        </div>
        <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
          {userStats?.reliabilityScore ?? "—"}
          {userStats?.reliabilityScore !== undefined && "%"}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t("stats.trustScore")}
        </p>
        {userStats?.reliabilityScore !== undefined && (
          <div className="mt-4 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-700"
              style={{ width: `${userStats.reliabilityScore}%` }}
            />
          </div>
        )}
      </div>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-white/70 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white font-semibold text-xl shadow-md overflow-hidden">
            {userProfile?.profilePictureUrl && !avatarErr ? (
              <img
                src={proxyAvatar(userProfile.profilePictureUrl)}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setAvatarErr(true)}
              />
            ) : (
              `${userProfile?.firstName?.[0] ?? ""}${userProfile?.lastName?.[0] ?? ""}`
            )}
          </div>
          <div>
            <p className="text-base font-bold text-gray-900 dark:text-white truncate">
              {userProfile
                ? `${userProfile.firstName} ${userProfile.lastName}`
                : "..."}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t("stats.memberSince")}{" "}
              {userProfile ? memberSince(userProfile.createdAt) : "..."}
            </p>
            <div className="mt-1 flex items-center gap-1">
              <IoSparklesOutline className="text-sky-500 text-xs" />
              <span className="text-[10px] text-sky-600 dark:text-sky-400 uppercase tracking-wider font-semibold">
                {t("stats.superTraveler")}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="text-center py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {userStats?.totalBookings ?? "—"}
            </p>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">
              {t("stats.stays")}
            </p>
          </div>
          <div className="text-center py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {userStats?.totalReviews ?? "—"}
            </p>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">
              {t("stats.reviewsReceived")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review, tab, onReply, onReport, t }: any) {
  const [imgErr, setImgErr] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.response || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const listingPhoto =
    review.booking.listing.photos?.find((p: any) => p.isMain)?.url ||
    review.booking.listing.photos?.[0]?.url;

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await onReply(review.id, replyText);
      setIsReplying(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReply = () => {
    setIsReplying(false);
    setReplyText(review.response || "");
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) return;
    setIsSubmitting(true);
    try {
      await onReport(review.id, reportReason);
      setShowReportModal(false);
      setReportReason("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-white/70 dark:border-gray-800 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex-shrink-0 w-full sm:w-40">
            <Link
              href={`/fr/listings/${review.booking.listing.id}`}
              className="relative w-full sm:w-40 h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group block"
            >
              {listingPhoto && !imgErr ? (
                <img
                  src={proxyImage(listingPhoto)}
                  alt={review.booking.listing.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={() => setImgErr(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <IoHomeOutline className="text-3xl text-gray-300 dark:text-gray-600" />
                </div>
              )}
            </Link>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-2 text-center sm:text-left">
              {fmtDate(review.booking.checkIn)}
            </p>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <Link
                  href={`/fr/listings/${review.booking.listing.id}`}
                  className="text-base font-bold text-gray-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                >
                  {review.booking.listing.title}
                </Link>
                <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
                  {tab === "received"
                    ? t("reviewCard.host")
                    : t("reviewCard.for")}{" "}
                  : {review.reviewer.firstName} {review.reviewer.lastName}
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/30">
                <IoStarSharp className="text-amber-400 text-sm" />
                <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">
                  {review.rating}
                </span>
              </div>
            </div>

            {review.comment && (
              <div className="border-l-4 border-sky-200 dark:border-sky-800 pl-4 py-1 mb-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>
            )}

            {review.response && !isReplying && (
              <div className="bg-sky-50/50 dark:bg-sky-950/20 rounded-xl p-3 mb-3 border border-sky-100 dark:border-sky-800">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                    {t("reviewCard.yourResponse")}
                  </p>
                  {tab === "received" && (
                    <button
                      onClick={() => {
                        setIsReplying(true);
                        setReplyText(review.response || "");
                      }}
                      className="text-[9px] text-sky-500 hover:text-sky-700 transition-colors"
                    >
                      {t("actions.edit")}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                  &ldquo;{review.response}&rdquo;
                </p>
                {review.responseAt && (
                  <p className="text-[9px] text-gray-400 mt-1">
                    {new Date(review.responseAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            )}

            {isReplying && (
              <div className="mt-3 mb-3 p-3 bg-gradient-to-r from-sky-50/80 to-indigo-50/80 dark:from-sky-950/30 dark:to-indigo-950/30 rounded-xl border border-sky-200 dark:border-sky-800">
                <p className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 mb-2 uppercase tracking-wider">
                  {review.response
                    ? t("reviewCard.editResponse")
                    : t("reviewCard.writeResponse")}
                </p>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all resize-none"
                  placeholder={t("reviewCard.responsePlaceholder")}
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSubmitReply}
                    disabled={isSubmitting || !replyText.trim()}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <IoCheckmarkCircleOutline className="w-3.5 h-3.5" />
                    )}
                    {t("actions.publish")}
                  </button>
                  <button
                    onClick={handleCancelReply}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {t("actions.cancel")}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 flex-wrap">
              {tab === "received" && !isReplying && (
                <button
                  onClick={() => {
                    setIsReplying(true);
                    setReplyText(review.response || "");
                  }}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 transition-colors"
                >
                  <IoChatbubbleOutline className="text-sm" />
                  {review.response
                    ? t("reviewCard.modifyReply")
                    : t("reviewCard.reply")}
                </button>
              )}
              <button
                onClick={() => setShowReportModal(true)}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-rose-500 transition-colors flex items-center gap-1"
              >
                <IoFlagOutline className="text-sm" />
                {t("reviewCard.report")}
              </button>
              <Link
                href={`/fr/listings/${review.booking.listing.id}`}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-sky-600 transition-colors ml-auto flex items-center gap-1"
              >
                {t("reviewCard.viewListing")}{" "}
                <IoChevronForwardOutline className="text-[10px]" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 fade-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t("reviewCard.reportReview")}
                </h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <IoCloseOutline className="text-2xl" />
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {t("reviewCard.reportReason")}
              </p>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all mb-3"
              >
                <option value="">{t("reviewCard.selectReason")}</option>
                <option value="inappropriate">
                  {t("reviewCard.reasons.inappropriate")}
                </option>
                <option value="fake">{t("reviewCard.reasons.fake")}</option>
                <option value="offensive">
                  {t("reviewCard.reasons.offensive")}
                </option>
                <option value="spam">{t("reviewCard.reasons.spam")}</option>
                <option value="other">{t("reviewCard.reasons.other")}</option>
              </select>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={3}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                placeholder={t("reviewCard.describeReason")}
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSubmitReport}
                  disabled={isSubmitting || !reportReason.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <IoFlagOutline className="w-4 h-4" />
                  )}
                  {t("reviewCard.submitReport")}
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {t("actions.cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ReviewsPage() {
  const [mounted, setMounted] = useState(false);
  const [showNewReviewModal, setShowNewReviewModal] = useState(false);

  const {
    loading,
    tab,
    setTab,
    reviews,
    profile,
    stats,
    search,
    setSearch,
    sortBy,
    setSortBy,
    filterRating,
    setFilterRating,
    filterStatus,
    setFilterStatus,
    toast,
    setToast,
    filteredReviews,
    activeFiltersCount,
    handleReply,
    handleReport,
    handleCreateReview,
    handleExportCSV,
    t,
    tCommon,
  } = useReviews();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <TenantHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
          <LoadingSpinner
            size="lg"
            color="primary"
            variant="spinner"
            text={tCommon("loading")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <TenantHeader />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        <div className="mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-sky-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70 dark:text-sky-400">
            <IoStarSharp className="h-3.5 w-3.5 fill-sky-600 text-sky-600 dark:fill-sky-400 dark:text-sky-400" />
            {t("dashboard.badge")}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-6xl">
            {t("dashboard.title")}{" "}
            <span className={GRADIENT_TEXT}>{t("dashboard.highlight")}</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
            {t("dashboard.subtitle")}
          </p>
        </div>

        <StatsSection
          reviews={reviews}
          userProfile={profile}
          userStats={stats}
          selectedFilterRating={filterRating}
          onSelectFilterRating={(star: number | null) => setFilterRating(star)}
          t={t}
        />

        <div className="mb-8 overflow-x-auto pb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTab("received");
                setFilterRating(null);
                setFilterStatus("all");
              }}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${tab === "received" ? "border-transparent bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20" : "border-white/70 bg-white/80 text-slate-600 shadow-sm backdrop-blur-md hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-400"}`}
            >
              <IoStarSharp className="h-4 w-4" />
              {t("tabs.received")}
              <span className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-white/20 text-white">
                {reviews.length}
              </span>
            </button>
            <button
              onClick={() => {
                setTab("given");
                setFilterRating(null);
              }}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${tab === "given" ? "border-transparent bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20" : "border-white/70 bg-white/80 text-slate-600 shadow-sm backdrop-blur-md hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-400"}`}
            >
              <IoChatbubbleOutline className="h-4 w-4" />
              {t("tabs.given")}
              <span className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-white/20 text-white">
                0
              </span>
            </button>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-white/70 dark:border-gray-800 p-4 mb-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm">
          <div className="relative flex-1">
            <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("filters.placeholder")}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                {t("filters.clear")}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {tab === "received" && (
              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterStatus === "all" ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white shadow-sm" : "text-gray-500"}`}
                >
                  {t("filters.all")}
                </button>
                <button
                  onClick={() => setFilterStatus("replied")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterStatus === "replied" ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white shadow-sm" : "text-gray-500"}`}
                >
                  {t("filters.replied")}
                </button>
                <button
                  onClick={() => setFilterStatus("unreplied")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterStatus === "unreplied" ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white shadow-sm" : "text-gray-500"}`}
                >
                  {t("filters.unreplied")}
                </button>
              </div>
            )}

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="recent">{t("filters.sortRecent")}</option>
                <option value="rating_desc">
                  {t("filters.sortRatingDesc")}
                </option>
                <option value="rating_asc">{t("filters.sortRatingAsc")}</option>
              </select>
              <IoChevronDownOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
            </div>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <IoFilterOutline /> {t("filters.activeFilters")}
            </span>
            {search && (
              <span className="bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-semibold px-3 py-1 rounded-xl border border-sky-200 dark:border-sky-800 flex items-center gap-1.5">
                {t("filters.searchFor")}: &ldquo;{search}&rdquo;
                <button onClick={() => setSearch("")}>
                  <IoCloseOutline />
                </button>
              </span>
            )}
            {filterRating !== null && (
              <span className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-semibold px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                {t("filters.rating")}: {filterRating} {t("filters.stars")}
                <button onClick={() => setFilterRating(null)}>
                  <IoCloseOutline />
                </button>
              </span>
            )}
            {filterStatus !== "all" && tab === "received" && (
              <span className="bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-xs font-semibold px-3 py-1 rounded-xl border border-violet-200 dark:border-violet-800 flex items-center gap-1.5">
                {t("filters.status")}:{" "}
                {filterStatus === "replied"
                  ? t("filters.replied")
                  : t("filters.unreplied")}
                <button onClick={() => setFilterStatus("all")}>
                  <IoCloseOutline />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearch("");
                setFilterRating(null);
                setFilterStatus("all");
              }}
              className="text-xs font-semibold text-gray-500 hover:underline ml-2"
            >
              {t("filters.resetAll")}
            </button>
          </div>
        )}

        <div className="space-y-5">
          {loading ? (
            [...Array(3)].map((_, i) => <ReviewSkeleton key={i} />)
          ) : filteredReviews.length === 0 ? (
            <EmptyState
              tab={tab}
              onCreateReview={() => setShowNewReviewModal(true)}
              t={t}
            />
          ) : (
            filteredReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                tab={tab}
                onReply={handleReply}
                onReport={handleReport}
                t={t}
              />
            ))
          )}
        </div>
      </main>

      {showNewReviewModal && (
        <ReviewModal
          isOpen={showNewReviewModal}
          onClose={() => setShowNewReviewModal(false)}
          onSubmit={handleCreateReview}
          booking={{ listing: { id: "", title: "" } }}
        />
      )}
    </div>
  );
}
