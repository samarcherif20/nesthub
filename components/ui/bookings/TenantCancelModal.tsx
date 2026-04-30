// components/ui/booking/TenantCancelModal.tsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Modal from "@/components/ui/Modal";
import {
  IoCloseOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoHomeOutline,
  IoCashOutline,
  IoTimeOutline,
} from "react-icons/io5";

interface Booking {
  id: string;
  listing: { 
    title: string; 
    governorate: string; 
    delegation: string; 
    photos?: { url: string; isMain: boolean }[];  // ✅ photos, pas images
  };
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  pricePerNight?: number;
  nights?: number;
}

interface TenantCancelModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notes: string) => Promise<void>;
}

// ✅ Fonction pip pour les images des listings
const pipListingImage = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

export default function TenantCancelModal({ booking, isOpen, onClose, onConfirm }: TenantCancelModalProps) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setNotes("");
      setConfirmText("");
      setLoading(false);
      setImageError(false);
    }
  }, [isOpen]);

  const today = new Date();
  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);
  const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  const nights = booking.nights || Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));

  // Calcul du remboursement actuel
  const getCurrentRefund = () => {
    if (daysUntilCheckIn > 30) {
      return { percentage: 100, label: "Remboursement total", color: "text-green-600", bg: "bg-green-50" };
    } else if (daysUntilCheckIn > 7) {
      return { percentage: 50, label: "Remboursement partiel (50%)", color: "text-yellow-600", bg: "bg-yellow-50" };
    } else {
      return { percentage: 0, label: "Aucun remboursement", color: "text-red-600", bg: "bg-red-50" };
    }
  };

  const currentRefund = getCurrentRefund();
  const refundAmount = (booking.totalPrice * currentRefund.percentage) / 100;
  const cancellationFee = booking.totalPrice - refundAmount;

  // Les 3 cas de politique (toujours visibles)
  const refundTiers = [
    { 
      percentage: 100, 
      label: "Remboursement total", 
      days: "> 30 jours",
      dotColor: "bg-green-500",
      activeClass: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
      active: daysUntilCheckIn > 30
    },
    { 
      percentage: 50, 
      label: "Remboursement partiel (50%)", 
      days: "30 à 7 jours",
      dotColor: "bg-yellow-500",
      activeClass: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800",
      active: daysUntilCheckIn > 7 && daysUntilCheckIn <= 30
    },
    { 
      percentage: 0, 
      label: "Aucun remboursement", 
      days: "< 7 jours",
      dotColor: "bg-red-500",
      activeClass: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
      active: daysUntilCheckIn <= 7
    },
  ];

  const handleSubmit = async () => {
    if (!reason) {
      alert("Veuillez sélectionner une raison");
      return;
    }
    if (confirmText !== "ANNULER") {
      alert('Veuillez saisir "ANNULER" pour confirmer');
      return;
    }
    setLoading(true);
    await onConfirm(reason, notes);
    setLoading(false);
  };

  // ✅ Récupérer l'URL de la photo principale (isMain = true) ou la première photo
  const mainPhoto = booking.listing?.photos?.find(p => p.isMain) || booking.listing?.photos?.[0];
  const imageUrl = mainPhoto?.url ? pipListingImage(mainPhoto.url) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      className="max-w-lg"
      title={
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <IoCloseOutline className="text-xl" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-slate-900 dark:text-white text-sm font-bold leading-tight">
              Annuler ma réservation
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Vérifiez les détails du remboursement avant de confirmer.
            </p>
          </div>
        </div>
      }
    >
      <div className="p-4 space-y-4 -mt-6">
        {/* Booking Summary avec PIP */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700">
          <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
            {imageUrl && !imageError ? (
              <img 
                src={imageUrl} 
                alt={booking.listing?.title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <IoHomeOutline className="text-lg" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-xs text-slate-900 dark:text-white truncate">
              {booking.listing?.title}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <IoLocationOutline className="text-[10px]" />
              {booking.listing?.governorate}, {booking.listing?.delegation}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              <IoCalendarOutline className="inline text-[10px] mr-1" />
              {format(checkInDate, "dd MMM", { locale: fr })} - {format(checkOutDate, "dd MMM", { locale: fr })}
            </p>
          </div>
        </div>

        {/* Politique de remboursement - Les 3 cas visibles */}
        <div className="space-y-2">
          <label className="block text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
            Politique de remboursement
          </label>
          <div className="space-y-1.5">
            {refundTiers.map((tier) => (
              <div 
                key={tier.percentage}
                className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                  tier.active 
                    ? tier.activeClass
                    : "opacity-50 bg-gray-50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${tier.dotColor}`}></div>
                  <span className={`text-xs font-medium ${tier.active ? "text-slate-700 dark:text-slate-300" : "text-slate-500"}`}>
                    {tier.label}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">{tier.days}</span>
              </div>
            ))}
          </div>
        </div>

       

        {/* Détail du remboursement */}
        <div className="space-y-1.5">
          <label className="block text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
            Détail du remboursement
          </label>
          <div className="bg-gray-200/80 dark:bg-gray-800/30 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Total ({nights} nuits)</span>
              <span className="font-medium text-slate-900">{booking.totalPrice.toLocaleString("fr-FR")} TND</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Frais d'annulation ({100 - currentRefund.percentage}%)</span>
              <span className="font-medium text-slate-900">{cancellationFee.toLocaleString("fr-FR")} TND</span>
            </div>
            <div className="pt-1.5 mt-1 border-t border-slate-200 flex justify-between">
              <span className="font-semibold text-sm text-slate-900">Total remboursé</span>
              <span className={`font-bold text-sm ${currentRefund.color}`}>{refundAmount.toLocaleString("fr-FR")} TND</span>
            </div>
          </div>
        </div>

        {/* Raison de l'annulation */}
        <div className="space-y-1.5">
          <label className="block text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase tracking-wider">
            Raison de l'annulation <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
          >
            <option value="">Sélectionnez une raison...</option>
            <option value="plans_changed">Mes plans ont changé</option>
            <option value="better_option">J'ai trouvé une meilleure option</option>
            <option value="emergency">Urgence personnelle</option>
            <option value="mistake">Réservation faite par erreur</option>
            <option value="other">Autre</option>
          </select>
        </div>

        {/* Notes supplémentaires */}
        <div className="space-y-1.5">
          <label className="block text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase tracking-wider">
            Notes supplémentaires (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Dites-nous en plus sur votre annulation..."
            rows={2}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
          />
        </div>

        {/* Confirmation */}
        <div className="p-3 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-lg">
          <label className="block text-[10px] font-medium text-red-800 dark:text-red-300 mb-1">
            Pour confirmer, saisissez <span className="font-bold underline">ANNULER</span>
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 uppercase font-bold text-center tracking-widest"
            placeholder="ANNULER"
          />
        </div>
      </div>

      {/* Modal Footer */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          type="button"
        >
          Retour
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !reason || confirmText !== "ANNULER"}
          className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1"
          type="button"
        >
          {loading ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Annulation...
            </>
          ) : (
            "Confirmer l'annulation"
          )}
        </button>
      </div>
    </Modal>
  );
}