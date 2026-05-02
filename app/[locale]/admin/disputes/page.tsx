// app/[locale]/admin/disputes/page.tsx
"use client";

import { useState, useRef, useEffect } from "react"; // ✅ Ajoutez useState ici
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  IoSearchOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoAlertCircleOutline,
  IoTimeOutline,
  IoSendOutline,
  IoWalletOutline,
  IoChatbubbleOutline,
  IoImageOutline,
  IoCloseOutline,
  IoDocumentTextOutline,
  IoHomeOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoCashOutline,
} from "react-icons/io5";
import {
  MdOutlineGavel,
  MdOutlineCleaningServices,
  MdOutlineNoiseAware,
} from "react-icons/md";
import { TbBoom } from "react-icons/tb";
import { GiBrokenWall } from "react-icons/gi";
import { FaMoneyBillWave, FaCalendarTimes } from "react-icons/fa";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertBanner from "@/components/ui/Alert";
import { useDisputes, Dispute, DisputeMessage } from "./hooks/useDisputes";

const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

const pipAvatar = (url: string) => `/api/users/avatar?url=${encodeURIComponent(url)}`;
const pipEvidence = (url: string) => {
  if (url.startsWith("http")) return url;
  if (url.startsWith("/uploads/")) return url;
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

const STATUS_CONFIG: Record<
  string,
  { labelKey: string; color: string; bg: string; dot: string }
> = {
  OPEN: {
    labelKey: "status.open",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    dot: "bg-red-500",
  },
  IN_REVIEW: {
    labelKey: "status.inReview",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    dot: "bg-amber-500",
  },
  RESOLVED: {
    labelKey: "status.resolved",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    labelKey: "status.rejected",
    color: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    dot: "bg-slate-400",
  },
};

const SEVERITY_CONFIG: Record<
  string,
  { labelKey: string; color: string; bg: string; dot: string; icon: React.ReactNode }
> = {
  HIGH: {
    labelKey: "severity.high",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    dot: "bg-red-500",
    icon: <TbBoom className="text-red-500" />,
  },
  MEDIUM: {
    labelKey: "severity.medium",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    dot: "bg-amber-500",
    icon: <IoAlertCircleOutline className="text-amber-500" />,
  },
  LOW: {
    labelKey: "severity.low",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    dot: "bg-blue-500",
    icon: <IoTimeOutline className="text-blue-500" />,
  },
};

const TYPE_CONFIG: Record<
  string,
  { labelKey: string; icon: React.ReactNode; color: string; bg: string }
> = {
  DAMAGE: {
    labelKey: "type.damage",
    icon: <GiBrokenWall className="text-lg" />,
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  CLEANING: {
    labelKey: "type.cleaning",
    icon: <MdOutlineCleaningServices className="text-lg" />,
    color: "text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  MISREPRESENTATION: {
    labelKey: "type.misrepresentation",
    icon: <IoHomeOutline className="text-lg" />,
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  NOISE: {
    labelKey: "type.noise",
    icon: <MdOutlineNoiseAware className="text-lg" />,
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  PAYMENT: {
    labelKey: "type.payment",
    icon: <FaMoneyBillWave className="text-lg" />,
    color: "text-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  CANCELLATION: {
    labelKey: "type.cancellation",
    icon: <FaCalendarTimes className="text-lg" />,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  OTHER: {
    labelKey: "type.other",
    icon: <IoDocumentTextOutline className="text-lg" />,
    color: "text-slate-600",
    bg: "bg-slate-100 dark:bg-slate-800",
  },
};

function EvidenceGallery({ images, t }: { images?: string[]; t: any }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  if (!images || images.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
        <IoImageOutline /> {t("evidence")} ({images.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedImage(img)}
            className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all group"
          >
            {!imageErrors[img] ? (
              <img
                src={pipEvidence(img)}
                alt={`${t("evidence")} ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={() => setImageErrors((prev) => ({ ...prev, [img]: true }))}
              />
            ) : (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <IoImageOutline className="text-slate-400 text-xl" />
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <button onClick={() => setSelectedImage(null)} className="absolute -top-10 right-0 text-white hover:text-slate-300 transition">
              <IoCloseOutline className="text-2xl" />
            </button>
            <img src={pipEvidence(selectedImage)} alt={t("enlargedEvidence")} className="max-w-full max-h-[85vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}

function DisputeDetailPanel({ dispute, onResolve, onReject, actionLoading, onSendMessage, sendingMessage, t }: any) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typeConfig = TYPE_CONFIG[dispute.type] || TYPE_CONFIG.OTHER;
  const statusConfig = STATUS_CONFIG[dispute.status];
  const severityConfig = SEVERITY_CONFIG[dispute.severity];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dispute.messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(dispute.id, newMessage);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-950/20 dark:to-violet-950/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold ${typeConfig.bg} ${typeConfig.color}`}>
              {typeConfig.icon}
              {t(typeConfig.labelKey)}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold ${statusConfig.bg} ${statusConfig.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
              {t(statusConfig.labelKey)}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${severityConfig.bg} ${severityConfig.color}`}>
              {severityConfig.icon}
              {t(severityConfig.labelKey)}
            </span>
          </div>
          <span className="font-mono text-xs text-slate-400">#{dispute.reference?.slice(-8) || dispute.id.slice(-8)}</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{dispute.listing?.title || t("untitled")}</h3>
        {dispute.listing?.location && (
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
            <IoLocationOutline className="text-xs" />
            {dispute.listing.location}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center overflow-hidden">
            {dispute.reporter.image ? (
              <img src={pipAvatar(dispute.reporter.image)} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                {dispute.reporter.firstName?.charAt(0)}{dispute.reporter.lastName?.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {dispute.reporter.firstName} {dispute.reporter.lastName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("openedDispute")}</p>
          </div>
        </div>

        {dispute.booking && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
              <IoCalendarOutline /> {t("stayDetails")}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t("dates")}:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {format(new Date(dispute.booking.checkIn), "dd MMM yyyy", { locale: fr })} -{" "}
                  {format(new Date(dispute.booking.checkOut), "dd MMM yyyy", { locale: fr })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t("nights")}:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {dispute.booking.nights || Math.ceil(
                    (new Date(dispute.booking.checkOut).getTime() - new Date(dispute.booking.checkIn).getTime()) / (1000 * 3600 * 24)
                  )} {t("nightsUnit")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t("totalAmount")}:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {dispute.booking.totalPrice.toLocaleString("fr-FR")} TND
                </span>
              </div>
            </div>
          </div>
        )}

        {dispute.refundAmount && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
              <IoCashOutline /> {t("requestedAmount")}
            </p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {dispute.refundAmount.toLocaleString("fr-FR")} TND
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
            <IoDocumentTextOutline /> {t("description")}
          </p>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
              {dispute.description || t("noDescription")}
            </p>
          </div>
        </div>

        <EvidenceGallery images={dispute.evidence} t={t} />

        {dispute.resolution && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
              <IoCheckmarkCircleOutline /> {t("resolution")}
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400">{dispute.resolution}</p>
            {dispute.resolvedAmount && (
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {t("refundGranted")}: {dispute.resolvedAmount.toLocaleString("fr-FR")} TND
              </p>
            )}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
            <IoChatbubbleOutline /> {t("conversation")} ({dispute.messages.length})
          </p>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {dispute.messages.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <IoChatbubbleOutline className="text-2xl mx-auto mb-2 opacity-50" />
                <p className="text-xs">{t("noMessages")}</p>
              </div>
            ) : (
              dispute.messages.map((msg: DisputeMessage) => {
                const isAdmin = msg.senderRole === "ADMIN";
                return (
                  <div key={msg.id} className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                    <div className={`px-4 py-2 rounded-2xl text-sm max-w-[85%] ${
                      isAdmin
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none"
                    }`}>
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {msg.senderName} {!isAdmin && msg.senderRole === "OWNER" ? `(${t("owner")})` : msg.senderRole === "TENANT" ? `(${t("tenant")})` : ""}
                      </p>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      {format(new Date(msg.createdAt), "dd MMM HH:mm", { locale: fr })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-800/30">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={t("addResponse")}
            className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            onClick={handleSend}
            disabled={sendingMessage || !newMessage.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50"
          >
            <IoSendOutline className="text-sm" />
          </button>
        </div>

        {(dispute.status === "OPEN" || dispute.status === "IN_REVIEW") && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onResolve(dispute.id, dispute.refundAmount)}
              disabled={actionLoading === dispute.id}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <IoCheckmarkCircleOutline /> {t("resolve")}
            </button>
            <button
              onClick={() => onReject(dispute.id)}
              disabled={actionLoading === dispute.id}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <IoCloseCircleOutline /> {t("reject")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDisputesPage() {
  const t = useTranslations("Disputes");

  const {
    disputes,
    selectedDispute,
    loading,
    actionLoading,
    sendingMessage,
    search,
    tab,
    alert,
    stats,
    totalActive,
    setSelectedDispute,
    setSearch,
    setTab,
    fetchDisputes,
    handleResolve,
    handleReject,
    handleSendMessage,
    clearAlert,
  } = useDisputes();

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="h-full flex flex-col overflow-hidden bg-surface">
      {alert && (
        <div className="fixed top-20 right-8 z-50">
          <AlertBanner type={alert.type} message={alert.message} onClose={clearAlert} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden p-6">
        {/* Header */}
        <div className="flex-shrink-0 flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">{t("title")}</h1>
            <p className="text-on-surface-variant text-sm mt-0.5">{t("description")}</p>
          </div>
          <div className="flex gap-2 bg-surface-container rounded-full p-1">
            <button
              onClick={() => { setTab("active"); setSelectedDispute(null); }}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${tab === "active" ? "bg-white dark:bg-slate-900 text-primary shadow-sm" : "text-on-surface-variant"}`}
            >
              {t("tabs.active")} ({totalActive})
            </button>
            <button
              onClick={() => { setTab("archive"); setSelectedDispute(null); }}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${tab === "archive" ? "bg-white dark:bg-slate-900 text-primary shadow-sm" : "text-on-surface-variant"}`}
            >
              {t("tabs.archived")} ({stats.resolved})
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex-shrink-0 grid grid-cols-4 gap-4 mb-6">
          <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 ${card3d}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-sm">
              <IoAlertCircleOutline className="text-white text-lg" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{t("stats.open")}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.open}</p>
            </div>
          </div>
          <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 ${card3d}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <IoTimeOutline className="text-white text-lg" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{t("stats.inReview")}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.inReview}</p>
            </div>
          </div>
          <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 ${card3d}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
              <IoCheckmarkCircleOutline className="text-white text-lg" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{t("stats.resolved")}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.resolved}</p>
            </div>
          </div>
          <div className={`bg-gradient-to-br from-sky-500 to-violet-600 rounded-2xl p-4 flex items-center gap-4 ${card3d}`}>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-sm">
              <IoWalletOutline className="text-white text-lg" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/70 uppercase">{t("stats.refunds")}</p>
              <p className="text-2xl font-bold text-white">{stats.totalRefund.toLocaleString("fr-FR")} TND</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex-shrink-0 mb-6">
          <div className="relative max-w-md">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Main Grid */}
        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
          {/* Liste des litiges */}
          <div className={`col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col ${block3d}`}>
            <div className="flex-shrink-0 p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/40 to-violet-50/20">
              <p className="text-xs font-semibold text-on-surface-variant">
                {disputes.length} {t("disputesCount")}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="md" color="primary" />
                </div>
              ) : disputes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                  <MdOutlineGavel className="text-4xl mb-2 opacity-50" />
                  <p className="text-sm">{t("noDisputes")}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {disputes.map((dispute) => {
                    const typeConfig = TYPE_CONFIG[dispute.type] || TYPE_CONFIG.OTHER;
                    const severityConfig = SEVERITY_CONFIG[dispute.severity];
                    return (
                      <button
                        key={dispute.id}
                        onClick={() => setSelectedDispute(dispute)}
                        className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all ${
                          selectedDispute?.id === dispute.id
                            ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-l-4 border-l-primary"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-primary">
                            #{dispute.reference?.slice(-8) || dispute.id.slice(-8)}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${severityConfig.bg} ${severityConfig.color}`}>
                            {t(severityConfig.labelKey)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center">
                            <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                              {dispute.reporter.firstName?.charAt(0)}{dispute.reporter.lastName?.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-on-surface">
                            {dispute.reporter.firstName} {dispute.reporter.lastName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${typeConfig.bg} ${typeConfig.color}`}>
                            {typeConfig.icon}
                            {t(typeConfig.labelKey)}
                          </span>
                          <span className={`text-[10px] font-bold flex items-center gap-1 ${STATUS_CONFIG[dispute.status].color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[dispute.status].dot}`}></span>
                            {t(STATUS_CONFIG[dispute.status].labelKey)}
                          </span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant mt-2">{formatDate(dispute.createdAt)}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Détail du litige */}
          <div className={`col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden ${block3d}`}>
            {selectedDispute ? (
              <DisputeDetailPanel
                dispute={selectedDispute}
                onResolve={handleResolve}
                onReject={handleReject}
                actionLoading={actionLoading}
                onSendMessage={handleSendMessage}
                sendingMessage={sendingMessage}
                t={t}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-on-surface-variant">
                <MdOutlineGavel className="text-5xl mb-3 opacity-50" />
                <p className="text-sm">{t("selectDispute")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}