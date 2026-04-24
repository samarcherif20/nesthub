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
  IoWalletOutline,
  IoCardOutline,
  IoChevronForwardOutline,
  IoCompassOutline,
  IoChatbubblesOutline,
  IoPersonCircleOutline,
 
} from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";

// ✅ Helper pour les images - identique pour réservations et recommandations
const pip = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;

const GRADIENT_BTN = "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-sky-500 hover:via-indigo-500 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-300";
const BG_GRADIENT = "bg-gradient-to-br from-sky-50 via-white to-purple-50";

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(price: number) {
  return price.toLocaleString("fr-FR") + " TND";
}

function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; cls: string; icon: JSX.Element }> = {
    PENDING: { label: "En attente", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <IoTimeOutline className="text-sm" /> },
    ACCEPTED: { label: "Acceptée", cls: "bg-sky-50 text-sky-700 border-sky-200", icon: <IoCheckmarkCircleOutline className="text-sm" /> },
    CONFIRMED: { label: "Confirmée", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <IoCheckmarkCircleOutline className="text-sm" /> },
    REJECTED: { label: "Refusée", cls: "bg-red-50 text-red-700 border-red-200", icon: <IoCloseCircleOutline className="text-sm" /> },
    CANCELLED: { label: "Annulée", cls: "bg-gray-100 text-gray-500 border-gray-200", icon: <IoCloseCircleOutline className="text-sm" /> },
    COMPLETED: { label: "Terminée", cls: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: <IoCheckmarkCircleOutline className="text-sm" /> },
  };
  return configs[status] || configs.PENDING;
}

