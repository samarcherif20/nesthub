// app/[locale]/payment/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";
import { useTheme } from "next-themes";
import { usePayment } from "./hooks/usePayment";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
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
  IoTimeOutline,
  IoCallOutline,
  IoPersonOutline,
  IoChevronForwardSharp,
  IoInformationCircleOutline,
} from "react-icons/io5";

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT STRIPE PAYMENT FORM
// ═══════════════════════════════════════════════════════════════════════════════
function StripePaymentFormInternal({
  booking,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
  agreed,
  setAgreed,
  offerId,
  clientSecret,
  timeLeft,
  onPaymentFailed,
  incrementAttempt,
  formatTimeRemaining,
  fmtPrice,
  t,
  locale,
}: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [isStripeReady, setIsStripeReady] = useState(false);
  const [paymentAttempts, setPaymentAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const blockData = localStorage.getItem(`payment_blocked_${offerId}`);
    if (blockData) {
      try {
        const { blockedUntil } = JSON.parse(blockData);
        if (Date.now() < blockedUntil) setIsBlocked(true);
        else localStorage.removeItem(`payment_blocked_${offerId}`);
      } catch (e) {}
    }
  }, [offerId]);

  useEffect(() => {
    if (stripe && elements) setIsStripeReady(true);
  }, [stripe, elements]);

  const canSubmit =
    agreed && stripe && elements && isStripeReady && !isBlocked && timeLeft > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !canSubmit) return;

    setIsProcessing(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/${locale}/payment/success`,
        },
      });

      if (error) {
        const newAttempts = paymentAttempts + 1;
        setPaymentAttempts(newAttempts);
        if (newAttempts >= 3) {
          setIsBlocked(true);
          onError(t("payment.threeAttemptsFailed"), "error");
          onPaymentFailed(offerId, 30 * 60);
          setTimeout(
            () => (window.location.href = `/${locale}/messages?paymentBlocked=true`),
            2000,
          );
        } else {
          onError(t("payment.cardRefused", { remaining: 3 - newAttempts }), "error");
        }
        setIsProcessing(false);
        return;
      }
    } catch (err) {
      const newAttempts = paymentAttempts + 1;
      setPaymentAttempts(newAttempts);
      if (newAttempts >= 3) {
        setIsBlocked(true);
        onError(t("payment.threeAttemptsFailed"), "error");
        onPaymentFailed(offerId, 30 * 60);
      } else {
        onError(t("payment.connectionError", { attempt: newAttempts }), "error");
      }
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
        <p className="text-xs text-sky-600 dark:text-sky-400 flex items-center justify-center gap-2">
          <IoTimeOutline className="text-sm" />
          {t("payment.timeRemaining")} :{" "}
          <span className="font-bold">{formatTimeRemaining(timeLeft)}</span>
        </p>
      </div>

      <div className="stripe-payment-element min-h-[280px]">
        {!isStripeReady ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin mb-3" />
            <p className="text-xs text-slate-400">{t("payment.loadingForm")}</p>
          </div>
        ) : (
          <PaymentElement />
        )}
      </div>

      <div className="space-y-2.5 pt-2">
        {[
          {
            label: `${fmtPrice(booking.pricePerNight)} TND × ${booking.nights} ${t("payment.nights", { count: booking.nights })}`,
            value: booking.pricePerNight * booking.nights,
          },
          { label: t("payment.cleaningFee"), value: booking.cleaningFee },
          {
            label: t("payment.serviceFee"),
            value: booking.serviceFee,
            accent: true,
          },
        ].map((item) => (
          <div key={item.label} className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-white/30">
              {item.label}
            </span>
            <span
              className={`font-bold ${item.accent ? "text-sky-600 dark:text-sky-400" : "text-slate-700 dark:text-white/70"}`}
            >
              {fmtPrice(item.value)} TND
            </span>
          </div>
        ))}
        <div className="pt-3 mt-1 border-t border-dashed border-slate-200 dark:border-white/[0.06]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-white/30">
              {t("payment.totalToPay")}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {fmtPrice(booking.totalPrice)}{" "}
              <span className="text-sm text-slate-500 dark:text-white/40">
                TND
              </span>
            </span>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="peer sr-only"
          />
          <div className="w-5 h-5 rounded-lg border border-slate-300 dark:border-white/[0.12] bg-slate-100 dark:bg-white/[0.04] peer-checked:bg-sky-500 peer-checked:border-sky-500 transition-all flex items-center justify-center">
            {agreed && (
              <IoCheckmarkCircleOutline className="text-white text-sm" />
            )}
          </div>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-white/30 leading-relaxed">
          {t("payment.acceptTerms")}
        </span>
      </label>

      <button
        type="submit"
        disabled={!canSubmit || isProcessing || timeLeft <= 0}
        className="relative w-full py-4 rounded-2xl text-base font-extrabold flex items-center justify-center gap-3 transition-all disabled:opacity-30 disabled:cursor-not-allowed overflow-hidden bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span>{t("payment.processing")}</span>
          </>
        ) : timeLeft <= 0 ? (
          <>
            <IoTimeOutline />
            <span>{t("payment.offerExpiredButton")}</span>
          </>
        ) : isBlocked ? (
          <>
            <IoTimeOutline />
            <span>{t("payment.paymentBlockedButton")}</span>
          </>
        ) : (
          <>
            <IoLockClosedOutline />
            <span>
              {t("payment.payButton", { amount: fmtPrice(booking.totalPrice) })}
            </span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-white/20 font-medium">
        <IoShieldCheckmarkOutline className="text-xs" />
        <span>{t("payment.encryption")}</span>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT CREDIT CARD PREVIEW AVEC ANIMATION FLOATING
// ═══════════════════════════════════════════════════════════════════════════════
function CreditCardPreview({
  number,
  name,
  expiry,
  cvc,
  flipped,
  onClick,
  t,
}: any) {
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
        {/* Face avant */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-3xl overflow-hidden border border-white/20 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-500/10" />
            <div className="absolute top-4 right-4 flex opacity-30">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg -ml-5" />
            </div>
            <div className="absolute bottom-20 left-6 right-6">
              <p className="text-white font-mono text-lg sm:text-xl tracking-[0.2em] font-bold drop-shadow-lg">
                {number}
              </p>
            </div>
            <div className="absolute bottom-6 left-6">
              <p className="text-[8px] text-white/50 uppercase tracking-[0.15em] mb-1">
                {t("payment.cardHolder")}
              </p>
              <p className="text-white/90 text-xs sm:text-sm font-bold tracking-wider uppercase">
                {name}
              </p>
            </div>
            <div className="absolute bottom-6 right-6 text-right">
              <p className="text-[8px] text-white/50 uppercase tracking-[0.15em] mb-1">
                {t("payment.expiry")}
              </p>
              <p className="text-white/90 text-xs sm:text-sm font-bold tracking-wider font-mono">
                {expiry}
              </p>
            </div>
          </div>
        </div>
        {/* Face arrière */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-3xl overflow-hidden border border-white/20">
            <div className="absolute top-8 left-0 right-0 h-12 bg-black/60" />
            <div className="absolute top-28 left-6 right-6">
              <div className="bg-white/95 rounded-md h-9 flex items-center justify-end px-4 shadow-inner">
                <p className="text-slate-800 font-mono text-sm font-bold tracking-widest">
                  {cvc}
                </p>
              </div>
              <p className="text-[8px] text-white/50 uppercase tracking-[0.15em] mt-2 text-right">
                {t("payment.securityCode")}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT TOAST (style comme demandé)
// ═══════════════════════════════════════════════════════════════════════════════
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
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          type === "success"
            ? "bg-green-500 text-white"
            : "bg-red-500 text-white"
        }`}
      >
        {type === "success" ? (
          <IoCheckmarkCircleOutline className="w-5 h-5" />
        ) : (
          <IoAlertCircleOutline className="w-5 h-5" />
        )}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <IoCloseOutline className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT AURORA BACKGROUND
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function LoadingScreen({ t }: { t: any }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner
          variant="spinner"
          size="lg"
          color="primary"
          speed="normal"
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("payment.loadingPayment")}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NO BOOKING FOUND
// ═══════════════════════════════════════════════════════════════════════════════
function NoBookingFound({ t, locale }: { t: any; locale: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
          <IoReceiptOutline className="text-3xl text-slate-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {t("payment.bookingNotFound")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {t("payment.bookingNotFoundDesc")}
        </p>
        <Link
          href={`/${locale}/messages`}
          className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline"
        >
          {t("payment.backToMessages")}
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════
export default function PaymentPage() {
  const params = useParams();
  const locale = (params.locale as string) || "fr";
  const { resolvedTheme } = useTheme();
  const t = useTranslations("ListingPage");
  const isDark = resolvedTheme === "dark";

  const {
    booking,
    isLoading,
    isProcessing,
    setIsProcessing,
    clientSecret,
    toast: hookToast,
    imgErr,
    setImgErr,
    agreed,
    setAgreed,
    showCardBack,
    setShowCardBack,
    timeLeft,
    offerExpired,
    offerId,
    formatTimeRemaining,
    fmtPrice,
    fmtShort,
    fmtDay,
    handlePaymentFailed,
    incrementPaymentAttempt,
    showToast,
  } = usePayment();

  // État local pour le toast UI (car on utilise le toast du hook)
  const [uiToast, setUiToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Fonction pour afficher le toast UI
  const showUiToast = (message: string, type: "success" | "error" | "info") => {
    setUiToast({ message, type });
    setTimeout(() => setUiToast(null), 4000);
  };

  if (isLoading) return <LoadingScreen t={t} />;
  if (!booking) return <NoBookingFound t={t} locale={locale} />;

  const listingImageUrl = booking.listing.image
    ? `/api/listings/image?url=${encodeURIComponent(booking.listing.image)}`
    : null;

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#0ea5e9",
        colorBackground: "transparent",
        colorText: isDark ? "#ffffff" : "#1e293b",
        colorTextSecondary: isDark ? "#94a3b8" : "#64748b",
        borderRadius: "14px",
        fontFamily: "Inter, system-ui, sans-serif",
      },
      rules: {
        ".Input": {
          backgroundColor: "transparent",
          border: isDark
            ? "1px solid rgba(255,255,255,0.2)"
            : "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "12px 14px",
        },
        ".Input:focus": {
          border: "1px solid #0ea5e9",
          boxShadow: "0 0 0 3px rgba(14,165,233,0.1)",
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

      {/* Toast Notification */}
      {uiToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              uiToast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {uiToast.type === "success" ? (
              <IoCheckmarkCircleOutline className="w-5 h-5" />
            ) : (
              <IoAlertCircleOutline className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{uiToast.message}</span>
            <button
              onClick={() => setUiToast(null)}
              className="ml-2 hover:opacity-70"
            >
              <IoCloseOutline className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        {/* Breadcrumb avec locale */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6">
          <Link
            href={`/${locale}`}
            className="text-slate-500 dark:text-slate-400 hover:text-sky-600"
          >
            Accueil
          </Link>
          <IoChevronForwardSharp className="text-[10px] text-slate-400 -rotate-90" />
          <Link
            href={`/${locale}/messages`}
            className="text-slate-500 dark:text-slate-400 hover:text-sky-600"
          >
            Messages
          </Link>
          <IoChevronForwardSharp className="text-[10px] text-slate-400 -rotate-90" />
          <span className="text-slate-900 dark:text-white font-extrabold">
            Paiement
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Colonne gauche */}
          <div className="space-y-6 lg:sticky lg:top-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 dark:bg-slate-900/70 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300 backdrop-blur-md">
                <IoSparklesOutline /> {t("payment.securePayment")}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-3">
                {t("payment.finalizeBooking")}{" "}
                <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {t("payment.reservation")}
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Carte bancaire · Visa · Mastercard · American Express
              </p>
            </div>

            {/* Carte avec animation flottante */}
            <div className="float-anim">
              <CreditCardPreview
                number="•••• •••• •••• ••••"
                name="VOTRE NOM"
                expiry="••/••"
                cvc="•••"
                flipped={showCardBack}
                onClick={() => setShowCardBack(!showCardBack)}
                t={t}
              />
            </div>

            {/* Steps (Offre → Paiement → Confirmé) */}
            <div className="flex items-center gap-3">
              {[
                { label: "Offre", done: true },
                { label: "Paiement", active: true },
                { label: "Confirmé", done: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 flex-1 last:flex-initial">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all duration-300 ${
                      s.done 
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                        : s.active 
                          ? "bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
                    }`}>
                      {s.done ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className={`text-xs font-semibold hidden sm:block ${
                      s.done 
                        ? "text-emerald-600 dark:text-emerald-400"
                        : s.active 
                          ? "text-slate-800 dark:text-white font-bold"
                          : "text-slate-400 dark:text-slate-500"
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={`flex-1 h-px ${
                      s.done 
                        ? "bg-gradient-to-r from-emerald-400 to-teal-400 dark:from-emerald-600 dark:to-teal-600"
                        : "bg-gradient-to-r from-slate-300 to-slate-300 dark:from-slate-700 dark:to-slate-700"
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Property mini card */}
            <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <div className="flex gap-4 p-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                  {listingImageUrl && !imgErr ? (
                    <img
                      src={listingImageUrl}
                      alt={booking.listing.title}
                      className="w-full h-full object-cover"
                      onError={() => setImgErr(true)}
                    />
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
                      <IoStarSharp /> {booking.listing.rating || 0}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {booking.listing.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <IoLocationOutline /> {booking.listing.location}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-slate-200 dark:border-slate-700">
                {[
                  {
                    icon: <IoLogInOutline />,
                    label: "Arrivée",
                    value: fmtShort(booking.checkIn),
                    day: fmtDay(booking.checkIn),
                  },
                  {
                    icon: <IoTimeOutline />,
                    label: "Séjour",
                    value: `${booking.nights} nuits`,
                    day: `${booking.guests} voyageurs`,
                  },
                  {
                    icon: <IoLogOutOutline />,
                    label: "Départ",
                    value: fmtShort(booking.checkOut),
                    day: fmtDay(booking.checkOut),
                  },
                ].map((d) => (
                  <div
                    key={d.label}
                    className="flex flex-col items-center gap-1 py-3 border-r last:border-r-0 border-slate-200 dark:border-slate-700"
                  >
                    <span className="text-slate-400 dark:text-white/20 text-sm">
                      {d.icon}
                    </span>
                    <p className="text-[7px] font-extrabold text-slate-400 dark:text-white/20 uppercase">
                      {d.label}
                    </p>
                    <p className="text-[11px] font-extrabold text-slate-800 dark:text-white">
                      {d.value}
                    </p>
                    <p className="text-[8px] text-slate-400 dark:text-white/20 capitalize">
                      {d.day}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 cartes de garantie */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <IoTrophyOutline />, label: t("payment.bestPrice"), sub: t("payment.bestPriceSub") },
                { icon: <IoFlashOutline />, label: t("payment.instantConfirmation"), sub: t("payment.instantConfirmationSub") },
                { icon: <IoDiamondOutline />, label: t("payment.premiumQuality"), sub: t("payment.premiumQualitySub") },
              ].map((b) => (
                <div
                  key={b.label}
                  className="text-center py-3 px-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                >
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <div className="text-violet-600 dark:text-violet-400 text-base">
                      {b.icon}
                    </div>
                  </div>
                  <p className="text-[9px] font-extrabold text-slate-600 dark:text-white/50 uppercase tracking-wider">
                    {b.label}
                  </p>
                  <p className="text-[8px] text-slate-400 dark:text-white/30">
                    {b.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne droite - Formulaire de paiement */}
          <div className="space-y-6">
            <div className="relative">
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-slate-800 rounded-3xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
                        <IoWalletOutline className="text-sky-600 dark:text-sky-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {t("payment.paymentInfo")}
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          {t("payment.encryptedData")}
                        </p>
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
                  {clientSecret && !offerExpired ? (
                    <Elements stripe={getStripe()} options={stripeOptions}>
                      <StripePaymentFormInternal
                        booking={booking}
                        onSuccess={() => console.log("Succès")}
                        onError={showUiToast}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                        agreed={agreed}
                        setAgreed={setAgreed}
                        offerId={offerId}
                        clientSecret={clientSecret}
                        timeLeft={timeLeft}
                        onPaymentFailed={handlePaymentFailed}
                        incrementAttempt={incrementPaymentAttempt}
                        formatTimeRemaining={formatTimeRemaining}
                        fmtPrice={fmtPrice}
                        t={t}
                        locale={locale}
                      />
                    </Elements>
                  ) : offerExpired ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                      <IoTimeOutline className="text-5xl text-slate-400" />
                      <p className="text-sm font-semibold text-slate-600">
                        {t("payment.offerExpired")}
                      </p>
                      <Link
                        href={`/${locale}/messages`}
                        className="mt-2 text-sm font-bold text-sky-600 hover:underline"
                      >
                        {t("payment.backToMessages")}
                      </Link>
                    </div>
                  ) : (
                    <LoadingScreen t={t} />
                  )}
                </div>
              </div>
            </div>

            {/* Annulation flexible */}
            <div className="rounded-2xl p-4 border border-emerald-200/60 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-900/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <IoShieldCheckmarkOutline className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">
                    {t("payment.flexibleCancellation")}
                  </p>
                  <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/60">
                    {t("payment.flexibleCancellationDesc")}
                  </p>
                </div>
              </div>
            </div>

            {/* Carte d'aide - Version VIOLETTE */}
            <div className="rounded-2xl p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <IoCallOutline className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {t("payment.needHelp")}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {t("payment.available247")}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/${locale}/help#contact-support`}
                  className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition flex items-center gap-1"
                >
                  {t("payment.help")}{" "}
                  <IoChevronDownOutline className="text-[10px] -rotate-90" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}