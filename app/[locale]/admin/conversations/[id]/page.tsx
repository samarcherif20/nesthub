// app/[locale]/admin/conversations/[id]/page.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import {
  IoChevronForwardOutline,
  IoCheckmarkCircleOutline,
  IoSendOutline,
  IoChatbubbleOutline,
  IoCheckmarkDoneOutline,
  IoShieldOutline,
  IoSwapHorizontalOutline,
  IoLocationOutline,
  IoFlagOutline,
  IoRefreshOutline,
  IoTimeOutline,
  IoCallOutline,
  IoCardOutline,
} from "react-icons/io5";
import { useConversationDetail } from "./hooks/useConversationDetail";
import ConfirmActionModal from "@/components/ui/modals/ConfirmActionModal";

interface Toast {
  type: "success" | "error";
  message: string;
}

interface ConfirmModalState {
  isOpen: boolean;
  action: "FLAG" | "UNFLAG" | "CLOSE" | "REOPEN" | null;
  conversationId?: string;
  conversationTitle?: string;
}

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "fr";
  const conversationId = params.id as string;
  const t = useTranslations("ConversationDetail");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [openBlocked, setOpenBlocked] = useState(false);
  const [openLeak, setOpenLeak] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [modalState, setModalState] = useState<ConfirmModalState>({ isOpen: false, action: null });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const {
    conversation,
    loading,
    note,
    submitting,
    alert,
    setNote,
    setAlert,
    fetchConversation,
    handleAddNote,
    handleAction,
    cleanSystemMessage,
    getImageUrl,
  } = useConversationDetail(conversationId, showToast);

  // Convertir les Alert du hook en Toast
  useEffect(() => {
    if (alert) {
      showToast(alert.type === "success" ? "success" : "error", alert.message);
      setAlert(null);
    }
  }, [alert, setAlert]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (conversation) setTimeout(scrollToBottom, 100);
  }, [conversation]);

  const formatTime = (date: Date) => {
    return format(new Date(date), "HH:mm");
  };

  const openConfirmModal = (action: ConfirmModalState["action"]) => {
    setModalState({
      isOpen: true,
      action,
      conversationId: conversation?.id,
      conversationTitle: conversation?.listing?.title,
    });
  };

  const closeConfirmModal = () => {
    setModalState({ isOpen: false, action: null });
  };

  const handleConfirmAction = async () => {
    if (!modalState.action || !conversation) return;
    await handleAction(modalState.action);
    closeConfirmModal();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-slate-400 dark:text-slate-500">{t("notFound")}</p>
          <button
            onClick={() => router.push(`/${locale}/admin/moderation`)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            {t("backToList")}
          </button>
        </div>
      </div>
    );
  }

  const { owner, tenant } = conversation.participants;
  const isFlagged = conversation.isBlocked;
  const hasReports = conversation.reportCount > 0;

  const getScoreColor = (score: number) => {
    if (score >= 70) return "emerald";
    if (score >= 40) return "amber";
    return "red";
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success" 
                ? "bg-green-500 text-white" 
                : "bg-red-500 text-white"
            }`}
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

      {/* Confirm Action Modal */}
      <ConfirmActionModal
        isOpen={modalState.isOpen}
        onClose={closeConfirmModal}
        action={modalState.action}
        conversationId={modalState.conversationId}
        conversationTitle={modalState.conversationTitle}
        onConfirm={handleConfirmAction}
        loading={submitting}
      />

      {/* Breadcrumb */}
      <div className="flex-shrink-0 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-2">
            <Link
              href={`/${locale}/admin/moderation`}
              className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase text-[12px] font-bold tracking-wider"
            >
              {t("moderation")}
            </Link>
            <IoChevronForwardOutline className="text-slate-400 dark:text-slate-600 text-[12px]" />
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold uppercase text-[12px] tracking-wider">
              {t("conversationNumber")} {conversation.id.slice(-8)}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            {isFlagged && (
              <span className="px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-full text-[9px] font-medium flex items-center gap-1">
                <IoFlagOutline className="text-[9px]" /> {t("flagged")}
              </span>
            )}
            {hasReports && (
              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full text-[9px] font-medium">
                {conversation.reportCount} {t("reports")}
              </span>
            )}
            <button
              onClick={fetchConversation}
              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all bg-white dark:bg-slate-800"
            >
              <IoRefreshOutline className="text-xs" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* ══ LEFT — Conversation ══ */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          {/* Participants — STICKY */}
          <div className="flex-shrink-0 px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 overflow-hidden flex items-center justify-center">
                    {owner.avatar ? (
                      <img
                        src={getImageUrl(owner.avatar)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        {owner.firstName?.charAt(0) || "O"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {owner.fullName}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {t("owner")}
                    </p>
                  </div>
                </div>

                <IoSwapHorizontalOutline className="text-slate-400 dark:text-slate-500 text-sm" />

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 overflow-hidden flex items-center justify-center">
                    {tenant.avatar ? (
                      <img
                        src={getImageUrl(tenant.avatar)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        {tenant.firstName?.charAt(0) || "T"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {tenant.fullName}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {t("tenant")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded flex items-center gap-1">
                <IoLocationOutline className="text-[10px]" />
                <span className="truncate max-w-[200px]">
                  {conversation.listing.title?.substring(0, 35)}...
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 dark:bg-slate-800/30">
            {conversation.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <IoChatbubbleOutline className="text-5xl text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  {t("noMessages")}
                </p>
              </div>
            )}

            {conversation.messages.map((message) => {
              const isOwner = message.senderId === owner.id;
              const isSystem = message.isSystem;
              const displayContent = isSystem
                ? cleanSystemMessage(message.content)
                : message.content;

              if (isSystem) {
                return (
                  <div
                    key={message.id}
                    className="flex items-center justify-center py-2"
                  >
                    <div className="flex items-center gap-1.5 px-4 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-full">
                      <IoTimeOutline className="text-[9px] text-slate-400 dark:text-slate-500" />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {displayContent}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-3 max-w-[80%] ${!isOwner ? "ml-auto flex-row-reverse" : ""}`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {message.senderAvatar ? (
                      <img
                        src={getImageUrl(message.senderAvatar)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                        {message.senderName?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>

                  <div
                    className={`space-y-0.5 ${!isOwner ? "items-end flex flex-col" : ""}`}
                  >
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-[15px] leading-relaxed ${
                        !isOwner
                          ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-br-sm shadow-sm shadow-indigo-500/20"
                          : "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-200 dark:border-slate-600"
                      }`}
                    >
                      {displayContent}
                    </div>
                    <div
                      className={`flex items-center gap-1 px-1 ${!isOwner ? "flex-row-reverse" : ""}`}
                    >
                      <span className="text-[9px] text-slate-400 dark:text-slate-500">
                        {formatTime(new Date(message.createdAt))}
                      </span>
                      {message.isRead && (
                        <IoCheckmarkDoneOutline className="text-[9px] text-indigo-500 dark:text-indigo-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Note input */}
          <div className="flex-shrink-0 p-3 bg-white dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <IoChatbubbleOutline className="text-slate-400 dark:text-slate-500 text-sm flex-shrink-0" />
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  placeholder={t("notePlaceholder")}
                  className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <button
                onClick={handleAddNote}
                disabled={submitting || !note.trim()}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 text-sm active:scale-95 shadow-md shadow-indigo-500/20"
              >
                <IoSendOutline className="text-sm" />
                <span>{t("send")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══ RIGHT — Sidebar ══ */}
        <div className="w-80 flex-shrink-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-y-auto shadow-sm">
          <div className="p-5 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <IoShieldOutline className="text-lg" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t("aiTitle")}
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {t("aiSubtitle")}
                </p>
              </div>
            </div>

            {/* Reliability */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {t("reliabilityScores")}
              </h3>
              <div className="space-y-2">
                {[
                  {
                    user: owner,
                    descHigh: t("reliableUser"),
                    descMid: t("moderateScore"),
                    descLow: t("lowScore"),
                  },
                  {
                    user: tenant,
                    descHigh: t("exemplaryProfile"),
                    descMid: t("correctBehavior"),
                    descLow: t("toMonitor"),
                  },
                ].map(({ user, descHigh, descMid, descLow }) => {
                  const score = user.reliabilityScore || 0;
                  const color = getScoreColor(score);
                  const desc =
                    score >= 70 ? descHigh : score >= 40 ? descMid : descLow;
                  return (
                    <div
                      key={user.id}
                      className="bg-white dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {user.fullName}
                        </span>
                        <span
                          className={`text-xs font-bold text-${color}-600 dark:text-${color}-400`}
                        >
                          {score}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-${color}-500`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">
                        {desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* IA DETECTION */}
            <div>
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <IoShieldOutline className="text-base" />
                {t("iaAlerts")}
              </h3>
              <div className="space-y-3">
                
                {/* 1. MESSAGES BLOQUÉS */}
                {(() => {
                  const blockedMessages = conversation.messages.filter(
                    (m) => !m.isSystem && m.content.startsWith("[Message bloqué")
                  );
                  if (blockedMessages.length === 0) return null;
                  return (
                    <div className="bg-violet-50/50 dark:bg-violet-950/20 rounded-xl border border-violet-200 dark:border-violet-800/40 overflow-hidden">
                      <button
                        onClick={() => setOpenBlocked(!openBlocked)}
                        className="w-full p-3 flex items-center justify-between hover:bg-violet-100/40 dark:hover:bg-violet-900/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-violet-100 dark:bg-violet-900/40 rounded-full flex items-center justify-center">
                            <IoFlagOutline className="text-violet-500 text-sm" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                              {t("blockedMessages")}
                            </p>
                            <p className="text-[10px] text-violet-500">
                              {blockedMessages.length} {t("messagesBlocked")}
                            </p>
                          </div>
                        </div>
                        <IoChevronForwardOutline
                          className={`text-violet-400 text-sm transition-transform duration-200 ${openBlocked ? "rotate-90" : ""}`}
                        />
                      </button>
                      {openBlocked && (
                        <div className="px-3 pb-3 pt-0 border-t border-violet-100 dark:border-violet-800/40 space-y-2">
                          {blockedMessages.map((msg) => (
                            <div key={msg.id} className="bg-white/50 dark:bg-slate-800/30 p-2 rounded-lg">
                              <div className="flex justify-between items-start">
                                <p className="text-[10px] font-medium text-violet-700 dark:text-violet-400">
                                  {msg.senderName}
                                </p>
                                <span className="text-[9px] text-violet-400">
                                  {formatTime(new Date(msg.createdAt))}
                                </span>
                              </div>
                              <p className="text-[9px] text-violet-600 dark:text-violet-300 mt-0.5 italic">
                                {msg.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 2. FUITE DE COORDONNÉES */}
                {(() => {
                  const leakMessages = conversation.messages.filter(
                    (m) =>
                      !m.isSystem &&
                      !m.content.startsWith("[Message bloqué") &&
                      (m.content.includes("+216") ||
                        m.content.includes("00216") ||
                        /\b[2579]\d{7}\b/.test(m.content) ||
                        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(m.content) ||
                        m.content.toLowerCase().includes("whatsapp") ||
                        m.content.toLowerCase().includes("telegram"))
                  );
                  if (leakMessages.length === 0) return null;
                  return (
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40 overflow-hidden">
                      <button
                        onClick={() => setOpenLeak(!openLeak)}
                        className="w-full p-3 flex items-center justify-between hover:bg-amber-100/40 dark:hover:bg-amber-900/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center">
                            <IoCallOutline className="text-amber-500 text-sm" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                              {t("coordinateLeaks")}
                            </p>
                            <p className="text-[10px] text-amber-500">
                              {leakMessages.length} {t("attempts")}
                            </p>
                          </div>
                        </div>
                        <IoChevronForwardOutline
                          className={`text-amber-400 text-sm transition-transform duration-200 ${openLeak ? "rotate-90" : ""}`}
                        />
                      </button>
                      {openLeak && (
                        <div className="px-3 pb-3 pt-0 border-t border-amber-100 dark:border-amber-800/40 space-y-2">
                          {leakMessages.map((msg) => (
                            <div key={msg.id} className="bg-white/50 dark:bg-slate-800/30 p-2 rounded-lg">
                              <div className="flex justify-between items-start">
                                <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
                                  {msg.senderName}
                                </p>
                                <span className="text-[9px] text-amber-400">
                                  {formatTime(new Date(msg.createdAt))}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-600 dark:text-slate-400 mt-0.5">
                                {msg.content.length > 100 ? msg.content.substring(0, 100) + "..." : msg.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 3. PAIEMENT EXTERNE */}
                {(() => {
                  const paymentMessages = conversation.messages.filter(
                    (m) =>
                      !m.isSystem &&
                      !m.content.startsWith("[Message bloqué") &&
                      (m.content.toLowerCase().includes("paypal") ||
                        m.content.toLowerCase().includes("western") ||
                        m.content.toLowerCase().includes("virement") ||
                        m.content.includes("hors plateforme") ||
                        m.content.includes("barra"))
                  );
                  if (paymentMessages.length === 0) return null;
                  return (
                    <div className="bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800/40 overflow-hidden">
                      <button
                        onClick={() => setOpenPayment(!openPayment)}
                        className="w-full p-3 flex items-center justify-between hover:bg-purple-100/40 dark:hover:bg-purple-900/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
                            <IoCardOutline className="text-purple-500 text-sm" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                              {t("suspiciousPayment")}
                            </p>
                            <p className="text-[10px] text-purple-500">
                              {paymentMessages.length} {t("attempts")}
                            </p>
                          </div>
                        </div>
                        <IoChevronForwardOutline
                          className={`text-purple-400 text-sm transition-transform duration-200 ${openPayment ? "rotate-90" : ""}`}
                        />
                      </button>
                      {openPayment && (
                        <div className="px-3 pb-3 pt-0 border-t border-purple-100 dark:border-purple-800/40 space-y-2">
                          {paymentMessages.map((msg) => (
                            <div key={msg.id} className="bg-white/50 dark:bg-slate-800/30 p-2 rounded-lg">
                              <div className="flex justify-between items-start">
                                <p className="text-[10px] font-medium text-purple-700 dark:text-purple-400">
                                  {msg.senderName}
                                </p>
                                <span className="text-[9px] text-purple-400">
                                  {formatTime(new Date(msg.createdAt))}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-600 dark:text-slate-400 mt-0.5">
                                {msg.content.length > 100 ? msg.content.substring(0, 100) + "..." : msg.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 4. AUCUNE ALERTE */}
                {conversation.messages.filter(
                  (m) =>
                    !m.isSystem &&
                    (m.content.startsWith("[Message bloqué") ||
                      m.content.includes("+216") ||
                      /\b[2579]\d{7}\b/.test(m.content) ||
                      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(m.content) ||
                      m.content.toLowerCase().includes("whatsapp") ||
                      m.content.toLowerCase().includes("paypal"))
                ).length === 0 && (
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                    <div className="flex items-center gap-2 p-3">
                      <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
                        <IoCheckmarkCircleOutline className="text-emerald-500 text-sm" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          {t("noAlerts")}
                        </p>
                        <p className="text-[10px] text-emerald-500">
                          {t("conversationSecure")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {t("quickActions")}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                
                <button
                  onClick={() => openConfirmModal(isFlagged ? "UNFLAG" : "FLAG")}
                  className={`w-full py-2 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-md ${
                    isFlagged
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                      : "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                  }`}
                >
                  <IoFlagOutline className="text-sm" />
                  {isFlagged ? t("unflag") : t("flag")}
                </button>

                <button
                  onClick={() => openConfirmModal("CLOSE")}
                  className="w-full py-2 rounded-full bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-md shadow-slate-700/20"
                >
                  <IoCheckmarkCircleOutline className="text-sm" />
                  {t("close")}
                </button>

                {conversation.status !== "OPEN" && (
                  <button
                    onClick={() => openConfirmModal("REOPEN")}
                    className="w-full py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <IoRefreshOutline className="text-sm" />
                    {t("reopen")}
                  </button>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}