// app/[locale]/(dashboard)/owner/reviews/components/ReviewModal.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GrLinkNext } from "react-icons/gr";

const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;
const pipListing = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  tenantId: string;
  tenantUsername: string;
  tenantImage?: string;
  listingTitle: string;
  listingImage?: string;
  checkIn?: string;
  checkOut?: string;
  onSubmit: (data: ReviewData) => Promise<void>;
}

interface ReviewData {
  bookingId: string;
  cleanliness: number;
  communication: number;
  houseRules: number;
  comment: string;
  recommend: boolean;
}

export default function ReviewModal({
  isOpen,
  onClose,
  bookingId,
  tenantId,
  tenantUsername,
  tenantImage,
  listingTitle,
  listingImage,
  checkIn,
  checkOut,
  onSubmit,
}: ReviewModalProps) {
  const t = useTranslations("Reviews");
  const [cleanliness, setCleanliness] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [houseRules, setHouseRules] = useState(0);
  const [comment, setComment] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverClean, setHoverClean] = useState(0);
  const [hoverComm, setHoverComm] = useState(0);
  const [hoverRules, setHoverRules] = useState(0);
  const [imageError, setImageError] = useState(false);

  const tenantAvatarUrl = tenantImage ? pipAvatar(tenantImage) : null;
  const listingImgUrl = listingImage ? pipListing(listingImage) : null;
  const displayName = tenantUsername || `@${tenantId.slice(0, 8)}`;

const handleSubmit = async () => {
  if (cleanliness === 0 || communication === 0 || houseRules === 0) {
    alert(t("errors.ratingRequired"));
    return;
  }

  setIsSubmitting(true);
  try {
    await onSubmit({
      bookingId,
      cleanliness,
      communication,
      houseRules,
      comment,
      recommend,
    });
    onClose();
    setCleanliness(0);
    setCommunication(0);
    setHouseRules(0);
    setComment("");
    setRecommend(true);
  } catch (error) {
    console.error(error);
    alert(t("errors.submitError"));
  } finally {
    setIsSubmitting(false);
  }
};

  const StarRating = ({
    value,
    onChange,
    onHover,
    hoverValue,
    label,
  }: {
    value: number;
    onChange: (val: number) => void;
    onHover: (val: number) => void;
    hoverValue: number;
    label: string;
  }) => {
    return (
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <div className="flex flex-row-reverse gap-1">
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => onHover(star)}
              onMouseLeave={() => onHover(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  star <= (hoverValue || value)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-slate-900 w-full max-w-[560px] rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-headline text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t("title")}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 dark:text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-8 py-6 flex flex-col gap-8 max-h-[70vh] overflow-y-auto">
                {/* Tenant & Listing Info */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-sky-500 to-purple-600 flex-shrink-0">
                    {tenantAvatarUrl && !imageError ? (
                      <img
                        src={tenantAvatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline text-lg font-bold text-slate-900 dark:text-white">
                      @{displayName}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
                      {listingImgUrl ? (
                        <img
                          src={listingImgUrl}
                          alt={listingTitle}
                          className="w-4 h-4 rounded object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-sm">
                          home_work
                        </span>
                      )}
                      <span>{listingTitle}</span>
                    </div>
                    {checkIn && checkOut && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span>{new Date(checkIn).toLocaleDateString()}</span>
                        <GrLinkNext className="w-3 h-3" />
                        <span>{new Date(checkOut).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ratings */}
                <div className="space-y-5">
                  <StarRating
                    value={cleanliness}
                    onChange={setCleanliness}
                    onHover={setHoverClean}
                    hoverValue={hoverClean}
                    label={t("criteria.cleanliness")}
                  />
                  <StarRating
                    value={communication}
                    onChange={setCommunication}
                    onHover={setHoverComm}
                    hoverValue={hoverComm}
                    label={t("criteria.communication")}
                  />
                  <StarRating
                    value={houseRules}
                    onChange={setHouseRules}
                    onHover={setHoverRules}
                    hoverValue={hoverRules}
                    label={t("criteria.houseRules")}
                  />
                </div>

                {/* Comment */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t("comment")}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-none"
                    placeholder={t("commentPlaceholder")}
                  />
                </div>

                {/* Recommend Toggle */}
                <div className="flex items-center justify-between py-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t("recommend")}
                  </label>
                  <button
                    onClick={() => setRecommend(!recommend)}
                    className={`relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${
                      recommend
                        ? "bg-gradient-to-r from-sky-500 to-purple-600"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    <span className="sr-only">{t("recommend")}</span>
                    <div
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        recommend ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 flex items-center justify-end gap-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-purple-600 text-white font-semibold shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      {t("publishing")}
                    </>
                  ) : (
                    t("publish")
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
