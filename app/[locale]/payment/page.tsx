// app/fr/payment/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";
import {
  IoArrowBackOutline,
  IoCardOutline,
  IoLockClosedOutline,
  IoShieldCheckmarkOutline,
  IoLocationOutline,
  IoPeopleOutline,
  IoReceiptOutline,
  IoInformationCircleOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoHomeOutline,
  IoChevronForwardOutline,
  IoMoonOutline,
  IoCloseOutline,
  IoTimeOutline,
  IoLogInOutline,
  IoLogOutOutline,
  IoSparklesOutline,
  IoRibbonOutline,
  IoStarSharp,
  IoFlashOutline,
  IoCallOutline,
  IoChatbubbleOutline,
  IoMailOutline,
  IoWalletOutline,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const pipListing = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

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
function fmtDay(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { weekday: "long" });
}
function fmtPrice(n: number) {
  return n.toLocaleString("fr-FR");
}

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

// ─── Mesh Background ──────────────────────────────────────────────────────────
function MeshBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div
        className="absolute -top-[40%] -right-[20%] w-[80vw] h-[80vw] rounded-full opacity-[0.07] dark:opacity-[0.04] blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, #6366f1 0%, #8b5cf6 40%, #0ea5e9 100%)",
          animation: "meshFloat 25s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -bottom-[30%] -left-[20%] w-[70vw] h-[70vw] rounded-full opacity-[0.06] dark:opacity-[0.03] blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, #7c3aed 0%, #6366f1 50%, #a78bfa 100%)",
          animation: "meshFloat 20s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute top-[20%] left-[30%] w-[50vw] h-[50vw] rounded-full opacity-[0.04] dark:opacity-[0.02] blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, #0ea5e9 0%, #8b5cf6 60%, #6366f1 100%)",
          animation: "meshFloat 30s ease-in-out infinite 2s",
        }}
      />
      {/* Noise grain */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-20 right-4 z-[80] max-w-sm fade-up">
      <div
        className={`flex items-center gap-2.5 pl-4 pr-3 py-3 rounded-2xl text-sm font-bold shadow-xl backdrop-blur-xl border ${
          type === "success"
            ? "bg-emerald-50/90 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-emerald-500/10"
            : type === "error"
              ? "bg-rose-50/90 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 shadow-rose-500/10"
              : "bg-sky-50/90 dark:bg-sky-900/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 shadow-sky-500/10"
        }`}
      >
        {type === "success" ? (
          <IoCheckmarkCircleOutline className="text-lg flex-shrink-0" />
        ) : type === "error" ? (
          <IoAlertCircleOutline className="text-lg flex-shrink-0" />
        ) : (
          <IoInformationCircleOutline className="text-lg flex-shrink-0" />
        )}
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="ml-1 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
        >
          <IoCloseOutline className="text-sm" />
        </button>
      </div>
    </div>
  );
}

