// app/[locale]/reservations/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  IoCalendarOutline,
  IoPeopleOutline,
  IoLocationOutline,
  IoChatbubbleOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoArrowForwardOutline,
  IoHomeOutline,
  IoSearchOutline,
  IoRefreshOutline,
  IoStarOutline,
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";

// Design tokens
const GRADIENT_BTN = "bg-gradient-to-r from-[#005cab] to-[#712ae2]";

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(price: number) {
  return price.toLocaleString("fr-FR") + " DT";
}

function getStatusConfig(status: string) {
  const configs: Record<
    string,
    { label: string; cls: string; icon: JSX.Element }
  > = {
    PENDING: {
      label: "En attente",
      cls: "bg-amber-100 text-amber-700",
      icon: <IoTimeOutline className="text-sm" />,
    },
    ACCEPTED: {
      label: "Acceptée",
      cls: "bg-sky-100 text-sky-700",
      icon: <IoCheckmarkCircleOutline className="text-sm" />,
    },
    CONFIRMED: {
      label: "Confirmée",
      cls: "bg-emerald-100 text-emerald-700",
      icon: <IoCheckmarkCircleOutline className="text-sm" />,
    },
    REJECTED: {
      label: "Refusée",
      cls: "bg-red-100 text-red-700",
      icon: <IoCloseCircleOutline className="text-sm" />,
    },
    CANCELLED: {
      label: "Annulée",
      cls: "bg-gray-100 text-gray-500",
      icon: <IoCloseCircleOutline className="text-sm" />,
    },
    COMPLETED: {
      label: "Terminée",
      cls: "bg-blue-100 text-blue-700",
      icon: <IoCheckmarkCircleOutline className="text-sm" />,
    },
  };
  return configs[status] || configs.PENDING;
}

