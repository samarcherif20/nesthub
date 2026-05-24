// app/[locale]/admin/bookings/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  IoChevronForwardOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoWalletOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoDownloadOutline,
  IoPrintOutline,
  IoChatbubbleOutline,
  IoShieldCheckmarkOutline,
  IoAlertCircleOutline,
  IoCreateOutline,
  IoCashOutline,
  IoScaleOutline,
  IoCloseCircleOutline,
  IoArrowBackOutline,
  IoCallOutline,
  IoMailOutline,
  IoHomeOutline,
  IoPeopleOutline,
  IoCardOutline,
  IoDocumentTextOutline,
} from "react-icons/io5";
import { 
  PiBuilding, 
  PiCurrencyCircleDollar, 
  PiClock, 
  PiChatCircle,
  PiUserCircle,
  PiUser,
  PiUsers
} from "react-icons/pi";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ============================================
// STYLES
// ============================================
const block3d = "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d = "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

// ============================================
// TYPES
// ============================================
interface BookingDetail {
  id: string;
  reference: string;
  status: string;
  paymentStatus: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalNights: number;
  totalPrice: number;
  cleaningFee: number;
  serviceFee: number;
  createdAt: string;
  confirmedAt?: string;
  listing: {
    id: string;
    title: string;
    governorate: string;
    delegation: string;
    street?: string;
    pricePerNight: number;
    images: { url: string }[];
    latitude?: number;
    longitude?: number;
  };
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    profilePictureUrl?: string;
    isIdentityVerified: boolean;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    profilePictureUrl?: string;
    isIdentityVerified: boolean;
  };
  payments: {
    id: string;
    amount: number;
    status: string;
    paidAt?: string;
    provider: string;
    providerTransactionId?: string;
  }[];
  timeline: {
    id: string;
    action: string;
    description: string;
    createdAt: string;
    actor: string;
  }[];
  notes?: {
    id: string;
    content: string;
    createdAt: string;
    adminName: string;
  }[];
  conversationId?: string;
}

// ============================================
// FORMATAGE
// ============================================
const formatDate = (dateString: string) => {
  if (!dateString) return "Date inconnue";
  try {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "Date inconnue";
  }
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return "Date inconnue";
  try {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Date inconnue";
  }
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: 2,
  }).format(price);
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "CONFIRMED":
      return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "Confirmée", icon: "✓" };
    case "PENDING":
      return { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "En attente", icon: "⏳" };
    case "COMPLETED":
      return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Terminée", icon: "✔" };
    case "CANCELLED":
      return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Annulée", icon: "✗" };
    default:
      return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", label: status, icon: "●" };
  }
};

