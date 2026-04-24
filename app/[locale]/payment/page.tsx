// app/fr/payment/page.tsx (version améliorée avec Stripe)
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe-client';
import {
  IoArrowBackOutline,
  IoCardOutline,
  IoWalletOutline,
  IoLockClosedOutline,
  IoShieldCheckmarkOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoPeopleOutline,
  IoBedOutline,
  IoReceiptOutline,
  IoInformationCircleOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoHomeOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const pipListing = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;

const GRAD = "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600";
const GRAD_TEXT = "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent";
const BTN_GRAD = `${GRAD} text-white font-extrabold shadow-lg shadow-indigo-200/60 dark:shadow-indigo-900/30 hover:opacity-90 active:scale-[.98] transition-all`;

interface BookingData {
  id: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  totalPrice: number;
  listing: {
    id: string;
    title: string;
    image?: string;
    location?: string;
    rating?: number;
    bedrooms?: number;
    maxGuests?: number;
    type?: string;
  };
  reference?: string;
}

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function fmtShort(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error" | "info"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === "success" ? "bg-emerald-500" : type === "error" ? "bg-red-500" : "bg-sky-500";
  const Icon = type === "success" ? IoCheckmarkCircleOutline : type === "error" ? IoAlertCircleOutline : IoInformationCircleOutline;

  return (
    <div className="fixed top-24 right-4 z-[80] max-w-sm animate-in slide-in-from-top-3 fade-in duration-300">
      <div className={`flex items-center gap-3 ${bg} text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium`}>
        <Icon className="text-lg flex-shrink-0" />
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
      </div>
    </div>
  );
}

// Composant de formulaire Stripe
function StripePaymentForm({ booking, onSuccess, onError, isProcessing, setIsProcessing }: any) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/fr/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      onError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full py-4 rounded-2xl text-base flex items-center justify-center gap-3 mt-4 ${BTN_GRAD} disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {isProcessing ? (
          <>
            <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Traitement en cours…
          </>
        ) : (
          <>
            <IoLockClosedOutline className="text-lg" />
            Payer {booking.totalPrice.toLocaleString("fr-FR")} TND
          </>
        )}
      </button>
    </form>
  );
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const offerId = searchParams.get("offerId");
  const conversationId = searchParams.get("conversationId");

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [imgErr, setImgErr] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => setToast({ message, type }), []);

  useEffect(() => {
    const fetchOffer = async () => {
      if (!offerId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/offers/${offerId}`);
        if (res.ok) {
          const offer = await res.json();
          setBooking({
            id: offer.id,
            checkIn: offer.checkIn,
            checkOut: offer.checkOut,
            nights: offer.nights,
            guests: offer.guests,
            pricePerNight: offer.pricePerNight,
            cleaningFee: offer.cleaningFee ?? 85,
            serviceFee: offer.serviceFee ?? Math.round(offer.pricePerNight * offer.nights * 0.05),
            totalPrice: offer.totalPrice,
            reference: offer.reference,
            listing: {
              id: offer.listing.id,
              title: offer.listing.title,
              image: offer.listing.image,
              location: offer.listing.location,
              bedrooms: offer.listing.bedrooms,
              maxGuests: offer.listing.maxGuests,
              type: offer.listing.type,
            },
          });

          // Créer le PaymentIntent
          const paymentRes = await fetch('/api/payments/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ offerId, conversationId }),
          });
          const paymentData = await paymentRes.json();
          if (paymentRes.ok) {
            setClientSecret(paymentData.clientSecret);
          } else {
            showToast(paymentData.error || 'Erreur de paiement', 'error');
          }
        } else {
          showToast("Offre non trouvée", "error");
        }
      } catch (error) {
        console.error("Error fetching offer:", error);
        showToast("Erreur de chargement", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffer();
  }, [offerId, conversationId, showToast]);

  const handleSuccess = () => {
    setIsSuccess(true);
    showToast("Paiement effectué avec succès !", "success");
    setTimeout(() => router.push(`/fr/payment/success?offerId=${offerId}`), 2000);
  };

  const handleError = (error: string) => {
    showToast(error, "error");
  };

  if (isLoading) {
    return (
     
<LoadingSpinner
        fullScreen={true}
        variant="spinner"
        size="lg"
        color="primary"
        text="chargement de votre page de paiemenet"
        speed="normal"
      />
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <IoCheckmarkCircleOutline className="text-emerald-500 text-5xl" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Paiement confirmé !</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Votre réservation a été validée.</p>
          <p className="text-xs text-gray-400 dark:text-gray-600">Redirection vers la confirmation…</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <IoReceiptOutline className="text-5xl text-gray-300 dark:text-slate-700 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucune réservation trouvée</h1>
          <Link href="/fr/messages" className="text-indigo-600 dark:text-indigo-400 hover:underline">Retour aux messages</Link>
        </div>
      </div>
    );
  }

  const listingImageUrl = booking.listing.image ? pipListing(booking.listing.image) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <TenantHeader></TenantHeader>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-1.5">
                Finaliser votre <span className={GRAD_TEXT}>réservation</span>
              </h1>
              <p className="text-sm text-gray-400 dark:text-gray-600">Paiement sécurisé par Stripe - Carte bancaire acceptée</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                  <IoCardOutline className="text-indigo-600 dark:text-indigo-400 text-sm" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Paiement par carte bancaire</h3>
              </div>

              {clientSecret && (
                <Elements stripe={getStripe()} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#6366f1', borderRadius: '12px' } } }}>
                  <StripePaymentForm booking={booking} onSuccess={handleSuccess} onError={handleError} isProcessing={isProcessing} setIsProcessing={setIsProcessing} />
                </Elements>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 py-4 opacity-50 hover:opacity-80 transition-opacity">
              {[{ icon: <IoShieldCheckmarkOutline />, label: "SSL Sécurisé 256-bit" }, { icon: <IoLockClosedOutline />, label: "Données chiffrées" }, { icon: <IoCheckmarkCircleOutline />, label: "PCI Compliant" }].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-500 text-sm">{icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="relative h-48 bg-gray-100 dark:bg-slate-800">
                {listingImageUrl && !imgErr ? (
                  <img src={listingImageUrl} alt={booking.listing.title} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
                ) : (
                  <div className={`w-full h-full ${GRAD} flex items-center justify-center`}>
                    <IoHomeOutline className="text-white text-5xl opacity-30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-extrabold text-lg leading-tight">{booking.listing.title}</h3>
                  {booking.listing.location && (
                    <p className="text-white/80 text-xs flex items-center gap-1 mt-1"><IoLocationOutline className="text-sm" />{booking.listing.location}</p>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-800">
                  <div><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">Séjour</p><p className="font-extrabold text-gray-900 dark:text-white">{booking.nights} nuit{booking.nights > 1 ? "s" : ""}</p></div>
                  <div className="text-right"><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">Dates</p><p className="font-extrabold text-gray-900 dark:text-white text-sm">{fmtShort(booking.checkIn)} → {fmtShort(booking.checkOut)}</p></div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>{booking.pricePerNight.toLocaleString("fr-FR")} TND × {booking.nights} nuit{booking.nights > 1 ? "s" : ""}</span><span>{(booking.pricePerNight * booking.nights).toLocaleString("fr-FR")} TND</span></div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>Frais de ménage</span><span>{booking.cleaningFee.toLocaleString("fr-FR")} TND</span></div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>Frais de service NestHub</span><span className="text-indigo-500">{booking.serviceFee.toLocaleString("fr-FR")} TND</span></div>
                </div>

                <div className="pt-4 border-t-2 border-dashed border-gray-100 dark:border-slate-800 flex justify-between items-center">
                  <div><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">Total (TND)</p><p className={`text-3xl font-extrabold tracking-tight ${GRAD_TEXT}`}>{booking.totalPrice.toLocaleString("fr-FR")} <span className="text-lg">TND</span></p></div>
                  <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center"><IoReceiptOutline className="text-indigo-500 text-xl" /></div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}