function ReservationCard({
  res,
  onPay,
  onCancel,
  onViewDetails,
  onContact,
  t,
}: any) {
  const [imgErr, setImgErr] = useState(false);

  const isPaid =
    res.paymentStatus === "PAID" ||
    res.isPaid === true ||
    res.status === "CONFIRMED";
  const isPending = res.status === "PENDING";
  const isAccepted = res.status === "ACCEPTED";
  const isConfirmed = res.status === "CONFIRMED";
  const isCompleted = res.status === "COMPLETED";
  const isCancelled = res.status === "CANCELLED";
  const isRejected = res.status === "REJECTED";

  const isPaidAndConfirmed = (isConfirmed || isAccepted) && isPaid;
  const isPendingPayment = (isAccepted || isConfirmed) && !isPaid;

  const statusConfig = getStatusConfig(res.status);
  const listingImageUrl = res.listing.image
    ? `/api/listings/image?url=${encodeURIComponent(res.listing.image)}`
    : null;

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-xl p-5 shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)] transition-all duration-300 hover:-translate-y-1">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Image */}
        <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
          {listingImageUrl && !imgErr ? (
            <img
              src={listingImageUrl}
              alt={res.listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#005cab] to-[#712ae2] flex items-center justify-center opacity-60">
              <IoHomeOutline className="text-white text-4xl" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-grow justify-between py-1">
          <div>
            <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusConfig.cls} flex items-center gap-1.5`}
              >
                {statusConfig.icon}
                {statusConfig.label}
                {isPaid && !isPending && !isPendingPayment && (
                  <span className="ml-1 text-[10px] bg-green-500/20 px-1 rounded">
                    ✓ payé
                  </span>
                )}
              </span>
              <span className="text-lg md:text-xl font-bold text-[#005cab]">
                {formatPrice(res.totalPrice)}
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-1">
              {res.listing.title}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <IoCalendarOutline className="text-[#005cab] text-lg" />
                <span>
                  {fmtDate(res.checkIn)} — {fmtDate(res.checkOut)}
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-medium">{res.nights} nuits</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <IoPeopleOutline className="text-[#005cab] text-lg" />
                <span>
                  {res.guests} Voyageur{res.guests > 1 ? "s" : ""}
                </span>
              </div>
              {res.listing.location && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <IoLocationOutline className="text-[#005cab] text-lg" />
                  <span className="truncate">{res.listing.location}</span>
                </div>
              )}
            </div>
          </div>

          {isCompleted && (
            <div className="flex items-center gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <IoStarOutline
                  key={i}
                  className="text-amber-400 text-base cursor-pointer hover:text-amber-500 transition-colors"
                />
              ))}
              <span className="text-xs text-slate-400 ml-2">
                Laisser un avis
              </span>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {isPending && (
              <>
                <button
                  onClick={() => onContact(res)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 py-2.5 md:py-3 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <IoChatbubbleOutline /> Contacter
                </button>
                <button
                  onClick={() => onCancel(res.id)}
                  className="flex-1 bg-red-50 dark:bg-red-950/30 py-2.5 md:py-3 rounded-full text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                >
                  Annuler
                </button>
              </>
            )}

            {isPendingPayment && (
              <>
                <button
                  onClick={() => onContact(res)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 py-2.5 md:py-3 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <IoChatbubbleOutline /> Contacter
                </button>
                <button
                  onClick={() => onPay(res)}
                  className={`flex-1 ${GRADIENT_BTN} py-2.5 md:py-3 rounded-full text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all`}
                >
                  Payer maintenant
                </button>
              </>
            )}

            {isPaidAndConfirmed && (
              <>
                <button
                  onClick={() => onContact(res)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 py-2.5 md:py-3 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <IoChatbubbleOutline /> Contacter
                </button>
                <button
                  onClick={() => onViewDetails(res)}
                  className={`flex-1 ${GRADIENT_BTN} py-2.5 md:py-3 rounded-full text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all`}
                >
                  Voir détails
                </button>
              </>
            )}

            {isCompleted && (
              <button
                onClick={() => onViewDetails(res)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 py-2.5 md:py-3 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <IoArrowForwardOutline /> Voir le bien
              </button>
            )}

            {(isCancelled || isRejected) && (
              <button
                onClick={() => onViewDetails(res)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 py-2.5 md:py-3 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Voir le bien
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm animate-pulse">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-48 h-48 rounded-xl bg-slate-100 dark:bg-slate-800" />
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-1/3" />
          <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full w-2/3" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-1/2" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-1/3" />
          <div className="flex gap-3 mt-4">
            <div className="flex-1 h-10 bg-slate-100 dark:bg-slate-800 rounded-full" />
            <div className="flex-1 h-10 bg-slate-100 dark:bg-slate-800 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TenantReservationsPage() {
  const router = useRouter();
  const t = useTranslations("ReservationsPage");

  const [tab, setTab] = useState<"UPCOMING" | "PAST" | "CANCELLED">("UPCOMING");
  const [allReservations, setAllReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(
    null,
  );

  const tabs = [
    { key: "UPCOMING", label: "À venir" },
    { key: "PAST", label: "Passées" },
    { key: "CANCELLED", label: "Annulées" },
  ];

  // Filtrer les réservations selon l'onglet
  const getFilteredReservations = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (tab) {
      case "UPCOMING":
        // À venir: PENDING, ACCEPTED, CONFIRMED
        return allReservations.filter(
          (r) =>
            r.status === "PENDING" ||
            r.status === "ACCEPTED" ||
            r.status === "CONFIRMED",
        );
      case "PAST":
        // Passées: COMPLETED
        return allReservations.filter((r) => r.status === "COMPLETED");
      case "CANCELLED":
        // Annulées: CANCELLED, REJECTED
        return allReservations.filter(
          (r) => r.status === "CANCELLED" || r.status === "REJECTED",
        );
      default:
        return allReservations;
    }
  };

  // Charger TOUS les bookings (sans filtre de statut)
  const loadReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      // Utiliser status=ALL pour charger tous les statuts
      const response = await fetch(
        `/api/bookings?role=tenant&status=ALL&pageSize=50`,
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      const raw = Array.isArray(data) ? data : (data.bookings ?? []);

      // Calculer isPaid et nights
      const processed = raw.map((r: any) => ({
        ...r,
        isPaid: r.paymentStatus === "PAID" || r.status === "CONFIRMED",
        nights:
          r.nights ||
          Math.ceil(
            (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) /
              86400000,
          ),
        listing: {
          ...r.listing,
          image: r.listing.image ?? null,
        },
        owner: {
          ...r.owner,
          firstName: r.owner?.firstName ?? null,
          lastName: r.owner?.lastName ?? null,
          image: r.owner?.image ?? null,
        },
      }));

      setAllReservations(processed);
    } catch (error) {
      console.error("Erreur chargement réservations:", error);
      setToast({
        message: "Erreur de chargement des réservations",
        type: "error",
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handlePay = (res: any) => {
    const params = new URLSearchParams({
      bookingId: res.id,
      ...(res.bookingOfferId ? { offerId: res.bookingOfferId } : {}),
    });
    router.push(`/fr/payment?${params.toString()}`);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Confirmer l'annulation de cette réservation ?")) return;

    try {
      const response = await fetch(`/api/bookings/${id}/cancel`, {
        method: "POST",
      });

      if (response.ok) {
        setToast({ message: "Réservation annulée", type: "info" });
        setAllReservations((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b)),
        );
        setTimeout(() => setToast(null), 3000);
      } else {
        const error = await response.json();
        setToast({
          message: error.error || "Erreur lors de l'annulation",
          type: "error",
        });
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast({ message: "Erreur de connexion", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleViewDetails = (res: any) => {
    router.push(`/fr/reservations/${res.id}`);
  };

  const handleContact = (res: any) => {
    if (res.conversationId) {
      router.push(`/fr/messages?conversation=${res.conversationId}`);
    } else {
      router.push(
        `/fr/messages?listingId=${res.listing.id}&ownerId=${res.owner?.id}`,
      );
    }
  };

  const displayedReservations = getFilteredReservations();

  return (
    <div className="min-h-screen bg-[#f9f9ff] dark:bg-slate-950">
      <TenantHeader />

      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg text-sm">
          {toast.message}
        </div>
      )}

      <main className="pt-32 pb-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-[3.5rem] font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Mes Réservations
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg">
            Gérez vos séjours passés et à venir dans nos propriétés d'exception.
          </p>
        </header>

        {/* Tabs avec compteurs */}
        <div className="flex gap-3 md:gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(({ key, label }) => {
            let count = 0;
            if (key === "UPCOMING") {
              count = allReservations.filter(
                (r) =>
                  r.status === "PENDING" ||
                  r.status === "ACCEPTED" ||
                  r.status === "CONFIRMED",
              ).length;
            } else if (key === "PAST") {
              count = allReservations.filter(
                (r) => r.status === "COMPLETED",
              ).length;
            } else {
              count = allReservations.filter(
                (r) => r.status === "CANCELLED" || r.status === "REJECTED",
              ).length;
            }

            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-5 md:px-8 py-2.5 md:py-3 rounded-full font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  tab === key
                    ? `${GRADIENT_BTN} text-white shadow-md`
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      tab === key
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={loadReservations}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm hover:border-slate-300 transition-colors shadow-sm"
          >
            <IoRefreshOutline className="text-base" /> Actualiser
          </button>
        </div>

        {/* Reservations Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : displayedReservations.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 md:py-24">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <IoCalendarOutline className="text-4xl md:text-5xl text-slate-300 dark:text-slate-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Aucune réservation{" "}
              {tab === "UPCOMING"
                ? "à venir"
                : tab === "PAST"
                  ? "passée"
                  : "annulée"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
              {tab === "UPCOMING"
                ? "Vous n'avez pas encore de réservation à venir. Commencez à explorer nos propriétés d'exception."
                : tab === "PAST"
                  ? "Vous n'avez pas encore de séjour passé avec nous."
                  : "Vous n'avez aucune réservation annulée."}
            </p>
            {tab === "UPCOMING" && (
              <Link
                href="/fr/search"
                className={`${GRADIENT_BTN} px-6 md:px-8 py-2.5 md:py-3 rounded-full text-sm md:text-base font-semibold text-white shadow-md hover:shadow-lg transition-all`}
              >
                Explorer les propriétés
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {displayedReservations.map((r) => (
              <ReservationCard
                key={r.id}
                res={r}
                onPay={handlePay}
                onCancel={handleCancel}
                onViewDetails={handleViewDetails}
                onContact={handleContact}
                t={t}
              />
            ))}

            {/* CTA Card for upcoming trips */}
            {tab === "UPCOMING" && displayedReservations.length > 0 && (
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 flex flex-col items-center justify-center p-8 md:p-10 text-center gap-4 min-h-[280px]">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <IoSearchOutline className="text-indigo-500 dark:text-indigo-400 text-xl" />
                </div>
                <div>
                  <h4 className="font-extrabold text-indigo-700 dark:text-indigo-400 text-lg mb-1">
                    Envie d'évasion ?
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    Réservez votre prochain séjour exceptionnel.
                  </p>
                  <Link
                    href="/fr/search"
                    className="inline-block px-5 py-2 rounded-full text-sm font-semibold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
                  >
                    Trouver un bien
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
