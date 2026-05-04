// app/[locale]/admin/disputes/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";
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
  IoRefreshOutline,
  IoImageOutline,
} from "react-icons/io5";
import { MdOutlineGavel } from "react-icons/md";

// ─── Design tokens (VOTRE THEME) ─────────────────────────────────────────────
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

// ─── Avatar (avec votre thème) ────────────────────────────────────────────────
function Avatar({ user, size = "md" }: {
  user: { firstName: string; lastName: string; image?: string };
  size?: "sm" | "md" | "lg";
}) {
  const [err, setErr] = useState(false);
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : size === "lg" ? "w-12 h-12 text-base" : "w-9 h-9 text-xs";
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`;
  return (
    <div className={`${sz} rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center`}>
      {user.image && !err ? (
        <img src={pipAvatar(user.image)} alt="" className="w-full h-full object-cover" onError={() => setErr(true)} />
      ) : (
        <span className="font-bold text-indigo-600 dark:text-indigo-400">{initials}</span>
      )}
    </div>
  );
}

// ─── Evidence lightbox ─────────────────────────────────────────────────────────
function EvidenceGallery({ images, t }: { images?: string[]; t: any }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  if (!images?.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setSelected(img)}
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
      {selected && (
        <div
          className="fixed inset-0 bg-black/85 z-[70] flex items-center justify-center p-6"
          onClick={() => setSelected(null)}
        >
          <button
            onClick={() => setSelected(null)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <IoCloseOutline className="text-xl" />
          </button>
          <img
            src={pipEvidence(selected)}
            alt={t("enlargedEvidence")}
            className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

// ─── Detail panel (AVEC VOTRE THEME) ──────────────────────────────────────────
function DisputeDetailPanel({
  dispute,
  onResolve,
  onReject,
  actionLoading,
  onSendMessage,
  sendingMessage,
  t,
}: any) {
  const [newMessage, setNewMessage] = useState("");
  const [resolveAmount, setResolveAmount] = useState<string>(dispute.refundAmount?.toString() ?? "");
  const [showResolveInput, setShowResolveInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = actionLoading === dispute.id;
  const canAct = dispute.status === "OPEN" || dispute.status === "IN_REVIEW";
  const ref = dispute.reference?.slice(-8) ?? dispute.id.slice(-8);

  const STATUS: Record<string, { label: string; dot: string; text: string; bg: string }> = {
    OPEN: { label: t("status.open"), dot: "bg-red-500 animate-pulse", text: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30" },
    IN_REVIEW: { label: t("status.inReview"), dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
    RESOLVED: { label: t("status.resolved"), dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    REJECTED: { label: t("status.rejected"), dot: "bg-slate-400", text: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
  };

  const SEVERITY: Record<string, { label: string; color: string; bg: string }> = {
    HIGH: { label: t("severity.high"), color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950/40" },
    MEDIUM: { label: t("severity.medium"), color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950/40" },
    LOW: { label: t("severity.low"), color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950/40" },
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

  const statusCfg = STATUS[dispute.status] ?? STATUS.OPEN;
  const sevCfg = SEVERITY[dispute.severity] ?? SEVERITY.LOW;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dispute.messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(dispute.id, newMessage);
    setNewMessage("");
  };

  const handleResolve = () => {
    const amt = parseFloat(resolveAmount);
    onResolve(dispute.id, isNaN(amt) ? undefined : amt);
    setShowResolveInput(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-sky-500 to-violet-500">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-lg">
                #{ref}
              </span>
              <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusCfg.bg} ${statusCfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${sevCfg.bg} ${sevCfg.color}`}>
                {t("severityLabel")} {sevCfg.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {TYPE_LABELS[dispute.type] ?? dispute.type}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight truncate">
              {dispute.listing?.title ?? t("unknownProperty")}
            </h3>
            {dispute.listing?.location && (
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">{dispute.listing.location}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <Avatar user={dispute.reporter} size="md" />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {dispute.reporter.firstName} {dispute.reporter.lastName}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-600">
              {t("openedOn")} {format(new Date(dispute.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {dispute.booking && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t("checkIn"), value: format(new Date(dispute.booking.checkIn), "dd MMM yyyy", { locale: fr }) },
              { label: t("checkOut"), value: format(new Date(dispute.booking.checkOut), "dd MMM yyyy", { locale: fr }) },
              { label: t("totalAmount"), value: `${dispute.booking.totalPrice.toLocaleString("fr-FR")} TND` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-1">{label}</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
        )}

        {dispute.refundAmount && (
          <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/40">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-0.5">{t("refundRequested")}</p>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400">
                {dispute.refundAmount.toLocaleString("fr-FR")} TND
              </p>
            </div>
            <IoWalletOutline className="text-4xl text-amber-300 dark:text-amber-800" />
          </div>
        )}

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2">{t("description")}</p>
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
              {dispute.description || t("noDescription")}
            </p>
          </div>
        </div>

        {dispute.evidence && dispute.evidence.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2">
              {t("evidence")} ({dispute.evidence.length})
            </p>
            <EvidenceGallery images={dispute.evidence} t={t} />
          </div>
        )}

        {dispute.resolution && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">{t("resolution")}</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">{dispute.resolution}</p>
            {dispute.resolvedAmount && (
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                {t("refundGranted")} : {dispute.resolvedAmount.toLocaleString("fr-FR")} TND
              </p>
            )}
          </div>
        )}

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-3">
            {t("conversation")} ({dispute.messages.length} {t("messageCount")})
          </p>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {dispute.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-300 dark:text-slate-700">
                <IoChatbubbleOutline className="text-3xl mb-2" />
                <p className="text-xs">{t("noMessages")}</p>
              </div>
            ) : (
              dispute.messages.map((msg: any) => {
                const isAdmin = msg.senderRole === "ADMIN";
                const roleLabel = msg.senderRole === "OWNER" ? t("owner") : msg.senderRole === "TENANT" ? t("tenant") : t("admin");
                return (
                  <div key={msg.id} className={`flex flex-col gap-1 ${isAdmin ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isAdmin
                        ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-tr-sm"
                        : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-sm"
                    }`}>
                      <p className={`text-[10px] font-bold mb-1 ${isAdmin ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}>
                        {msg.senderName} · {roleLabel}
                      </p>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 px-1">
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

      <div className="flex-shrink-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={t("replyAsAdmin")}
            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={sendingMessage || !newMessage.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-40 flex-shrink-0"
          >
            {sendingMessage ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin block" />
            ) : (
              <IoSendOutline className="text-sm" />
            )}
          </button>
        </div>

        {canAct && (
          <div className="space-y-2">
            {showResolveInput ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={resolveAmount}
                    onChange={(e) => setResolveAmount(e.target.value)}
                    placeholder={t("refundAmountPlaceholder")}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <button
                  onClick={handleResolve}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isLoading ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin block" /> : <IoCheckmarkCircleOutline className="text-sm" />}
                  {t("confirm")}
                </button>
                <button
                  onClick={() => setShowResolveInput(false)}
                  className="p-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <IoCloseOutline className="text-base" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowResolveInput(true)}
                  disabled={isLoading}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <IoCheckmarkCircleOutline className="text-sm" />
                  {t("resolve")}
                </button>
                <button
                  onClick={() => onReject(dispute.id)}
                  disabled={isLoading}
                  className="py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <IoCloseCircleOutline className="text-sm" />
                  {t("reject")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dispute list item (AVEC VOTRE THEME) ──────────────────────────────────────
function DisputeListItem({
  dispute,
  isSelected,
  onClick,
  t,
}: any) {
  const STATUS: Record<string, { label: string; dot: string; text: string; bg: string }> = {
    OPEN: { label: t("status.open"), dot: "bg-red-500 animate-pulse", text: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30" },
    IN_REVIEW: { label: t("status.inReview"), dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
    RESOLVED: { label: t("status.resolved"), dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    REJECTED: { label: t("status.rejected"), dot: "bg-slate-400", text: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
  };

  const SEVERITY: Record<string, { label: string; color: string; bg: string }> = {
    HIGH: { label: t("severity.high"), color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950/40" },
    MEDIUM: { label: t("severity.medium"), color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950/40" },
    LOW: { label: t("severity.low"), color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950/40" },
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

  const statusCfg = STATUS[dispute.status] ?? STATUS.OPEN;
  const sevCfg = SEVERITY[dispute.severity] ?? SEVERITY.LOW;
  const ref = dispute.reference?.slice(-8) ?? dispute.id.slice(-8);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group ${
        isSelected
          ? "bg-indigo-50/60 dark:bg-indigo-950/20 border-l-[3px] border-l-indigo-500 dark:border-l-indigo-400 pl-[13px]"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <span className="font-mono text-[10px] font-bold text-indigo-500 dark:text-indigo-400">#{ref}</span>
        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${sevCfg.bg} ${sevCfg.color}`}>
          {sevCfg.label}
        </span>
      </div>
      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight mb-1.5 line-clamp-1">
        {dispute.listing?.title ?? t("unknownProperty")}
      </p>
      <div className="flex items-center gap-2 mb-2.5">
        <Avatar user={dispute.reporter} size="sm" />
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {dispute.reporter.firstName} {dispute.reporter.lastName}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
          {TYPE_LABELS[dispute.type] ?? dispute.type}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          <span className={`text-[10px] font-bold ${statusCfg.text}`}>{statusCfg.label}</span>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-2">
        {format(new Date(dispute.createdAt), "dd MMM yyyy", { locale: fr })}
      </p>
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminDisputesPage() {
  const t = useTranslations("Disputes");
  const { getToken } = useAuth();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [stats, setStats] = useState({ open: 0, inReview: 0, resolved: 0, rejected: 0, totalRefund: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"active" | "archive">("active");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = await getToken({ template: "my-app-template" });
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers ?? {}),
        },
      });
    },
    [getToken]
  );

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const status = tab === "active" ? "OPEN,IN_REVIEW" : "RESOLVED,REJECTED";
      const params = new URLSearchParams({ status, ...(search && { search }) });
      const [dRes, sRes] = await Promise.all([
        authFetch(`/api/admin/disputes?${params}`),
        authFetch("/api/admin/disputes/stats"),
      ]);
      if (dRes.ok) {
        const data = await dRes.json();
        const list = data.disputes ?? [];
        setDisputes(list);
        if (list.length > 0 && !selectedDispute) setSelectedDispute(list[0]);
      }
      if (sRes.ok) setStats(await sRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [authFetch, tab, search, selectedDispute]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const handleResolve = async (id: string, amount?: number) => {
    setActionLoading(id);
    try {
      const res = await authFetch(`/api/admin/disputes/${id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ resolvedAmount: amount }),
      });
      if (res.ok) {
        setAlert({ type: "success", message: t("resolveSuccess") });
        await fetchDisputes();
      } else {
        setAlert({ type: "error", message: t("resolveError") });
      }
    } catch {
      setAlert({ type: "error", message: t("connectionError") });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await authFetch(`/api/admin/disputes/${id}/reject`, { method: "POST" });
      if (res.ok) {
        setAlert({ type: "success", message: t("rejectSuccess") });
        await fetchDisputes();
      } else {
        setAlert({ type: "error", message: t("rejectError") });
      }
    } catch {
      setAlert({ type: "error", message: t("connectionError") });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendMessage = async (id: string, content: string) => {
    setSendingMessage(true);
    try {
      const res = await authFetch(`/api/admin/disputes/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const newMsg = {
          id: Date.now().toString(),
          content,
          createdAt: new Date().toISOString(),
          senderName: "Admin",
          senderRole: "ADMIN",
        };
        setDisputes((p) => p.map((d) => d.id === id ? { ...d, messages: [...d.messages, newMsg] } : d));
        setSelectedDispute((p) => p?.id === id ? { ...p, messages: [...(p.messages ?? []), newMsg] } : p);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingMessage(false);
    }
  };

  const filtered = disputes.filter(
    (d) =>
      !search ||
      d.reporter.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      d.reporter.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      d.listing?.title?.toLowerCase().includes(search.toLowerCase()) ||
      (d.reference ?? d.id).toLowerCase().includes(search.toLowerCase())
  );

  const totalActive = stats.open + stats.inReview;

  return (
    <div className="h-full flex flex-col overflow-hidden ">
      {alert && (
        <div className="fixed top-5 right-5 z-[60] w-full max-w-sm">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden p-5 md:p-6 gap-5">

        {/* Header */}
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
            <button
              onClick={fetchDisputes}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all text-sm font-medium"
            >
              <IoRefreshOutline className="text-base" />
              {t("refresh")}
            </button>
            <div className="flex gap-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 rounded-xl">
              <button
                onClick={() => { setTab("active"); setSelectedDispute(null); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "active" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                {t("tabs.active")} ({totalActive})
              </button>
              <button
                onClick={() => { setTab("archive"); setSelectedDispute(null); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "archive" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                {t("tabs.archived")} ({stats.resolved + stats.rejected})
              </button>
            </div>
          </div>
        </div>

        {/* KPI cards - AVEC VOS ICONES ET VOTRE THEME */}
        <div className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t("stats.open"), value: stats.open, grad: "from-red-400 to-rose-500", Icon: IoAlertCircleOutline, border: "border-red-100 dark:border-red-900/40", text: "text-red-600 dark:text-red-400" },
            { label: t("stats.inReview"), value: stats.inReview, grad: "from-amber-400 to-orange-500", Icon: IoTimeOutline, border: "border-amber-100 dark:border-amber-900/40", text: "text-amber-600 dark:text-amber-400" },
            { label: t("stats.resolved"), value: stats.resolved, grad: "from-emerald-400 to-teal-500", Icon: IoCheckmarkCircleOutline, border: "border-emerald-100 dark:border-emerald-900/40", text: "text-emerald-600 dark:text-emerald-400" },
            { label: t("stats.refunds"), value: `${stats.totalRefund.toLocaleString("fr-FR")} TND`, grad: "from-indigo-500 to-violet-600", Icon: IoWalletOutline, border: "border-indigo-100 dark:border-indigo-900/40", text: "text-indigo-600 dark:text-indigo-400" },
          ].map(({ label, value, grad, Icon, border, text }) => (
            <div key={label} className={`bg-white dark:bg-slate-900 rounded-2xl border ${border} p-4 flex items-center gap-4 ${card3d}`}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm flex-shrink-0`}>
                <Icon className="text-white text-lg" />
              </div>
              <div>
                <p className={`text-xl font-black leading-none ${text}`}>{value}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main 2-col layout */}
        <div className="flex-1 grid grid-cols-12 gap-5 min-h-0">

          {/* List column */}
          <div className={`col-span-12 lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden flex flex-col ${block3d}`}>
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
                  <LoadingSpinner fullScreen={false} variant="spinner" size="md" color="primary" text="Chargement..." speed="normal" />
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
                  />
                ))
              )}
            </div>
          </div>

          {/* Detail column */}
          <div className={`col-span-12 lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden flex flex-col ${block3d}`}>
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