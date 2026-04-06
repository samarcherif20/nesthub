// components/ui/DeleteListingModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Trash2, AlertCircle, Calendar, X } from "lucide-react";
import { MdWarningAmber } from "react-icons/md";

interface DeleteListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cancelBookings?: boolean) => void;
  isLoading?: boolean;
  listingTitle?: string;
  hasBookings?: boolean;
  bookingsCount?: number;
}

const block3d = "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";

export default function DeleteListingModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  listingTitle,
  hasBookings = false,
  bookingsCount = 0,
}: DeleteListingModalProps) {
  const t = useTranslations("OwnerListings.deleteModal");
  const [cancelBookings, setCancelBookings] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [step, setStep] = useState<"confirm" | "type">("confirm");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Si l'annonce a des réservations, on montre d'abord l'option
      if (hasBookings && bookingsCount > 0) {
        setStep("confirm");
      } else {
        setStep("type");
      }
      setCancelBookings(false);
      setConfirmText("");
    }
  }, [isOpen, hasBookings, bookingsCount]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (step === "type" && confirmText !== "SUPPRIMER") return;
    onConfirm(cancelBookings);
  };

  const resetModal = () => {
    setCancelBookings(false);
    setConfirmText("");
    if (hasBookings && bookingsCount > 0) {
      setStep("confirm");
    } else {
      setStep("type");
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Si on est à l'étape confirm (avec réservations) et qu'on choisit d'annuler ou non
  const handleStepProceed = () => {
    setStep("type");
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div 
        className={`bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-rose-100 dark:border-rose-900/30 ${block3d}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header with close button */}
          <div className="flex justify-end -mt-2 -mr-2">
            <button 
              onClick={handleClose} 
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
              <Trash2 size={26} className="text-rose-600 dark:text-rose-400" />
            </div>
            
            {/* Title */}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {t("title")}
            </h3>
            
            {/* Description */}
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t("description")}
            </p>

            {/* Afficher le titre de l'annonce si disponible */}
            {listingTitle && (
              <div className="w-full mb-4 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                  « {listingTitle} »
                </p>
              </div>
            )}
            
            {/* Warning message */}
            <div className="w-full p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 mb-4">
              <p className="text-xs text-rose-700 dark:text-rose-400 font-medium flex items-center gap-1.5">
                <MdWarningAmber className="text-sm flex-shrink-0" />
                {t("warning")}
              </p>
            </div>

            {/* Étape 1: Option d'annulation des réservations (si des réservations existent) */}
            {step === "confirm" && hasBookings && bookingsCount > 0 && (
              <div className="w-full mb-4">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                  <div className="flex items-start gap-3">
                    <Calendar size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                        {bookingsCount} réservation(s) en cours
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                        Cette annonce a des réservations actives.
                      </p>
                      <label className="flex items-center gap-2 mt-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cancelBookings}
                          onChange={(e) => setCancelBookings(e.target.checked)}
                          className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs text-amber-700 dark:text-amber-400">
                          Annuler automatiquement les réservations en cours
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleStepProceed}
                  className="w-full mt-3 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
                >
                  Continuer
                </button>
              </div>
            )}

            {/* Étape 2: Confirmation par texte (suppression définitive) */}
            {step === "type" && (
              <>
                <div className="w-full mb-4">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 text-left">
                    Tapez <span className="font-bold text-rose-600">SUPPRIMER</span> pour confirmer la suppression définitive
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="SUPPRIMER"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all uppercase text-center font-mono"
                    autoFocus
                  />
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isLoading || confirmText !== "SUPPRIMER"}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t("deleting")}
                      </>
                    ) : (
                      <>
                        <Trash2 size={14} />
                        {t("confirm")}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}