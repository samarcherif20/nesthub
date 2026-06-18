"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  IoCalendarOutline,
  IoPeopleOutline,
  IoWalletOutline,
  IoHomeOutline,
  IoBedOutline,
  IoLocationOutline,
  IoStarSharp,
  IoCloseOutline,
  IoPencilOutline,
  IoSaveOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { MdHolidayVillage } from "react-icons/md";

// Helper pour l'image du listing
const pipListingImage = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

interface Listing {
  id: string;
  title: string;
  image?: string;
  pricePerNight?: number;
  location?: string;
  rating?: number;
  bedrooms?: number;
  maxGuests?: number;
  cleaningFee?: number;
  type?: string;
}

interface EditableBookingCardProps {
  listing: Listing;
  infoRequestId: string;
  initialCheckIn: string;
  initialCheckOut: string;
  initialGuests: number;
  onUpdate: (updatedInfoRequest: any) => void;
  onSendSystemMessage: (message: string) => void;
  isOfferAccepted?: boolean;
  offerStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  isPaid?: boolean;
    conversationId: string; 

}

function fmtDate(dateStr: string, locale: string = "fr") {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
}

function formatDateForInput(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

function normalizeDateForAPI(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

function nightsBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  return Math.max(
    0,
    Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000),
  );
}

// Composant d'étoiles pour la note
function StarRating({ rating }: { rating: number }) {
  const t = useTranslations("MessagesPage");
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {rating > 0 ? (
        <>
          {[...Array(fullStars)].map((_, i) => (
            <IoStarSharp
              key={`full-${i}`}
              className="text-amber-400 text-[10px] fill-amber-400"
            />
          ))}
          {hasHalfStar && (
            <div className="relative">
              <IoStarSharp className="text-gray-300 dark:text-gray-600 text-[10px]" />
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <IoStarSharp className="text-amber-400 text-[10px] fill-amber-400" />
              </div>
            </div>
          )}
          {[...Array(emptyStars)].map((_, i) => (
            <IoStarSharp
              key={`empty-${i}`}
              className="text-gray-300 dark:text-gray-600 text-[10px]"
            />
          ))}
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 ml-1">
            {rating.toFixed(1)}
          </span>
        </>
      ) : (
        <>
          {[...Array(5)].map((_, i) => (
            <IoStarSharp
              key={`empty-${i}`}
              className="text-gray-300 dark:text-gray-600 text-[10px]"
            />
          ))}
          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
            {t("booking.noRating")}
          </span>
        </>
      )}
    </div>
  );
}

export function EditableBookingCard({
  listing,
  infoRequestId,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  onUpdate,
  onSendSystemMessage,
  isOfferAccepted = false,
  offerStatus,
  isPaid = false,
}: EditableBookingCardProps) {
  const t = useTranslations("MessagesPage");
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgErr, setImgErr] = useState(false);

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const basePrice = nights * (listing.pricePerNight || 0);
  const cleaningFee = listing.cleaningFee || 0;
  const serviceFee = Math.round(basePrice * 0.05);
  const totalPrice = basePrice + cleaningFee + serviceFee;

  const listingImageUrl = listing.image ? pipListingImage(listing.image) : null;

  // Désactiver l'édition si offre acceptée ET paiement effectué
  const isLocked = (isOfferAccepted || offerStatus === "ACCEPTED") && isPaid;
  const isOfferPending = offerStatus === "PENDING" && !isPaid;
  const hasOffer = offerStatus !== undefined && offerStatus !== null;
  const isOfferAcceptedNotPaid = offerStatus === "ACCEPTED" && !isPaid;

  // Valeurs par défaut pour l'affichage
  const maxGuests = listing.maxGuests ?? null;
  const bedrooms = listing.bedrooms ?? null;

  // Déterminer la classe de bordure selon le statut
  const getBorderClass = () => {
    if (isLocked) {
      return "border-emerald-500 dark:border-emerald-500 shadow-emerald-100 dark:shadow-emerald-950/30";
    }
    if (isOfferAcceptedNotPaid) {
      return "border-blue-500 dark:border-blue-500 shadow-blue-100 dark:shadow-blue-950/30";
    }
    if (isOfferPending) {
      return "border-amber-500 dark:border-amber-500 shadow-amber-100 dark:shadow-amber-950/30";
    }
    return "border-slate-200 dark:border-slate-800";
  };

  const hasChanges = () => {
    return (
      checkIn !== initialCheckIn ||
      checkOut !== initialCheckOut ||
      guests !== initialGuests
    );
  };

  const validateDates = () => {
    if (!checkIn || !checkOut) {
      setError(t("booking.errors.datesRequired"));
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate < today) {
      setError(t("booking.errors.pastDate"));
      return false;
    }
    if (checkOutDate <= checkInDate) {
      setError(t("booking.errors.invalidDates"));
      return false;
    }
    if (maxGuests && guests && guests > maxGuests) {
      setError(t("booking.errors.maxGuests", { max: maxGuests }));
      return false;
    }
    return true;
  };

