"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IoArrowBackOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoPersonOutline,
  IoStarSharp,
  IoHomeOutline,
  IoCashOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoShieldCheckmarkOutline,
  IoChatbubbleOutline,
  IoAlertCircleOutline,
  IoCloseCircleOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";

// Fonction pip pour les images (comme dans le layout)
const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

const pipListing = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

const GRAD = "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600";
const BTN_GRAD = `${GRAD} text-white font-bold shadow-lg shadow-indigo-200/40 dark:shadow-indigo-900/20 hover:opacity-90 active:scale-[.98] transition-all`;

// Couleurs pour l'avatar
const avatarColors = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-violet-500",
  "bg-sky-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-teal-500",
];

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtPrice(n: number) {
  return n.toLocaleString("fr-FR") + " TND";
}

interface ExtensionRequest {
  id: string;
  bookingId: string;
  requestedCheckOut: string;
  additionalNights: number;
  additionalPrice: number;
  message?: string;
  status: string;
  createdAt: string;
  booking: {
    id: string;
    reference: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    totalPrice: number;
    pricePerNight: number;
    cleaningFee?: number;
    serviceFee?: number;
    nights: number;
    tenant: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      email: string;
      profilePictureUrl?: string;
      stats?: { averageRating: number; totalReviews: number };
    };
    listing: {
      id: string;
      title: string;
      type: string;
      governorate: string;
      delegation: string;
      street?: string;
      photos: { url: string; isMain: boolean }[];
    };
  };
}