// ─── Stripe form ──────────────────────────────────────────────────────────────
function StripePaymentForm({
  booking,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
}: any) {
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
        redirect: "if_required",
      });
      if (error) onError(error.message);
      else onSuccess();
    } catch (err: any) {
      onError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="group relative w-full py-4 rounded-2xl text-base font-extrabold flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white transition-all shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 overflow-hidden"
      >
        {/* Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -skew-x-12 group-hover:animate-[shimmer_1.5s_ease]" />
        {isProcessing ? (
          <>
            <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Traitement en cours…
          </>
        ) : (
          <>
            <IoLockClosedOutline className="text-lg relative z-10" />
            <span className="relative z-10">
              Payer {fmtPrice(booking.totalPrice)} TND
            </span>
          </>
        )}
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const offerId = searchParams.get("offerId");
  const conversationId = searchParams.get("conversationId");

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [imgErr, setImgErr] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") =>
      setToast({ message, type }),
    []
  );

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
            serviceFee:
              offer.serviceFee ??
              Math.round(offer.pricePerNight * offer.nights * 0.05),
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
          const paymentRes = await fetch(
            "/api/payments/create-payment-intent",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ offerId, conversationId }),
            }
          );
          const paymentData = await paymentRes.json();
          if (paymentRes.ok) setClientSecret(paymentData.clientSecret);
          else showToast(paymentData.error || "Erreur de paiement", "error");
        } else {
          showToast("Offre non trouvée", "error");
        }
      } catch {
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
    setTimeout(
      () => router.push(`/fr/payment/success?offerId=${offerId}`),
      2500
    );
  };
  const handleError = (error: string) => showToast(error, "error");

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <LoadingSpinner
        fullScreen
        variant="spinner"
        size="lg"
        color="primary"
        text="Chargement de votre page de paiement"
        speed="normal"
      />
    );
  }

  // ─── Success ────────────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f6f5ff] dark:bg-[#0a0a1a] flex items-center justify-center px-4">
        <MeshBackground />
        <style>{`
          @keyframes confettiBurst {
            0% { opacity:0; transform:scale(.5) rotate(0deg) }
            50% { opacity:1; transform:scale(1.1) rotate(5deg) }
            100% { opacity:1; transform:scale(1) rotate(0deg) }
          }
          @keyframes checkDraw {
            0% { stroke-dashoffset: 50 }
            100% { stroke-dashoffset: 0 }
          }
          @keyframes ringPulse {
            0% { transform:scale(1); opacity:.3 }
            100% { transform:scale(1.8); opacity:0 }
          }
        `}</style>
        <div
          className="text-center max-w-sm"
          style={{ animation: "confettiBurst .6s ease both" }}
        >
          {/* Animated check */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            {/* Pulsing rings */}
            <div
              className="absolute inset-0 rounded-3xl bg-emerald-400/20"
              style={{
                animation: "ringPulse 1.5s ease-out infinite",
              }}
            />
            <div
              className="absolute inset-0 rounded-3xl bg-emerald-400/15"
              style={{
                animation: "ringPulse 1.5s ease-out .3s infinite",
              }}
            />
            <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <svg
                viewBox="0 0 24 24"
                className="w-10 h-10"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline
                  points="20 6 9 17 4 12"
                  style={{
                    strokeDasharray: 50,
                    animation: "checkDraw .5s ease .3s both",
                  }}
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
            Paiement confirmé !
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
            Votre réservation a été validée avec succès.
          </p>
         

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-medium">
            <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-indigo-500 animate-spin" />
            Redirection …
          </div>
        </div>
      </div>
    );
  }

  // ─── No booking ─────────────────────────────────────────────────────────────
  if (!booking) {
    return (
      <div className="min-h-screen bg-[#f6f5ff] dark:bg-[#0a0a1a] flex items-center justify-center px-4">
        <MeshBackground />
        <div className="text-center">
          <div className="w-16 h-16 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-gray-800 shadow-sm">
            <IoReceiptOutline className="text-3xl text-gray-400 dark:text-gray-500" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Aucune réservation trouvée
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
            Vérifiez le lien ou retournez à vos messages.
          </p>
          <Link
            href="/fr/messages"
            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1"
          >
            Retour aux messages{" "}
            <IoChevronForwardOutline className="text-xs" />
          </Link>
        </div>
      </div>
    );
  }

  const listingImageUrl = booking.listing.image
    ? pipListing(booking.listing.image)
    : null;
  const nightsTotal = booking.pricePerNight * booking.nights;

  return (
    <div className="min-h-screen bg-[#f6f5ff] dark:bg-[#0a0a1a] text-gray-900 dark:text-white transition-colors">
      <MeshBackground />

      <style>{`
        @keyframes meshFloat {
          0%,100%{transform:translate(0,0) scale(1)}
          25%{transform:translate(5%,-3%) scale(1.05)}
          50%{transform:translate(-3%,5%) scale(.95)}
          75%{transform:translate(3%,2%) scale(1.02)}
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{transform:translateX(-150%)} 100%{transform:translateX(150%)} }
        .fade-up { animation: fadeUp .55s cubic-bezier(.22,1,.36,1) both }
        .d1{animation-delay:.06s}.d2{animation-delay:.12s}.d3{animation-delay:.18s}
        .d4{animation-delay:.24s}.d5{animation-delay:.3s}.d6{animation-delay:.36s}
      `}</style>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <TenantHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2.5 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-8 fade-up"
        >
          <div className="w-8 h-8 rounded-xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/50 dark:border-gray-800 flex items-center justify-center group-hover:border-indigo-300 dark:group-hover:border-indigo-700 group-hover:shadow-md group-hover:shadow-indigo-500/5 transition-all">
            <IoArrowBackOutline className="text-sm" />
          </div>
          Retour
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ═══ LEFT ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-6">
            {/* Header */}
            <div className="fade-up d1">
              <div className="flex items-center gap-3 mb-2">
                
                <div>
                  <h1 className="text-4xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    Finaliser votre{" "}
                    <span className="bg-gradient-to-r from-sky-500 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                      paiement !
                    </span>
                  </h1>
                </div>
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500 ">
                Paiement sécurisé par Stripe · Carte bancaire acceptée
              </p>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center gap-0 fade-up d1">
              {[
                { label: "Offre acceptée", done: true },
                { label: "Paiement", active: true },
                { label: "Confirmation", done: false },
              ].map((step, i) => (
                <div key={i} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition-all ${
                        step.done
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : step.active
                            ? "bg-gradient-to-br from-indigo-500 to-violet-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20"
                            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600"
                      }`}
                    >
                      {step.done ? (
                        <IoCheckmarkCircleOutline className="text-sm" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold hidden sm:block ${
                        step.done
                          ? "text-emerald-600 dark:text-emerald-400"
                          : step.active
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-400 dark:text-gray-600"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div
                      className={`flex-1 h-px mx-3 ${
                        step.done
                          ? "bg-emerald-300 dark:bg-emerald-700"
                          : "bg-gray-200 dark:bg-gray-800"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Payment card */}
            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/50 dark:border-gray-800 rounded-3xl overflow-hidden shadow-lg shadow-indigo-500/5 fade-up d2">
              {/* Card header */}
              <div className="px-6 py-4 border-b border-gray-100/80 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/30">
                    <IoCardOutline className="text-indigo-600 dark:text-indigo-400 text-base" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Carte bancaire
                    </h3>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      Visa, Mastercard, American Express
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {["Visa", "MC", "Amex"].map((c) => (
                    <div
                      key={c}
                      className="h-6 px-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                    >
                      <span className="text-[9px] font-extrabold text-gray-500 dark:text-gray-400 tracking-wider">
                        {c}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stripe form */}
              <div className="p-6">
                {clientSecret ? (
                  <Elements
                    stripe={getStripe()}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: "stripe",
                        variables: {
                          colorPrimary: "#6366f1",
                          borderRadius: "14px",
                          fontFamily: "inherit",
                          colorBackground: "transparent",
                        },
                        rules: {
                          ".Input": {
                            border: "1.5px solid #e5e7eb",
                            boxShadow: "none",
                            padding: "12px 14px",
                            backgroundColor: "rgba(255,255,255,0.6)",
                          },
                          ".Input:focus": {
                            border: "1.5px solid #818cf8",
                            boxShadow: "0 0 0 4px rgba(99,102,241,0.08)",
                          },
                          ".Label": {
                            fontWeight: "700",
                            fontSize: "12px",
                            marginBottom: "6px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: "#9ca3af",
                          },
                        },
                      },
                    }}
                  >
                    <StripePaymentForm
                      booking={booking}
                      onSuccess={handleSuccess}
                      onError={handleError}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                    />
                  </Elements>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full border-2 border-indigo-200 dark:border-indigo-800 border-t-indigo-500 animate-spin" />
                    </div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                      Initialisation du paiement sécurisé…
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Security badges */}
            <div className="grid grid-cols-3 gap-3 fade-up d3">
              {[
                {
                  icon: <IoShieldCheckmarkOutline />,
                  label: "SSL 256-bit",
                  desc: "Connexion chiffrée",
                  color: "indigo",
                },
                {
                  icon: <IoLockClosedOutline />,
                  label: "Données sécurisées",
                  desc: "Aucune donnée stockée",
                  color: "violet",
                },
                {
                  icon: <IoCheckmarkCircleOutline />,
                  label: "PCI DSS",
                  desc: "Norme bancaire",
                  color: "purple",
                },
              ].map(({ icon, label, desc, color }) => (
                <div
                  key={label}
                  className="flex flex-col items-center text-center gap-2 py-4 px-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/50 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-transform group-hover:scale-110 ${
                      color === "indigo"
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30"
                        : color === "violet"
                          ? "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/30"
                          : "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/30"
                    }`}
                  >
                    {icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                      {label}
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">
                      {desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Info note */}
            <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/15 border border-indigo-100 dark:border-indigo-800/30 fade-up d4">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0 border border-indigo-200 dark:border-indigo-800/30 mt-0.5">
                <IoFlashOutline className="text-indigo-600 dark:text-indigo-400 text-sm" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-0.5">
                  Confirmation instantanée
                </p>
                <p className="text-[11px] text-indigo-600/60 dark:text-indigo-400/60 leading-relaxed">
                  Votre réservation est confirmée immédiatement après le
                  paiement. Un email de confirmation avec tous les détails vous
                  sera envoyé automatiquement.
                </p>
              </div>
            </div>
          </div>

          {/* ═══ RIGHT ══════════════════════════════════════════════════════ */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            {/* Property card */}
            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-gray-800 overflow-hidden shadow-lg shadow-indigo-500/5 fade-up d2">
              {/* Image */}
              <div className="relative h-56 bg-gray-100 dark:bg-gray-800">
                {listingImageUrl && !imgErr ? (
                  <img
                    src={listingImageUrl}
                    alt={booking.listing.title}
                    className="w-full h-full object-cover"
                    onError={() => setImgErr(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-200 via-violet-200 to-purple-200 dark:from-indigo-900 dark:via-violet-900 dark:to-purple-900 flex items-center justify-center">
                    <IoHomeOutline className="text-6xl text-indigo-300 dark:text-indigo-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/5" />

                {/* Type badge */}
                {booking.listing.type && (
                  <div className="absolute top-3 left-3">
                    <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest text-white/90 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/15">
                      <IoSparklesOutline className="text-[10px]" />
                      {booking.listing.type}
                    </span>
                  </div>
                )}

                {/* Image bottom info */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-extrabold text-lg leading-tight mb-1.5">
                    {booking.listing.title}
                  </h3>
                  {booking.listing.location && (
                    <p className="text-white/70 text-xs flex items-center gap-1 font-medium">
                      <IoLocationOutline className="text-sm flex-shrink-0" />
                      {booking.listing.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Date strip */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    {
                      icon: (
                        <IoLogInOutline className="text-indigo-600 dark:text-indigo-400" />
                      ),
                      label: "Arrivée",
                      value: fmtShort(booking.checkIn),
                      day: fmtDay(booking.checkIn),
                      bg: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30",
                    },
                    {
                      icon: (
                        <IoMoonOutline className="text-purple-600 dark:text-purple-400" />
                      ),
                      label: "Durée",
                      value: `${booking.nights} nuit${booking.nights > 1 ? "s" : ""}`,
                      day: `${booking.guests} voyag.`,
                      bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/30",
                    },
                    {
                      icon: (
                        <IoLogOutOutline className="text-violet-600 dark:text-violet-400" />
                      ),
                      label: "Départ",
                      value: fmtShort(booking.checkOut),
                      day: fmtDay(booking.checkOut),
                      bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800/30",
                    },
                  ].map(({ icon, label, value, day, bg }) => (
                    <div
                      key={label}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border ${bg}`}
                    >
                      <span className="text-lg">{icon}</span>
                      <div className="text-center">
                        <p className="text-[8px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-[.15em]">
                          {label}
                        </p>
                        <p className="text-xs font-extrabold text-gray-900 dark:text-white mt-0.5">
                          {value}
                        </p>
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 capitalize font-medium">
                          {day}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reference */}
                {booking.reference && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-xs">
                    <IoReceiptOutline className="text-sm text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      Réf:
                    </span>
                    <span className="font-mono font-bold text-gray-700 dark:text-gray-300 tracking-wider">
                      {booking.reference}
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div className="relative">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
                  <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 px-2">
                    <span className="text-[8px] font-extrabold text-gray-300 dark:text-gray-700 uppercase tracking-widest">
                      Détails du prix
                    </span>
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {fmtPrice(booking.pricePerNight)} TND ×{" "}
                      {booking.nights} nuit
                      {booking.nights > 1 ? "s" : ""}
                    </span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {fmtPrice(nightsTotal)} TND
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Frais de ménage
                    </span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {fmtPrice(booking.cleaningFee)} TND
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Frais de service
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {fmtPrice(booking.serviceFee)} TND
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="relative pt-5">
                  <div className="absolute top-0 left-0 right-0 border-t-2 border-dashed border-gray-200 dark:border-gray-800" />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-gray-400 dark:text-gray-500 mb-0.5">
                        Total à payer
                      </p>
                      <p className="text-2xl font-black bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent tracking-tight leading-none">
                        {fmtPrice(booking.totalPrice)}{" "}
                        <span className="text-sm font-bold">TND</span>
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-900/20 dark:via-violet-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-center">
                      <IoWalletOutline className="text-indigo-600 dark:text-indigo-400 text-xl" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation */}
            <div className="rounded-2xl p-4 border border-emerald-200/60 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-900/10 backdrop-blur-sm fade-up d4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0 border border-emerald-200 dark:border-emerald-800/30 mt-0.5">
                  <IoShieldCheckmarkOutline className="text-emerald-500 text-sm" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">
                    Annulation flexible
                  </p>
                  <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/60 leading-relaxed">
                    Annulation gratuite jusqu'à 30 jours avant l'arrivée.
                    Remboursement intégral garanti.
                  </p>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="rounded-2xl p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/50 dark:border-gray-800 fade-up d5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                    <IoChatbubbleOutline className="text-gray-500 dark:text-gray-400 text-sm" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      Besoin d'aide ?
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      Disponible 24h/7j
                    </p>
                  </div>
                </div>
                <Link
                  href="/fr/help"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 group"
                >
                  Aide{" "}
                  <IoChevronForwardOutline className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}