const handleSave = async () => {
  if (isLocked) {
    setError(t("booking.errors.locked"));
    return;
  }
  if (!validateDates()) return;

  setIsLoading(true);
  setError(null);

  try {
    const formattedCheckIn = normalizeDateForAPI(checkIn);
    const formattedCheckOut = normalizeDateForAPI(checkOut);

    const response = await fetch(`/api/info-requests/${infoRequestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkIn: formattedCheckIn,
        checkOut: formattedCheckOut,
        guests: guests || 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || t("booking.errors.updateFailed"));
    }

    const data = await response.json();

    const oldDates = `${fmtDate(initialCheckIn, t.locale)} → ${fmtDate(initialCheckOut, t.locale)}`;
    const newDates = `${fmtDate(checkIn, t.locale)} → ${fmtDate(checkOut, t.locale)}`;
    const guestText = guests
      ? `${guests} ${guests > 1 ? t("booking.guestsPlural") : t("booking.guestsSingular")}`
      : t("booking.notSpecified");
    const oldGuestText = initialGuests
      ? `${initialGuests} ${initialGuests > 1 ? t("booking.guestsPlural") : t("booking.guestsSingular")}`
      : t("booking.notSpecified");

    const systemMessage = t("booking.systemMessage.updated", {
      oldDates,
      newDates,
      oldGuests: oldGuestText,
      newGuests: guestText,
      total: totalPrice.toLocaleString("fr-FR"),
    });

    // Appeler la fonction passée en prop
    onSendSystemMessage(systemMessage);
    onUpdate(data.infoRequest);
    setIsEditing(false);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

  const handleCancel = () => {
    setCheckIn(initialCheckIn);
    setCheckOut(initialCheckOut);
    setGuests(initialGuests);
    setIsEditing(false);
    setError(null);
  };

  const handleGuestsChange = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      setGuests(0);
    } else if (maxGuests && maxGuests > 0 && numValue > maxGuests) {
      setGuests(maxGuests);
    } else {
      setGuests(numValue);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border-2 ${getBorderClass()} overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center shadow-md">
              <MdHolidayVillage className="text-white text-sm" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                {t("booking.title")}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {isLocked
                  ? t("booking.confirmed")
                  : isOfferAcceptedNotPaid
                    ? t("booking.offerAcceptedPendingPayment")
                    : hasOffer && offerStatus === "PENDING"
                      ? t("booking.offerPending")
                      : t("booking.infoRequest")}
              </p>
            </div>
          </div>

          {/* Bouton Modifier : UNIQUEMENT si pas d'offre existante */}
          {!isEditing && !isLocked && !hasOffer && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-950/30 dark:to-purple-950/30 text-sky-600 dark:text-sky-400 hover:from-sky-100 hover:to-purple-100 transition-all"
            >
              <IoPencilOutline className="text-xs" />
              {t("booking.edit")}
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Listing info */}
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-sky-100 to-purple-100 dark:from-slate-800 dark:to-slate-700 flex-shrink-0 shadow-sm">
            {listingImageUrl && !imgErr ? (
              <img
                src={listingImageUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
                onError={() => setImgErr(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center">
                <IoHomeOutline className="text-white text-xl opacity-80" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-snug line-clamp-2 mb-1">
              {listing.title}
            </h4>
            {listing.location && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                <IoLocationOutline className="text-xs shrink-0" />
                {listing.location}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StarRating rating={listing.rating || 0} />

              {/* Chambres - Affiche "Non spécifié" si null */}
              {bedrooms !== null && bedrooms !== undefined && bedrooms > 0 ? (
                <span className="flex items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                  <IoBedOutline className="text-[10px]" />
                  {bedrooms}{" "}
                  {bedrooms > 1
                    ? t("booking.bedroomsPlural")
                    : t("booking.bedroomsSingular")}
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                  <IoBedOutline className="text-[10px]" />
                  {t("booking.notSpecified")}
                </span>
              )}

              {/* Max voyageurs - Affiche "Non spécifié" si null ou 0 */}
              {maxGuests !== null &&
              maxGuests !== undefined &&
              maxGuests > 0 ? (
                <span className="flex items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                  <IoPeopleOutline className="text-[10px]" />
                  {maxGuests}{" "}
                  {maxGuests > 1
                    ? t("booking.maxGuestsPlural")
                    : t("booking.maxGuestsSingular")}
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                  <IoPeopleOutline className="text-[10px]" />
                  {t("booking.notSpecified")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div
          className={`rounded-xl p-4 space-y-3 ${
            isLocked || isOfferAcceptedNotPaid
              ? "bg-slate-50 dark:bg-slate-800/30"
              : "bg-gradient-to-br from-sky-50 to-purple-50 dark:from-sky-950/20 dark:to-purple-950/20"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center">
              <IoCalendarOutline className="text-white text-sm" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
              {t("booking.dates")}
            </span>
            {(isLocked || isOfferAcceptedNotPaid) && (
              <IoTimeOutline className="text-slate-400 text-xs ml-auto" />
            )}
          </div>

          {isEditing && !isLocked && !hasOffer ? (
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">
                  {t("booking.checkIn")}
                </label>
                <input
                  type="date"
                  value={formatDateForInput(checkIn) || ""}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">
                  {t("booking.checkOut")}
                </label>
                <input
                  type="date"
                  value={formatDateForInput(checkOut) || ""}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={
                    checkIn
                      ? formatDateForInput(checkIn)
                      : new Date().toISOString().split("T")[0]
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("booking.checkIn")}
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  {fmtDate(checkIn, t.locale) || t("booking.notSpecified")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("booking.checkOut")}
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  {fmtDate(checkOut, t.locale) || t("booking.notSpecified")}
                </span>
              </div>
              {nights > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t("booking.duration")}
                  </span>
                  <span className="text-sm font-bold bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
                    {nights}{" "}
                    {nights > 1
                      ? t("booking.nightsPlural")
                      : t("booking.nightsSingular")}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Guests */}
        <div
          className={`rounded-xl p-4 space-y-3 ${
            isLocked || isOfferAcceptedNotPaid
              ? "bg-slate-50 dark:bg-slate-800/30"
              : "bg-gradient-to-br from-sky-50 to-purple-50 dark:from-sky-950/20 dark:to-purple-950/20"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center">
              <IoPeopleOutline className="text-white text-sm" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
              {t("booking.guests")}
            </span>
          </div>

          {isEditing && !isLocked && !hasOffer ? (
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">
                {t("booking.numberOfGuests")}
              </label>
              <input
                type="number"
                value={guests || ""}
                onChange={(e) => handleGuestsChange(e.target.value)}
                placeholder={t("booking.guestsPlaceholder")}
                min="0"
                max={maxGuests || 10}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {t("booking.guestsOptional")}
              </p>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {t("booking.guests")}
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-white">
                {guests && guests > 0
                  ? `${guests} ${guests > 1 ? t("booking.guestsPlural") : t("booking.guestsSingular")}`
                  : t("booking.notSpecified")}
              </span>
            </div>
          )}
        </div>

        {/* Price - Ne s'affiche que si pricePerNight existe et > 0 */}
        {nights > 0 && listing.pricePerNight && listing.pricePerNight > 0 && (
          <div
            className={`rounded-xl p-4 ${
              isLocked || isOfferAcceptedNotPaid
                ? "bg-slate-50 dark:bg-slate-800/30"
                : "bg-gradient-to-br from-sky-50 to-purple-50 dark:from-sky-950/20 dark:to-purple-950/20"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center">
                <IoWalletOutline className="text-white text-sm" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
                {t("booking.priceDetails")}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>
                  {listing.pricePerNight.toLocaleString("fr-FR")} TND × {nights}{" "}
                  {nights > 1
                    ? t("booking.nightsPlural")
                    : t("booking.nightsSingular")}
                </span>
                <span>{basePrice.toLocaleString("fr-FR")} TND</span>
              </div>
              {cleaningFee > 0 && (
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span>{t("booking.cleaningFee")}</span>
                  <span>{cleaningFee.toLocaleString("fr-FR")} TND</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>{t("booking.serviceFee")}</span>
                <span>{serviceFee.toLocaleString("fr-FR")} TND</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-extrabold">
                <span className="bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
                  {t("booking.total")}
                </span>
                <span className="bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent text-base">
                  {totalPrice.toLocaleString("fr-FR")} TND
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Messages status */}
        {isLocked && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 text-center border border-emerald-200 dark:border-emerald-800/30">
            <div className="flex items-center justify-center gap-2">
              <IoCheckmarkCircleOutline className="text-emerald-500 text-sm" />
              <p className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                {t("booking.lockedMessage")}
              </p>
            </div>
          </div>
        )}

        {/* Offre acceptée mais pas encore payée */}
        {isOfferAcceptedNotPaid && (
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3 text-center border border-blue-200 dark:border-blue-800/30">
            <div className="flex items-center justify-center gap-2">
              <IoCheckmarkCircleOutline className="text-blue-500 text-sm" />
              <p className="text-blue-600 dark:text-blue-400 text-[11px] font-medium">
                Offre acceptée - En attente de paiement
              </p>
            </div>
          </div>
        )}

        {/* Offre en attente */}
        {hasOffer && !isLocked && !isEditing && offerStatus === "PENDING" && (
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 text-center border border-amber-200 dark:border-amber-800/30">
            <div className="flex items-center justify-center gap-2">
              <IoTimeOutline className="text-amber-500 text-sm" />
              <p className="text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                {t("booking.pendingMessage")}
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 text-center border border-red-200 dark:border-red-800/30">
            <p className="text-red-500 dark:text-red-400 text-[11px] font-medium">
              {error}
            </p>
          </div>
        )}

        {/* Action buttons */}
        {isEditing && !isLocked && !hasOffer && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              <IoCloseOutline className="text-base" />
              {t("booking.cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !hasChanges()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <IoSaveOutline className="text-base" />
              )}
              {t("booking.save")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
