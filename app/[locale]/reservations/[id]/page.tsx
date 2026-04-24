// app/[locale]/reservations/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IoArrowBackOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoKeyOutline,
  IoCopyOutline,
  IoCheckmarkCircleOutline,
  IoDocumentTextOutline,
  IoDownloadOutline,
  IoChatbubbleOutline,
  IoShieldCheckmarkOutline,
  IoPersonOutline,
  IoCallOutline,
  IoStarSharp,
  IoStarOutline,
  IoMapOutline,
  IoTimeOutline,
  IoReceiptOutline,
  IoAlertCircleOutline,
  IoPawOutline,
  IoMoonOutline,
  IoVolumeOffOutline,
  IoArrowForwardOutline,
  IoHomeOutline,
  IoInformationCircleOutline,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import MapPickerWrapper from "@/components/ui/maps/MapPickerWrapper";
import { ReviewModal } from "@/components/ui/modals/ReviewModal";

// ─── pip helper ───────────────────────────────────────────────────────────────
const pipListing = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;
const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

// ─── Design tokens ─────────────────────────────────────────────────────────────
const GRAD = "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600";
const GRAD_TEXT =
  "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent";
const BTN_GRAD = `${GRAD} text-white font-bold shadow-lg shadow-indigo-200/40 dark:shadow-indigo-900/20 hover:opacity-90 active:scale-[.98] transition-all`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface BookingDetails {
  id: string;
  reference: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  pricePerNight: number;
  cleaningFee?: number;
  serviceFee?: number;
  listing: {
    id: string;
    title: string;
    type: string;
    governorate: string;
    delegation: string;
    street?: string;
    latitude?: number;
    longitude?: number;
    photos: { url: string; isMain: boolean }[];
    houseRules?: Record<string, boolean | string> | null;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
    stats?: { averageRating: number; totalReviews: number };
  };
  revealedInfo?: {
    accessCode?: string;
    checkinInstructions?: string;
    exactAddress?: string;
    ownerPhone?: string;
  };
  contract?: { pdfUrl: string };
  hasReview?: boolean;
  conversationId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtShort(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtPrice(n: number) {
  return n.toLocaleString("fr-FR") + " TND";
}

// ─── Copy toast ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      onClick={copy}
      className="text-gray-400 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
      title="Copier"
    >
      {copied ? (
        <IoCheckmarkCircleOutline className="text-emerald-500 text-lg" />
      ) : (
        <IoCopyOutline className="text-lg" />
      )}
    </button>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    COMPLETED: {
      label: "Terminé",
      cls: "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400",
    },
    CONFIRMED: {
      label: "Confirmé",
      cls: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400",
    },
    ACCEPTED: {
      label: "Accepté",
      cls: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
    },
    PAID: {
      label: "Payé",
      cls: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400",
    },
    PENDING: {
      label: "En attente",
      cls: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
    },
    CANCELLED: {
      label: "Annulé",
      cls: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400",
    },
  };
  const { label, cls } = map[status] ?? {
    label: status,
    cls: "bg-gray-100 dark:bg-slate-800 text-gray-500",
  };
  return (
    <span
      className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${cls}`}
    >
      {label}
    </span>
  );
}

// ─── Score bar (static display) ───────────────────────────────────────────────
function ScoreBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${GRAD} rounded-full transition-all duration-500`}
        style={{ width: `${(value / 5) * 100}%` }}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mainImgErr, setMainImgErr] = useState(false);
  const [ownerImgErr, setOwnerImgErr] = useState(false);
  const [staticMapCoords, setStaticMapCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      if (!data.nights && data.checkIn && data.checkOut) {
        data.nights = Math.ceil(
          (new Date(data.checkOut).getTime() -
            new Date(data.checkIn).getTime()) /
            86_400_000,
        );
      }
      setBooking(data);

      // Récupérer les coordonnées du listing pour la carte
      if (data.listing?.id) {
        const listingRes = await fetch(`/api/listings/${data.listing.id}`);
        if (listingRes.ok) {
          const listingData = await listingRes.json();
          if (listingData.latitude && listingData.longitude) {
            setStaticMapCoords({
              lat: listingData.latitude,
              lng: listingData.longitude,
            });
          }
        }
      }
    } catch {
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleSubmitReview = async (reviewData: any) => {
    if (!booking) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("bookingId", booking.id);
      formData.append("rating", reviewData.rating.toString());
      formData.append("criteria", JSON.stringify(reviewData.criteria));
      formData.append("publicComment", reviewData.publicComment);
      formData.append("privateNote", reviewData.privateNote);
      reviewData.photos.forEach((photo: File, i: number) => {
        formData.append(`photo_${i}`, photo);
      });

      const res = await fetch("/api/reviews", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        showToast("Merci pour votre avis !");
        setIsReviewModalOpen(false);
        fetchBooking();
      } else {
        const err = await res.json();
        showToast(err.error || "Erreur lors de l'envoi");
      }
    } catch {
      showToast("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] dark:bg-slate-950">
        <TenantHeader />
        <main className="pt-8 pb-20 px-6 max-w-7xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded-full w-1/3 mb-8" />
          <div className="h-64 bg-gray-200 dark:bg-slate-800 rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] dark:bg-slate-950">
        <TenantHeader />
        <main className="pt-28 pb-20 flex items-center justify-center flex-col gap-4">
          <IoAlertCircleOutline className="text-gray-300 dark:text-slate-700 text-6xl" />
          <p className="text-gray-500 dark:text-gray-500 font-semibold">
            Réservation introuvable
          </p>
          <button
            onClick={() => router.push("/fr/reservations")}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Retour à mes réservations
          </button>
        </main>
      </div>
    );
  }

  const isCompleted = booking.status === "COMPLETED";
  const location = [
    booking.listing.street,
    booking.listing.delegation,
    booking.listing.governorate,
  ]
    .filter(Boolean)
    .join(", ");
  const mainPhoto =
    booking.listing.photos.find((p) => p.isMain) ?? booking.listing.photos[0];
  const totalNightsPrice = booking.pricePerNight * booking.nights;
  const ownerDisplayName = `${booking.owner.firstName} ${booking.owner.lastName}`;

  return (
    <div className="min-h-screen bg-[#f9f9ff] dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors">
      <TenantHeader />

      {toast && (
        <div className="fixed top-24 right-4 z-[90] bg-emerald-500 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-3 duration-300">
          <IoCheckmarkCircleOutline className="text-lg" />
          {toast}
        </div>
      )}

      <main className="pt-8 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Back + header */}
        <div className="mb-10">
          <button
            onClick={() => router.push("/fr/reservations")}
            className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 font-medium mb-6 transition-colors"
          >
            <IoArrowBackOutline />
            Mes réservations
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-8">
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <StatusBadge status={booking.status} />
                <span className="text-xs text-gray-400 dark:text-gray-600 font-mono">
                  Réf: {booking.reference}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight mb-3">
                {booking.listing.title}
              </h1>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <IoLocationOutline className="text-indigo-500 text-base flex-shrink-0" />
                <p className="text-base font-medium">{location}</p>
              </div>
            </div>
            <div className="md:col-span-4 flex justify-start md:justify-end">
              {isCompleted && !booking.hasReview ? (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className={`px-7 py-3.5 rounded-full text-sm ${BTN_GRAD} flex items-center gap-2`}
                >
                  <IoStarOutline className="text-base" />
                  Laisser un avis
                </button>
              ) : isCompleted && booking.hasReview ? (
                <span className="px-6 py-3 rounded-full text-sm font-bold bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 flex items-center gap-2">
                  <IoCheckmarkCircleOutline className="text-base" />
                  Avis déjà publié
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Booking info + photo */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-7 border border-gray-100 dark:border-slate-800">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-5">
                  Informations de séjour
                </p>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                      Arrivée
                    </p>
                    <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                      {fmtDate(booking.checkIn)}
                    </p>
                  </div>
                  <IoArrowForwardOutline className="text-gray-400 dark:text-gray-600 text-xl" />
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                      Départ
                    </p>
                    <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                      {fmtDate(booking.checkOut)}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                      Durée
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {booking.nights} nuit{booking.nights > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                      Voyageurs
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {booking.guests} adulte{booking.guests > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[220px] rounded-2xl overflow-hidden group">
                {mainPhoto && !mainImgErr ? (
                  <img
                    src={pipListing(mainPhoto.url)}
                    alt={booking.listing.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={() => setMainImgErr(true)}
                  />
                ) : (
                  <div
                    className={`w-full h-full ${GRAD} flex items-center justify-center opacity-50`}
                  >
                    <IoHomeOutline className="text-white text-6xl" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-xs font-medium opacity-80">
                    Vue de la propriété
                  </p>
                  <p className="text-base font-extrabold">
                    {booking.listing.delegation}
                  </p>
                </div>
              </div>
            </section>

            {/* Access & check-in section avec carte interactive */}
            {booking.revealedInfo && (
              <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-sky-50 dark:bg-sky-950/40 rounded-xl flex items-center justify-center text-sky-500 dark:text-sky-400">
                    <IoKeyOutline className="text-2xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Accès et Instructions
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    {booking.revealedInfo.accessCode && (
                      <div>
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Code d'entrée numérique
                        </h4>
                        <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl flex items-center justify-between border border-gray-100 dark:border-slate-700">
                          <span className="text-2xl font-mono font-bold tracking-[0.5em] text-gray-900 dark:text-white">
                            {booking.revealedInfo.accessCode}
                          </span>
                          <CopyButton text={booking.revealedInfo.accessCode} />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                          <IoTimeOutline className="text-sm" />
                          Actif à partir de 15:00 le jour de l'arrivée.
                        </p>
                      </div>
                    )}

                    {booking.revealedInfo.checkinInstructions && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Instructions de Check-in
                        </h4>
                        <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/40">
                          <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed flex items-start gap-2">
                            <IoCheckmarkCircleOutline className="text-indigo-500 flex-shrink-0 mt-0.5 text-lg" />
                            {booking.revealedInfo.checkinInstructions}
                          </p>
                        </div>
                      </div>
                    )}

                    {booking.revealedInfo.ownerPhone && (
                      <div>
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Téléphone de l'hôte
                        </h4>
                        <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl flex items-center justify-between border border-gray-100 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <IoCallOutline className="text-indigo-400 text-base" />
                            <span className="font-bold text-gray-900 dark:text-white">
                              {booking.revealedInfo.ownerPhone}
                            </span>
                          </div>
                          <CopyButton text={booking.revealedInfo.ownerPhone} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Carte interactive avec MapPickerWrapper */}
                  <div className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800 min-h-[280px] shadow-inner border border-gray-200 dark:border-slate-700">
                    {staticMapCoords ? (
                      <MapPickerWrapper
                        initialLat={staticMapCoords.lat}
                        initialLng={staticMapCoords.lng}
                        readOnly={true}
                        height="280px"
                        zoom={15}
                        showMarker={true}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
                          <IoMapOutline className="text-indigo-500 dark:text-indigo-400 text-2xl" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          {booking.revealedInfo?.exactAddress ||
                            location ||
                            "Emplacement du logement"}
                        </p>
                        <button
                          onClick={() =>
                            window.open(
                              `https://maps.google.com/?q=${encodeURIComponent(location)}`,
                              "_blank",
                            )
                          }
                          className="mt-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-shadow text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 flex items-center gap-1"
                        >
                          <IoMapOutline className="text-sm" />
                          Ouvrir dans Maps
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Message si pas d'infos révélées mais réservation confirmée */}
            {!booking.revealedInfo && booking.status === "CONFIRMED" && (
              <section className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-8 border border-amber-200 dark:border-amber-900/40">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/50 rounded-xl flex items-center justify-center">
                    <IoInformationCircleOutline className="text-amber-500 text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-800 dark:text-amber-400">
                      Informations d'accès
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                      Les informations d'accès seront disponibles 24h avant
                      votre arrivée.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* House rules */}
            <section className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-7 border border-gray-100 dark:border-slate-800">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-7">
                Règlement intérieur
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  {
                    icon: <IoVolumeOffOutline className="text-2xl" />,
                    label: "Non Fumeur",
                  },
                  {
                    icon: <IoPawOutline className="text-2xl" />,
                    label: "Animaux autorisés",
                  },
                  {
                    icon: <IoMoonOutline className="text-2xl" />,
                    label: "Pas de fêtes",
                  },
                  {
                    icon: <IoTimeOutline className="text-2xl" />,
                    label: "Silence 22h–08h",
                  },
                ].map(({ icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center text-center gap-2.5"
                  >
                    <div className="text-gray-500 dark:text-gray-400">
                      {icon}
                    </div>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT column */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Payment summary */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-7 border border-gray-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                  <IoReceiptOutline className="text-indigo-500 dark:text-indigo-400 text-base" />
                </div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  Récapitulatif financier
                </h3>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    {fmtPrice(booking.pricePerNight)} × {booking.nights} nuit
                    {booking.nights > 1 ? "s" : ""}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {fmtPrice(totalNightsPrice)}
                  </span>
                </div>
                {(booking.cleaningFee ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>Frais de ménage</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {fmtPrice(booking.cleaningFee!)}
                    </span>
                  </div>
                )}
                {(booking.serviceFee ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>Frais de service NestHub</span>
                    <span className="font-semibold text-indigo-500">
                      {fmtPrice(booking.serviceFee!)}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-dashed border-gray-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="font-extrabold text-gray-900 dark:text-white">
                    Total payé
                  </span>
                  <span className={`text-2xl font-extrabold ${GRAD_TEXT}`}>
                    {fmtPrice(booking.totalPrice)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/40">
                <IoShieldCheckmarkOutline className="text-emerald-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Transaction sécurisée par NestHub Pay
                </span>
              </div>
            </div>

            {/* Host card */}
            <div className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-4 mb-5">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-sky-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {booking.owner.profilePictureUrl && !ownerImgErr ? (
                      <img
                        src={pipAvatar(booking.owner.profilePictureUrl)}
                        alt={ownerDisplayName}
                        className="w-full h-full object-cover"
                        onError={() => setOwnerImgErr(true)}
                      />
                    ) : (
                      `${booking.owner.firstName.charAt(0)}${booking.owner.lastName.charAt(0)}`
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                    <IoShieldCheckmarkOutline className="text-white text-[10px]" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-0.5">
                    Votre hôte
                  </p>
                  <h4 className="font-extrabold text-gray-900 dark:text-white">
                    {ownerDisplayName}
                  </h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    <IoStarSharp className="text-amber-400 text-xs" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {booking.owner.stats?.averageRating ?? 5} étoiles ·{" "}
                      {booking.owner.stats?.totalReviews ?? 0} avis
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {booking.conversationId ? (
                  <Link
                    href={`/fr/messages?conversation=${booking.conversationId}`}
                    className="w-full py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-full text-sm font-bold text-center hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <IoChatbubbleOutline className="text-base" />
                    Contacter l'hôte
                  </Link>
                ) : (
                  <button className="w-full py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-full text-sm font-bold hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
                    <IoChatbubbleOutline className="text-base" />
                    Contacter l'hôte
                  </button>
                )}
                <Link
                  href={`/fr/profiles/${booking.owner.id}`}
                  className="w-full py-2.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 rounded-full text-sm font-bold text-center hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <IoPersonOutline className="text-base" />
                  Voir le profil
                </Link>
              </div>
            </div>

            {/* Contract & docs */}
            <div className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 space-y-1">
              {booking.contract?.pdfUrl && (
                <a
                  href={booking.contract.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between group px-3 py-2.5 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <IoDocumentTextOutline className="text-gray-500 dark:text-gray-400 text-base" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Contrat de location (PDF)
                    </span>
                  </div>
                  <IoDownloadOutline className="text-gray-400 dark:text-gray-600 group-hover:text-indigo-500 transition-colors text-base" />
                </a>
              )}
              {[
                {
                  icon: <IoShieldCheckmarkOutline />,
                  label: "Politique d'annulation",
                },
                {
                  icon: <IoReceiptOutline />,
                  label: "Facture détaillée",
                },
              ].map(({ icon, label }) => (
                <a
                  key={label}
                  href="#"
                  className="flex items-center justify-between group px-3 py-2.5 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-gray-400 text-base">
                      {icon}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                  </div>
                  <IoArrowForwardOutline className="text-gray-300 dark:text-slate-700 group-hover:text-indigo-500 transition-colors text-sm" />
                </a>
              ))}
            </div>

            {/* Cancellation policy */}
            <div className="p-5 bg-red-50/60 dark:bg-red-950/15 rounded-2xl border border-red-100 dark:border-red-900/30">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-red-400 dark:text-red-600 mb-1.5">
                Politique d'annulation
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                Cette réservation était sous la politique{" "}
                <strong>Modérée</strong>. Annulation gratuite jusqu'à 5 jours
                avant l'arrivée.
              </p>
            </div>
          </aside>
        </div>

        {/* Footer quote */}
        <footer className="mt-20 py-10 border-t border-gray-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-400 dark:text-gray-600 italic text-sm leading-relaxed max-w-md text-center md:text-left">
            "Nous espérons que votre séjour à{" "}
            <span className="font-semibold text-gray-600 dark:text-gray-400">
              {booking.listing.title}
            </span>{" "}
            a été à la hauteur de vos attentes."
          </p>
          <span className="text-2xl font-extrabold tracking-tighter opacity-20 text-gray-900 dark:text-white">
            NESTHUB
          </span>
        </footer>
      </main>

      {/* Review Modal - Using the separate component */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleSubmitReview}
        booking={booking}
      />
    </div>
  );
}
