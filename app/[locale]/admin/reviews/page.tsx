"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  IoEyeOffOutline,
  IoEyeOutline,
  IoShieldOutline,
  IoFlag,
  IoCalendarOutline,
  IoLocationOutline,
  IoTimeOutline,
} from "react-icons/io5";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import { useAdminReviews } from "./hooks/useAdminReviews";
import ConfirmActionModal from "@/components/ui/modals/ConfirmActionModal";

const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

function formatDateTime(date: string | Date) {
  return format(new Date(date), "dd MMMM yyyy à HH:mm", { locale: fr });
}

function formatTimeAgo(date: string | Date) {
  const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `Il y a ${diff} secondes`;
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} minutes`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} heures`;
  return `Il y a ${Math.floor(diff / 86400)} jours`;
}

function formatDateShort(date: string | Date) {
  return format(new Date(date), "dd/MM/yyyy", { locale: fr });
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

function RatingBadge({ rating, isFlagged }: { rating: number; isFlagged: boolean }) {
  const isLow = rating <= 2;
  const isHigh = rating >= 4;
  return (
    <span className={`text-[10px] font-bold uppercase tracking-tighter ${
      isFlagged ? "text-red-500" : isLow ? "text-red-500" : isHigh ? "text-emerald-600" : "text-slate-500"
    }`}>
      {rating}.0
    </span>
  );
}

function StatusBadge({ isFlagged, isPublished }: { isFlagged: boolean; isPublished: boolean }) {
  if (isFlagged) {
    return (
      <span className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide flex items-center gap-1">
        <IoFlag className="text-xs" /> Signalé
      </span>
    );
  }
  if (!isPublished) {
    return (
      <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide flex items-center gap-1">
        <IoEyeOffOutline className="text-xs" /> Masqué
      </span>
    );
  }
  return (
    <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide flex items-center gap-1">
      <IoCheckmarkCircleOutline className="text-xs" /> Actif
    </span>
  );
}

function ReviewCard({ review, onToggleVisibility, onDelete, t, actionLoading, openHideModal, openDeleteModal, locale }: any) {
  const isFlagged = review.isFlagged;
  const stayDuration = Math.ceil(
    (new Date(review.booking.checkOut).getTime() - new Date(review.booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl p-6 flex items-start gap-8 ${card3d} transition-all hover:translate-x-1 border ${isFlagged ? "border-l-4 border-l-red-500 border-red-200 dark:border-red-800" : "border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"}`}>
      
      {/* Rating Column */}
      <div className="flex flex-col items-center gap-1 w-24 flex-shrink-0">
        <Stars rating={review.rating} />
        <RatingBadge rating={review.rating} isFlagged={isFlagged} />
      </div>

      {/* Content Column */}
      <div className="flex-1 space-y-3">
        
        {/* ✅ En-tête avec statut bien collé à droite */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`font-bold text-sm truncate  ${isFlagged ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
                {review.reviewer?.firstName} {review.reviewer?.lastName}
              </span>
              <IoStarOutline className="text-slate-400 text-xs flex-shrink-0" />
              <span className={`text-sm font-semibold truncate ${isFlagged ? "text-red-500" : "text-indigo-600 dark:text-indigo-400"}`}>
                {review.booking?.listing?.title}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 mt-1.75">
            <StatusBadge isFlagged={review.isFlagged} isPublished={review.isPublished} />
          </div>
        </div>

        {/* Détails du séjour */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <IoCalendarOutline className="text-xs" />
            {formatDateShort(review.booking.checkIn)} → {formatDateShort(review.booking.checkOut)}
          </span>
          <span className="flex items-center gap-1">
            <IoTimeOutline className="text-xs" />
            {stayDuration} nuit{stayDuration > 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <IoLocationOutline className="text-xs" />
            {review.booking?.listing?.delegation}, {review.booking?.listing?.governorate}
          </span>
        </div>

        {/* Commentaire */}
        <div className={isFlagged ? "bg-red-50/30 dark:bg-red-950/20 p-3 rounded-lg border border-red-100 dark:border-red-800/50" : ""}>
          <p className={`text-sm leading-relaxed max-w-3xl italic ${isFlagged ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}`}>
            &ldquo;{review.comment || "Aucun commentaire"}&rdquo;
          </p>
        </div>

        {/* Motif de signalement et lien réservation */}
        <div className="flex items-center gap-4 flex-wrap">
          {review.flagReason && (
            <span className="text-[10px] text-red-500 font-medium flex items-center gap-1">
              <IoWarningOutline className="text-sm" /> Motif: {review.flagReason}
            </span>
          )}
          
          <a
            href={`/${locale}/admin/booking/${review.booking?.id}`}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 ml-auto"
          >
            <IoLinkOutline className="text-sm" /> Voir la réservation #{review.booking?.reference?.slice(-6)}
          </a>
        </div>
      </div>

      {/* Actions Column */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1">
          <span className="text-[10px] font-bold px-3 py-1 text-slate-500">
            {review.isPublished ? "Masquer" : "Afficher"}
          </span>
          <button
            onClick={() => openHideModal(review)}
            disabled={actionLoading === review.id}
            className={`w-8 h-4 rounded-full relative transition-colors shadow-inner ${review.isPublished ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"}`}
          >
            <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${review.isPublished ? "right-0.5" : "left-0.5"}`} />
          </button>
        </div>
        <button
          onClick={() => openDeleteModal(review)}
          disabled={actionLoading === review.id}
          className="p-3 rounded-xl bg-red-50/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors group disabled:opacity-50"
        >
          {actionLoading === review.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <IoTrashOutline className="group-active:scale-90 transition-transform text-sm" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function AdminReviewsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("AdminReviews");
  const {
    loading,
    reviews,
    pagination,
    allReviewsCount,
    stats,
    filterType,
    setFilterType,
    ratingFilter,
    setRatingFilter,
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    showDeleteModal,
    deleting,
    selectedReview,
    actionLoading,
    handleToggleVisibility,
    handleDeleteReview,
    openDeleteModal,
    closeDeleteModal,
    handlePageChange,
    fetchReviews,
  } = useAdminReviews();

  // États pour le modal Hide/Show
  const [showHideModal, setShowHideModal] = useState(false);
  const [hideAction, setHideAction] = useState<"hide" | "show" | null>(null);
  const [selectedHideReview, setSelectedHideReview] = useState<any>(null);

  const openHideModal = (review: any) => {
    setSelectedHideReview(review);
    setHideAction(review.isPublished ? "hide" : "show");
    setShowHideModal(true);
  };

  const closeHideModal = () => {
    setShowHideModal(false);
    setSelectedHideReview(null);
    setHideAction(null);
  };

  const handleConfirmHide = async () => {
    if (!selectedHideReview) return;
    const newHidden = hideAction === "hide";
    await handleToggleVisibility(selectedHideReview.id, newHidden);
    closeHideModal();
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex">
          <main className="flex-1 p-10">
            <div className="flex items-center justify-center h-96">
              <LoadingSpinner size="lg" color="primary" variant="spinner" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body">
      <div className="flex">
        <main className="flex-1 p-10">
          {/* Header Section */}
          <div className="mb-12 flex justify-between items-end flex-wrap gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-2 block">
                {t("badge")}
              </span>
              <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
                {t("title")}
              </h1>
            </div>
            <div className="flex gap-4 ml-auto">
              <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm">
                {(["all", "flagged", "pending"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      filterType === type
                        ? "bg-white dark:bg-gray-900 shadow-sm text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 hover:text-indigo-600"
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
            <div className="col-span-8 bg-white dark:bg-gray-800/50 rounded-xl p-6 flex items-center justify-between flex-wrap gap-4 shadow-sm border border-indigo-100 dark:border-indigo-900/40">
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
                  <p className="text-2xl font-bold text-red-500">{stats.flaggedCount}</p>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm px-4 py-2 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
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

            <div className="col-span-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-6 text-white flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start">
                <IoStarOutline className="text-3xl text-white/80" />
                <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full font-bold">MODÉRATION</span>
              </div>
              <div className="mt-4">
                <p className="text-lg font-bold leading-tight">{t("message")}</p>
                <p className="text-xs opacity-80 mt-1">{t("submessage")}</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-lg" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 rounded-xl px-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
              />
              <IoFilterOutline className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 text-lg" />
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-indigo-100 dark:border-indigo-900/40">
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
                  openHideModal={openHideModal}
                  openDeleteModal={openDeleteModal}
                  actionLoading={actionLoading}
                  t={t}
                  locale={locale}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900/40">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all disabled:opacity-50"
                >
                  <IoCloseOutline className="rotate-180 text-lg" />
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum = pagination.page;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${
                        pagination.page === pageNum
                          ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm"
                          : "hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all disabled:opacity-50"
                >
                  <IoCloseOutline className="text-lg" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* DELETE MODAL - Rouge */}
      <ConfirmActionModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        action="DELETE_REVIEW"
        conversationId={selectedReview?.id}
        conversationTitle={selectedReview?.booking?.listing?.title}
        onConfirm={handleDeleteReview}
        loading={deleting}
        title={t("modal.delete.title")}
        message={t("modal.delete.message")}
        confirmText={t("modal.delete.confirm")}
        cancelText={t("modal.cancel")}
        variant="danger"
      />

      {/* HIDE MODAL - Orange/Ambre */}
      <ConfirmActionModal
        isOpen={showHideModal && hideAction === "hide"}
        onClose={closeHideModal}
        action="HIDE_REVIEW"
        conversationId={selectedHideReview?.id}
        conversationTitle={selectedHideReview?.booking?.listing?.title}
        onConfirm={handleConfirmHide}
        loading={actionLoading === selectedHideReview?.id}
        title={t("modal.hide.title")}
        message={t("modal.hide.message")}
        confirmText={t("modal.hide.confirm")}
        cancelText={t("modal.cancel")}
        variant="warning"
      />

      {/* SHOW MODAL - Vert */}
      <ConfirmActionModal
        isOpen={showHideModal && hideAction === "show"}
        onClose={closeHideModal}
        action="SHOW_REVIEW"
        conversationId={selectedHideReview?.id}
        conversationTitle={selectedHideReview?.booking?.listing?.title}
        onConfirm={handleConfirmHide}
        loading={actionLoading === selectedHideReview?.id}
        title={t("modal.show.title")}
        message={t("modal.show.message")}
        confirmText={t("modal.show.confirm")}
        cancelText={t("modal.cancel")}
        variant="success"
      />
    </div>
  );
}