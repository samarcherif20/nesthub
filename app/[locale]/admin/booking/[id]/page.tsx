"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  IoChevronForwardOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoWalletOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoDownloadOutline,
  IoPrintOutline,
  IoChatbubbleOutline,
  IoShieldCheckmarkOutline,
  IoAlertCircleOutline,
  IoCreateOutline,
  IoCloseCircleOutline,
  IoDocumentTextOutline,
} from "react-icons/io5";
import { 
  PiBuilding, 
  PiUsers,
  PiUserCircle
} from "react-icons/pi";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useBookingDetails } from "./hooks/useBookingDetails";

interface Toast {
  type: "success" | "error";
  message: string;
}

// Styles
const block3d = "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d = "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

// Fonction robuste pour nettoyer le HTML
const cleanHtmlContent = (html: string): string => {
  if (!html) return "";
  
  // Si c'est du HTML avec des balises
  if (html.includes('<') && html.includes('>')) {
    // Créer un élément div temporaire pour parser le HTML
    if (typeof window !== 'undefined') {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.textContent || div.innerText || html.replace(/<[^>]*>/g, '');
    }
  }
  
  // Fallback: supprimer les balises HTML avec regex
  return html.replace(/<[^>]*>/g, '');
};

// Formatage avec locale
const formatDate = (dateString: string, locale: string) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const formatDateTime = (dateString: string, locale: string) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const formatPrice = (price: number, locale: string) => {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: 2,
  }).format(price);
};

const getStatusConfig = (status: string, t: any) => {
  switch (status) {
    case "CONFIRMED":
      return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: t("statusConfirmed") };
    case "PENDING":
      return { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: t("statusPending") };
    case "COMPLETED":
      return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: t("statusCompleted") };
    case "CANCELLED":
      return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: t("statusCancelled") };
    default:
      return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", label: status };
  }
};

