// app/[locale]/admin/disputes/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import DisputeActionModal from "@/components/ui/modals/DisputeActionModal";
import {
  IoSearchOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoAlertCircleOutline,
  IoTimeOutline,
  IoSendOutline,
  IoWalletOutline,
  IoChatbubbleOutline,
  IoCloseOutline,
  IoImageOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoDocumentTextOutline,
  IoAddOutline,
  IoRemoveOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import { MdOutlineGavel } from "react-icons/md";
import { useDisputes } from "./hooks/useDisputes";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pipAvatar = (url: string) =>
  url?.includes("http")
    ? `/api/users/avatar?url=${encodeURIComponent(url)}`
    : url || "";

const pipEvidence = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/uploads/")) return url;
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({
  user,
  size = "md",
}: {
  user: { firstName: string; lastName: string; image?: string };
  size?: "sm" | "md" | "lg";
}) {
  const [err, setErr] = useState(false);
  const sz =
    size === "sm"
      ? "w-7 h-7 text-[10px]"
      : size === "lg"
        ? "w-12 h-12 text-base"
        : "w-9 h-9 text-xs";
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`;
  return (
    <div
      className={`${sz} rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center`}
    >
      {user.image && !err ? (
        <img
          src={pipAvatar(user.image)}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <span className="font-bold text-indigo-600 dark:text-indigo-400">
          {initials}
        </span>
      )}
    </div>
  );
}

// ─── Evidence lightbox avec navigation et zoom ────────────────────────────────
function EvidenceGallery({ images, t }: { images?: string[]; t: any }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  if (!images?.length) return null;

  const currentImage = selectedIndex !== null ? images[selectedIndex] : null;

  const goPrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const goNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleZoomIn = () => setScale(Math.min(scale + 0.3, 3));
  const handleZoomOut = () => {
    if (scale > 0.5) {
      setScale(Math.max(scale - 0.3, 0.5));
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") handleResetZoom();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, scale]);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => {
              setSelectedIndex(i);
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-400 transition-all group"
          >
            {!errors.has(img) ? (
              <img
                src={pipEvidence(img)}
                alt={`${t("evidence")} ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={() => setErrors((p) => new Set([...p, img]))}
              />
            ) : (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <IoImageOutline className="text-slate-400" />
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedIndex !== null && currentImage && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedIndex(null);
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all"
          >
            <IoCloseOutline className="text-xl" />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-2">
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            >
              <IoRemoveOutline className="text-lg" />
            </button>
            <span className="text-white text-xs font-mono min-w-[40px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            >
              <IoAddOutline className="text-lg" />
            </button>
            {scale !== 1 && (
              <button
                onClick={handleResetZoom}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all text-xs"
              >
                ⟲
              </button>
            )}
          </div>

          {selectedIndex > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all"
            >
              <IoChevronBackOutline className="text-xl" />
            </button>
          )}

          {selectedIndex < images.length - 1 && (
            <button
              onClick={goNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all"
            >
              <IoChevronForwardOutline className="text-xl" />
            </button>
          )}

          <div
            className="relative max-w-[90vw] max-h-[85vh] overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            style={{ cursor: scale > 1 ? "grab" : "default" }}
          >
            <img
              src={pipEvidence(currentImage)}
              alt=""
              className="max-w-full max-h-[85vh] object-contain transition-transform duration-200"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                cursor:
                  scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
              }}
              draggable={false}
            />
          </div>

          <div className="absolute bottom-6 right-6 z-20 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5">
            <span className="text-white text-xs font-mono">
              {selectedIndex + 1} / {images.length}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function DisputeDetailPanel({
  dispute,
  onResolveClick,
  onRejectClick,
  actionLoading,
  onSendMessage,
  sendingMessage,
  t,
  locale,
}: any) {
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<"BOTH" | "OWNER" | "TENANT">("BOTH");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = actionLoading === dispute.id;
  const canAct = dispute.status === "OPEN" || dispute.status === "IN_REVIEW";
  const ref = dispute.reference?.slice(-8) ?? dispute.id.slice(-8);

  const getDateLocale = () => (locale === "fr" ? fr : enUS);

  const STATUS_CONFIG: Record<
    string,
    { label: string; color: string; bg: string; border: string }
  > = {
    OPEN: {
      label: t("status.open"),
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    },
    IN_REVIEW: {
      label: t("status.inReview"),
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    RESOLVED: {
      label: t("status.resolved"),
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    REJECTED: {
      label: t("status.rejected"),
      color: "text-slate-500",
      bg: "bg-slate-100",
      border: "border-slate-200",
    },
  };

  const SEVERITY_CONFIG: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    HIGH: {
      label: t("severity.high"),
      color: "text-red-600",
      bg: "bg-red-100",
    },
    MEDIUM: {
      label: t("severity.medium"),
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    LOW: {
      label: t("severity.low"),
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
  };

  const TYPE_LABELS: Record<string, string> = {
    DAMAGE: t("type.damage"),
    CLEANING: t("type.cleaning"),
    MISREPRESENTATION: t("type.misrepresentation"),
    NOISE: t("type.noise"),
    PAYMENT: t("type.payment"),
    CANCELLATION: t("type.cancellation"),
    OTHER: t("type.other"),
  };

  const status = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.OPEN;
  const severity = SEVERITY_CONFIG[dispute.severity] || SEVERITY_CONFIG.LOW;

  // Logique pour le verdict (sans argent)
  const isResolved = dispute.status === "RESOLVED";
  const isRejected = dispute.status === "REJECTED";

  const getResolutionContent = () => {
    if (isResolved) {
      return {
        icon: <IoCheckmarkCircleOutline className="text-lg" />,
        bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
        borderColor: "border-emerald-200 dark:border-emerald-800/40",
        textColor: "text-emerald-700 dark:text-emerald-400",
        title: t("resolution.resolved"),
        message: t("resolution.resolvedMessage"),
      };
    } else if (isRejected) {
      return {
        icon: <IoCloseCircleOutline className="text-lg" />,
        bgColor: "bg-red-50 dark:bg-red-950/20",
        borderColor: "border-red-200 dark:border-red-800/40",
        textColor: "text-red-700 dark:text-red-400",
        title: t("resolution.rejected"),
        message: t("resolution.rejectedMessage"),
      };
    }
    return null;
  };

  const resolutionContent = getResolutionContent();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dispute.messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(dispute.id, newMessage, replyTo);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded-lg">
            #{ref}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${status.bg} ${status.color} border ${status.border}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${status.color.replace("text-", "bg-")}`}
            />
            {status.label}
          </span>
          <span
            className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${severity.bg} ${severity.color}`}
          >
            {severity.label}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {TYPE_LABELS[dispute.type] ?? dispute.type}
          </span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
          {dispute.listing?.title ?? t("unknownProperty")}
        </h3>
        {dispute.listing?.location && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {dispute.listing.location}
          </p>
        )}

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl flex-1">
            <Avatar user={dispute.reporter} size="md" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {dispute.reporter.firstName} {dispute.reporter.lastName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("plaintiff")} · {t("openedOn")}{" "}
                {format(new Date(dispute.createdAt), "dd MMM yyyy", {
                  locale: getDateLocale(),
                })}
              </p>
            </div>
          </div>
          {dispute.respondent && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl flex-1">
              <Avatar user={dispute.respondent} size="md" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {dispute.respondent.firstName} {dispute.respondent.lastName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("defendant")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-950/20">
        {dispute.booking && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <IoCalendarOutline className="text-sm" />
                {t("bookingInfo")}
              </h4>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                  {t("checkIn")}
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {format(new Date(dispute.booking.checkIn), "dd MMM yyyy", {
                    locale: getDateLocale(),
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                  {t("checkOut")}
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {format(new Date(dispute.booking.checkOut), "dd MMM yyyy", {
                    locale: getDateLocale(),
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                  {t("totalAmount")}
                </p>
                <p className="text-sm font-semibold text-emerald-600">
                  {dispute.booking.totalPrice.toLocaleString(
                    locale === "fr" ? "fr-FR" : "en-US",
                  )}{" "}
                  TND
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <IoDocumentTextOutline className="text-sm" />
              {t("description")}
            </h4>
          </div>
          <div className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
              {dispute.description || t("noDescription")}
            </p>
          </div>
        </div>

        {dispute.evidence && dispute.evidence.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <IoImageOutline className="text-sm" />
                {t("evidence")} ({dispute.evidence.length})
              </h4>
            </div>
            <div className="p-4">
              <EvidenceGallery images={dispute.evidence} t={t} />
            </div>
          </div>
        )}

        {/* Resolution Card - Dynamique selon le verdict (sans argent) */}
        {resolutionContent && (
          <div
            className={`rounded-xl border p-4 ${resolutionContent.bgColor} ${resolutionContent.borderColor}`}
          >
            <div className="flex items-center gap-3">
              <div className={`text-${resolutionContent.textColor}`}>
                {resolutionContent.icon}
              </div>
              <div className="flex-1">
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${resolutionContent.textColor}`}
                >
                  {resolutionContent.title}
                </p>
                <p
                  className={`text-sm font-medium mt-1 ${resolutionContent.textColor}`}
                >
                  {resolutionContent.message}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <IoChatbubbleOutline className="text-sm" />
              {t("conversation")} ({dispute.messages.length})
            </h4>
          </div>
          <div className="p-4">
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {dispute.messages.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <IoChatbubbleOutline className="text-3xl mx-auto mb-2" />
                  <p className="text-xs">{t("noMessages")}</p>
                </div>
              ) : (
                dispute.messages.map((msg: any) => {
                  const isAdmin = msg.senderRole === "ADMIN";
                  let bgColor = "";
                  if (isAdmin)
                    bgColor = "bg-indigo-600 text-white rounded-br-none";
                  else if (msg.senderRole === "OWNER")
                    bgColor =
                      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-bl-none";
                  else
                    bgColor =
                      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-bl-none";

                  let roleLabel = "";
                  if (isAdmin) roleLabel = t("admin");
                  else if (msg.senderRole === "OWNER") roleLabel = t("owner");
                  else roleLabel = t("tenant");

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] ${isAdmin ? "text-right" : "text-left"}`}
                      >
                        <div
                          className={`px-4 py-2 rounded-2xl text-sm ${bgColor}`}
                        >
                          <p className="text-[10px] opacity-70 mb-1">
                            {msg.senderName} · {roleLabel}
                            {msg.recipientRole && (
                              <span className="ml-1 text-[8px] opacity-50">
                                →{" "}
                                {msg.recipientRole === "OWNER"
                                  ? t("toOwner")
                                  : msg.recipientRole === "TENANT"
                                    ? t("toTenant")
                                    : t("toBoth")}
                              </span>
                            )}
                          </p>
                          {msg.content}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {format(new Date(msg.createdAt), "HH:mm", {
                            locale: getDateLocale(),
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setReplyTo("BOTH")}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              replyTo === "BOTH"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            {t("replyToBoth")}
          </button>
          <button
            onClick={() => setReplyTo("OWNER")}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              replyTo === "OWNER"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            {t("replyToOwner")}
          </button>
          <button
            onClick={() => setReplyTo("TENANT")}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              replyTo === "TENANT"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            {t("replyToTenant")}
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={
              replyTo === "BOTH"
                ? t("replyToBothPlaceholder")
                : replyTo === "OWNER"
                  ? t("replyToOwnerPlaceholder")
                  : t("replyToTenantPlaceholder")
            }
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={sendingMessage || !newMessage.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {sendingMessage ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <IoSendOutline className="text-sm" />
            )}
            <span className="text-sm font-medium hidden sm:inline">
              {t("send")}
            </span>
          </button>
        </div>

        {canAct && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onResolveClick(dispute.id)}
              disabled={isLoading}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <IoCheckmarkCircleOutline className="text-base" />
              {t("resolve")}
            </button>
            <button
              onClick={() => onRejectClick(dispute.id)}
              disabled={isLoading}
              className="py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <IoCloseCircleOutline className="text-base" />
              {t("reject")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dispute list item ──────────────────────────────────────────────────────
function DisputeListItem({ dispute, isSelected, onClick, t, locale }: any) {
  const getDateLocale = () => (locale === "fr" ? fr : enUS);

  const STATUS_CONFIG: Record<
    string,
    { label: string; color: string; dot: string }
  > = {
    OPEN: { label: t("status.open"), color: "text-red-600", dot: "bg-red-500" },
    IN_REVIEW: {
      label: t("status.inReview"),
      color: "text-amber-600",
      dot: "bg-amber-500",
    },
    RESOLVED: {
      label: t("status.resolved"),
      color: "text-emerald-600",
      dot: "bg-emerald-500",
    },
    REJECTED: {
      label: t("status.rejected"),
      color: "text-slate-400",
      dot: "bg-slate-400",
    },
  };

  const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
    HIGH: { label: t("severity.high"), color: "text-red-600" },
    MEDIUM: { label: t("severity.medium"), color: "text-amber-600" },
    LOW: { label: t("severity.low"), color: "text-blue-600" },
  };

  const TYPE_LABELS: Record<string, string> = {
    DAMAGE: t("type.damage"),
    CLEANING: t("type.cleaning"),
    MISREPRESENTATION: t("type.misrepresentation"),
    NOISE: t("type.noise"),
    PAYMENT: t("type.payment"),
    CANCELLATION: t("type.cancellation"),
    OTHER: t("type.other"),
  };

  const status = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.OPEN;
  const severity = SEVERITY_CONFIG[dispute.severity] || SEVERITY_CONFIG.LOW;
  const ref = dispute.reference?.slice(-8) ?? dispute.id.slice(-8);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group ${
        isSelected
          ? "bg-indigo-50/60 dark:bg-indigo-950/20 border-l-[3px] border-l-indigo-500 dark:border-l-indigo-400"
          : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-[10px] font-bold text-indigo-500 dark:text-indigo-400">
          #{ref}
        </span>
        <span className={`text-[9px] font-bold ${severity.color}`}>
          {severity.label}
        </span>
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight mb-1 line-clamp-1">
        {dispute.listing?.title ?? t("unknownProperty")}
      </p>
      <div className="flex items-center gap-2 mb-2">
        <Avatar user={dispute.reporter} size="sm" />
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {dispute.reporter.firstName} {dispute.reporter.lastName}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
          {TYPE_LABELS[dispute.type] ?? dispute.type}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          <span className={`text-[10px] font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-2">
        {format(new Date(dispute.createdAt), "dd MMM yyyy", {
          locale: getDateLocale(),
        })}
      </p>
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminDisputesPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("Disputes");

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    action: "RESOLVE" | "REJECT" | null;
    disputeId?: string;
  }>({ isOpen: false, action: null });

  const {
    disputes,
    selectedDispute,
    loading,
    actionLoading,
    sendingMessage,
    search,
    tab,
    stats,
    totalActive,
    totalArchived,
    setSelectedDispute,
    setSearch,
    setTab,
    fetchDisputes,
    handleResolve,
    handleReject,
    handleSendMessage,
  } = useDisputes();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const openResolveModal = (disputeId: string) => {
    setModalState({
      isOpen: true,
      action: "RESOLVE",
      disputeId,
    });
  };

  const openRejectModal = (disputeId: string) => {
    setModalState({ isOpen: true, action: "REJECT", disputeId });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, action: null, disputeId: undefined });
  };

  const onResolve = async (id: string) => {
    await handleResolve(id);
    showToast("success", t("resolveSuccess"));
  };

  const onReject = async (id: string) => {
    await handleReject(id);
    showToast("success", t("rejectSuccess"));
  };

  const onSendMessage = async (
    id: string,
    content: string,
    replyTo: "BOTH" | "OWNER" | "TENANT",
  ) => {
    await handleSendMessage(id, content, replyTo);
  };

  const filtered = disputes.filter(
    (d) =>
      !search ||
      d.reporter.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      d.reporter.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      d.listing?.title?.toLowerCase().includes(search.toLowerCase()) ||
      (d.reference ?? d.id).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <DisputeActionModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        action={modalState.action}
        disputeId={modalState.disputeId}
        disputeTitle={selectedDispute?.listing?.title}
        onConfirm={async () => {
          if (modalState.action === "RESOLVE") {
            await onResolve(modalState.disputeId!);
          } else if (modalState.action === "REJECT") {
            await onReject(modalState.disputeId!);
          }
          closeModal();
        }}
        loading={actionLoading === modalState.disputeId}
      />

      <div className="flex-1 flex flex-col overflow-hidden p-5 md:p-6 gap-5">
        <div className="flex-shrink-0 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">
              {t("description")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 rounded-xl">
              <button
                onClick={() => {
                  setTab("active");
                  setSelectedDispute(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "active" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                {t("tabs.active")} ({totalActive})
              </button>
              <button
                onClick={() => {
                  setTab("archive");
                  setSelectedDispute(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "archive" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                {t("tabs.archived")} ({totalArchived})
              </button>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 grid grid-cols-3 lg:grid-cols-3 gap-4">
          {[
            {
              label: t("stats.open"),
              value: stats.open,
              grad: "from-red-400 to-rose-500",
              Icon: IoAlertCircleOutline,
              border: "border-red-100 dark:border-red-900/40",
              text: "text-red-600 dark:text-red-400",
            },
            {
              label: t("stats.inReview"),
              value: stats.inReview,
              grad: "from-amber-400 to-orange-500",
              Icon: IoTimeOutline,
              border: "border-amber-100 dark:border-amber-900/40",
              text: "text-amber-600 dark:text-amber-400",
            },
            {
              label: t("stats.resolved"),
              value: stats.resolved,
              grad: "from-emerald-400 to-teal-500",
              Icon: IoCheckmarkCircleOutline,
              border: "border-emerald-100 dark:border-emerald-900/40",
              text: "text-emerald-600 dark:text-emerald-400",
            },
            
          ].map(({ label, value, grad, Icon, border, text }) => (
            <div
              key={label}
              className={`bg-white dark:bg-slate-900 rounded-2xl border ${border} p-4 flex items-center gap-4 ${card3d}`}
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm flex-shrink-0`}
              >
                <Icon className="text-white text-lg" />
              </div>
              <div>
                <p className={`text-xl font-black leading-none ${text}`}>
                  {value}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-12 gap-5 min-h-0">
          <div
            className={`col-span-12 lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden flex flex-col ${block3d}`}
          >
            <div className="flex-shrink-0 p-3 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
              <div className="relative">
                <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-sm" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-700"
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-2 font-medium">
                {filtered.length} {t("disputesCount")}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner
                    fullScreen={false}
                    variant="spinner"
                    size="md"
                    color="primary"
                    text="Chargement..."
                    speed="normal"
                  />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300 dark:text-slate-700 gap-2">
                  <MdOutlineGavel className="text-4xl" />
                  <p className="text-xs">{t("noDisputes")}</p>
                </div>
              ) : (
                filtered.map((d) => (
                  <DisputeListItem
                    key={d.id}
                    dispute={d}
                    isSelected={selectedDispute?.id === d.id}
                    onClick={() => setSelectedDispute(d)}
                    t={t}
                    locale={locale}
                  />
                ))
              )}
            </div>
          </div>

          <div
            className={`col-span-12 lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden flex flex-col ${block3d}`}
          >
            {selectedDispute ? (
              <DisputeDetailPanel
                dispute={selectedDispute}
                onResolveClick={openResolveModal}
                onRejectClick={openRejectModal}
                actionLoading={actionLoading}
                onSendMessage={onSendMessage}
                sendingMessage={sendingMessage}
                t={t}
                locale={locale}
              />
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-300 dark:text-slate-700 gap-3">
                <MdOutlineGavel className="text-5xl" />
                <p className="text-sm text-slate-400 dark:text-slate-600">
                  {t("selectDispute")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}