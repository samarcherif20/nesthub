// app/fr/payment/success/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IoCheckmarkCircle,
  IoDocumentTextOutline,
  IoChatbubbleOutline,
  IoLocationOutline,
  IoCallOutline,
  IoKeyOutline,
  IoInformationCircleOutline,
  IoHomeOutline,
  IoShieldCheckmarkOutline,
  IoArrowForwardOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoPeopleOutline,
  IoReceiptOutline,
  IoPersonOutline,
  IoLogInOutline,
  IoLogOutOutline,
  IoMoonOutline,
  IoCheckmarkCircleOutline,
  IoChevronForwardOutline,
  IoMailOutline,
  IoPhonePortraitOutline,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const pipListing = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

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
  realBookingId?: string;
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

function fmtDay(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { weekday: "long" });
}

// ─── Access code display ───────────────────────────────────────────────────────
function AccessCodeDisplay({ code }: { code: string }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {code.split("").map((d, i) => (
        <div
          key={i}
          className="w-11 rounded-xl bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center font-black text-xl text-indigo-600 dark:text-indigo-400 shadow-sm"
          style={{
            paddingTop: 10,
            paddingBottom: 10,
            animation: `digitPop .4s cubic-bezier(.22,1,.36,1) ${i * 0.06 + 0.2}s both`,
          }}
        >
          {d}
        </div>
      ))}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20 flex-shrink-0">
        <span className="text-white text-base">{icon}</span>
      </div>
      <div>
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Step badge ───────────────────────────────────────────────────────────────
function StepBadge({
  num,
  label,
  done,
  active,
}: {
  num: number;
  label: string;
  done: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition-all ${
          done
            ? "bg-emerald-500 border-emerald-500 text-white"
            : active
              ? "bg-gradient-to-br from-indigo-500 to-violet-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20"
              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600"
        }`}
      >
        {done ? (
          <IoCheckmarkCircleOutline className="text-sm" />
        ) : (
          num
        )}
      </div>
      <span
        className={`text-xs font-bold hidden sm:block ${
          done
            ? "text-emerald-600 dark:text-emerald-400"
            : active
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-gray-400 dark:text-gray-600"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
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
        let data: any;
        let realBookingIdTemp: string | null = null;

        if (bookingId) {
          const res = await fetch(`/api/bookings/${bookingId}`);
          if (res.ok) {
            data = await res.json();
            realBookingIdTemp = data.id;
          } else {
            const offerRes = await fetch(`/api/offers/${bookingId}`);
            if (offerRes.ok) {
              data = await offerRes.json();
              data = data.offer || data;
            } else throw new Error("Réservation non trouvée");
          }
        } else if (offerId) {
          const res = await fetch(`/api/offers/${offerId}`);
          if (!res.ok) throw new Error("Erreur chargement offre");
          data = await res.json();
          data = data.offer || data;
          const bookingRes = await fetch(`/api/bookings?offerId=${offerId}`);
          if (bookingRes.ok) {
            const bd = await bookingRes.json();
            if (bd.bookings?.length > 0) realBookingIdTemp = bd.bookings[0].id;
          }
        } else if (paymentIntent) {
          const res = await fetch(
            `/api/payments/confirm?payment_intent=${paymentIntent}`
          );
          if (!res.ok) throw new Error("Erreur confirmation paiement");
          data = await res.json();
        } else throw new Error("Aucun identifiant trouvé");

        const nights =
          data.nights ||
          Math.ceil(
            (new Date(data.checkOut).getTime() -
              new Date(data.checkIn).getTime()) /
              86400000
          );
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
          offerId: data.offerId || offerId || data.id,
          realBookingId: realBookingIdTemp || undefined,
        });
      } catch (e) {
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
      const body: { offerId?: string; bookingId?: string } = {};
      if (booking.offerId) body.offerId = booking.offerId;
      else if (booking.realBookingId) body.bookingId = booking.realBookingId;
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur génération contrat");
      if (data.contract?.id)
        window.open(`/api/contracts/${data.contract.id}/download`, "_blank");
      else alert("Contrat généré !");
    } catch {
      alert("Erreur lors de la génération du contrat");
    } finally {
      setContractLoading(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <LoadingSpinner
        fullScreen
        variant="spinner"
        size="lg"
        color="primary"
        text="Chargement de votre confirmation"
        speed="normal"
      />
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <TenantHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center border border-rose-200 dark:border-rose-800/40">
            <IoInformationCircleOutline className="text-rose-500 text-2xl" />
          </div>
          <p className="text-base font-bold text-gray-900 dark:text-white">
            {error || "Erreur de chargement"}
          </p>
          <Link
            href="/fr/reservations"
            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
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
  const nightsTotal = booking.pricePerNight * booking.nights;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(.85); }
          to   { opacity: 1; transform: scale(1);   }
        }
        @keyframes digitPop {
          from { opacity: 0; transform: translateY(10px) scale(.9); }
          to   { opacity: 1; transform: translateY(0)   scale(1);   }
        }
        @keyframes checkDraw {
          from { stroke-dashoffset: 50; }
          to   { stroke-dashoffset: 0;  }
        }
        @keyframes ringOut {
          0%   { transform: scale(1); opacity: .35; }
          100% { transform: scale(1.65); opacity: 0; }
        }
        .fu  { animation: fadeUp  .55s cubic-bezier(.22,1,.36,1) both; }
        .si  { animation: scaleIn .5s  cubic-bezier(.22,1,.36,1) both; }
        .d1  { animation-delay: .07s; }
        .d2  { animation-delay: .14s; }
        .d3  { animation-delay: .21s; }
        .d4  { animation-delay: .28s; }
        .d5  { animation-delay: .35s; }
        .d6  { animation-delay: .42s; }
        .d7  { animation-delay: .49s; }
      `}</style>

      <TenantHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">

        {/* ── Steps indicator ── */}
        <div className="flex items-center gap-0 mb-8 fu">
          {[
            { label: "Offre acceptée", done: true },
            { label: "Paiement", done: true },
            { label: "Confirmation", active: true, done: false },
          ].map((step, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-initial">
              <StepBadge
                num={i + 1}
                label={step.label}
                done={step.done}
                active={step.active}
              />
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

        {/* ══════════════════════════════════════════════════════════════════
            SUCCESS HERO
        ══════════════════════════════════════════════════════════════════ */}
        <section className="flex flex-col items-center text-center mb-12 si">
          

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
            Paiement{" "}
            <span className="bg-gradient-to-r from-sky-500 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              confirmé !
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            Votre réservation est finalisée. Tous les détails sont ci-dessous.
          </p>

          <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-[9px] font-extrabold uppercase tracking-[.2em] text-gray-400 dark:text-gray-500">
              Réf:
            </span>
            <span className="font-mono font-extrabold text-sm text-gray-900 dark:text-white tracking-wider">
              {booking.reference}
            </span>
            <IoCheckmarkCircleOutline className="text-emerald-500 text-sm" />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            MAIN GRID
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">

          {/* ═════════════════════ LEFT ═════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-6">

            {/* ── 1. SÉJOUR ── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden fu d1">
              <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
              <div className="p-6">
                <SectionHeader
                  icon={<IoCalendarOutline />}
                  title="Détails du séjour"
                  subtitle={`Émis le ${fmtDate(booking.issuedAt)}`}
                />

                <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-900/15 border border-indigo-100 dark:border-indigo-800/30 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/30 flex items-center justify-center flex-shrink-0">
                    <IoHomeOutline className="text-indigo-600 dark:text-indigo-400 text-base" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-indigo-400 dark:text-indigo-500">
                      Propriété
                    </p>
                    <p className="text-sm font-extrabold text-gray-900 dark:text-white leading-snug">
                      {booking.listing.title}
                    </p>
                    {booking.listing.location && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <IoLocationOutline className="text-indigo-400 dark:text-indigo-500 text-xs flex-shrink-0" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {booking.listing.location}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    {
                      icon: <IoLogInOutline className="text-indigo-600 dark:text-indigo-400" />,
                      label: "Arrivée",
                      value: fmtDate(booking.checkIn),
                      sub: `Dès ${booking.checkInTime || "15:00"}`,
                      bg: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30",
                    },
                    {
                      icon: <IoMoonOutline className="text-purple-600 dark:text-purple-400" />,
                      label: "Durée",
                      value: `${booking.nights} nuit${booking.nights > 1 ? "s" : ""}`,
                      sub: `${booking.guests} voyag.`,
                      bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/30",
                    },
                    {
                      icon: <IoLogOutOutline className="text-violet-600 dark:text-violet-400" />,
                      label: "Départ",
                      value: fmtDate(booking.checkOut),
                      sub: `Avant ${booking.checkOutTime || "11:00"}`,
                      bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800/30",
                    },
                  ].map(({ icon, label, value, sub, bg }) => (
                    <div key={label} className={`rounded-xl p-3.5 border ${bg} flex flex-col gap-1.5`}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{icon}</span>
                        <p className="text-[8px] font-extrabold uppercase tracking-[.15em] text-gray-400 dark:text-gray-500">{label}</p>
                      </div>
                      <p className="text-xs font-extrabold text-gray-900 dark:text-white leading-snug">{value}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{sub}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-gray-400 dark:text-gray-500 mb-3">Détail des prix</p>
                  <div className="space-y-2.5 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{booking.pricePerNight.toLocaleString("fr-FR")} TND × {booking.nights} nuit{booking.nights > 1 ? "s" : ""}</span>
                      <span className="font-bold text-gray-700 dark:text-gray-300">{nightsTotal.toLocaleString("fr-FR")} TND</span>
                    </div>
                    {booking.cleaningFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Frais de ménage</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{booking.cleaningFee.toLocaleString("fr-FR")} TND</span>
                      </div>
                    )}
                    {booking.serviceFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Frais de service</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{booking.serviceFee.toLocaleString("fr-FR")} TND</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-extrabold text-gray-900 dark:text-white">Total payé</p>
                    <p className="text-xl font-black bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                      {booking.totalPrice.toLocaleString("fr-FR")} <span className="text-sm font-bold">TND</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 2. INFORMATIONS HÔTE ── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 fu d2">
              <SectionHeader
                icon={<IoPersonOutline />}
                title="Informations de l'hôte"
                subtitle="Votre interlocuteur pour ce séjour"
              />

              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-violet-500/15 flex-shrink-0">
                  {booking.owner.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-extrabold text-gray-900 dark:text-white truncate">{booking.owner.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <IoShieldCheckmarkOutline className="text-indigo-500 text-sm" />
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Hôte vérifié</span>
                  </div>
                  {booking.owner.phone && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <IoPhonePortraitOutline className="text-gray-400 dark:text-gray-500 text-sm" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{booking.owner.phone}</p>
                    </div>
                  )}
                </div>
                <Link
                  href="/fr/messages"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm shadow-indigo-500/15 active:scale-[.97] flex-shrink-0"
                >
                  <IoChatbubbleOutline className="text-sm" />
                  <span className="hidden sm:inline">Message</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-900/15 border border-sky-100 dark:border-sky-800/30">
                  <div className="flex items-center gap-2 mb-1">
                    <IoCallOutline className="text-sky-600 dark:text-sky-400 text-sm" />
                    <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-gray-400 dark:text-gray-500">Téléphone</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{booking.owner.phone || "Via messagerie"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-violet-50 dark:bg-violet-900/15 border border-violet-100 dark:border-violet-800/30">
                  <div className="flex items-center gap-2 mb-1">
                    <IoChatbubbleOutline className="text-violet-600 dark:text-violet-400 text-sm" />
                    <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-gray-400 dark:text-gray-500">Messagerie</p>
                  </div>
                  <Link href="/fr/messages" className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:underline">
                    Ouvrir le chat →
                  </Link>
                </div>
              </div>

              {booking.accessCode && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-3">
                    <IoKeyOutline className="text-indigo-600 dark:text-indigo-400 text-base" />
                    <p className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">Code d'accès</p>
                  </div>
                  <AccessCodeDisplay code={booking.accessCode} />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2.5 font-medium flex items-center gap-1">
                    <IoTimeOutline className="text-xs" />
                    Actif à partir de {booking.checkInTime || "15:00"} le jour de l'arrivée
                  </p>
                </div>
              )}
            </div>

            {/* ── 3. CONTRAT ── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 fu d3">
              <SectionHeader
                icon={<IoDocumentTextOutline />}
                title="Contrat & documents"
                subtitle="Téléchargez votre contrat de location"
              />

              <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50 via-violet-50/50 to-purple-50/30 dark:from-indigo-900/15 dark:via-violet-900/10 dark:to-purple-900/10 border border-indigo-100 dark:border-indigo-800/30 mb-5">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <IoDocumentTextOutline className="text-indigo-600 dark:text-indigo-400 text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white">Contrat de location</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{booking.listing.title} · Réf {booking.reference}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-medium">PDF · Généré automatiquement · Signé électroniquement</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/30 flex-shrink-0">
                  <IoCheckmarkCircleOutline className="text-emerald-500 text-sm" />
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">Prêt</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={generateContract}
                  disabled={contractLoading}
                  className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/25 hover:scale-[1.02] active:scale-[.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {contractLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Génération…
                    </>
                  ) : (
                    <>
                      <IoDocumentTextOutline className="text-lg" />
                      Télécharger le contrat
                    </>
                  )}
                </button>
                <Link
                  href="/fr/messages"
                  className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-extrabold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors active:scale-[.97]"
                >
                  <IoChatbubbleOutline className="text-lg" />
                  Contacter l'hôte
                </Link>
              </div>

              <div className="flex items-center gap-2.5 mt-4 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-800/30">
                <IoShieldCheckmarkOutline className="text-emerald-500 text-base flex-shrink-0" />
                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  Transaction sécurisée · Données chiffrées · PCI Compliant
                </p>
              </div>
            </div>
          </div>

          {/* ═════════════════════ RIGHT ════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-5">

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden fu d2">
              <div className="relative h-52 bg-gray-100 dark:bg-gray-800">
                {mainImage && !imgErrors[0] ? (
                  <img
                    src={mainImage}
                    alt={booking.listing.title}
                    className="w-full h-full object-cover"
                    onError={() => setImgErrors((p) => ({ ...p, 0: true }))}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-200 via-violet-200 to-purple-200 dark:from-indigo-900 dark:via-violet-900 dark:to-purple-900 flex items-center justify-center">
                    <IoHomeOutline className="text-5xl text-indigo-300 dark:text-indigo-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                {booking.listing.type && (
                  <div className="absolute top-3 left-3">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-white/90 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                      {booking.listing.type}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-extrabold text-base leading-tight mb-1">{booking.listing.title}</p>
                  {booking.listing.location && (
                    <div className="flex items-center gap-1 text-white/60 text-xs font-medium">
                      <IoLocationOutline className="text-sm flex-shrink-0" />
                      <span className="truncate">{booking.listing.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { icon: <IoCalendarOutline className="text-indigo-500 text-sm" />, val: fmtShort(booking.checkIn), lbl: "Arrivée" },
                    { icon: <IoMoonOutline className="text-violet-500 text-sm" />, val: `${booking.nights}N`, lbl: "Durée" },
                    { icon: <IoPeopleOutline className="text-purple-500 text-sm" />, val: booking.guests, lbl: "Voyag." },
                  ].map(({ icon, val, lbl }) => (
                    <div key={lbl} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                      {icon}
                      <p className="text-sm font-extrabold text-gray-900 dark:text-white">{val}</p>
                      <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{lbl}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-900/20 dark:via-violet-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30">
                  <div className="flex items-center gap-2">
                    <IoReceiptOutline className="text-indigo-600 dark:text-indigo-400 text-base" />
                    <span className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</span>
                  </div>
                  <span className="text-base font-black bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                    {booking.totalPrice.toLocaleString("fr-FR")} TND
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200/60 dark:border-amber-800/30 fu d4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <IoInformationCircleOutline className="text-amber-600 dark:text-amber-400 text-sm" />
              </div>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/70 leading-relaxed font-medium">
                Le code d'accès sera activé le jour de votre arrivée à partir de {booking.checkInTime || "15:00"}. Pour toute question, contactez l'hôte via le chat.
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/15 border border-indigo-100 dark:border-indigo-800/30 fu d5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <IoMailOutline className="text-indigo-600 dark:text-indigo-400 text-sm" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-0.5">E-mail envoyé</p>
                <p className="text-[11px] text-indigo-600/60 dark:text-indigo-400/60 leading-relaxed">
                  Un récapitulatif complet a été envoyé à votre adresse e-mail.
                </p>
              </div>
            </div>

            <Link
              href="/fr/reservations"
              className="group flex items-center justify-between w-full px-5 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md hover:shadow-indigo-500/5 transition-all fu d6"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-center">
                  <IoHomeOutline className="text-indigo-600 dark:text-indigo-400 text-base" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white">Mes réservations</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Voir tous vos séjours</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:border-indigo-200 dark:group-hover:border-indigo-700 transition-all">
                <IoArrowForwardOutline className="text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all text-sm" />
              </div>
            </Link>

            <div className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 fu d7">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">Besoin d'aide ?</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Support 24h/7j</p>
              </div>
              <Link
                href="/fr/help"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 group"
              >
                Centre d'aide <IoChevronForwardOutline className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-5 fu d7">
          <p className="text-sm text-gray-400 dark:text-gray-600 italic text-center sm:text-left">
            "Merci de faire confiance à <span className="not-italic font-bold text-indigo-600 dark:text-indigo-400">Nesthub</span>. Nous espérons que votre séjour sera inoubliable."
          </p>
          <div className="flex items-center gap-2 opacity-20">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500" />
            <span className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">NESTHUB</span>
          </div>
        </div>
      </main>
    </div>
  );
}