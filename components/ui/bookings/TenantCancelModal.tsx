// components/ui/booking/TenantCancelModal.tsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslations } from "next-intl";
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
    photos?: { url: string; isMain: boolean }[];
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

// Fonction pip pour les images des listings
const pipListingImage = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

export default function TenantCancelModal({
  booking,
  isOpen,
  onClose,
  onConfirm,
}: TenantCancelModalProps) {
  const t = useTranslations('tenant.cancel.modal');
  
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
  const daysUntilCheckIn = Math.ceil(
    (checkInDate.getTime() - today.getTime()) / (1000 * 3600 * 24),
  );
  const nights =
    booking.nights ||
    Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24),
    );

  // Calcul du remboursement actuel
  const getCurrentRefund = () => {
    if (daysUntilCheckIn > 30) {
      return {
        percentage: 100,
        label: t('full_refund'),
        color: "text-green-600",
        bg: "bg-green-50",
      };
    } else if (daysUntilCheckIn > 7) {
      return {
        percentage: 50,
        label: t('partial_refund'),
        color: "text-yellow-600",
        bg: "bg-yellow-50",
      };
    } else {
      return {
        percentage: 0,
        label: t('no_refund'),
        color: "text-red-600",
        bg: "bg-red-50",
      };
    }
  };

  const currentRefund = getCurrentRefund();
  const refundAmount = (booking.totalPrice * currentRefund.percentage) / 100;
  const cancellationFee = booking.totalPrice - refundAmount;

  // Les 3 cas de politique
  const refundTiers = [
    {
      percentage: 100,
      label: t('full_refund'),
      days: t('days_30_plus'),
      dotColor: "bg-green-500",
      activeClass:
        "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
      active: daysUntilCheckIn > 30,
    },
    {
      percentage: 50,
      label: t('partial_refund'),
      days: t('days_7_to_30'),
      dotColor: "bg-yellow-500",
      activeClass:
        "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800",
      active: daysUntilCheckIn > 7 && daysUntilCheckIn <= 30,
    },
    {
      percentage: 0,
      label: t('no_refund'),
      days: t('days_less_than_7'),
      dotColor: "bg-red-500",
      activeClass:
        "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
      active: daysUntilCheckIn <= 7,
    },
  ];

  const handleSubmit = async () => {
    if (!reason) {
      alert(t('alert_select_reason'));
      return;
    }
    if (confirmText !== "ANNULER") {
      alert(t('alert_confirm_word'));
      return;
    }
    setLoading(true);
    try {
      await onConfirm(reason, notes);
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      alert(t('alert_error'));
    } finally {
      setLoading(false);
    }
  };

  const mainPhoto =
    booking.listing?.photos?.find((p) => p.isMain) ||
    booking.listing?.photos?.[0];
  const imageUrl = mainPhoto?.url ? pipListingImage(mainPhoto.url) : null;

  const isButtonEnabled = !loading && reason && confirmText === "ANNULER";

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
              {t('title')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              {t('subtitle')}
            </p>
          </div>
        </div>
      }
    >
      <div className="p-4 space-y-4 -mt-6">
        {/* Booking Summary */}
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
              {format(checkInDate, "dd MMM", { locale: fr })} -{" "}
              {format(checkOutDate, "dd MMM", { locale: fr })}
            </p>
          </div>
        </div>

        {/* Politique de remboursement */}
        <div className="space-y-2">
          <label className="block text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
            {t('refund_policy')}
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
                  <div
                    className={`w-2 h-2 rounded-full ${tier.dotColor}`}
                  ></div>
                  <span
                    className={`text-xs font-medium ${tier.active ? "text-slate-700 dark:text-slate-300" : "text-slate-500"}`}
                  >
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
            {t('refund_details')}
          </label>
          <div className="bg-gray-200/80 dark:bg-gray-800/30 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">
                {t('total_nights', { nights })}
              </span>
              <span className="font-medium text-slate-900">
                {booking.totalPrice.toLocaleString("fr-FR")} TND
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">
                {t('cancellation_fee', { percentage: 100 - currentRefund.percentage })}
              </span>
              <span className="font-medium text-slate-900">
                {cancellationFee.toLocaleString("fr-FR")} TND
              </span>
            </div>
            <div className="pt-1.5 mt-1 border-t border-slate-200 flex justify-between">
              <span className="font-semibold text-sm text-slate-900">
                {t('total_refunded')}
              </span>
              <span className={`font-bold text-sm ${currentRefund.color}`}>
                {refundAmount.toLocaleString("fr-FR")} TND
              </span>
            </div>
          </div>
        </div>

        {/* Raison de l'annulation */}
        <div className="space-y-1.5">
          <label className="block text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase tracking-wider">
            {t('reason_label')} <span className="text-red-500">{t('reason_required')}</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
          >
            <option value="">{t('reason_placeholder')}</option>
            <option value="plans_changed">{t('reason_plans_changed')}</option>
            <option value="better_option">{t('reason_better_option')}</option>
            <option value="emergency">{t('reason_emergency')}</option>
            <option value="mistake">{t('reason_mistake')}</option>
            <option value="other">{t('reason_other')}</option>
          </select>
        </div>

        {/* Notes supplémentaires */}
        <div className="space-y-1.5">
          <label className="block text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase tracking-wider">
            {t('notes_label')} {t('notes_optional')}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('notes_placeholder')}
            rows={2}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
          />
        </div>

        {/* Confirmation */}
        <div className="p-3 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-lg">
          <label className="block text-[10px] font-medium text-red-800 dark:text-red-300 mb-1">
            {t('confirm_label')}{" "}
            <span className="font-bold underline">{t('confirm_word')}</span>
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 text-xs rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 uppercase font-bold text-center tracking-widest"
            placeholder={t('confirm_placeholder')}
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
          {t('button_back')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isButtonEnabled}
          className={`px-4 py-2 rounded-lg text-white text-xs font-medium shadow-sm transition-all duration-200 flex items-center gap-1 ${
            isButtonEnabled
              ? "bg-red-600 hover:bg-red-700 active:scale-95 cursor-pointer"
              : "bg-red-400 cursor-not-allowed opacity-50"
          }`}
          type="button"
        >
          {loading ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('button_cancelling')}
            </>
          ) : (
            t('button_confirm')
          )}
        </button>
      </div>
    </Modal>
  );
}