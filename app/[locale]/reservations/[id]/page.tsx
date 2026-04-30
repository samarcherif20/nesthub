// app/[locale]/dashboard/tenant/bookings/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  IoArrowBackOutline,
  IoLocationOutline,
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
  IoNavigateOutline,
  IoChevronForwardOutline,
  IoCashOutline,
  IoInformationCircleOutline,
  IoCalendarNumberOutline,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import TenantCancelModal from "@/components/ui/bookings/TenantCancelModal";

const MapPickerWrapper = dynamic(
  () => import("@/components/ui/maps/MapPickerWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-10 h-10 mx-auto mb-2">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-200 dark:border-indigo-800"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 dark:border-t-indigo-400 animate-spin"></div>
          </div>
          <p className="text-xs text-slate-500">Chargement de la carte...</p>
        </div>
      </div>
    ),
  },
);

const ReviewModal = dynamic(
  () =>
    import("@/components/ui/modals/ReviewModal").then((mod) => mod.ReviewModal),
  { ssr: false },
);

const ExtendBookingModal = dynamic(
  () => import("@/components/ui/bookings/ExtendendBookingModal"),
  { ssr: false },
);

// Fonctions utilitaires
function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtShortDate(d: string) {
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="text-outline hover:text-primary transition-colors"
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    COMPLETED: { label: "Terminé", cls: "bg-primary/10 text-primary" },
    CONFIRMED: { label: "Confirmé", cls: "bg-emerald-50 text-emerald-700" },
    ACCEPTED: { label: "Accepté", cls: "bg-emerald-50 text-emerald-700" },
    PAID: { label: "Payé", cls: "bg-indigo-50 text-indigo-700" },
    PENDING: { label: "En attente", cls: "bg-amber-50 text-amber-700" },
    CANCELLED: { label: "Annulé", cls: "bg-red-50 text-red-600" },
  };
  const { label, cls } = map[status] ?? {
    label: status,
    cls: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${cls}`}
    >
      {label}
    </span>
  );
}

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

function getDynamicHouseRules(
  rules: Record<string, boolean | string> | null | undefined,
) {
  const defaultRules = [
    {
      icon: <IoVolumeOffOutline className="text-3xl" />,
      label: "Non Fumeur",
      condition: true,
    },
    {
      icon: <IoPawOutline className="text-3xl" />,
      label: "Animaux autorisés",
      condition: true,
    },
    {
      icon: <IoMoonOutline className="text-3xl" />,
      label: "Pas de fêtes",
      condition: true,
    },
    {
      icon: <IoTimeOutline className="text-3xl" />,
      label: "Silence 22h-08h",
      condition: true,
    },
  ];
  if (!rules) return defaultRules;
  return [
    {
      icon: <IoVolumeOffOutline className="text-3xl" />,
      label: "Non Fumeur",
      condition: rules.noSmoking !== false,
    },
    {
      icon: <IoPawOutline className="text-3xl" />,
      label: "Animaux autorisés",
      condition: rules.petsAllowed === true,
    },
    {
      icon: <IoMoonOutline className="text-3xl" />,
      label: "Pas de fêtes",
      condition: rules.noParties !== false,
    },
    {
      icon: <IoTimeOutline className="text-3xl" />,
      label: rules.quietHours
        ? `Silence ${rules.quietHours}`
        : "Silence 22h-08h",
      condition: true,
    },
  ].filter((r) => r.condition);
}

export default function TenantBookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
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
            86400000,
        );
      }
      setBooking(data);
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
    } catch (err) {
      console.error(err);
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
    try {
      const formData = new FormData();
      formData.append("bookingId", booking.id);
      formData.append("rating", reviewData.rating.toString());
      formData.append("criteria", JSON.stringify(reviewData.criteria));
      formData.append("publicComment", reviewData.publicComment);
      formData.append("privateNote", reviewData.privateNote || "");
      reviewData.photos?.forEach((photo: File, i: number) => {
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
    }
  };

  const handleExtendSuccess = async () => {
    setIsExtendModalOpen(false);
    await fetchBooking();
    showToast("✅ Demande de prolongation envoyée avec succès !");
  };

  // ✅ HANDLE CANCEL - Annulation par le locataire
  const handleCancel = async (reason: string, notes: string) => {
    try {
      const response = await fetch(`/api/bookings/${booking?.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, message: notes }),
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message || "Réservation annulée avec succès");
        setIsCancelModalOpen(false);
        fetchBooking(); // Recharger pour mettre à jour le statut
      } else {
        showToast(data.error || "Erreur lors de l'annulation");
      }
    } catch (error) {
      showToast("Erreur de connexion");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-800 dark:to-purple-900">
        <TenantHeader />
        <main className="pt-28 pb-20 px-6 max-w-[1440px] mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-container-high rounded-full w-1/3 mb-8" />
            <div className="h-64 bg-surface-container-high rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-800 dark:to-purple-900">
        <TenantHeader />
        <main className="pt-28 pb-20 flex items-center justify-center flex-col gap-4">
          <IoAlertCircleOutline className="text-4xl text-outline" />
          <p className="text-on-surface-variant font-semibold">
            Réservation introuvable
          </p>
          <button
            onClick={() => router.push("/fr/reservations")}
            className="text-primary text-sm hover:underline"
          >
            Retour à mes réservations
          </button>
        </main>
      </div>
    );
  }

  const isCompleted = booking.status === "COMPLETED";
  const isConfirmed = ["CONFIRMED", "ACCEPTED", "PAID"].includes(
    booking.status,
  );
  const isNotCompleted = new Date(booking.checkOut) > new Date();
  const showExtendButton = isConfirmed && isNotCompleted;
  const isCancellable =
    isConfirmed && isNotCompleted && booking.status !== "CANCELLED";

  const location = [
    booking.listing.street,
    booking.listing.delegation,
    booking.listing.governorate,
  ]
    .filter(Boolean)
    .join(", ");
  const mainPhoto =
    booking.listing.photos.find((p) => p.isMain) ?? booking.listing.photos[0];
  const ownerDisplayName = `${booking.owner.firstName} ${booking.owner.lastName}`;
  const houseRules = getDynamicHouseRules(booking.listing.houseRules);
  const totalNightsPrice = booking.pricePerNight * booking.nights;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-800 dark:to-purple-900">
      <TenantHeader />

      {toast && (
        <div className="fixed top-24 right-4 z-[90] bg-emerald-500 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-3 duration-300">
          <IoCheckmarkCircleOutline className="text-lg" />
          {toast}
        </div>
      )}

      <main className="pt-28 pb-20 px-6 max-w-[1440px] mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push("/fr/reservations")}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface font-medium mb-6 transition-colors"
        >
          <IoArrowBackOutline className="text-base" />
          Mes réservations
        </button>

        {/* Header Section */}
        <header className="mb-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-8">
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge status={booking.status} />
              <span className="text-on-surface-variant/60 text-sm font-medium">
                Réf: {booking.reference}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-on-surface">
              {booking.listing.title}
            </h1>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <IoLocationOutline className="text-primary text-lg" />
              <p className="text-lg font-medium">
                {location ||
                  `${booking.listing.delegation}, ${booking.listing.governorate}`}
              </p>
            </div>
          </div>
          <div className="md:col-span-4 flex justify-end gap-3 flex-wrap">
            {/* ✅ BOUTON ANNULATION - Pour le locataire */}
            {isCancellable && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-full font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                Annuler la réservation
              </button>
            )}

            {showExtendButton && (
              <button
                onClick={() => setIsExtendModalOpen(true)}
                className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-4 rounded-full font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
              >
                <IoCalendarNumberOutline className="text-lg" />
                Prolonger
              </button>
            )}

            {isCompleted && !booking.hasReview && (
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                Laisser un avis
              </button>
            )}

            {isCompleted && booking.hasReview && (
              <span className="bg-surface-container-high text-on-surface-variant px-6 py-4 rounded-full font-bold flex items-center gap-2">
                <IoCheckmarkCircleOutline className="text-emerald-500" />
                Avis publié
              </span>
            )}
          </div>
        </header>

        {/* REMPLACER LA PARTIE EXISTANTE PAR TON CONTENU ACTUEL... */}

        {/* Reste du contenu (inchangé) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6">
                  Informations de séjour
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-on-surface-variant uppercase tracking-wider">
                        Arrivée
                      </p>
                      <p className="text-xl font-bold text-on-surface">
                        {fmtDate(booking.checkIn)}
                      </p>
                    </div>
                    <IoArrowForwardOutline className="text-outline-variant text-xl" />
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant uppercase tracking-wider">
                        Départ
                      </p>
                      <p className="text-xl font-bold text-on-surface">
                        {fmtDate(booking.checkOut)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-outline-variant/20 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-on-surface-variant uppercase tracking-wider">
                        Durée
                      </p>
                      <p className="font-semibold text-on-surface">
                        {booking.nights} {booking.nights > 1 ? "nuits" : "nuit"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant uppercase tracking-wider">
                        Voyageurs
                      </p>
                      <p className="font-semibold text-on-surface">
                        {booking.guests}{" "}
                        {booking.guests > 1 ? "personnes" : "personne"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative h-full min-h-[240px] rounded-xl overflow-hidden group">
                {mainPhoto && !mainImgErr ? (
                  <img
                    src={`/api/listings/image?url=${encodeURIComponent(mainPhoto.url)}`}
                    alt={booking.listing.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={() => setMainImgErr(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                    <IoHomeOutline className="text-4xl text-outline" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm font-medium opacity-80">
                    Vue de la propriété
                  </p>
                  <p className="text-lg font-bold">
                    {booking.listing.delegation}
                  </p>
                </div>
              </div>
            </section>

            {booking.revealedInfo && (
              <section className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center text-primary">
                    <IoKeyOutline className="text-2xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-on-surface">
                    Accès et Instructions
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    {booking.revealedInfo.accessCode && (
                      <div>
                        <h4 className="text-sm font-bold text-on-surface-variant uppercase mb-2">
                          Code d'entrée numérique
                        </h4>
                        <div className="bg-surface-container p-4 rounded-xl flex items-center justify-between">
                          <span className="text-2xl font-mono font-bold tracking-[0.5em] text-on-surface">
                            {booking.revealedInfo.accessCode}
                          </span>
                          <CopyButton text={booking.revealedInfo.accessCode} />
                        </div>
                        <p className="text-xs text-on-surface-variant mt-2">
                          Actif à partir de 15:00 le jour de l'arrivée.
                        </p>
                      </div>
                    )}
                    {booking.revealedInfo.ownerPhone && (
                      <div>
                        <h4 className="text-sm font-bold text-on-surface-variant uppercase mb-2">
                          Téléphone de l'hôte
                        </h4>
                        <div className="bg-surface-container p-4 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IoCallOutline className="text-primary" />
                            <span className="font-semibold text-on-surface">
                              {booking.revealedInfo.ownerPhone}
                            </span>
                          </div>
                          <CopyButton text={booking.revealedInfo.ownerPhone} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    {booking.revealedInfo.checkinInstructions && (
                      <div>
                        <h4 className="text-sm font-bold text-on-surface-variant uppercase mb-2">
                          Instructions de Check-in
                        </h4>
                        <div className="bg-primary-fixed/20 rounded-xl p-4 border border-primary-fixed">
                          <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                            {booking.revealedInfo.checkinInstructions}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {!booking.revealedInfo && booking.status === "CONFIRMED" && (
              <section className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-8 border border-amber-200 dark:border-amber-800">
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

            {staticMapCoords && staticMapCoords.lat && staticMapCoords.lng && (
              <section className="bg-surface-container-low rounded-xl p-0 overflow-hidden border border-outline-variant/10">
                <div className="relative h-64 w-full">
                  <MapPickerWrapper
                    latitude={staticMapCoords.lat}
                    longitude={staticMapCoords.lng}
                    onLocationChange={() => {}}
                    readOnly={true}
                  />
                  <button
                    onClick={() =>
                      window.open(
                        `https://maps.google.com/?q=${encodeURIComponent(location || `${booking.listing.delegation}, ${booking.listing.governorate}`)}`,
                        "_blank",
                      )
                    }
                    className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 px-4 py-2 rounded-full text-xs font-bold shadow-md hover:bg-slate-50 transition z-10 flex items-center gap-1"
                  >
                    <IoNavigateOutline className="text-sm" />
                    Ouvrir dans Maps
                  </button>
                </div>
              </section>
            )}

            <section className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-8">
                Règlement intérieur
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {houseRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center text-center gap-3"
                  >
                    <div className="text-on-surface-variant">{rule.icon}</div>
                    <span className="text-xs font-medium text-on-surface-variant">
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)]">
              <h3 className="text-xl font-bold text-on-surface mb-6">
                Récapitulatif financier
              </h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-on-surface-variant">
                  <span>
                    {fmtPrice(booking.pricePerNight)} x {booking.nights}{" "}
                    {booking.nights > 1 ? "nuits" : "nuit"}
                  </span>
                  <span className="font-medium text-on-surface">
                    {fmtPrice(totalNightsPrice)}
                  </span>
                </div>
                {(booking.cleaningFee ?? 0) > 0 && (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Frais de ménage</span>
                    <span className="font-medium text-on-surface">
                      {fmtPrice(booking.cleaningFee!)}
                    </span>
                  </div>
                )}
                {(booking.serviceFee ?? 0) > 0 && (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Frais de service Nesthub</span>
                    <span className="font-medium text-primary">
                      {fmtPrice(booking.serviceFee!)}
                    </span>
                  </div>
                )}
                <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-center">
                  <span className="text-lg font-bold text-on-surface">
                    Total payé
                  </span>
                  <span className="text-2xl font-black text-primary tracking-tight">
                    {fmtPrice(booking.totalPrice)}
                  </span>
                </div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                <IoShieldCheckmarkOutline className="text-sm" />
                Transaction sécurisée par Nesthub Pay
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl">
                    {booking.owner.profilePictureUrl && !ownerImgErr ? (
                      <img
                        src={`/api/users/avatar?url=${encodeURIComponent(booking.owner.profilePictureUrl)}`}
                        alt={ownerDisplayName}
                        className="w-full h-full object-cover"
                        onError={() => setOwnerImgErr(true)}
                      />
                    ) : (
                      `${booking.owner.firstName?.charAt(0) || ""}${booking.owner.lastName?.charAt(0) || ""}`
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 bg-primary text-white p-0.5 rounded-full border-2 border-white dark:border-slate-900">
                    <IoShieldCheckmarkOutline className="text-[10px]" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1">
                    Votre Hôte
                  </p>
                  <h4 className="text-lg font-bold text-on-surface">
                    {ownerDisplayName}
                  </h4>
                  <div className="flex items-center gap-1 mt-1">
                    <IoStarSharp className="text-amber-400 text-sm" />
                    <span className="text-sm font-medium text-on-surface-variant">
                      {booking.owner.stats?.averageRating || 5} ·{" "}
                      {booking.owner.stats?.totalReviews || 0} avis
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {booking.conversationId ? (
                  <Link
                    href={`/fr/messages?conversation=${booking.conversationId}`}
                    className="w-full py-3 bg-surface-container-high rounded-full font-bold hover:bg-surface-container-highest transition-colors active:scale-95 flex items-center justify-center gap-2"
                  >
                    <IoChatbubbleOutline className="text-sm" />
                    Contacter l'hôte
                  </Link>
                ) : (
                  <button className="w-full py-3 bg-surface-container-high rounded-full font-bold hover:bg-surface-container-highest transition-colors active:scale-95 flex items-center justify-center gap-2">
                    <IoChatbubbleOutline className="text-sm" />
                    Contacter l'hôte
                  </button>
                )}
                <Link
                  href={`/fr/profiles/${booking.owner.id}`}
                  className="w-full py-3 border border-outline-variant/30 rounded-full font-bold hover:bg-white dark:hover:bg-slate-800 transition-colors active:scale-95 flex items-center justify-center gap-2"
                >
                  <IoPersonOutline className="text-sm" />
                  Voir le profil
                </Link>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 space-y-4">
              {booking.contract?.pdfUrl && (
                <a
                  href={booking.contract.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between group p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <IoDocumentTextOutline className="text-on-surface-variant text-xl" />
                    <span className="text-sm font-semibold text-on-surface">
                      Contrat de location (PDF)
                    </span>
                  </div>
                  <IoDownloadOutline className="text-outline-variant group-hover:text-primary" />
                </a>
              )}
              <a
                href="#"
                className="flex items-center justify-between group p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <IoReceiptOutline className="text-on-surface-variant text-xl" />
                  <span className="text-sm font-semibold text-on-surface">
                    Facture détaillée
                  </span>
                </div>
                <IoChevronForwardOutline className="text-outline-variant group-hover:text-primary" />
              </a>
            </div>

            <div className="p-6 bg-error-container/20 rounded-xl">
              <p className="text-xs text-on-error-container uppercase font-bold tracking-widest mb-2">
                Politique d'annulation
              </p>
              <p className="text-sm text-on-error-container leading-relaxed">
                Cette réservation est sous la politique <strong>Modérée</strong>
                . Annulation gratuite jusqu'à 5 jours avant l'arrivée.
              </p>
            </div>
          </aside>
        </div>

        <footer className="mt-20 py-12 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="max-w-md">
            <p className="text-on-surface-variant italic font-medium leading-relaxed">
              "Nous espérons que votre séjour à {booking.listing.title} a été à
              la hauteur de vos attentes."
            </p>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-2xl font-extrabold text-outline-variant tracking-tighter opacity-30">
              NESTHUB
            </span>
          </div>
        </footer>
      </main>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onSubmit={handleSubmitReview}
          booking={booking}
        />
      )}

      {/* Extend Booking Modal */}
      {isExtendModalOpen && (
        <ExtendBookingModal
          booking={{
            id: booking.id,
            listingId: booking.listing.id,
            listingTitle: booking.listing.title,
            checkOut: booking.checkOut,
            pricePerNight: booking.pricePerNight,
          }}
          onClose={() => setIsExtendModalOpen(false)}
          onSuccess={handleExtendSuccess}
        />
      )}

      {/* ✅ Cancel Modal - Locataire */}
      <TenantCancelModal
        booking={booking}
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancel}
      />
    </div>
  );
}
