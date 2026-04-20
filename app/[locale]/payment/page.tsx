// app/fr/payment/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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

// ─── pip helpers ───────────────────────────────────────────────────────────────
const pipListing = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

// ─── Design tokens ─────────────────────────────────────────────────────────────
const GRAD = "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600";
const GRAD_TEXT =
  "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent";
const BTN_GRAD = `${GRAD} text-white font-extrabold shadow-lg shadow-indigo-200/60 dark:shadow-indigo-900/30 hover:opacity-90 active:scale-[.98] transition-all`;

// ─── Types ─────────────────────────────────────────────────────────────────────

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

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

function formatCardNumber(val: string) {
  return val
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(val: string) {
  const clean = val.replace(/\D/g, "").slice(0, 4);
  if (clean.length >= 3) return `${clean.slice(0, 2)} / ${clean.slice(2)}`;
  return clean;
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
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

  const bg =
    type === "success"
      ? "bg-emerald-500"
      : type === "error"
        ? "bg-red-500"
        : "bg-sky-500";
  const Icon =
    type === "success"
      ? IoCheckmarkCircleOutline
      : type === "error"
        ? IoAlertCircleOutline
        : IoInformationCircleOutline;

  return (
    <div className="fixed top-24 right-4 z-[80] max-w-sm animate-in slide-in-from-top-3 fade-in duration-300">
      <div
        className={`flex items-center gap-3 ${bg} text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium`}
      >
        <Icon className="text-lg flex-shrink-0" />
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Payment method card ───────────────────────────────────────────────────────
function PaymentMethodCard({
  value,
  selected,
  onSelect,
  icon,
  label,
  subtitle,
}: {
  value: string;
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
  subtitle: string;
}) {
  return (
    <label
      className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all border-2 ${
        selected
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
          : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-200 dark:hover:border-slate-700"
      }`}
    >
      <input
        type="radio"
        name="payment"
        value={value}
        checked={selected}
        onChange={onSelect}
        className="mt-0.5 accent-indigo-600"
      />
      <div className="flex-1 min-w-0">
        <div
          className={`text-2xl mb-1 ${selected ? "text-indigo-500" : "text-gray-400 dark:text-gray-600"}`}
        >
          {icon}
        </div>
        <p
          className={`font-bold text-sm ${selected ? "text-indigo-700 dark:text-indigo-300" : "text-gray-800 dark:text-gray-200"}`}
        >
          {label}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
          {subtitle}
        </p>
      </div>
      {selected && (
        <IoCheckmarkCircleOutline className="text-indigo-500 text-xl flex-shrink-0 mt-1" />
      )}
    </label>
  );
}

// ─── Input field ───────────────────────────────────────────────────────────────
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-3.5 px-4 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 dark:focus:ring-indigo-600/40 focus:border-indigo-400 dark:focus:border-indigo-600 transition-colors";

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get booking data from URL params or fetch from API
  const bookingId = searchParams.get("bookingId");
  const offerId = searchParams.get("offerId");

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "edinar">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [imgErr, setImgErr] = useState(false);

  // Form state
  const [form, setForm] = useState({
    cardHolder: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") =>
      setToast({ message, type }),
    []
  );

  // Fetch booking/offer data
  useEffect(() => {
    const fetchBooking = async () => {
      setIsLoading(true);
      try {
        let data: BookingData | null = null;

        if (offerId) {
          // Fetch from offer
          const res = await fetch(`/api/offers/${offerId}`);
          if (res.ok) {
            const offer = await res.json();
            data = {
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
                id: offer.listing?.id ?? offer.listingId,
                title: offer.listing?.title ?? "Logement",
                image: offer.listing?.image,
                location: offer.listing?.location,
                rating: offer.listing?.rating,
                bedrooms: offer.listing?.bedrooms,
                maxGuests: offer.listing?.maxGuests,
                type: offer.listing?.type,
              },
            };
          }
        } else if (bookingId) {
          // Fetch from booking
          const res = await fetch(`/api/bookings/${bookingId}`);
          if (res.ok) {
            const b = await res.json();
            const nights = Math.ceil(
              (new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) /
                86_400_000
            );
            data = {
              id: b.id,
              checkIn: b.checkIn,
              checkOut: b.checkOut,
              nights,
              guests: b.guests,
              pricePerNight: b.pricePerNight ?? b.listing?.pricePerNight ?? 0,
              cleaningFee: b.cleaningFee ?? 85,
              serviceFee: b.serviceFee ?? Math.round((b.totalPrice ?? 0) * 0.05),
              totalPrice: b.totalPrice,
              reference: b.reference,
              listing: {
                id: b.listing?.id ?? b.listingId,
                title: b.listing?.title ?? "Logement",
                image: b.listing?.image,
                location: b.listing?.location,
                rating: b.listing?.rating,
                bedrooms: b.listing?.bedrooms,
                maxGuests: b.listing?.maxGuests,
                type: b.listing?.type,
              },
            };
          }
        }

        if (!data) {
          // Fallback: try to build from query params directly
          const total = searchParams.get("total");
          const title = searchParams.get("title");
          if (total && title) {
            data = {
              id: offerId ?? bookingId ?? "unknown",
              checkIn: searchParams.get("checkIn") ?? "",
              checkOut: searchParams.get("checkOut") ?? "",
              nights: parseInt(searchParams.get("nights") ?? "1"),
              guests: parseInt(searchParams.get("guests") ?? "1"),
              pricePerNight: parseInt(searchParams.get("price") ?? "0"),
              cleaningFee: 85,
              serviceFee: Math.round(parseInt(total) * 0.05),
              totalPrice: parseInt(total),
              listing: {
                id: searchParams.get("listingId") ?? "",
                title,
                image: searchParams.get("image") ?? undefined,
                location: searchParams.get("location") ?? undefined,
              },
            };
          }
        }

        setBooking(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, offerId, searchParams]);

  // Form validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (paymentMethod === "card") {
      if (!form.cardHolder.trim())
        errs.cardHolder = "Nom requis";
      const raw = form.cardNumber.replace(/\s/g, "");
      if (raw.length < 16) errs.cardNumber = "Numéro invalide (16 chiffres)";
      const exp = form.expiry.replace(/\s/g, "");
      if (exp.length < 4) errs.expiry = "Date invalide (MM/AA)";
      if (form.cvv.length < 3) errs.cvv = "CVV invalide (3 chiffres)";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;
    setIsProcessing(true);
    try {
      // POST to payment endpoint
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking?.id,
          offerId,
          method: paymentMethod,
          amount: booking?.totalPrice,
          cardHolder: form.cardHolder,
          // never send raw card data — in production route through Konnect/Stripe
          last4: form.cardNumber.replace(/\s/g, "").slice(-4),
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        showToast("Paiement effectué avec succès !", "success");
        // Redirect after 3s
        setTimeout(() => router.push("/fr/reservations"), 3000);
      } else {
        const data = await res.json();
        showToast(data.error ?? "Erreur lors du paiement", "error");
      }
    } catch {
      showToast("Erreur de connexion. Veuillez réessayer.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className={`w-12 h-12 rounded-2xl ${GRAD} animate-pulse`} />
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <IoCheckmarkCircleOutline className="text-emerald-500 text-5xl" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
            Paiement confirmé !
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
            Votre réservation a été validée.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Redirection vers vos réservations…
          </p>
          {booking && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {booking.listing.title}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {fmtShort(booking.checkIn)} → {fmtShort(booking.checkOut)} ·{" "}
                {booking.nights} nuit{booking.nights > 1 ? "s" : ""}
              </p>
              <p className={`text-lg font-extrabold mt-2 ${GRAD_TEXT}`}>
                {booking.totalPrice.toLocaleString("fr-FR")} TND payés
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const listingImageUrl = booking?.listing.image
    ? pipListing(booking.listing.image)
    : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100 antialiased transition-colors duration-300">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 flex items-center px-5 lg:px-10 justify-between transition-colors">
        <div className="flex items-center gap-4">
          <Link
            href="/fr/messages"
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            <IoArrowBackOutline className="text-gray-600 dark:text-gray-400 text-lg" />
          </Link>
          <span
            className={`text-xl font-extrabold tracking-tight ${GRAD_TEXT}`}
          >
            NestHub
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-600 font-medium">
          <IoLockClosedOutline className="text-sm text-emerald-500" />
          Paiement sécurisé
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* ── LEFT: Form ──────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-8">

            {/* Header */}
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-1.5">
                Finaliser votre{" "}
                <span className={GRAD_TEXT}>réservation</span>
              </h1>
              <p className="text-sm text-gray-400 dark:text-gray-600">
                Vérifiez vos informations et procédez au paiement sécurisé.
              </p>
            </div>

            {/* Payment method selection */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <IoCardOutline className="text-indigo-500" />
                Mode de paiement
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PaymentMethodCard
                  value="card"
                  selected={paymentMethod === "card"}
                  onSelect={() => setPaymentMethod("card")}
                  icon={<IoCardOutline />}
                  label="Carte bancaire"
                  subtitle="Visa, Mastercard, CIB"
                />
                <PaymentMethodCard
                  value="edinar"
                  selected={paymentMethod === "edinar"}
                  onSelect={() => setPaymentMethod("edinar")}
                  icon={<IoWalletOutline />}
                  label="E-dinar (Konnect)"
                  subtitle="Paiement instantané tunisien"
                />
              </div>
            </section>

            {/* Card form */}
            {paymentMethod === "card" && (
              <section className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                    <IoLockClosedOutline className="text-indigo-600 dark:text-indigo-400 text-sm" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Informations de paiement
                  </h3>
                </div>

                {/* Cardholder */}
                <Field label="Nom sur la carte">
                  <input
                    type="text"
                    value={form.cardHolder}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, cardHolder: e.target.value }))
                    }
                    placeholder="M. Mohamed Ben Ali"
                    className={inputCls}
                  />
                  {errors.cardHolder && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.cardHolder}
                    </p>
                  )}
                </Field>

                {/* Card number */}
                <Field label="Numéro de carte">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.cardNumber}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          cardNumber: formatCardNumber(e.target.value),
                        }))
                      }
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className={inputCls + " pr-12"}
                    />
                    <IoCardOutline className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-slate-600 text-xl" />
                  </div>
                  {errors.cardNumber && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.cardNumber}
                    </p>
                  )}
                </Field>

                {/* Expiry + CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Expiration (MM / AA)">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.expiry}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          expiry: formatExpiry(e.target.value),
                        }))
                      }
                      placeholder="MM / AA"
                      maxLength={7}
                      className={inputCls}
                    />
                    {errors.expiry && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.expiry}
                      </p>
                    )}
                  </Field>
                  <Field label="CVV">
                    <div className="relative">
                      <input
                        type={showCvv ? "text" : "password"}
                        inputMode="numeric"
                        value={form.cvv}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            cvv: e.target.value.replace(/\D/g, "").slice(0, 3),
                          }))
                        }
                        placeholder="123"
                        maxLength={3}
                        className={inputCls + " pr-10"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCvv((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                      >
                        {showCvv ? (
                          <IoEyeOffOutline className="text-base" />
                        ) : (
                          <IoEyeOutline className="text-base" />
                        )}
                      </button>
                    </div>
                    {errors.cvv && (
                      <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>
                    )}
                  </Field>
                </div>

                {/* Pay button */}
                <button
                  onClick={handlePay}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-2xl text-base flex items-center justify-center gap-3 mt-2 ${BTN_GRAD} disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {isProcessing ? (
                    <>
                      <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Traitement en cours…
                    </>
                  ) : (
                    <>
                      <IoLockClosedOutline className="text-lg" />
                      Payer{" "}
                      {booking
                        ? `${booking.totalPrice.toLocaleString("fr-FR")} TND`
                        : ""}
                      <IoShieldCheckmarkOutline className="text-lg" />
                    </>
                  )}
                </button>
              </section>
            )}

            {/* E-dinar section */}
            {paymentMethod === "edinar" && (
              <section className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center mx-auto mb-4">
                  <IoWalletOutline className="text-purple-500 text-3xl" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                  Paiement via Konnect
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                  Vous allez être redirigé vers la plateforme Konnect pour
                  finaliser votre paiement de manière sécurisée.
                </p>
                <button
                  onClick={handlePay}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-2xl text-base flex items-center justify-center gap-3 ${BTN_GRAD} disabled:opacity-60`}
                >
                  {isProcessing ? (
                    <>
                      <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Redirection…
                    </>
                  ) : (
                    <>
                      <IoWalletOutline className="text-lg" />
                      Payer via Konnect ·{" "}
                      {booking
                        ? `${booking.totalPrice.toLocaleString("fr-FR")} TND`
                        : ""}
                      <IoChevronForwardOutline className="text-lg" />
                    </>
                  )}
                </button>
              </section>
            )}

            {/* Security badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 py-4 opacity-50 hover:opacity-80 transition-opacity">
              {[
                {
                  icon: <IoShieldCheckmarkOutline />,
                  label: "SSL Sécurisé 256-bit",
                },
                { icon: <IoLockClosedOutline />, label: "Données chiffrées" },
                {
                  icon: <IoCheckmarkCircleOutline />,
                  label: "PCI Compliant",
                },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-500 text-sm">
                    {icon}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-600">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Summary sticky card ──────────────────────────────── */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24">
            {booking ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">

                {/* Listing image */}
                <div className="relative h-48 bg-gray-100 dark:bg-slate-800">
                  {listingImageUrl && !imgErr ? (
                    <img
                      src={listingImageUrl}
                      alt={booking.listing.title}
                      className="w-full h-full object-cover"
                      onError={() => setImgErr(true)}
                    />
                  ) : (
                    <div
                      className={`w-full h-full ${GRAD} flex items-center justify-center`}
                    >
                      <IoHomeOutline className="text-white text-5xl opacity-30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-extrabold text-lg leading-tight">
                      {booking.listing.title}
                    </h3>
                    {booking.listing.location && (
                      <p className="text-white/80 text-xs flex items-center gap-1 mt-1">
                        <IoLocationOutline className="text-sm" />
                        {booking.listing.location}
                      </p>
                    )}
                  </div>
                  {/* Type badge */}
                  {booking.listing.type && (
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                        {booking.listing.type}
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-6 space-y-5">

                  {/* Stay row */}
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                        Séjour
                      </p>
                      <p className="font-extrabold text-gray-900 dark:text-white">
                        {booking.nights} nuit
                        {booking.nights > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                        Dates
                      </p>
                      <p className="font-extrabold text-gray-900 dark:text-white text-sm">
                        {fmtShort(booking.checkIn)} →{" "}
                        {fmtShort(booking.checkOut)}
                      </p>
                    </div>
                  </div>

                  {/* Info chips */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        icon: <IoCalendarOutline />,
                        label: `${fmtDate(booking.checkIn)}`,
                      },
                      {
                        icon: <IoPeopleOutline />,
                        label: `${booking.guests} voyageur${booking.guests > 1 ? "s" : ""}`,
                      },
                      ...(booking.listing.bedrooms
                        ? [
                            {
                              icon: <IoBedOutline />,
                              label: `${booking.listing.bedrooms} chambre${booking.listing.bedrooms > 1 ? "s" : ""}`,
                            },
                          ]
                        : []),
                    ].map(({ icon, label }) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 px-2.5 py-1 rounded-full"
                      >
                        <span className="text-indigo-400">{icon}</span>
                        {label}
                      </span>
                    ))}
                  </div>

                  {/* Price breakdown */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        {booking.pricePerNight.toLocaleString("fr-FR")} TND ×{" "}
                        {booking.nights} nuit
                        {booking.nights > 1 ? "s" : ""}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {(booking.pricePerNight * booking.nights).toLocaleString(
                          "fr-FR"
                        )}{" "}
                        TND
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Frais de ménage</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {booking.cleaningFee.toLocaleString("fr-FR")} TND
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Frais de service NestHub</span>
                      <span className="font-medium text-indigo-500">
                        {booking.serviceFee.toLocaleString("fr-FR")} TND
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-4 border-t-2 border-dashed border-gray-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                        Total (TND)
                      </p>
                      <p
                        className={`text-3xl font-extrabold tracking-tight ${GRAD_TEXT}`}
                      >
                        {booking.totalPrice.toLocaleString("fr-FR")}{" "}
                        <span className="text-lg">TND</span>
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                      <IoReceiptOutline className="text-indigo-500 text-xl" />
                    </div>
                  </div>

                  {/* Price guarantee note */}
                  <div className="flex items-start gap-3 p-3.5 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-800">
                    <IoInformationCircleOutline className="text-indigo-400 text-base flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-500 italic">
                      Le prix affiché est ferme et définitif. Aucuns frais
                      supplémentaires ne vous seront demandés lors de votre
                      arrivée.
                    </p>
                  </div>

                  {/* Reference */}
                  {booking.reference && (
                    <p className="text-center text-[10px] text-gray-300 dark:text-slate-700 font-mono">
                      Réf. {booking.reference}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* No booking data fallback */
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-8 text-center">
                <IoReceiptOutline className="text-4xl text-gray-200 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-gray-400 dark:text-gray-600">
                  Aucune réservation trouvée
                </p>
                <Link
                  href="/fr/search"
                  className="inline-block mt-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Retour à la recherche
                </Link>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 py-8 transition-colors">
        <div className="max-w-screen-xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            © 2026 NestHub. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            {["Politique de confidentialité", "Conditions générales", "Aide"].map(
              (link) => (
                <Link
                  key={link}
                  href="#"
                  className="text-xs text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-400 transition-colors"
                >
                  {link}
                </Link>
              )
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}