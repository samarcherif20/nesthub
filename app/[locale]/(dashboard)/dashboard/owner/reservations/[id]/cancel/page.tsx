// app/[locale]/dashboard/owner/reservations/[id]/cancel/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  IoArrowBackOutline,
  IoWarningOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoCloseOutline,
  IoCashOutline,
  IoHomeOutline,
} from "react-icons/io5";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertBanner from "@/components/ui/Alert";

const pipListingImage = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

export default function OwnerCancelBookingPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchBooking();
  }, []);

  const fetchBooking = async () => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/bookings/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBooking(data);
    } catch (error) {
      console.error("Erreur chargement booking:", error);
      setAlert({ type: "error", message: "Réservation non trouvée" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (confirmText !== "ANNULER") {
      setAlert({ type: "error", message: 'Veuillez saisir "ANNULER" pour confirmer' });
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/bookings/${params.id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, message }),
      });

      const data = await res.json();

      if (res.ok) {
        setAlert({ type: "success", message: "Réservation annulée avec succès" });
        setTimeout(() => router.push("/dashboard/owner/reservations"), 2000);
      } else {
        setAlert({ type: "error", message: data.error || "Erreur lors de l'annulation" });
      }
    } catch (error) {
      setAlert({ type: "error", message: "Erreur de connexion" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <IoCloseOutline className="text-4xl text-red-500 mx-auto mb-3" />
          <p className="text-slate-600">Réservation non trouvée</p>
          <button
            onClick={() => router.push("/dashboard/owner/reservations")}
            className="mt-4 text-indigo-600 hover:underline"
          >
            Retour aux réservations
          </button>
        </div>
      </div>
    );
  }

  const checkInDate = booking.checkIn ? new Date(booking.checkIn) : null;
  const checkOutDate = booking.checkOut ? new Date(booking.checkOut) : null;
  
  // ✅ PROPRIÉTAIRE : Remboursement toujours à 100%
  const refundPercentage = 100;
  const refundAmount = booking.totalPrice || 0;

  const mainPhoto = booking.listing?.photos?.find((p: any) => p.isMain) || booking.listing?.photos?.[0];
  const imageUrl = mainPhoto?.url ? pipListingImage(mainPhoto.url) : null;

  return (
    <div className="p-6">
      {alert && (
        <div className="fixed top-20 right-8 z-50">
          <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      {/* Header avec bouton retour */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <IoArrowBackOutline className="text-xl text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Annuler une réservation
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Formulaire */}
        <div className="lg:col-span-7 space-y-6">
          {/* Important Notice */}
          <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-5 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <IoWarningOutline className="text-lg text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="text-base font-bold text-red-800 dark:text-red-300 mb-2">Avis important</h2>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                    <span>Votre statut d'hôte peut être affecté par cette annulation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                    <span>Le calendrier sera automatiquement débloqué pour ces dates.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                    <span>Le locataire sera remboursé intégralement.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cancellation Form */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                Raison de l'annulation
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              >
                <option value="">Sélectionnez une raison</option>
                <option value="maintenance">Maintenance d'urgence requise</option>
                <option value="double_booking">Double réservation accidentelle</option>
                <option value="damage">Dommages importants à la propriété</option>
                <option value="sold">Vente de la propriété</option>
                <option value="other">Autre motif impérieux</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                Message pour le locataire
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Expliquez brièvement la situation au locataire..."
                rows={4}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
                Confirmation finale
              </label>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Veuillez saisir <span className="font-bold text-slate-900 dark:text-white">ANNULER</span> pour confirmer.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ANNULER"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-center font-bold tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all uppercase"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Récapitulatif */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden sticky top-6">
            {/* Image */}
            <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
              {imageUrl ? (
                <img src={imageUrl} alt={booking.listing?.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <IoHomeOutline className="text-4xl text-slate-400" />
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span className="bg-red-600 text-white font-bold px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider">
                  Annulation
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {booking.listing?.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <IoLocationOutline className="text-[11px]" />
                  {booking.listing?.governorate}, {booking.listing?.delegation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Arrivée</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {checkInDate ? format(checkInDate, "dd MMM yyyy", { locale: fr }) : "—"}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Départ</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {checkOutDate ? format(checkOutDate, "dd MMM yyyy", { locale: fr }) : "—"}
                  </p>
                </div>
              </div>

              {/* Remboursement - Propriétaire = 100% */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <IoPersonOutline className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500">Locataire</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {booking.tenant?.firstName} {booking.tenant?.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500">Prix Total</p>
                    <p className="text-base font-bold text-red-600">{booking.totalPrice?.toLocaleString("fr-FR")} TND</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <IoCashOutline className="text-slate-500" />
                      <p className="text-xs font-medium text-slate-600">Remboursement</p>
                    </div>
                    {/* ✅ Toujours 100% en vert */}
                    <p className="text-base font-bold text-green-600">
                      {refundAmount.toLocaleString("fr-FR")} TND (100%)
                    </p>
                  </div>
                  {/* Message informatif */}
                  <div className="mt-2 flex items-center gap-1.5 text-amber-600 text-xs">
                    <IoWarningOutline className="text-[11px]" />
                    <span>En annulant, vous remboursez intégralement le locataire.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="-mt-12 flex flex-col sm:flex-row-reverse gap-3">
        <button
          onClick={handleCancel}
          disabled={submitting}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <IoCloseOutline className="text-lg" />
          {submitting ? "Annulation en cours..." : "Confirmer l'annulation"}
        </button>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          Retour
        </button>
      </div>
    </div>
  );
}