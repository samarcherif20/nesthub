// app/fr/payment/success/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  IoPersonOutline,
  IoHomeOutline,
  IoShieldCheckmarkOutline,
  IoArrowForwardOutline,
  IoNotificationsOutline,
  IoHelpCircleOutline,
  IoStarSharp,
} from "react-icons/io5";

// ─── pip helpers ──────────────────────────────────────────────────────────────

const pipListing = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

// ─── Design tokens ────────────────────────────────────────────────────────────

const GRAD = "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600";
const GRAD_TEXT =
  "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent";
const BTN_GRAD = `${GRAD} text-white font-bold shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/30 hover:opacity-90 active:scale-[.98] transition-all`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingConfirmation {
  id: string;
  reference: string;
  issuedAt: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  tenant: {
    name: string;
    verified?: boolean;
  };
  owner: {
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
  };
  accessCode?: string;
  contractPdfUrl?: string;
  checkInTime?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// Mask phone: +216 22 45X XXX
function maskPhone(phone: string) {
  if (!phone) return "+216 ·· ··· ···";
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 8) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)}X XXX`;
  }
  return phone;
}

// ─── AccessCodeDisplay ────────────────────────────────────────────────────────

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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const offerId = searchParams.get("offerId");

  const [booking, setBooking] = useState<BookingConfirmation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  // ── Fetch confirmation data ────────────────────────────────────────────────
  useEffect(() => {
    const fetchConfirmation = async () => {
      setIsLoading(false); // optimistically remove skeleton; real fetch below

      try {
        const id = bookingId || offerId;
        if (!id) return;

        const endpoint = bookingId
          ? `/api/bookings/${bookingId}`
          : `/api/offers/${offerId}`;

        const res = await fetch(endpoint);
        if (!res.ok) return;
        const data = await res.json();

        const nights = bookingId
          ? Math.ceil(
              (new Date(data.checkOut).getTime() -
                new Date(data.checkIn).getTime()) /
                86_400_000
            )
          : data.nights ?? 1;

        setBooking({
          id: data.id,
          reference:
            data.reference ??
            `NH-${new Date().getFullYear()}-${data.id?.slice(-6).toUpperCase()}`,
          issuedAt: data.createdAt ?? new Date().toISOString(),
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          nights,
          guests: data.guests ?? 1,
          totalPrice: data.totalPrice ?? 0,
          tenant: {
            name:
              data.tenant?.firstName
                ? `${data.tenant.firstName} ${data.tenant.lastName ?? ""}`.trim()
                : "Vous",
            verified: data.tenant?.isVerified ?? true,
          },
          owner: {
            name:
              data.owner?.firstName
                ? `${data.owner.firstName} ${data.owner.lastName ?? ""}`.trim()
                : data.listing?.owner?.firstName ?? "Le propriétaire",
            phone: data.owner?.phone ?? data.listing?.owner?.phone,
            isPremium: data.owner?.isPremium ?? false,
            image: data.owner?.image ?? data.listing?.owner?.image,
          },
          listing: {
            id: data.listing?.id ?? data.listingId,
            title: data.listing?.title ?? "Votre logement",
            location:
              data.listing?.location ??
              [data.listing?.delegation, data.listing?.governorate]
                .filter(Boolean)
                .join(", ") ??
              "Tunisie",
            address: data.listing?.address ?? data.listing?.street,
            images: data.listing?.images ?? [],
            rating: data.listing?.rating,
            type: data.listing?.type,
          },
          accessCode: data.accessCode ?? data.contract?.accessCode,
          contractPdfUrl: data.contractPdfUrl ?? data.contract?.pdfUrl,
          checkInTime: data.listing?.checkInTime ?? "14:00",
        });
      } catch (e) {
        console.error(e);
      }
    };

    fetchConfirmation();
  }, [bookingId, offerId]);

  // ── Skeleton loading ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className={`w-12 h-12 rounded-2xl ${GRAD} animate-pulse`} />
      </div>
    );
  }

  // ── Fallback data when no API data ─────────────────────────────────────────
  const b: BookingConfirmation = booking ?? {
    id: "demo",
    reference: "NH-2025-DEMO-001",
    issuedAt: new Date().toISOString(),
    checkIn: "",
    checkOut: "",
    nights: 7,
    guests: 2,
    totalPrice: 1450,
    tenant: { name: "Ahmed B.", verified: true },
    owner: { name: "Amira L.", isPremium: true },
    listing: {
      id: "",
      title: "Votre logement",
      location: "Tunisie",
      images: [],
    },
    accessCode: "4829",
    checkInTime: "14:00",
  };

  const images = b.listing.images ?? [];
  const mainImage = images[0] ? pipListing(images[0]) : null;
  const thumb1 = images[1] ? pipListing(images[1]) : null;
  const thumb2 = images[2] ? pipListing(images[2]) : null;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f9f9ff] dark:bg-slate-950 text-gray-900 dark:text-gray-100 antialiased transition-colors duration-300">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between px-6 py-4 max-w-screen-2xl mx-auto">
          <span className={`text-2xl font-extrabold tracking-tighter ${GRAD_TEXT}`}>
            NESTHUB
          </span>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              <IoNotificationsOutline className="text-xl" />
            </button>
            <button className="p-2 rounded-full text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              <IoHelpCircleOutline className="text-xl" />
            </button>
          </div>
        </div>
        <div className="h-px bg-gray-100 dark:bg-slate-800 opacity-50" />
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-14 pb-24">

        {/* ── Success hero ──────────────────────────────────────────────────── */}
        <section className="flex flex-col items-center text-center mb-16">
          <div className="relative mb-6">
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-400 to-purple-600 opacity-20 blur-xl scale-150" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-300/40 dark:shadow-indigo-900/40">
              <IoCheckmarkCircle className="text-white text-4xl" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4 leading-tight">
            Paiement{" "}
            <span className={GRAD_TEXT}>confirmé !</span>
          </h1>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed">
            Votre réservation pour{" "}
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {b.listing.location}
            </span>{" "}
            est finalisée. Nous préparons votre arrivée dans ce havre de paix méditerranéen.
          </p>

          {/* Quick stats strip */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            {[
              {
                icon: <IoCalendarOutline />,
                label: b.checkIn ? `${fmtShort(b.checkIn)} → ${fmtShort(b.checkOut)}` : `${b.nights} nuits`,
              },
              {
                icon: <IoPeopleOutline />,
                label: `${b.guests} voyageur${b.guests > 1 ? "s" : ""}`,
              },
              {
                icon: <IoShieldCheckmarkOutline />,
                label: "Réservation sécurisée",
              },
            ].map(({ icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-4 py-2 rounded-full shadow-sm"
              >
                <span className="text-indigo-500">{icon}</span>
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* ── Main 2-column grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* ── LEFT: Contract ────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-end justify-between px-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Votre contrat de location
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                Généré instantanément
              </span>
            </div>

            {/* Contract card */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-8 border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Watermark */}
              <div className="absolute top-0 right-0 p-5 opacity-[.04] dark:opacity-[.06] pointer-events-none select-none">
                <IoDocumentTextOutline className="text-[120px] text-gray-900 dark:text-white" />
              </div>

              <div className="relative space-y-6">
                {/* Reference + date */}
                <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-800 pb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                      Référence du bail
                    </p>
                    <p className="font-extrabold text-gray-900 dark:text-white font-mono tracking-wide">
                      {b.reference}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                      Date d'émission
                    </p>
                    <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                      {fmtDate(b.issuedAt)}
                    </p>
                  </div>
                </div>

                {/* Tenant + owner */}
                <div className="grid grid-cols-2 gap-8 py-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2">
                      Locataire
                    </p>
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {b.tenant.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-base text-gray-900 dark:text-white leading-tight">
                          {b.tenant.name}
                        </p>
                        {b.tenant.verified && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                            <IoShieldCheckmarkOutline className="text-sm" />
                            Identité vérifiée
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2">
                      Propriétaire
                    </p>
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {b.owner.image ? (
                          <img
                            src={pipAvatar(b.owner.image)}
                            alt={b.owner.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          b.owner.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-base text-gray-900 dark:text-white leading-tight">
                          {b.owner.name}
                        </p>
                        {b.owner.isPremium && (
                          <p className="text-xs text-indigo-500 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                            <IoStarSharp className="text-xs text-amber-400" />
                            Hôte Premium NestHub
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Objet du contrat */}
                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2">
                    Objet du contrat
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                    "Location saisonnière du bien{" "}
                    <span className="not-italic font-semibold text-gray-800 dark:text-gray-200">
                      {b.listing.title}
                    </span>
                    {b.listing.address ? ` situé au ${b.listing.address}` : ""}
                    . Durée du séjour, conditions d'annulation et charte de bon
                    voisinage acceptées par les deux parties."
                  </p>
                </div>

                {/* Stay summary */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Arrivée",
                      value: b.checkIn ? fmtDate(b.checkIn) : "—",
                    },
                    {
                      label: "Départ",
                      value: b.checkOut ? fmtDate(b.checkOut) : "—",
                    },
                    {
                      label: "Total payé",
                      value: `${b.totalPrice.toLocaleString("fr-FR")} TND`,
                      gradient: true,
                    },
                  ].map(({ label, value, gradient }) => (
                    <div
                      key={label}
                      className="bg-gray-50 dark:bg-slate-800/40 rounded-xl p-3 border border-gray-100 dark:border-slate-700/40"
                    >
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                        {label}
                      </p>
                      <p
                        className={`text-sm font-bold leading-tight ${
                          gradient
                            ? GRAD_TEXT
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={b.contractPdfUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 py-4 px-6 rounded-full flex items-center justify-center gap-3 text-sm ${BTN_GRAD}`}
              >
                <IoDownloadOutline className="text-lg" />
                Télécharger le contrat PDF
              </a>
              <Link
                href="/fr/messages"
                className="flex-1 py-4 px-6 rounded-full flex items-center justify-center gap-3 text-sm font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                <IoChatbubbleOutline className="text-lg" />
                Retour au chat
              </Link>
            </div>
          </div>

          {/* ── RIGHT: Unlocked details bento ─────────────────────────────── */}
          <div className="lg:col-span-5 space-y-5">
            <div className="px-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Détails débloqués
              </h2>
              <p className="text-sm text-gray-400 dark:text-gray-600 mt-0.5">
                Informations confidentielles désormais disponibles
              </p>
            </div>

            {/* Map + address card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm">
              <div className="h-48 relative bg-gray-100 dark:bg-slate-800 overflow-hidden">
                {/* Static map placeholder — swap with real Mapbox/Google embed */}
                <div className="w-full h-full bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-950/40 dark:to-indigo-950/40 flex items-center justify-center relative overflow-hidden">
                  {/* Fake street grid */}
                  <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 200">
                    {[20, 60, 100, 140, 180].map((y) => (
                      <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#6366f1" strokeWidth="1" />
                    ))}
                    {[40, 100, 160, 220, 280, 340, 400].map((x) => (
                      <line key={x} x1={x} y1="0" x2={x} y2="200" stroke="#6366f1" strokeWidth="1" />
                    ))}
                    <rect x="80" y="30" width="60" height="40" rx="4" fill="#e0e7ff" />
                    <rect x="200" y="60" width="80" height="50" rx="4" fill="#c7d2fe" />
                    <rect x="120" y="100" width="50" height="35" rx="4" fill="#e0e7ff" />
                    <rect x="280" y="20" width="70" height="45" rx="4" fill="#ddd6fe" />
                  </svg>
                  {/* Pin */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center">
                      <IoLocationOutline className="text-indigo-600 dark:text-indigo-400 text-2xl" />
                    </div>
                    <div className="mt-2 bg-white dark:bg-slate-900 px-3 py-1 rounded-full shadow-md">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {b.listing.location}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">
                  Adresse exacte
                </p>
                <p className="text-base font-extrabold text-gray-900 dark:text-white leading-snug">
                  {b.listing.address ?? b.listing.location}
                </p>
                {b.listing.title !== b.listing.location && (
                  <p className="text-sm text-gray-400 dark:text-gray-600 mt-0.5">
                    {b.listing.title}
                  </p>
                )}
              </div>
            </div>

            {/* Owner phone + access code row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">

              {/* Owner direct contact */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center flex-shrink-0">
                  <IoCallOutline className="text-purple-500 dark:text-purple-400 text-xl" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-0.5">
                    Contact direct de {b.owner.name.split(" ")[0]}
                  </p>
                  <p className="font-extrabold text-gray-900 dark:text-white tracking-tight text-sm">
                    {b.owner.phone ? maskPhone(b.owner.phone) : "+216 ·· ··· ···"}
                  </p>
                </div>
              </div>

              {/* Access code */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center flex-shrink-0">
                  <IoKeyOutline className="text-sky-500 dark:text-sky-400 text-xl" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1.5">
                    Code d'accès numérique
                  </p>
                  {b.accessCode ? (
                    <AccessCodeDisplay code={b.accessCode} />
                  ) : (
                    <div className="flex gap-2">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="w-9 h-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center font-extrabold text-gray-300 dark:text-slate-600"
                        >
                          ·
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info notice */}
            <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl">
              <IoInformationCircleOutline className="text-indigo-500 dark:text-indigo-400 text-lg flex-shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">
                Le code d'accès sera activé automatiquement le jour de votre
                arrivée à partir de{" "}
                <span className="font-bold">{b.checkInTime ?? "14:00"}</span>.
                Pour toute question,{" "}
                {b.owner.name.split(" ")[0]} est disponible via le chat
                sécurisé NestHub.
              </p>
            </div>

            {/* My bookings CTA */}
            <Link
              href="/fr/reservations"
              className="flex items-center justify-between w-full px-5 py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                  <IoHomeOutline className="text-indigo-500 dark:text-indigo-400 text-base" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    Mes réservations
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-600">
                    Voir tous vos séjours
                  </p>
                </div>
              </div>
              <IoArrowForwardOutline className="text-gray-300 dark:text-slate-700 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>

        </div>

        {/* ── Editorial property photo grid ─────────────────────────────────── */}
        {images.length > 0 && (
          <section className="mt-20">
            <div className="grid grid-cols-12 gap-3 h-72 md:h-80 rounded-2xl overflow-hidden">

              {/* Main large image — 8 cols */}
              <div className="col-span-12 md:col-span-8 relative group overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                {mainImage && !imgErrors[0] ? (
                  <img
                    src={mainImage}
                    alt={b.listing.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={() => setImgErrors((p) => ({ ...p, 0: true }))}
                  />
                ) : (
                  <div className={`w-full h-full ${GRAD} flex items-center justify-center opacity-60`}>
                    <IoHomeOutline className="text-white text-6xl" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-6 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">
                    Votre destination
                  </p>
                  <h3 className="text-xl md:text-2xl font-extrabold">
                    {b.listing.title}
                  </h3>
                  <p className="text-sm text-white/80 flex items-center gap-1 mt-0.5">
                    <IoLocationOutline className="text-sm" />
                    {b.listing.location}
                  </p>
                </div>
                {b.listing.rating && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                    <IoStarSharp className="text-amber-400 text-sm" />
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {b.listing.rating}
                    </span>
                  </div>
                )}
              </div>

              {/* 2 thumbnail images — 4 cols, stacked */}
              <div className="hidden md:flex md:col-span-4 flex-col gap-3">
                <div className="flex-1 relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800 group">
                  {thumb1 && !imgErrors[1] ? (
                    <img
                      src={thumb1}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={() => setImgErrors((p) => ({ ...p, 1: true }))}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-200 to-indigo-200 dark:from-sky-900/40 dark:to-indigo-900/40" />
                  )}
                </div>
                <div className="flex-1 relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800 group">
                  {thumb2 && !imgErrors[2] ? (
                    <img
                      src={thumb2}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={() => setImgErrors((p) => ({ ...p, 2: true }))}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-900/40 dark:to-pink-900/40" />
                  )}
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ── Bottom actions ─────────────────────────────────────────────────── */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/fr/search"
            className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 font-medium transition-colors"
          >
            Explorer d'autres logements
            <IoArrowForwardOutline />
          </Link>
        </div>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 mt-4 transition-colors">
        <div className="max-w-screen-xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400 dark:text-gray-700">
            © 2026 NestHub. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            {["Politique de confidentialité", "Conditions générales"].map(
              (l) => (
                <Link
                  key={l}
                  href="#"
                  className="text-xs text-gray-400 dark:text-gray-700 hover:text-gray-600 dark:hover:text-gray-500 transition-colors"
                >
                  {l}
                </Link>
              )
            )}
          </div>
        </div>
      </footer>

    </div>
  );
}