export default function ExtensionRequestPage() {
  const params = useParams();
  const router = useRouter();
  const extensionId = params.id as string;

  const [request, setRequest] = useState<ExtensionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const avatarColor =
    avatarColors[Math.floor(Math.random() * avatarColors.length)];

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRequest = useCallback(async () => {
    try {
      const res = await fetch(`/api/extensions/${extensionId}`);
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      setRequest(data);
    } catch (error) {
      console.error(error);
      showToast("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
    }
  }, [extensionId]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleAccept = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/extensions/${extensionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACCEPTED" }),
      });
      if (res.ok) {
        showToast("✅ Prolongation acceptée avec succès !");
        setTimeout(() => router.push("/fr/dashboard/owner/reservations"), 1500);
      } else {
        const error = await res.json();
        showToast(error.error || "Erreur lors de l'acceptation", "error");
      }
    } catch {
      showToast("Erreur de connexion", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast("Veuillez indiquer une raison du refus", "error");
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch(`/api/extensions/${extensionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECTED",
          rejectionReason,
        }),
      });
      if (res.ok) {
        showToast("❌ Demande refusée");
        setTimeout(() => router.push("/fr/dashboard/owner/reservations"), 1500);
      } else {
        const error = await res.json();
        showToast(error.error || "Erreur lors du refus", "error");
      }
    } catch {
      showToast("Erreur de connexion", "error");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-slate-500">Chargement...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <IoAlertCircleOutline className="text-4xl text-slate-400" />
        <p className="text-slate-600 dark:text-slate-400 font-semibold">
          Demande introuvable
        </p>
        <button
          onClick={() => router.push("/fr/dashboard/owner/reservations")}
          className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline"
        >
          Retour aux réservations
        </button>
      </div>
    );
  }

  const tenant = request.booking.tenant;
  const listing = request.booking.listing;
  const serviceFee = Math.round(request.additionalPrice * 0.15);
  const totalRevenue = request.additionalPrice + serviceFee;

  // Générer le calendrier pour afficher les dates
  const currentCheckOut = new Date(request.booking.checkOut);
  const requestedCheckOut = new Date(request.requestedCheckOut);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const calendarDate = new Date(request.booking.checkIn);
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const currentStart = new Date(request.booking.checkIn);
  const currentEnd = new Date(request.booking.checkOut);
  const requestedEnd = new Date(request.requestedCheckOut);

  const isCurrentDay = (day: number) => {
    const date = new Date(year, month, day);
    return date >= currentStart && date <= currentEnd;
  };

  const isExtensionDay = (day: number) => {
    const date = new Date(year, month, day);
    return date > currentEnd && date <= requestedEnd;
  };

  const getAvatarUrl = () => {
    if (tenant.profilePictureUrl && !avatarError) {
      return pipAvatar(tenant.profilePictureUrl);
    }
    if (tenant.profilePictureUrl) return tenant.profilePictureUrl;
    return null;
  };

  const displayName =
    tenant.username || `${tenant.firstName} ${tenant.lastName}` || "Voyageur";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="p-6">
      {toast && (
        <div
          className={`fixed top-24 right-6 z-[90] text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-3 duration-300 ${
            toast.includes("✅") ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          <IoCheckmarkCircleOutline className="text-lg" />
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 tracking-wider uppercase">
            <span>RÉSERVATIONS</span>
            <span className="text-xs">→</span>
            <span>#{request.booking.reference}</span>
            <span className="text-xs">→</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
              PROLONGATION
            </span>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium mb-4 transition-colors"
          >
            <IoArrowBackOutline className="text-base" />
            Retour
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Demande de prolongation de séjour
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Examinez les détails de l'extension demandée par votre voyageur.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 space-y-6">
            {/* Guest Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-6">
              <div className="relative">
                <div
                  className={`w-20 h-20 rounded-full overflow-hidden ${avatarColor} flex items-center justify-center text-white font-bold text-2xl ring-2 ring-indigo-100 dark:ring-indigo-900 shadow-lg`}
                >
                  {getAvatarUrl() ? (
                    <img
                      src={getAvatarUrl()!}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    initial
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                  <IoShieldCheckmarkOutline className="text-white text-[10px]" />
                </div>
              </div>
              <div>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold tracking-widest uppercase mb-1 block">
                  VOTRE VOYAGEUR
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  @{displayName}
                </h2>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <IoStarSharp className="text-amber-400 text-sm" />
                  <span className="text-sm">
                    {tenant.stats?.averageRating || 5} ·{" "}
                    {tenant.stats?.totalReviews || 0} séjours
                  </span>
                </div>
              </div>
            </div>

            {/* Dates Comparison avec calendrier */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 border border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                <IoCalendarOutline className="text-indigo-500 text-xl" />
                Comparaison du séjour
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 font-semibold mb-1 uppercase">
                    SÉJOUR ACTUEL
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {fmtDate(request.booking.checkIn)} -{" "}
                    {fmtDate(request.booking.checkOut)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {request.booking.nights} nuits
                  </p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-1 uppercase">
                    NOUVELLE DEMANDE
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {fmtDate(request.booking.checkIn)} -{" "}
                    {fmtDate(request.requestedCheckOut)}
                  </p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                    +{request.additionalNights} nuit
                    {request.additionalNights > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Calendrier visuel */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {new Date(year, month).toLocaleDateString("fr-FR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h4>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="w-3 h-3 rounded-sm bg-indigo-300 dark:bg-indigo-700"></div>
                      <span>Séjour actuel</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="w-3 h-3 rounded-sm bg-purple-500"></div>
                      <span>Extension</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
                  <span>L</span>
                  <span>M</span>
                  <span>M</span>
                  <span>J</span>
                  <span>V</span>
                  <span>S</span>
                  <span>D</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startOffset }, (_, i) => (
                    <div key={`empty-${i}`} className="p-2" />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const isCurrent = isCurrentDay(day);
                    const isExtension = isExtensionDay(day);
                    let bgClass = "";
                    let textClass = "text-slate-700 dark:text-slate-300";

                    if (isCurrent) {
                      bgClass =
                        "bg-indigo-100 dark:bg-indigo-900/40 rounded-lg";
                      textClass =
                        "text-indigo-700 dark:text-indigo-400 font-bold";
                    }
                    if (isExtension) {
                      bgClass =
                        "bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-lg shadow-md";
                      textClass = "text-white";
                    }

                    return (
                      <div key={day} className={`p-2 text-center ${bgClass}`}>
                        <span className={textClass}>{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {request.message && (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 mt-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Message du voyageur
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                    "{request.message}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 sticky top-6">
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold tracking-widest uppercase mb-4 block">
                IMPACT SUR VOS REVENUS
              </span>
              <div className="flex items-end gap-2 mb-6">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  +{totalRevenue.toLocaleString()}
                </span>
                <span className="text-xl font-bold text-slate-400 mb-1">
                  TND
                </span>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 text-sm">
                  <span>
                    {request.additionalNights} nuit
                    {request.additionalNights > 1 ? "s" : ""} x{" "}
                    {request.booking.pricePerNight} TND
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {fmtPrice(request.additionalPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 text-sm">
                  <span>Frais de service (15%)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {fmtPrice(serviceFee)}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Gain total net
                  </span>
                  <span className="text-lg font-bold bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                    {fmtPrice(totalRevenue)}
                  </span>
                </div>
              </div>

              {/* Bouton Accepter */}
              <button
                onClick={handleAccept}
                disabled={processing}
                className={`w-full py-3 px-4 rounded-xl ${BTN_GRAD} flex items-center justify-center gap-2 disabled:opacity-50 mb-3`}
              >
                <IoCheckmarkCircleOutline className="text-lg" />
                {processing ? "Traitement..." : "Accepter la prolongation"}
              </button>

              {/* Bouton Refuser avec input intégré */}
              {!showRejectInput ? (
                <button
                  onClick={() => setShowRejectInput(true)}
                  disabled={processing}
                  className="w-full py-3 px-4 rounded-xl border-2 border-red-500 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                >
                  Refuser la demande
                </button>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Motif du refus (obligatoire)..."
                    rows={3}
                    className="w-full p-3 border border-red-300 dark:border-red-700 rounded-xl bg-red-50 dark:bg-red-950/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={processing || !rejectionReason.trim()}
                      className="flex-1 py-2 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition disabled:opacity-50"
                    >
                      {processing ? "Traitement..." : "Confirmer le refus"}
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectInput(false);
                        setRejectionReason("");
                      }}
                      className="flex-1 py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Property Preview avec pipListing */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden flex items-center p-4 gap-4 border border-slate-100 dark:border-slate-800">
              {listing.photos[0] && (
                <img
                  src={pipListing(listing.photos[0].url)}
                  alt={listing.title}
                  className="w-14 h-14 rounded-xl object-cover"
                />
              )}
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold">
                  VOTRE LOGEMENT
                </p>
                <p className="font-bold text-slate-900 dark:text-white truncate text-sm">
                  {listing.title}
                </p>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <IoLocationOutline className="text-xs" />
                  <span>
                    {listing.delegation}, {listing.governorate}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Button */}
            <Link
              href={`/fr/messages?user=${tenant.id}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <IoChatbubbleOutline className="text-lg" />
              Contacter le voyageur
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