function ReservationCard({ res, onPay, onCancel, onViewDetails, onContact, t }: any) {
  const [imgErr, setImgErr] = useState(false);
  const imageUrl = res.listing.image ? pip(res.listing.image) : null;

  const isPaid = res.paymentStatus === "PAID" || res.isPaid === true || res.status === "CONFIRMED";
  const isPending = res.status === "PENDING";
  const isAccepted = res.status === "ACCEPTED";
  const isConfirmed = res.status === "CONFIRMED";
  const isCompleted = res.status === "COMPLETED";
  const isCancelled = res.status === "CANCELLED";
  const isRejected = res.status === "REJECTED";

  const isPaidAndConfirmed = (isConfirmed || isAccepted) && isPaid;
  const isPendingPayment = (isAccepted || isConfirmed) && !isPaid;

  const statusConfig = getStatusConfig(res.status);

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-52 h-48 md:h-auto relative overflow-hidden bg-gray-100">
          {imageUrl && !imgErr ? (
            <img 
              src={imageUrl} 
              alt={res.listing.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              onError={() => setImgErr(true)} 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 flex items-center justify-center opacity-60">
              <IoHomeOutline className="text-white text-4xl" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${statusConfig.cls} flex items-center gap-1.5`}>
              {statusConfig.icon}{statusConfig.label}
            </span>
          </div>
          {isPaid && !isPending && !isPendingPayment && (
            <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
              <IoCardOutline className="text-xs" /> Payé
            </div>
          )}
          {isPendingPayment && (
            <div className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
              <IoWalletOutline className="text-xs" /> En attente
            </div>
          )}
        </div>

        <div className="flex-1 p-5">
          <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
            <h3 className="text-base font-bold text-gray-900 line-clamp-1">{res.listing.title}</h3>
            <span className="text-xl font-black text-indigo-600">{formatPrice(res.totalPrice)}</span>
          </div>

          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <IoCalendarOutline className="text-indigo-500 text-base" />
              <span>{fmtDate(res.checkIn)} — {fmtDate(res.checkOut)}</span>
              <span className="text-gray-300">·</span>
              <span className="font-medium">{res.nights} nuit{res.nights > 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <IoPeopleOutline className="text-indigo-500 text-base" />
              <span>{res.guests} voyageur{res.guests > 1 ? "s" : ""}</span>
            </div>
            {res.listing.location && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <IoLocationOutline className="text-indigo-500 text-base" />
                <span className="truncate">{res.listing.location}</span>
              </div>
            )}
          </div>

          {isCompleted && (
            <div className="flex items-center gap-1 mb-4 p-2 bg-indigo-50 rounded-lg">
              {[...Array(5)].map((_, i) => (
                <IoStarOutline key={i} className="text-amber-400 text-base cursor-pointer hover:text-amber-500 transition-colors" />
              ))}
              <span className="text-xs text-gray-500 ml-2">Laisser un avis</span>
            </div>
          )}

          <div className="flex gap-2">
            {isPending && (
              <>
                <button onClick={() => onContact(res)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                  <IoChatbubbleOutline /> Contacter
                </button>
                <button onClick={() => onCancel(res.id)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Annuler</button>
              </>
            )}

            {isPendingPayment && (
              <>
                <button onClick={() => onContact(res)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                  <IoChatbubbleOutline /> Contacter
                </button>
                <button onClick={() => onPay(res)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${GRADIENT_BTN} flex items-center justify-center gap-2`}>
                  Payer
                </button>
              </>
            )}

            {(isPaidAndConfirmed || isConfirmed) && (
              <>
                <button onClick={() => onContact(res)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                  <IoChatbubbleOutline /> Contacter
                </button>
                <button onClick={() => onViewDetails(res)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${GRADIENT_BTN} flex items-center justify-center gap-2`}>
                  Détails <IoChevronForwardOutline />
                </button>
              </>
            )}

            {isCompleted && (
              <button onClick={() => onViewDetails(res)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                Voir le bien <IoArrowForwardOutline />
              </button>
            )}

            {(isCancelled || isRejected) && (
              <button onClick={() => onViewDetails(res)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
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
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-52 h-48 bg-gray-200" />
        <div className="flex-1 p-5 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="flex gap-2 mt-4">
            <div className="flex-1 h-10 bg-gray-200 rounded-xl" />
            <div className="flex-1 h-10 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ Empty State - Aside à droite de la page
function EmptyStateAside() {
  return (
    <div className="sticky top-24 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-2xl border-2 border-dashed border-indigo-200 p-6 text-center shadow-sm">
      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
        <IoHomeOutline className="text-indigo-500 text-3xl" />
      </div>
      <h3 className="text-lg font-bold text-indigo-600 mb-2">Envie d'évasion ?</h3>
      <p className="text-gray-500 text-sm mb-5">
        Explorez de nouvelles destinations et réservez votre prochain séjour exceptionnel.
      </p>
      <Link href="/fr/search">
        <button className={`px-5 py-2.5 rounded-full text-white font-semibold text-sm ${GRADIENT_BTN}`}>
          Trouver un bien
        </button>
      </Link>
    </div>
  );
}

// ✅ Composant Bento Grid Recommendations - AVEC extraction correcte des images
function BentoGridRecommendations({ recommendations }: { recommendations: any[] }) {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // ✅ Fonction pour extraire l'image - MÊME LOGIQUE que ReservationCard
  const getImageUrl = (listing: any) => {
    // Chercher la photo principale dans photos
    const mainPhoto = listing.photos?.find((p: any) => p.isMain);
    if (mainPhoto?.url) return pip(mainPhoto.url);
    
    // Sinon prendre la première photo
    if (listing.photos?.[0]?.url) return pip(listing.photos[0].url);
    
    // Sinon utiliser le champ image
    if (listing.image) return pip(listing.image);
    
    return null;
  };

  const handleImageError = (id: string) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  if (!recommendations || recommendations.length < 3) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 min-h-[500px] md:h-[550px]">
      {/* Main large card */}
      <div className="md:col-span-2 md:row-span-2 rounded-2xl overflow-hidden relative group shadow-md hover:shadow-xl transition-all cursor-pointer">
        <Link href={`/fr/listings/${recommendations[0].id}`}>
          {!imgErrors[recommendations[0].id] && getImageUrl(recommendations[0]) ? (
            <img 
              src={getImageUrl(recommendations[0])!} 
              alt={recommendations[0].title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={() => handleImageError(recommendations[0].id)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
              <IoHomeOutline className="text-indigo-400 text-6xl" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-6">
            <span className="text-xs text-white/80 mb-2 uppercase tracking-wider font-semibold">DESTINATION TENDANCE</span>
            <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">{recommendations[0].title}</h3>
            <p className="text-white/80 text-sm mt-1">{recommendations[0].location || `${recommendations[0].governorate}, ${recommendations[0].delegation}`}</p>
            <div className="mt-3"><span className="text-white font-bold text-lg">{recommendations[0].pricePerNight || 250} TND</span><span className="text-white/70 text-xs"> /nuit</span></div>
          </div>
        </Link>
      </div>
      {/* Small cards */}
      {recommendations.slice(1, 3).map((rec) => (
        <div key={rec.id} className="rounded-2xl overflow-hidden relative group shadow-md hover:shadow-xl transition-all cursor-pointer">
          <Link href={`/fr/listings/${rec.id}`}>
            {!imgErrors[rec.id] && getImageUrl(rec) ? (
              <img 
                src={getImageUrl(rec)!} 
                alt={rec.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={() => handleImageError(rec.id)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
                <IoHomeOutline className="text-indigo-400 text-4xl" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
              <span className="text-white font-bold text-xl md:text-2xl text-center px-4">{rec.title}</span>
              <p className="text-white/80 text-sm mt-1">{rec.location || `${rec.governorate}, ${rec.delegation}`}</p>
              <div className="mt-2"><span className="text-white font-bold">{rec.pricePerNight || 200} TND</span><span className="text-white/70 text-xs"> /nuit</span></div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

export default function TenantReservationsPage() {
  const router = useRouter();
  const t = useTranslations("ReservationsPage");

  const [tab, setTab] = useState<"UPCOMING" | "PAST" | "CANCELLED">("UPCOMING");
  const [allReservations, setAllReservations] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const tabs = [
    { key: "UPCOMING", label: "À venir", icon: <IoCalendarOutline /> },
    { key: "PAST", label: "Passées", icon: <IoCheckmarkCircleOutline /> },
    { key: "CANCELLED", label: "Annulées", icon: <IoCloseCircleOutline /> },
  ];

  const getFilteredReservations = () => {
    switch (tab) {
      case "UPCOMING": return allReservations.filter(r => r.status === "PENDING" || r.status === "ACCEPTED" || r.status === "CONFIRMED");
      case "PAST": return allReservations.filter(r => r.status === "COMPLETED");
      case "CANCELLED": return allReservations.filter(r => r.status === "CANCELLED" || r.status === "REJECTED");
      default: return allReservations;
    }
  };

  const loadReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings?role=tenant&status=ALL&pageSize=50`);
      if (!response.ok) throw new Error(`Erreur ${response.status}`);

      const data = await response.json();
      const raw = Array.isArray(data) ? data : (data.bookings ?? []);

      const processed = raw.map((r: any) => ({
        ...r,
        isPaid: r.paymentStatus === "PAID" || r.status === "CONFIRMED",
        nights: r.nights || Math.ceil((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86400000),
        listing: { ...r.listing, image: r.listing.image ?? null },
        owner: { ...r.owner, firstName: r.owner?.firstName ?? null, lastName: r.owner?.lastName ?? null, image: r.owner?.image ?? null },
      }));

      setAllReservations(processed);
      
      // Charger les recommandations
      const recRes = await fetch(`/api/listings?featured=true&limit=4`);
      const recData = await recRes.json();
      console.log('📸 RECOMMENDATIONS:', recData.listings?.map(l => ({
        id: l.id,
        title: l.title,
        image: l.image,
        photosCount: l.photos?.length,
        firstPhoto: l.photos?.[0]?.url
      })));
      setRecommendations(recData.listings || []);
      setRecommendationsLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setToast({ message: "Erreur de chargement", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadReservations(); }, [loadReservations]);

  const handlePay = (res: any) => {
    const params = new URLSearchParams({ bookingId: res.id, ...(res.bookingOfferId ? { offerId: res.bookingOfferId } : {}) });
    router.push(`/fr/payment?${params.toString()}`);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Confirmer l'annulation ?")) return;
    try {
      const response = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      if (response.ok) {
        setToast({ message: "Réservation annulée", type: "info" });
        setAllReservations(prev => prev.map(b => b.id === id ? { ...b, status: "CANCELLED" } : b));
        setTimeout(() => setToast(null), 3000);
      } else {
        const error = await response.json();
        setToast({ message: error.error || "Erreur", type: "error" });
        setTimeout(() => setToast(null), 3000);
      }
    } catch { setToast({ message: "Erreur de connexion", type: "error" }); setTimeout(() => setToast(null), 3000); }
  };

  const handleViewDetails = (res: any) => router.push(`/fr/reservations/${res.id}`);
  const handleContact = (res: any) => {
    if (res.conversationId) router.push(`/fr/messages?conversation=${res.conversationId}`);
    else router.push(`/fr/messages?listingId=${res.listing.id}&ownerId=${res.owner?.id}`);
  };

  const displayedReservations = getFilteredReservations();
  const counts = {
    upcoming: allReservations.filter(r => r.status === "PENDING" || r.status === "ACCEPTED" || r.status === "CONFIRMED").length,
    past: allReservations.filter(r => r.status === "COMPLETED").length,
    cancelled: allReservations.filter(r => r.status === "CANCELLED" || r.status === "REJECTED").length,
  };

  const showRecommendations = !recommendationsLoading && recommendations.length >= 3;

  return (
    <div className={`min-h-screen ${BG_GRADIENT}`}>
      <TenantHeader />

      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg text-sm animate-in slide-in-from-top-2">
          {toast.message}
        </div>
      )}

      <main className="pt-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Mes Réservations</h1>
          <p className="text-gray-500 text-base">Gérez vos séjours passés et à venir</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {tabs.map(({ key, label, icon }) => {
            const count = counts[key.toLowerCase() as keyof typeof counts];
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                  tab === key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {icon}
                {label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === key ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Refresh */}
        <div className="flex justify-end mb-4">
          <button onClick={loadReservations} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <IoRefreshOutline className="text-base" /> Actualiser
          </button>
        </div>

        {/* Layout: Contenu central + Aside droit */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Colonne principale - Liste des réservations */}
          <div className="flex-1">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : displayedReservations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <IoCalendarOutline className="text-gray-300 text-3xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  Aucune réservation {tab === "UPCOMING" ? "à venir" : tab === "PAST" ? "passée" : "annulée"}
                </h3>
                <p className="text-gray-400 text-sm max-w-md">
                  {tab === "UPCOMING" 
                    ? "Vous n'avez pas encore de réservation. Commencez à explorer nos propriétés."
                    : tab === "PAST" 
                    ? "Vous n'avez pas encore de séjour passé."
                    : "Aucune réservation annulée."}
                </p>
                {tab === "UPCOMING" && (
                  <Link href="/fr/search" className={`mt-6 px-6 py-2.5 rounded-full text-sm font-semibold text-white ${GRADIENT_BTN}`}>
                    Explorer les propriétés
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
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
              </div>
            )}
          </div>

          {/* ✅ Colonne latérale droite - Empty State (toujours visible) */}
          <div className="lg:w-80 flex-shrink-0">
            <EmptyStateAside />
          </div>
        </div>

        {/* Section Recommandations Bento Grid (pleine largeur) */}
        {showRecommendations && (
          <section className="mt-20">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Inspirations pour votre prochain séjour</h2>
            <BentoGridRecommendations recommendations={recommendations} />
          </section>
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] px-6 py-3 flex justify-between items-center z-50">
        <Link href="/fr/search" className="flex flex-col items-center gap-1 text-gray-500 hover:text-indigo-600 transition">
          <IoCompassOutline className="text-xl" />
          <span className="text-[9px] font-semibold uppercase tracking-wider">Explorer</span>
        </Link>
        <Link href="/fr/reservations" className="flex flex-col items-center gap-1 text-indigo-600">
          <IoCalendarOutline className="text-xl" />
          <span className="text-[9px] font-semibold uppercase tracking-wider">Voyages</span>
        </Link>
        <Link href="/fr/messages" className="flex flex-col items-center gap-1 text-gray-500 hover:text-indigo-600 transition">
          <IoChatbubblesOutline className="text-xl" />
          <span className="text-[9px] font-semibold uppercase tracking-wider">Messages</span>
        </Link>
        <Link href="/fr/profile" className="flex flex-col items-center gap-1 text-gray-500 hover:text-indigo-600 transition">
          <IoPersonCircleOutline className="text-xl" />
          <span className="text-[9px] font-semibold uppercase tracking-wider">Profil</span>
        </Link>
      </div>
    </div>
  );
}