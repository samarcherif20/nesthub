// components/ui/modals/ReviewModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  IoCloseOutline,
  IoStar,
  IoStarOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoSendOutline,
  IoSpeedometerOutline,
  IoChatbubbleOutline,
  IoBusinessOutline,
  IoLocationOutline,
  IoCashOutline,
  IoTimeOutline,
  IoHomeOutline,
  IoCheckmarkCircle,
} from "react-icons/io5";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  booking: any;
}

// Helper pour les images
const pipListing = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;
const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

export function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  booking,
}: ReviewModalProps) {
  const t = useTranslations("ReviewModal");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [criteria, setCriteria] = useState({
    cleanliness: 0,
    communication: 0,
    checkIn: 0,
    accuracy: 0,
    location: 0,
    value: 0,
  });
  const [publicComment, setPublicComment] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setRating(0);
        setCriteria({
          cleanliness: 0,
          communication: 0,
          checkIn: 0,
          accuracy: 0,
          location: 0,
          value: 0,
        });
        setPublicComment("");
        setPrivateNote("");
        setShowSuccess(false);
        setImgError(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleCriteriaChange = (criterion: string, value: number) => {
    setCriteria((prev) => ({ ...prev, [criterion]: value }));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert(t("errors.ratingRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        rating,
        criteria,
        publicComment,
        privateNote,
        targetType: "LISTING",
      });
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert(t("errors.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (v: number) => void;
  }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-3xl transition-all hover:scale-110 active:scale-95 focus:outline-none"
          >
            {star <= (hoverRating || value) ? (
              <IoStar className="text-amber-500 fill-amber-500 drop-shadow-sm" />
            ) : (
              <IoStarOutline className="text-slate-300" />
            )}
          </button>
        ))}
      </div>
    );
  };

  const CriteriaSlider = ({
    icon: Icon,
    label,
    value,
    onChange,
  }: {
    icon: any;
    label: string;
    value: number;
    onChange: (v: number) => void;
  }) => {
    const percentage = (value / 5) * 100;

    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-sm">
              <Icon className="text-xs" />
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {label}
            </span>
          </div>
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 px-2 py-0.5 rounded-full">
            {value === 0 ? "—" : value.toFixed(1)}
          </span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #0ea5e9 ${percentage}%, #e2e8f0 ${percentage}%)`,
            }}
          />
        </div>
      </div>
    );
  };

  const averageCriteria =
    Object.values(criteria).reduce((a, b) => a + b, 0) /
    Object.values(criteria).length;
  const hostName =
    booking?.owner?.username || booking?.owner?.firstName || t("host");

  const listingImage =
    booking?.listing?.photos?.[0]?.url || booking?.listing?.image;
  const ownerAvatar = booking?.owner?.profilePictureUrl;
  const listingLocation =
    booking?.listing?.location ||
    `${booking?.listing?.delegation || ""}, ${booking?.listing?.governorate || ""}`.replace(
      /^, /,
      "",
    );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="max-w-5xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
          {/* Left Side - Background Image with Overlay */}
          <div className="relative w-full md:w-5/12 overflow-hidden">
            {listingImage && !imgError ? (
              <>
                <img
                  src={pipListing(listingImage)}
                  alt={booking?.listing?.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900" />
            )}

            <div className="relative h-full flex flex-col justify-between p-6 md:p-8 min-h-[300px] md:min-h-full">
              <div>
                <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                    {t("badge")}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2">
                  {t("title")}
                </h2>
                <p className="text-white/70 text-sm">{t("subtitle")}</p>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-[10px] font-semibold tracking-wider text-white/50 uppercase mb-1">
                    {t("stayAt")}
                  </p>
                  <h3 className="text-lg md:text-xl font-bold text-white leading-tight line-clamp-2">
                    {booking?.listing?.title}
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white/80">
                    <IoCalendarOutline className="text-sm" />
                    <span className="text-xs">
                      {booking && formatDate(booking.checkIn)} —{" "}
                      {booking && formatDate(booking.checkOut)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <IoLocationOutline className="text-sm" />
                    <span className="text-xs">
                      {listingLocation || t("locationNotSpecified")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <IoHomeOutline className="text-sm" />
                    <span className="text-xs">
                      {booking?.listing?.type || t("property")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-white/20">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {ownerAvatar ? (
                      <img
                        src={pipAvatar(ownerAvatar)}
                        alt={hostName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <IoPersonOutline className="text-white text-lg" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {hostName}
                    </p>
                    <p className="text-[10px] text-white/60">{t("yourHost")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Review Form */}
          <div className="w-full md:w-7/12 p-6 md:p-8 overflow-y-auto max-h-[90vh] bg-white dark:bg-slate-900">
            <div className="space-y-6">
              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  <IoCloseOutline className="text-xl" />
                </button>
              </div>

              {/* Overall Rating */}
              <div className="text-center md:text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 block">
                  {t("overallRating")}
                </label>
                <div className="flex justify-center md:justify-start">
                  <StarRating value={rating} onChange={handleRatingClick} />
                </div>
                {rating === 0 && (
                  <p className="text-[10px] text-amber-500 mt-1">
                    {t("clickToRate")}
                  </p>
                )}
              </div>

              {/* Detailed Criteria */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t("detailedCriteria")}
                  </label>
                  {averageCriteria > 0 && (
                    <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 px-2 py-0.5 rounded-full">
                      {t("average")} {averageCriteria.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CriteriaSlider
                    icon={IoSpeedometerOutline}
                    label={t("criteria.cleanliness")}
                    value={criteria.cleanliness}
                    onChange={(v) => handleCriteriaChange("cleanliness", v)}
                  />
                  <CriteriaSlider
                    icon={IoChatbubbleOutline}
                    label={t("criteria.communication")}
                    value={criteria.communication}
                    onChange={(v) => handleCriteriaChange("communication", v)}
                  />
                  <CriteriaSlider
                    icon={IoTimeOutline}
                    label={t("criteria.checkIn")}
                    value={criteria.checkIn}
                    onChange={(v) => handleCriteriaChange("checkIn", v)}
                  />
                  <CriteriaSlider
                    icon={IoBusinessOutline}
                    label={t("criteria.accuracy")}
                    value={criteria.accuracy}
                    onChange={(v) => handleCriteriaChange("accuracy", v)}
                  />
                  <CriteriaSlider
                    icon={IoLocationOutline}
                    label={t("criteria.location")}
                    value={criteria.location}
                    onChange={(v) => handleCriteriaChange("location", v)}
                  />
                  <CriteriaSlider
                    icon={IoCashOutline}
                    label={t("criteria.value")}
                    value={criteria.value}
                    onChange={(v) => handleCriteriaChange("value", v)}
                  />
                </div>
              </div>

              {/* Public Comment */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  {t("publicComment")}
                </label>
                <textarea
                  value={publicComment}
                  onChange={(e) => setPublicComment(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 resize-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder={t("publicCommentPlaceholder")}
                />
              </div>

              {/* Private Note */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  {t("privateNote", { hostName })}
                </label>
                <textarea
                  value={privateNote}
                  onChange={(e) => setPrivateNote(e.target.value)}
                  rows={2}
                  className="w-full p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 resize-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 italic"
                  placeholder={t("privateNotePlaceholder")}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || rating === 0}
                  className="w-full sm:w-auto px-8 py-2.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("submitting")}
                    </>
                  ) : (
                    <>
                      <IoSendOutline className="text-xs" />
                      {t("publish")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