const getImageUrl = (url: string) => {
  if (!url) return "";
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

// Toast component
function Toast({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
        {toast.type === "success" ? <IoCheckmarkCircleOutline className="w-5 h-5" /> : <IoAlertCircleOutline className="w-5 h-5" />}
        <span className="text-sm font-medium">{toast.message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <IoCloseCircleOutline className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Composant pour afficher une note nettoyée
function NoteItem({ note, formatDateTime, locale }: { note: any; formatDateTime: (date: string, locale: string) => string; locale: string }) {
  const cleanContent = cleanHtmlContent(note.content);
  
  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold text-[11px] text-indigo-600">{note.adminName}</span>
        <span className="text-[9px] text-slate-400">{formatDateTime(note.createdAt, locale)}</span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-words">
        {cleanContent}
      </p>
    </div>
  );
}

// Main component
export default function AdminBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "fr";
  const bookingId = params.id as string;
  const t = useTranslations("AdminBookingDetail");

  const { booking, loading, submitting, addNote, downloadContract, downloadReceipt } = useBookingDetails(bookingId);

  const [note, setNote] = useState("");
  const [contractLoading, setContractLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    // Nettoyer la note avant envoi pour éviter le HTML
    const cleanNote = cleanHtmlContent(note);
    const success = await addNote(cleanNote);
    if (success) {
      setNote("");
      showToast("success", t("toastNoteAdded"));
    } else {
      showToast("error", t("toastNoteError"));
    }
  };

  const handleDownloadContract = async () => {
    if (!booking) return;
    setContractLoading(true);
    const result = await downloadContract(booking.id);
    if (result.success && result.contractId) {
      window.open(`/api/contracts/${result.contractId}/download`, "_blank");
      showToast("success", t("toastContractSuccess"));
    } else {
      showToast("error", result.error || t("toastContractError"));
    }
    setContractLoading(false);
  };

  const handleDownloadReceipt = async () => {
    if (!booking) return;
    setReceiptLoading(true);
    const result = await downloadReceipt(booking.id, booking.reference);
    if (result.success && result.blob) {
      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recu_${booking.reference || booking.id.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast("success", t("toastReceiptSuccess"));
    } else {
      showToast("error", result.error || t("toastReceiptError"));
    }
    setReceiptLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

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
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("notFound")}</h2>
          <Link href={`/${locale}/admin/bookings`} className="mt-4 text-indigo-600 hover:underline inline-block">
            {t("backToList")}
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(booking.status, t);
  const totalWithFees = booking.totalPrice + (booking.cleaningFee || 0) + (booking.serviceFee || 0);
  const paidPayment = booking.payments?.find(p => p.status === "PAID");

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
      
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href={`/${locale}/admin/dashboard`} className="hover:text-indigo-600 transition-colors">ADMIN</Link>
        <IoChevronForwardOutline className="h-3 w-3 text-slate-400" />
        <Link href={`/${locale}/admin/bookings`} className="hover:text-indigo-600 transition-colors">{t("breadcrumbBookings")}</Link>
        <IoChevronForwardOutline className="h-3 w-3 text-slate-400" />
        <span className="text-indigo-600 font-semibold">#{booking.reference?.slice(-8) || booking.id.slice(-8)}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("title")}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{t("createdOn")} {formatDate(booking.createdAt, locale)}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleDownloadReceipt}
            disabled={receiptLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all text-sm font-medium disabled:opacity-50"
          >
            <IoDownloadOutline className="text-base" /> {receiptLoading ? t("generating") : t("receiptButton")}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold shadow-sm transition-all"
          >
            <IoPrintOutline className="text-base" /> {t("printButton")}
          </button>
          <button
            onClick={handleDownloadContract}
            disabled={contractLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all text-sm font-medium disabled:opacity-50"
          >
            <IoDocumentTextOutline className="text-base" /> {contractLoading ? t("generating") : t("contractButton")}
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className={`bg-white dark:bg-slate-900 rounded-2xl overflow-hidden ${block3d}`}>
        
        {/* Property Image */}
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

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-12 gap-6">
            
            {/* Dates Section */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <IoCalendarOutline className="text-indigo-500 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("calendarTitle")}</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t("checkIn")}</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{formatDate(booking.checkIn, locale)}</p>
                    <p className="text-xs text-slate-400">15:00 - 18:00</p>
                  </div>
                  <IoChevronForwardOutline className="text-slate-400" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t("checkOut")}</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{formatDate(booking.checkOut, locale)}</p>
                    <p className="text-xs text-slate-400">{t("beforeCheckout")}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t("stayDuration")}</span>
                  <span className="font-semibold">{booking.totalNights} {t("nights")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t("guests")}</span>
                  <span className="font-semibold">{booking.guests} {t("person", { count: booking.guests })}</span>
                </div>
              </div>
            </div>

            {/* Participants Section */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <PiUsers className="text-indigo-500 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("participantsTitle")}</h3>
              </div>
              <div className="space-y-3">
                {/* Guest */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => router.push(`/${locale}/admin/users/${booking.tenant.id}`)}>
                  <div className="relative">
                    {booking.tenant.profilePictureUrl ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
                        <img src={getImageUrl(booking.tenant.profilePictureUrl)} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <PiUserCircle className="w-10 h-10 text-indigo-400 bg-indigo-50 rounded-full" />
                    )}
                    {booking.tenant.isIdentityVerified && (
                      <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-0.5">
                        <IoShieldCheckmarkOutline className="text-[8px] text-white" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t("guest")}</p>
                    <p className="text-sm font-semibold">{booking.tenant.firstName} {booking.tenant.lastName}</p>
                    <p className="text-xs text-indigo-600">{booking.tenant.email}</p>
                  </div>
                </div>
                {/* Host */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => router.push(`/${locale}/admin/users/${booking.owner.id}`)}>
                  <div className="relative">
                    {booking.owner.profilePictureUrl ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
                        <img src={getImageUrl(booking.owner.profilePictureUrl)} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <PiUserCircle className="w-10 h-10 text-indigo-400 bg-indigo-50 rounded-full" />
                    )}
                    {booking.owner.isIdentityVerified && (
                      <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-0.5">
                        <IoShieldCheckmarkOutline className="text-[8px] text-white" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t("host")}</p>
                    <p className="text-sm font-semibold">{booking.owner.firstName} {booking.owner.lastName}</p>
                    <p className="text-xs text-indigo-600">{booking.owner.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleContactHost}
                  className="w-full mt-2 py-2 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                >
                  <IoChatbubbleOutline className="text-sm" /> {t("contactButton")}
                </button>
              </div>
            </div>

            {/* Finance Section */}
            <div className="col-span-12 lg:col-span-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <IoWalletOutline className="text-indigo-500 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("financeTitle")}</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t("stayCost", { nights: booking.totalNights })}</span>
                    <span>{formatPrice(booking.totalPrice, locale)}</span>
                  </div>
                  {booking.cleaningFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{t("cleaningFee")}</span>
                      <span>{formatPrice(booking.cleaningFee, locale)}</span>
                    </div>
                  )}
                  {booking.serviceFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{t("serviceFee")}</span>
                      <span>{formatPrice(booking.serviceFee, locale)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                    <span className="font-bold">{t("total")}</span>
                    <span className="text-xl font-black text-indigo-600">{formatPrice(totalWithFees, locale)}</span>
                  </div>
                </div>
                {paidPayment && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-5 bg-blue-900 rounded flex items-center justify-center">
                          <span className="text-[6px] text-white font-black">VISA</span>
                        </div>
                        <span className="text-xs text-green-600 font-medium">{t("paymentMade")}</span>
                      </div>
                      <IoCheckmarkCircleOutline className="text-green-500" />
                    </div>
                    {paidPayment.paidAt && (
                      <p className="text-[10px] text-slate-400 mt-1">{t("paidOn")} {formatDate(paidPayment.paidAt, locale)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline and Notes */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Audit Timeline */}
        <div className="col-span-12 lg:col-span-7">
          <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 ${card3d} h-full flex flex-col`}>
            <div className="flex items-center gap-3 mb-6 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <IoTimeOutline className="text-indigo-500 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("auditTitle")}</h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
              {booking.timeline?.map((event) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <IoCheckmarkCircleOutline className="text-indigo-500 text-sm" />
                  </div>
                  <div className="flex-1 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{event.action}</h4>
                      <span className="text-[10px] text-slate-400">{formatDateTime(event.createdAt, locale)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{event.description}</p>
                    <p className="text-[10px] text-indigo-500 mt-1">{t("by")}: {event.actor}</p>
                  </div>
                </div>
              ))}
              {(!booking.timeline || booking.timeline.length === 0) && (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">{t("noAudit")}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Admin Notes */}
        <div className="col-span-12 lg:col-span-5">
          <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 ${card3d} h-full flex flex-col`}>
            <div className="flex items-center gap-3 mb-6 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <IoCreateOutline className="text-indigo-500 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("notesTitle")}</h3>
            </div>
            
            <div className="flex-shrink-0 mb-4">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                placeholder={t("notePlaceholder")}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddNote}
                  disabled={submitting || !note.trim()}
                  className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {submitting ? t("adding") : t("addNote")}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[calc(400px-120px)]">
              {booking.notes?.map((noteItem) => (
                <NoteItem 
                  key={noteItem.id} 
                  note={noteItem} 
                  formatDateTime={formatDateTime} 
                  locale={locale} 
                />
              ))}
              {(!booking.notes || booking.notes.length === 0) && (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">{t("noNotes")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}