const getImageUrl = (url: string) => {
  if (!url) return "";
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

// ============================================
// TOAST
// ============================================
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className={`rounded-xl shadow-lg p-4 flex items-center gap-3 ${type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
        {type === "success" ? <IoCheckmarkCircleOutline className="text-xl" /> : <IoAlertCircleOutline className="text-xl" />}
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function AdminBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "fr";
  const bookingId = params.id as string;
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBooking(data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/bookings/${bookingId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: note }),
      });
      if (res.ok) {
        setNote("");
        fetchBookingDetails();
        setToast({ message: "Note ajoutée avec succès", type: "success" });
      }
    } catch (error) {
      console.error("Erreur:", error);
      setToast({ message: "Erreur lors de l'ajout de la note", type: "error" });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Télécharger le contrat
  const handleDownloadContract = async () => {
    if (!booking) return;
    setContractLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur génération contrat");
      }

      if (data.contract?.id) {
        window.open(`/api/contracts/${data.contract.id}/download`, "_blank");
        setToast({ message: "Contrat généré avec succès !", type: "success" });
      } else {
        setToast({ message: "Erreur lors de la génération", type: "error" });
      }
    } catch (error) {
      console.error("Erreur:", error);
      setToast({ message: "Erreur technique lors de la génération du contrat", type: "error" });
    } finally {
      setContractLoading(false);
    }
  };

  // Télécharger le reçu
  const handleDownloadReceipt = async () => {
    if (!booking) return;
    setReceiptLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/bookings/${booking.id}/receipt`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recu_${booking.reference || booking.id.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setToast({ message: "Reçu téléchargé avec succès", type: "success" });
    } catch (error) {
      console.error("Erreur:", error);
      setToast({ message: "Erreur lors du téléchargement du reçu", type: "error" });
    } finally {
      setReceiptLoading(false);
    }
  };

  // Imprimer le reçu
  const handlePrintReceipt = () => {
    window.print();
  };

  // Contacter l'hôte
  const handleContactHost = () => {
    if (booking?.conversationId) {
      router.push(`/${locale}/admin/conversations/${booking.conversationId}`);
    } else {
      router.push(`/${locale}/admin/conversations?bookingId=${booking?.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-10 bg-white dark:bg-slate-900 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Réservation non trouvée</h2>
          <Link href={`/${locale}/admin/bookings`} className="mt-4 text-indigo-600 hover:underline inline-block">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const totalWithFees = booking.totalPrice + (booking.cleaningFee || 0) + (booking.serviceFee || 0);
  const paidPayment = booking.payments?.find(p => p.status === "PAID");

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── BREADCRUMB ── */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href={`/${locale}/admin/dashboard`} className="hover:text-indigo-600 transition-colors">ADMIN</Link>
        <IoChevronForwardOutline className="h-3 w-3 text-slate-400" />
        <Link href={`/${locale}/admin/bookings`} className="hover:text-indigo-600 transition-colors">Réservations</Link>
        <IoChevronForwardOutline className="h-3 w-3 text-slate-400" />
        <span className="text-indigo-600 font-semibold">#{booking.reference?.slice(-8) || booking.id.slice(-8)}</span>
      </div>

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
         
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Détails de la réservation
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.text}`}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Créée le {formatDate(booking.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadReceipt}
            disabled={receiptLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all text-sm font-medium disabled:opacity-50"
          >
            <IoDownloadOutline className="text-base" /> 
            {receiptLoading ? "Génération..." : "Reçu"}
          </button>
          <button
            onClick={handlePrintReceipt}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold shadow-sm transition-all"
          >
            <IoPrintOutline className="text-base" /> Imprimer
          </button>
          <button
            onClick={handleDownloadContract}
            disabled={contractLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all text-sm font-medium disabled:opacity-50"
          >
            <IoDocumentTextOutline className="text-base" />
            {contractLoading ? "Génération..." : "Contrat"}
          </button>
        </div>
      </div>

      {/* ── CARTE PRINCIPALE ── */}
      <div className={`bg-white dark:bg-slate-900 rounded-2xl overflow-hidden ${block3d}`}>
        
        {/* Image de la propriété */}
        <div className="relative h-64 md:h-80">
          {booking.listing.images?.[0]?.url ? (
            <img className="w-full h-full object-cover" src={getImageUrl(booking.listing.images[0].url)} alt={booking.listing.title} />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
              <PiBuilding className="text-6xl text-slate-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="text-2xl font-bold">{booking.listing.title}</h2>
            <p className="text-white/80 text-sm mt-1 flex items-center gap-1">
              <IoLocationOutline className="text-sm" />
              {booking.listing.delegation}, {booking.listing.governorate}
            </p>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          <div className="grid grid-cols-12 gap-6">
            
            {/* Section Dates */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <IoCalendarOutline className="text-indigo-500 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Calendrier</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Arrivée</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{formatDate(booking.checkIn)}</p>
                    <p className="text-xs text-slate-400">15:00 - 18:00</p>
                  </div>
                  <IoChevronForwardOutline className="text-slate-400" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Départ</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{formatDate(booking.checkOut)}</p>
                    <p className="text-xs text-slate-400">Avant 11:00</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Durée du séjour</span>
                  <span className="font-semibold">{booking.totalNights} nuits</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Nombre de voyageurs</span>
                  <span className="font-semibold">{booking.guests} personne{booking.guests > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Section Participants */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <PiUsers className="text-indigo-500 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Participants</h3>
              </div>
              <div className="space-y-3">
                {/* Voyageur */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => router.push(`/${locale}/admin/users/${booking.tenant.id}`)}>
                  <div className="relative">
                    {booking.tenant.profilePictureUrl ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40">
                        <img src={getImageUrl(booking.tenant.profilePictureUrl)} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <PiUserCircle className="w-10 h-10 text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-full" />
                    )}
                    {booking.tenant.isIdentityVerified && (
                      <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-0.5">
                        <IoShieldCheckmarkOutline className="text-[8px] text-white" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Voyageur</p>
                    <p className="text-sm font-semibold">{booking.tenant.firstName} {booking.tenant.lastName}</p>
                    <p className="text-xs text-indigo-600">{booking.tenant.email}</p>
                  </div>
                </div>
                {/* Hôte */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => router.push(`/${locale}/admin/users/${booking.owner.id}`)}>
                  <div className="relative">
                    {booking.owner.profilePictureUrl ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40">
                        <img src={getImageUrl(booking.owner.profilePictureUrl)} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <PiUserCircle className="w-10 h-10 text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-full" />
                    )}
                    {booking.owner.isIdentityVerified && (
                      <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-0.5">
                        <IoShieldCheckmarkOutline className="text-[8px] text-white" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Hôte</p>
                    <p className="text-sm font-semibold">{booking.owner.firstName} {booking.owner.lastName}</p>
                    <p className="text-xs text-indigo-600">{booking.owner.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleContactHost}
                  className="w-full mt-2 py-2 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                >
                  <IoChatbubbleOutline className="text-sm" /> Contacter
                </button>
              </div>
            </div>

            {/* Section Financière */}
            <div className="col-span-12 lg:col-span-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <IoWalletOutline className="text-indigo-500 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Finance</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Séjour ({booking.totalNights} nuits)</span>
                    <span>{formatPrice(booking.totalPrice)}</span>
                  </div>
                  {booking.cleaningFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Frais de ménage</span>
                      <span>{formatPrice(booking.cleaningFee)}</span>
                    </div>
                  )}
                  {booking.serviceFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Frais de service</span>
                      <span>{formatPrice(booking.serviceFee)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-black text-indigo-600">{formatPrice(totalWithFees)}</span>
                  </div>
                </div>
                {paidPayment && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-5 bg-blue-900 rounded flex items-center justify-center">
                          <span className="text-[6px] text-white font-black">VISA</span>
                        </div>
                        <span className="text-xs text-green-600 font-medium">Paiement effectué</span>
                      </div>
                      <IoCheckmarkCircleOutline className="text-green-500" />
                    </div>
                    {paidPayment.paidAt && (
                      <p className="text-[10px] text-slate-400 mt-1">Le {formatDate(paidPayment.paidAt)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── JOURNAL ET NOTES (même hauteur) ── */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Journal d'audit */}
        <div className="col-span-12 lg:col-span-7">
          <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 ${card3d} h-full flex flex-col`}>
            <div className="flex items-center gap-3 mb-6 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <IoTimeOutline className="text-indigo-500 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Journal d'audit</h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
              {booking.timeline?.map((event, idx) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <IoCheckmarkCircleOutline className="text-indigo-500 text-sm" />
                  </div>
                  <div className="flex-1 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{event.action}</h4>
                      <span className="text-[10px] text-slate-400">{formatDateTime(event.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{event.description}</p>
                    <p className="text-[10px] text-indigo-500 mt-1">Par: {event.actor}</p>
                  </div>
                </div>
              ))}
              {(!booking.timeline || booking.timeline.length === 0) && (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">Aucun événement d'audit</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes Admin - même hauteur */}
        <div className="col-span-12 lg:col-span-5">
          <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 ${card3d} h-full flex flex-col`}>
            <div className="flex items-center gap-3 mb-6 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <IoCreateOutline className="text-indigo-500 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notes internes</h3>
            </div>
            
            <div className="flex-shrink-0 mb-4">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                placeholder="Ajouter une note de suivi..."
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={addNote}
                  disabled={submitting || !note.trim()}
                  className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {submitting ? "Envoi..." : "Ajouter"}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[calc(400px-120px)]">
              {booking.notes?.map((noteItem) => (
                <div key={noteItem.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[11px] text-indigo-600">{noteItem.adminName}</span>
                    <span className="text-[9px] text-slate-400">{formatDateTime(noteItem.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{noteItem.content}</p>
                </div>
              ))}
              {(!booking.notes || booking.notes.length === 0) && (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">Aucune note</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}