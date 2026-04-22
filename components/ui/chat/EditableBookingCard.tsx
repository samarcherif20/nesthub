// components/ui/chat/EditableBookingCard.tsx
"use client";

import { useState, useEffect } from "react";
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
  isOfferAccepted?: boolean; // ✅ AJOUT : Indique si une offre a été acceptée
  offerStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED"; // ✅ AJOUT
}

function fmtDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateForInput(dateStr: string) {
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

export function EditableBookingCard({
  listing,
  infoRequestId,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  onUpdate,
  onSendSystemMessage,
  isOfferAccepted = false, // ✅ DÉFAUT: false
  offerStatus,
}: EditableBookingCardProps) {
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgErr, setImgErr] = useState(false);

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const basePrice = nights * (listing.pricePerNight || 0);
  const cleaningFee = listing.cleaningFee || 85;
  const serviceFee = Math.round(basePrice * 0.05);
  const totalPrice = basePrice + cleaningFee + serviceFee;

  const listingImageUrl = listing.image ? pipListingImage(listing.image) : null;

  // ✅ Vérifier si les modifications sont bloquées (offre acceptée)
  const isLocked = isOfferAccepted || offerStatus === "ACCEPTED";

  const hasChanges = () => {
    return (
      checkIn !== initialCheckIn ||
      checkOut !== initialCheckOut ||
      guests !== initialGuests
    );
  };

  const validateDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate < today) {
      setError("La date d'arrivée ne peut pas être dans le passé");
      return false;
    }
    if (checkOutDate <= checkInDate) {
      setError("La date de départ doit être après la date d'arrivée");
      return false;
    }
    if (guests < 1) {
      setError("Minimum 1 voyageur");
      return false;
    }
    if (listing.maxGuests && guests > listing.maxGuests) {
      setError(`Maximum ${listing.maxGuests} voyageurs`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (isLocked) {
      setError("Les dates sont verrouillées car l'offre a été acceptée");
      return;
    }
    if (!validateDates()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/info-requests/${infoRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkIn, checkOut, guests }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la modification");
      }

      const data = await response.json();

      const oldDates = `${fmtDate(initialCheckIn)} → ${fmtDate(initialCheckOut)}`;
      const newDates = `${fmtDate(checkIn)} → ${fmtDate(checkOut)}`;
      const systemMessage = `🔄 **Demande modifiée**\n\n📅 Période : ${oldDates} → ${newDates}\n👥 Voyageurs : ${initialGuests} → ${guests} personne${guests > 1 ? "s" : ""}\n\n💰 Nouveau prix : ${totalPrice.toLocaleString("fr-FR")} TND`;

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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Header blanc avec bordure */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center shadow-md">
              <MdHolidayVillage className="text-white text-sm" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                Détails du séjour
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {isLocked ? "Réservation confirmée" : "Votre demande d'information"}
              </p>
            </div>
          </div>
          {!isEditing && !isLocked && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-950/30 dark:to-purple-950/30 text-sky-600 dark:text-sky-400 hover:from-sky-100 hover:to-purple-100 transition-all"
            >
              <IoPencilOutline className="text-xs" />
              Modifier
            </button>
          )}
          {/* ✅ Badge si offre acceptée */}
          {isLocked && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40">
              <IoCheckmarkCircleOutline className="text-emerald-600 dark:text-emerald-400 text-xs" />
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                Offre acceptée
              </span>
            </div>
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
              {listing.rating && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30">
                  <IoStarSharp className="text-amber-400 text-[10px]" />
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    {listing.rating}
                  </span>
                </span>
              )}
              {listing.bedrooms && (
                <span className="flex items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <IoBedOutline className="text-xs" />
                  {listing.bedrooms} ch.
                </span>
              )}
              {listing.maxGuests && (
                <span className="flex items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <IoPeopleOutline className="text-xs" />
                  {listing.maxGuests} pers.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dates - avec style verrouillé si isLocked */}
        <div className={`rounded-xl p-4 space-y-3 ${
          isLocked 
            ? "bg-slate-50 dark:bg-slate-800/30" 
            : "bg-gradient-to-br from-sky-50 to-purple-50 dark:from-sky-950/20 dark:to-purple-950/20"
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center">
              <IoCalendarOutline className="text-white text-sm" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
              Dates du séjour
            </span>
            {isLocked && <IoTimeOutline className="text-slate-400 text-xs ml-auto" />}
          </div>

          {isEditing && !isLocked ? (
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">
                  Arrivée
                </label>
                <input
                  type="date"
                  value={formatDateForInput(checkIn)}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                  disabled={isLocked}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">
                  Départ
                </label>
                <input
                  type="date"
                  value={formatDateForInput(checkOut)}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                  disabled={isLocked}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Arrivée
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  {fmtDate(checkIn)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Départ
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  {fmtDate(checkOut)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Durée
                </span>
                <span className="text-sm font-bold bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
                  {nights} nuit{nights > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Guests */}
        <div className={`rounded-xl p-4 space-y-3 ${
          isLocked 
            ? "bg-slate-50 dark:bg-slate-800/30" 
            : "bg-gradient-to-br from-sky-50 to-purple-50 dark:from-sky-950/20 dark:to-purple-950/20"
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center">
              <IoPeopleOutline className="text-white text-sm" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
              Voyageurs
            </span>
          </div>

          {isEditing && !isLocked ? (
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">
                Nombre de personnes
              </label>
              <input
                type="number"
                value={guests}
                onChange={(e) =>
                  setGuests(Math.max(1, parseInt(e.target.value) || 1))
                }
                min="1"
                max={listing.maxGuests || 10}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                disabled={isLocked}
              />
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Personnes
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-white">
                {guests} personne{guests > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Price */}
        {nights > 0 && listing.pricePerNight && (
          <div className={`rounded-xl p-4 ${
            isLocked 
              ? "bg-slate-50 dark:bg-slate-800/30" 
              : "bg-gradient-to-br from-sky-50 to-purple-50 dark:from-sky-950/20 dark:to-purple-950/20"
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center">
                <IoWalletOutline className="text-white text-sm" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
                Détail du prix
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>
                  {listing.pricePerNight.toLocaleString("fr-FR")} TND × {nights}{" "}
                  nuit{nights > 1 ? "s" : ""}
                </span>
                <span>{basePrice.toLocaleString("fr-FR")} TND</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>Frais de ménage</span>
                <span>{cleaningFee} TND</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>Frais de service</span>
                <span>{serviceFee} TND</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-extrabold">
                <span className="bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
                  Total
                </span>
                <span className="bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent text-base">
                  {totalPrice.toLocaleString("fr-FR")} TND
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Message verrouillé si offre acceptée */}
        {isLocked && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 text-center border border-emerald-200 dark:border-emerald-800/30">
            <div className="flex items-center justify-center gap-2">
              <IoCheckmarkCircleOutline className="text-emerald-500 text-sm" />
              <p className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                Offre acceptée - Les dates sont verrouillées
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
        {isEditing && !isLocked && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              <IoCloseOutline className="text-base" />
              Annuler
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
              Enregistrer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}