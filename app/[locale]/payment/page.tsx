"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";
import { useTheme } from "next-themes";
import {
  IoLockClosedOutline,
  IoShieldCheckmarkOutline,
  IoLocationOutline,
  IoReceiptOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoHomeOutline,
  IoCloseOutline,
  IoLogInOutline,
  IoLogOutOutline,
  IoSparklesOutline,
  IoStarSharp,
  IoFlashOutline,
  IoWalletOutline,
  IoChevronDownOutline,
  IoTrophyOutline,
  IoDiamondOutline,
  IoGlobeOutline,
  IoTimeOutline,
  IoCallOutline,
  IoCardOutline,
  IoPersonOutline,
  IoChevronForwardSharp,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const pipListing = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

function fmtShort(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function fmtDay(d: string) {
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

const gradientButton = `
  bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 
  hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const gradientText =
  "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent";

// ═══════════════════════════════════════════════════════════════════════════════
// AURORA BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════════
function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950" />

      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
        style={{
          background: "radial-gradient(circle, #0ea5e9, #6366f1, transparent)",
          top: "-10%",
          right: "-5%",
        }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
        style={{
          background: "radial-gradient(circle, #8b5cf6, #a855f7, transparent)",
          bottom: "-15%",
          left: "-10%",
        }}
        animate={{
          x: [0, -30, 40, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-[80px]"
        style={{
          background: "radial-gradient(circle, #6366f1, #0ea5e9, transparent)",
          top: "40%",
          left: "30%",
        }}
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -40, 30, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3D CREDIT CARD PREVIEW - avec clic pour retourner
// ═══════════════════════════════════════════════════════════════════════════════
function CreditCardPreview({
  number,
  name,
  expiry,
  cvc,
  flipped,
  onClick,
}: {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
  flipped: boolean;
  onClick?: () => void;
}) {
  const displayNumber = number || "•••• •••• •••• ••••";
  const displayName = name || "VOTRE NOM";
  const displayExpiry = expiry || "••/••";

  return (
    <div 
      className="perspective-[1200px] w-full max-w-[380px] mx-auto cursor-pointer"
      onClick={onClick}
    >
      <motion.div
        className="relative w-full aspect-[1.586/1]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-3xl overflow-hidden border border-white/20 shadow-xl">
            
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-500/10" />

            <div className="absolute top-4 right-4 flex opacity-30 z-30">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg -ml-5" />
            </div>

            <div className="absolute top-20 left-5 z-10">
              <div className="w-12 h-8 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 shadow-xl">
                <div className="w-full h-full rounded-md border border-amber-600/40 p-0.5">
                  <div className="w-full h-[45%] border-b border-amber-600/40" />
                  <div className="flex justify-center mt-0.5">
                    <div className="w-3.5 h-2.5 rounded-sm border border-amber-600/40" />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute top-24 left-14 z-20 text-white/70">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 18C10 14 10 10 6 6" />
                <path d="M10 18C14 14 14 10 10 6" />
                <path d="M14 18C18 14 18 10 14 6" />
              </svg>
            </div>

            <div className="absolute bottom-20 left-6 right-6">
              <p className="text-white font-mono text-lg sm:text-xl tracking-[0.2em] font-bold drop-shadow-lg">
                {displayNumber}
              </p>
            </div>

            <div className="absolute bottom-6 left-6">
              <p className="text-[8px] text-white/50 uppercase tracking-[0.15em] mb-1">
                Titulaire
              </p>
              <p className="text-white/90 text-xs sm:text-sm font-bold tracking-wider uppercase drop-shadow-sm">
                {displayName}
              </p>
            </div>

            <div className="absolute bottom-6 right-6 text-right">
              <p className="text-[8px] text-white/50 uppercase tracking-[0.15em] mb-1">
                Expire
              </p>
              <p className="text-white/90 text-xs sm:text-sm font-bold tracking-wider font-mono drop-shadow-sm">
                {displayExpiry}
              </p>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-3xl overflow-hidden border border-white/20">
            <div className="absolute top-8 left-0 right-0 h-12 bg-black/60" />
            <div className="absolute top-28 left-6 right-6">
              <div className="bg-white/95 rounded-md h-9 flex items-center justify-end px-4 shadow-inner">
                <p className="text-slate-800 font-mono text-sm font-bold tracking-widest">{cvc || "•••"}</p>
              </div>
              <p className="text-[8px] text-white/50 uppercase tracking-[0.15em] mt-2 text-right">Code de sécurité</p>
            </div>
            <div className="absolute bottom-8 left-6 right-6">
              <p className="text-[7px] text-white/30 leading-relaxed text-center">Cette carte est la propriété de l'établissement bancaire émetteur.</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRIPE PAYMENT FORM - adapté au dark/light mode
// ═══════════════════════════════════════════════════════════════════════════════
function StripePaymentForm({
  booking,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
  agreed,
  setAgreed,
}: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [isStripeReady, setIsStripeReady] = useState(false);

  useEffect(() => {
    if (stripe && elements) {
      setIsStripeReady(true);
    }
  }, [stripe, elements]);

  const canSubmit = agreed && stripe && elements && isStripeReady;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !canSubmit) return;
    setIsProcessing(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/fr/payment/success`,
        },
        redirect: "if_required",
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="stripe-payment-element min-h-[280px]">
        {!isStripeReady ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin mb-3" />
            <p className="text-xs text-slate-400">Chargement du formulaire de paiement...</p>
          </div>
        ) : (
          <PaymentElement />
        )}
      </div>

      <div className="space-y-2.5 pt-2">
        {[
          { label: `${fmtPrice(booking.pricePerNight)} TND × ${booking.nights} nuits`, value: booking.pricePerNight * booking.nights },
          { label: "Frais de ménage", value: booking.cleaningFee },
          { label: "Frais de service", value: booking.serviceFee, accent: true },
        ].map((item) => (
          <div key={item.label} className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-white/30">{item.label}</span>
            <span className={`font-bold ${item.accent ? "text-sky-600 dark:text-sky-400" : "text-slate-700 dark:text-white/70"}`}>
              {fmtPrice(item.value)} TND
            </span>
          </div>
        ))}

        <div className="pt-3 mt-1 border-t border-dashed border-slate-200 dark:border-white/[0.06]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-white/30">
              Total à payer
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {fmtPrice(booking.totalPrice)}{" "}
              <span className="text-sm text-slate-500 dark:text-white/40">TND</span>
            </span>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="peer sr-only" />
          <div className="w-5 h-5 rounded-lg border border-slate-300 dark:border-white/[0.12] bg-slate-100 dark:bg-white/[0.04] peer-checked:bg-sky-500 peer-checked:border-sky-500 transition-all flex items-center justify-center">
            {agreed && <IoCheckmarkCircleOutline className="text-white text-sm" />}
          </div>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-white/30 leading-relaxed group-hover:text-slate-600 dark:group-hover:text-white/40 transition-colors">
          J'accepte les conditions générales et la politique de confidentialité
        </span>
      </label>

      <motion.button
        type="submit"
        disabled={!canSubmit || isProcessing}
        whileHover={canSubmit && !isProcessing ? { scale: 1.01, y: -1 } : {}}
        whileTap={canSubmit && !isProcessing ? { scale: 0.98 } : {}}
        className={`relative w-full py-4 rounded-2xl text-base font-extrabold flex items-center justify-center gap-3 transition-all disabled:opacity-30 disabled:cursor-not-allowed overflow-hidden group ${gradientButton}`}
      >
        {isProcessing ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex items-center gap-3">
            <motion.div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span>Traitement sécurisé…</span>
          </motion.div>
        ) : (
          <>
            <IoLockClosedOutline className="text-lg relative z-10" />
            <span className="relative z-10">Payer {fmtPrice(booking.totalPrice)} TND</span>
          </>
        )}
      </motion.button>

      <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-white/20 font-medium">
        <IoShieldCheckmarkOutline className="text-xs" />
        <span>Chiffrement SSL 256-bit · Données jamais stockées</span>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════════════════
