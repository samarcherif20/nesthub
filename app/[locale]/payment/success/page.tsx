// app/fr/payment/success/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IoCheckmarkCircle,
  IoDocumentTextOutline,
  IoDownloadOutline,
  IoChatbubbleOutline,
  IoLocationOutline,
  IoCallOutline,
  IoKeyOutline,
  IoInformationCircleOutline,
  IoCalendarOutline,
  IoPeopleOutline,
  IoHomeOutline,
  IoShieldCheckmarkOutline,
  IoArrowForwardOutline,
  IoNotificationsOutline,
  IoHelpCircleOutline,
  IoStarSharp,
  IoTimeOutline,
} from "react-icons/io5";

const pipListing = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;
const GRAD = "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600";
const GRAD_TEXT =
  "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent";
const BTN_GRAD = `${GRAD} text-white font-bold shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/30 hover:opacity-90 active:scale-[.98] transition-all`;

interface BookingConfirmation {
  id: string;
  reference: string;
  issuedAt: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  tenant: { id: string; name: string; verified?: boolean };
  owner: {
    id: string;
    name: string;
    phone?: string;
    isPremium?: boolean;
    image?: string;
  };
  listing: {
    id: string;
    title: string;
    location: string;
    address?: string;
    images?: string[];
    rating?: number;
    type?: string;
    governorate?: string;
    delegation?: string;
    street?: string;
  };
  accessCode?: string;
  contractPdfUrl?: string;
  checkInTime?: string;
  checkOutTime?: string;
  contractId?: string;
  offerId?: string;
  realBookingId?: string; // Stocker le vrai bookingId
}

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtShort(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function AccessCodeDisplay({ code }: { code: string }) {
  const digits = code.split("");
  return (
    <div className="flex gap-2">
      {digits.map((d, i) => (
        <div
          key={i}
          className="w-10 h-12 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-extrabold text-xl text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700"
        >
          {d}
        </div>
      ))}
    </div>
  );
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentIntent = searchParams.get("payment_intent");
  const offerId = searchParams.get("offerId");
  const bookingId = searchParams.get("bookingId");

  const [booking, setBooking] = useState<BookingConfirmation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const [contractLoading, setContractLoading] = useState(false);

  useEffect(() => {
    const fetchConfirmation = async () => {
      try {
        let data;
        let realBookingIdTemp = null;

        // Priorité: bookingId > offerId > paymentIntent
        if (bookingId) {
          const res = await fetch(`/api/bookings/${bookingId}`);
          if (res.ok) {
            data = await res.json();
            realBookingIdTemp = data.id;
          } else {
            // Si le booking n'existe pas, on va chercher l'offre
            const offerRes = await fetch(`/api/offers/${bookingId}`);
            if (offerRes.ok) {
              data = await offerRes.json();
              data = data.offer || data;
              realBookingIdTemp = null; // Pas de booking associé
            } else {
              throw new Error("Réservation non trouvée");
            }
          }
        } else if (offerId) {
          const res = await fetch(`/api/offers/${offerId}`);
          if (!res.ok) throw new Error("Erreur chargement offre");
          data = await res.json();
          data = data.offer || data;

          // Vérifier si une réservation existe déjà pour cette offre
          const bookingRes = await fetch(`/api/bookings?offerId=${offerId}`);
          if (bookingRes.ok) {
            const bookingData = await bookingRes.json();
            if (bookingData.bookings && bookingData.bookings.length > 0) {
              realBookingIdTemp = bookingData.bookings[0].id;
            }
          }
        } else if (paymentIntent) {
          const res = await fetch(
            `/api/payments/confirm?payment_intent=${paymentIntent}`,
          );
          if (!res.ok) throw new Error("Erreur confirmation paiement");
          data = await res.json();
        } else {
          throw new Error("Aucun identifiant de réservation trouvé");
        }

        const nights =
          data.nights ||
          Math.ceil(
            (new Date(data.checkOut).getTime() -
              new Date(data.checkIn).getTime()) /
              86400000,
          );

        // Construire l'adresse complète
        const fullAddress = [
          data.listing?.street,
          data.listing?.delegation,
          data.listing?.governorate,
        ]
          .filter(Boolean)
          .join(", ");

        setBooking({
          id: data.id,
          reference: data.reference || `OFF-${Date.now().toString(36)}`,
          issuedAt: data.createdAt || new Date().toISOString(),
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          nights,
          guests: data.guests || 1,
          totalPrice: data.totalPrice || 0,
          pricePerNight: data.pricePerNight || 0,
          cleaningFee: data.cleaningFee || 0,
          serviceFee: data.serviceFee || 0,
          tenant: {
            id: data.tenant?.id,
            name: data.tenant?.name || "Vous",
            verified: data.tenant?.isVerified,
          },
          owner: {
            id: data.owner?.id,
            name: data.owner?.name || "Le propriétaire",
            phone: data.revealedInfo?.ownerPhone,
            image: data.owner?.image,
          },
          listing: {
            id: data.listing?.id,
            title: data.listing?.title || "Votre logement",
            location: fullAddress || data.listing?.location || "",
            address: fullAddress,
            images:
              data.listing?.photos?.map((p: any) => p.url) ||
              data.listing?.images ||
              [],
            type: data.listing?.type,
          },
          accessCode:
            data.revealedInfo?.accessCode ||
            Math.floor(1000 + Math.random() * 9000).toString(),
          checkInTime: "15:00",
          checkOutTime: "11:00",
          contractId: data.contract?.id,
          offerId: data.offerId || offerId || data.id, // Stocker l'offerId
          realBookingId: realBookingIdTemp || undefined,
        });

        console.log("📊 Booking chargé:", {
          offerId: data.offerId || offerId,
          realBookingId: realBookingIdTemp,
          bookingId: data.id,
        });
      } catch (e) {
        console.error("Erreur:", e);
        setError("Impossible de charger les détails de la réservation");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfirmation();
  }, [paymentIntent, offerId, bookingId]);

  const generateContract = async () => {
    if (!booking) return;
    setContractLoading(true);

    try {
      const requestBody: { offerId?: string; bookingId?: string } = {};

      if (booking.offerId) {
        requestBody.offerId = booking.offerId;
      } else if (booking.realBookingId) {
        requestBody.bookingId = booking.realBookingId;
      }

      console.log("📤 Envoi requête contrat:", requestBody);

      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      console.log("📥 Réponse contrat:", data);

      if (!res.ok) {
        throw new Error(data.error || "Erreur génération contrat");
      }

      if (data.contract?.id) {
        // Télécharger via l'endpoint de téléchargement
        window.open(`/api/contracts/${data.contract.id}/download`, "_blank");
      } else {
        alert("Contrat généré avec succès !");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la génération du contrat");
    } finally {
      setContractLoading(false);
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className={`w-12 h-12 rounded-2xl ${GRAD} animate-pulse`} />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-500 mb-4">
            {error || "Erreur de chargement"}
          </h1>
          <Link
            href="/fr/reservations"
            className="text-indigo-600 hover:underline"
          >
            Voir mes réservations
          </Link>
        </div>
      </div>
    );
  }

  const mainImage = booking.listing.images?.[0]
    ? pipListing(booking.listing.images[0])
    : null;

  return (
    <div className="min-h-screen bg-[#f9f9ff] dark:bg-slate-950">
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-6 py-4 max-w-screen-2xl mx-auto">
          <span
            className={`text-2xl font-extrabold tracking-tighter ${GRAD_TEXT}`}
          >
            NESTHUB
          </span>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800">
              <IoNotificationsOutline className="text-xl" />
            </button>
            <button className="p-2 rounded-full text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800">
              <IoHelpCircleOutline className="text-xl" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-14 pb-24">
        {/* Section succès */}
        <section className="flex flex-col items-center text-center mb-16">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-400 to-purple-600 opacity-20 blur-xl scale-150" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center shadow-xl">
              <IoCheckmarkCircle className="text-white text-4xl" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4 leading-tight">
            Paiement <span className={GRAD_TEXT}>confirmé !</span>
          </h1>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-lg">
            Votre réservation est finalisée. Nous préparons votre arrivée.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Colonne gauche - Détails */}
          <div className="lg:col-span-7 space-y-6">
            {/* Carte résumé */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-gray-100 dark:border-slate-800 shadow-sm">
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-800 pb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                      Référence
                    </p>
                    <p className="font-extrabold text-gray-900 dark:text-white font-mono">
                      {booking.reference}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                      Date
                    </p>
                    <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                      {fmtDate(booking.issuedAt)}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2">
                    Récapitulatif
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Location du bien{" "}
                    <span className="font-semibold">
                      {booking.listing.title}
                    </span>{" "}
                    du {fmtDate(booking.checkIn)} au {fmtDate(booking.checkOut)}{" "}
                    pour {booking.guests} voyageur(s).
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 dark:bg-slate-800/40 rounded-xl p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                      Arrivée
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {fmtDate(booking.checkIn)}
                    </p>
                    <p className="text-xs text-gray-400">
                      À partir de {booking.checkInTime}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800/40 rounded-xl p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                      Départ
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {fmtDate(booking.checkOut)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Avant {booking.checkOutTime}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800/40 rounded-xl p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                      Total
                    </p>
                    <p className={`text-sm font-bold ${GRAD_TEXT}`}>
                      {booking.totalPrice.toLocaleString("fr-FR")} TND
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Détails des prix */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
              <h3 className="text-sm font-bold mb-4 text-gray-700 dark:text-gray-300">
                Détail des prix
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {booking.pricePerNight} TND × {booking.nights} nuits
                  </span>
                  <span>
                    {(booking.pricePerNight * booking.nights).toLocaleString(
                      "fr-FR",
                    )}{" "}
                    TND
                  </span>
                </div>
                {booking.cleaningFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Frais de ménage</span>
                    <span>
                      {booking.cleaningFee.toLocaleString("fr-FR")} TND
                    </span>
                  </div>
                )}
                {booking.serviceFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Frais de service</span>
                    <span>
                      {booking.serviceFee.toLocaleString("fr-FR")} TND
                    </span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className={GRAD_TEXT}>
                    {booking.totalPrice.toLocaleString("fr-FR")} TND
                  </span>
                </div>
              </div>
            </div>

            {/* Boutons action */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={generateContract}
                disabled={contractLoading}
                className={`flex-1 py-4 px-6 rounded-full flex items-center justify-center gap-3 text-sm ${BTN_GRAD} disabled:opacity-50`}
              >
                <IoDocumentTextOutline className="text-lg" />
                {contractLoading ? "Génération..." : "Télécharger le contrat"}
              </button>
              <Link
                href="/fr/messages"
                className="flex-1 py-4 px-6 rounded-full flex items-center justify-center gap-3 text-sm font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition"
              >
                <IoChatbubbleOutline className="text-lg" />
                Contacter l'hôte
              </Link>
            </div>
          </div>

          {/* Colonne droite - Logement et accès */}
          <div className="lg:col-span-5 space-y-5">
            {/* Carte logement */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm">
              <div className="h-48 relative bg-gray-100 dark:bg-slate-800 overflow-hidden">
                {mainImage && !imgErrors[0] ? (
                  <img
                    src={mainImage}
                    alt={booking.listing.title}
                    className="w-full h-full object-cover"
                    onError={() => setImgErrors((p) => ({ ...p, 0: true }))}
                  />
                ) : (
                  <div
                    className={`w-full h-full ${GRAD} flex items-center justify-center opacity-60`}
                  >
                    <IoHomeOutline className="text-white text-6xl" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                  Destination
                </p>
                <p className="text-base font-extrabold text-gray-900 dark:text-white">
                  {booking.listing.title}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-600 mt-0.5">
                  {booking.listing.location}
                </p>
              </div>
            </div>

            {/* Contact et accès */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">
                  <IoCallOutline className="text-purple-500 text-xl" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-0.5">
                    Contact hôte
                  </p>
                  <p className="font-extrabold text-gray-900 dark:text-white text-sm">
                    {booking.owner.name}
                  </p>
                  {booking.owner.phone && (
                    <p className="text-xs text-gray-500">
                      {booking.owner.phone}
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
                  <IoKeyOutline className="text-sky-500 text-xl" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1.5">
                    Code d'accès
                  </p>
                  {booking.accessCode ? (
                    <AccessCodeDisplay code={booking.accessCode} />
                  ) : (
                    <p className="text-sm text-gray-400">
                      Dès {booking.checkInTime}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Info supplémentaire */}
            <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl">
              <IoInformationCircleOutline className="text-indigo-500 text-lg flex-shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700 dark:text-indigo-400">
                Le code d'accès sera activé le jour de votre arrivée à partir de{" "}
                {booking.checkInTime || "14:00"}. Pour toute question, contactez
                l'hôte via le chat sécurisé.
              </p>
            </div>

            {/* Lien vers réservations */}
            <Link
              href="/fr/reservations"
              className="flex items-center justify-between w-full px-5 py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm hover:border-indigo-200 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <IoHomeOutline className="text-indigo-500 text-base" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    Mes réservations
                  </p>
                  <p className="text-xs text-gray-400">Voir tous vos séjours</p>
                </div>
              </div>
              <IoArrowForwardOutline className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