function Toast({ message, type, onClose }: any) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.9 }}
      className="fixed top-24 left-1/2 -translate-x-1/2 z-[100]"
    >
      <div className={`flex items-center gap-3 pl-5 pr-4 py-3.5 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-2xl border ${
        type === "success" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" :
        type === "error" ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20" :
        "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20"
      }`}>
        {type === "success" ? <IoCheckmarkCircleOutline className="text-lg" /> : type === "error" ? <IoAlertCircleOutline className="text-lg" /> : <IoSparklesOutline className="text-lg" />}
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"><IoCloseOutline className="text-sm" /></button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUCCESS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function SuccessScreen({ booking, onRedirect }: { booking: BookingData; onRedirect: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRedirect(), 3000);
    return () => clearTimeout(timer);
  }, [onRedirect]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
        className="relative w-full max-w-md"
      >
        <div className="absolute -inset-10 bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 rounded-[40px] blur-3xl" />

        <div className="relative bg-white/70 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/50 dark:border-white/[0.08] rounded-[32px] p-8 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500 to-transparent" />

          <div className="flex justify-center mb-8">
            <div className="relative">
              {[0, 0.2, 0.4].map((delay, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-emerald-500/30"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, delay }}
                />
              ))}
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30"
              >
                <IoCheckmarkCircleOutline className="text-4xl text-white" />
              </motion.div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Paiement confirmé !</h1>
            <p className="text-slate-500 dark:text-white/40 text-sm">Votre réservation a été enregistrée avec succès</p>
          </div>

          <div className="bg-white/50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-white/[0.06]">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <IoReceiptOutline className="text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Récapitulatif</p>
                <p className="text-[10px] text-slate-400 dark:text-white/30 font-mono">{booking.reference || "RES-" + booking.id.slice(0, 8)}</p>
              </div>
              <div className="ml-auto">
                <span className="text-lg font-black text-emerald-500">{fmtPrice(booking.totalPrice)} TND</span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: "Propriété", value: booking.listing.title },
                { label: "Dates", value: `${fmtShort(booking.checkIn)} → ${fmtShort(booking.checkOut)}` },
                { label: "Voyageurs", value: `${booking.guests} personnes` },
                { label: "Durée", value: `${booking.nights} nuits` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-white/30">{item.label}</span>
                  <span className="text-slate-700 dark:text-white/80 font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-white/20 border-t-sky-500 animate-spin" />
            <span className="text-xs text-slate-400 dark:text-white/30 font-medium">Redirection en cours…</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner variant="spinner" size="lg" color="primary" speed="normal" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Préparation du paiement sécurisé...</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const offerId = searchParams.get("offerId");
  const conversationId = searchParams.get("conversationId");

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [imgErr, setImgErr] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [showCardBack, setShowCardBack] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => setToast({ message, type }), []);

  const handleCardClick = () => {
    setShowCardBack(!showCardBack);
  };

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
          const paymentRes = await fetch("/api/payments/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ offerId, conversationId }),
          });
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
  };
  const handleError = (error: string) => showToast(error, "error");
  const handleSuccessRedirect = () => router.push(`/fr/payment/success?offerId=${offerId}`);

  if (isLoading) return <LoadingScreen />;
  if (isSuccess) return <SuccessScreen booking={booking!} onRedirect={handleSuccessRedirect} />;
  if (!booking) return <NoBookingFound />;

  const listingImageUrl = booking.listing.image ? pipListing(booking.listing.image) : null;

  // Configuration Stripe avec support du dark mode via useTheme
  const stripeOptions = {
    clientSecret: clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0ea5e9',
        colorBackground: 'transparent',
        colorText: isDark ? '#ffffff' : '#1e293b',
        colorTextSecondary: isDark ? '#94a3b8' : '#64748b',
        colorDanger: '#ef4444',
        borderRadius: '14px',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      rules: {
        '.Input': {
          backgroundColor: 'transparent',
          border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '12px 14px',
          color: isDark ? '#ffffff' : '#1e293b',
          fontSize: '14px',
          fontWeight: '500',
        },
        '.Input:focus': {
          border: '1px solid #0ea5e9',
          boxShadow: '0 0 0 3px rgba(14,165,233,0.1)',
        },
        '.Label': {
          fontSize: '11px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: isDark ? '#94a3b8' : '#64748b',
          marginBottom: '6px',
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <AuroraBackground />
      <TenantHeader />

      <style jsx global>{`
        .stripe-payment-element {
          width: 100%;
          min-height: 280px;
        }
        .stripe-payment-element iframe {
          width: 100% !important;
          min-height: 280px !important;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .float-anim {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6">
          <Link href="/fr" className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition">ACCUEIL</Link>
          <IoChevronForwardSharp className="text-[10px] text-slate-400 -rotate-90" />
          <Link href="/fr/messages" className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition">MESSAGES</Link>
          <IoChevronForwardSharp className="text-[10px] text-slate-400 -rotate-90" />
          <span className="text-slate-900 dark:text-white font-extrabold">PAIEMENT</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN */}
          <div className="space-y-6 lg:sticky lg:top-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 dark:bg-slate-900/70 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300 shadow-sm backdrop-blur-md">
                <IoSparklesOutline className="h-3.5 w-3.5" /> Paiement sécurisé
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-3">
                Finaliser votre{" "}
                <span className={gradientText}>réservation</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Carte bancaire · Visa · Mastercard · American Express
              </p>
            </div>

            {/* 3D Card Preview */}
            <div className="float-anim">
              <CreditCardPreview
                number="•••• •••• •••• ••••"
                name="VOTRE NOM"
                expiry="••/••"
                cvc="•••"
                flipped={showCardBack}
                onClick={handleCardClick}
              />
            </div>

            {/* Steps */}
            <div className="flex items-center gap-3">
              {[
                { label: "Offre", done: true },
                { label: "Paiement", active: true },
                { label: "Confirmé", done: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 flex-1 last:flex-initial">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all duration-300 ${s.done ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25" : s.active ? "bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-700"}`}>
                      {s.done ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className={`text-xs font-semibold hidden sm:block ${s.done ? "text-emerald-600 dark:text-emerald-400" : s.active ? "text-slate-800 dark:text-white font-bold" : "text-slate-400 dark:text-slate-500"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={`flex-1 h-px ${s.done ? "bg-gradient-to-r from-emerald-400 to-teal-400 dark:from-emerald-600 dark:to-teal-600" : "bg-gradient-to-r from-slate-300 to-slate-300 dark:from-slate-700 dark:to-slate-700"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Property mini card */}
            <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <div className="flex gap-4 p-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                  {listingImageUrl && !imgErr ? (
                    <img src={listingImageUrl} alt={booking.listing.title} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-500/20 to-indigo-500/20 flex items-center justify-center">
                      <IoHomeOutline className="text-3xl text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                      {booking.listing.type || "Villa"}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                      <IoStarSharp className="text-[9px]" />
                      {booking.listing.rating || 4.9}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{booking.listing.title}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <IoLocationOutline className="text-[10px]" />
                    {booking.listing.location}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-slate-200 dark:border-slate-700">
                {[
                  { icon: <IoLogInOutline />, label: "Arrivée", value: fmtShort(booking.checkIn), day: fmtDay(booking.checkIn) },
                  { icon: <IoTimeOutline />, label: "Durée", value: `${booking.nights} nuits`, day: `${booking.guests} voyageurs` },
                  { icon: <IoLogOutOutline />, label: "Départ", value: fmtShort(booking.checkOut), day: fmtDay(booking.checkOut) },
                ].map((d) => (
                  <div key={d.label} className="flex flex-col items-center gap-1 py-3 border-r last:border-r-0 border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 dark:text-white/20 text-sm">{d.icon}</span>
                    <p className="text-[7px] font-extrabold text-slate-400 dark:text-white/20 uppercase tracking-[.15em]">{d.label}</p>
                    <p className="text-[11px] font-extrabold text-slate-800 dark:text-white">{d.value}</p>
                    <p className="text-[8px] text-slate-400 dark:text-white/20 capitalize">{d.day}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6">
              {[
                { icon: <IoShieldCheckmarkOutline />, label: "SSL 256-bit" },
                { icon: <IoLockClosedOutline />, label: "PCI DSS" },
                { icon: <IoDiamondOutline />, label: "Stripe" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-1.5 text-slate-400 dark:text-white/30">
                  <span className="text-sm">{b.icon}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider">{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <div className="relative">
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-slate-900/20">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
                        <IoWalletOutline className="text-sky-600 dark:text-sky-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Informations de paiement</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Toutes les données sont chiffrées</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {["Visa", "MC", "Amex"].map((c) => (
                        <div key={c} className="h-6 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 tracking-wider">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {clientSecret ? (
                    <Elements stripe={getStripe()} options={stripeOptions}>
                      <StripePaymentForm
                        booking={booking}
                        onSuccess={handleSuccess}
                        onError={handleError}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                        agreed={agreed}
                        setAgreed={setAgreed}
                      />
                    </Elements>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                      <LoadingSpinner variant="spinner" size="md" color="primary" speed="normal" />
                      <p className="text-xs font-semibold text-slate-400">Initialisation du paiement sécurisé…</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cancellation policy */}
            <div className="rounded-2xl p-4 border border-emerald-200/60 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-900/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <IoShieldCheckmarkOutline className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">Annulation flexible</p>
                  <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/60">Annulation gratuite jusqu'à 30 jours avant l'arrivée.</p>
                </div>
              </div>
            </div>

            {/* Help bar */}
            <div className="rounded-2xl p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <IoCallOutline className="text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Besoin d'aide ?</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Disponible 24h/7j</p>
                  </div>
                </div>
                <Link href="/fr/help" className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 transition flex items-center gap-1">
                  Aide <IoChevronDownOutline className="text-[10px] -rotate-90" />
                </Link>
              </div>
            </div>

            {/* Guarantee badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <IoTrophyOutline />, label: "Meilleur prix", sub: "Garanti" },
                { icon: <IoFlashOutline />, label: "Confirmation", sub: "Instantanée" },
                { icon: <IoDiamondOutline />, label: "Qualité", sub: "Premium" },
              ].map((b) => (
                <div key={b.label} className="text-center py-3 px-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 dark:text-white/30 text-lg mb-1.5 flex justify-center">{b.icon}</div>
                  <p className="text-[9px] font-extrabold text-slate-600 dark:text-white/50 uppercase tracking-wider">{b.label}</p>
                  <p className="text-[8px] text-slate-400 dark:text-white/30">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NoBookingFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-800">
          <IoReceiptOutline className="text-3xl text-slate-400 dark:text-slate-500" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Aucune réservation trouvée</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Vérifiez le lien ou retournez à vos messages.</p>
        <button onClick={() => router.push("/fr/messages")} className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center justify-center gap-1">
          Retour aux messages <IoChevronDownOutline className="text-xs -rotate-90" />
        </button>
      </div>
    </div>
  );
}