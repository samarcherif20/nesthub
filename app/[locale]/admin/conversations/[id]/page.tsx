// app/[locale]/admin/conversations/[id]/page.tsx
"use client";

import { useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertBanner from "@/components/ui/Alert";
import {
  IoChevronForwardOutline,
  IoWarningOutline,
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
} from "react-icons/io5";
import { useConversationDetail } from "./hooks/useConversationDetail";

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const t = useTranslations("ConversationDetail");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  } = useConversationDetail(conversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (conversation) setTimeout(scrollToBottom, 100);
  }, [conversation]);

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
            onClick={() => router.push("/admin/moderation")}
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

  // Fonction pour obtenir la classe de couleur en fonction du score
  const getScoreColor = (score: number) => {
    if (score >= 70) return "emerald";
    if (score >= 40) return "amber";
    return "red";
  };

  return (
    <div className="h-full flex flex-col">
      {alert && (
        <div className="fixed top-20 right-8 z-50">
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex-shrink-0 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-2">
            <Link
              href="/admin/moderation"
              className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase text-[10px] font-bold tracking-wider"
            >
              {t("moderation")}
            </Link>
            <IoChevronForwardOutline className="text-slate-400 dark:text-slate-600 text-[9px]" />
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold uppercase text-[10px] tracking-wider">
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
                      <img src={getImageUrl(owner.avatar)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        {owner.firstName?.charAt(0) || "O"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{owner.fullName}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{t("owner")}</p>
                  </div>
                </div>

                <IoSwapHorizontalOutline className="text-slate-400 dark:text-slate-500 text-sm" />

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 overflow-hidden flex items-center justify-center">
                    {tenant.avatar ? (
                      <img src={getImageUrl(tenant.avatar)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        {tenant.firstName?.charAt(0) || "T"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{tenant.fullName}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{t("tenant")}</p>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded flex items-center gap-1">
                <IoLocationOutline className="text-[10px]" />
                <span className="truncate max-w-[200px]">{conversation.listing.title?.substring(0, 35)}...</span>
              </div>
            </div>
          </div>

          {/* Messages — SEULE PARTIE QUI SCROLL */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 dark:bg-slate-800/30">
            {conversation.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <IoChatbubbleOutline className="text-5xl text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-slate-400 dark:text-slate-500">{t("noMessages")}</p>
              </div>
            )}

            {conversation.messages.map((message) => {
              const isOwner = message.senderId === owner.id;
              const isSystem = message.isSystem;
              const displayContent = isSystem ? cleanSystemMessage(message.content) : message.content;

              if (isSystem) {
                return (
                  <div key={message.id} className="flex items-center justify-center py-2">
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
                      <img src={getImageUrl(message.senderAvatar)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                        {message.senderName?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>

                  <div className={`space-y-0.5 ${!isOwner ? "items-end flex flex-col" : ""}`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-[15px] leading-relaxed ${
                      !isOwner
                        ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-br-sm shadow-sm shadow-indigo-500/20"
                        : "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-200 dark:border-slate-600"
                    }`}>
                      {displayContent}
                    </div>
                    <div className={`flex items-center gap-1 px-1 ${!isOwner ? "flex-row-reverse" : ""}`}>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500">
                        {format(new Date(message.createdAt), "HH:mm", { locale: fr })}
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

          {/* Note input — STICKY at bottom */}
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
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t("aiTitle")}</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{t("aiSubtitle")}</p>
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
                  const desc = score >= 70 ? descHigh : score >= 40 ? descMid : descLow;
                  return (
                    <div key={user.id} className="bg-white dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{user.fullName}</span>
                        <span className={`text-xs font-bold text-${color}-600 dark:text-${color}-400`}>{score}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-${color}-500`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">{desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alerts */}
            {hasReports && (
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {t("detectedAlerts")}
                </h3>
                <div className="space-y-2">
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-xl flex items-start gap-2">
                    <IoWarningOutline className="text-red-600 dark:text-red-400 text-sm mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400">{t("userReport")}</p>
                      <p className="text-[9px] text-red-600 dark:text-red-400/80 mt-0.5">{t("reportedCount", { count: conversation.reportCount })}</p>
                    </div>
                  </div>
                  {isFlagged && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 rounded-xl flex items-start gap-2">
                      <IoShieldOutline className="text-amber-600 dark:text-amber-400 text-sm mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{t("blockedConversation")}</p>
                        <p className="text-[9px] text-amber-600 dark:text-amber-400/80 mt-0.5">{t("suspendedByModerator")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {conversation.notes && conversation.notes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("internalNotes")}
                  </h3>
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                    {conversation.notes.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {conversation.notes.slice(0, 3).map((n) => (
                    <div key={n.id} className="bg-white dark:bg-slate-800/50 p-2.5 rounded-lg border-l-2 border-indigo-500 shadow-sm">
                      <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">{n.content}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[8px] font-medium text-slate-500 dark:text-slate-400">{n.adminName}</span>
                        <span className="text-[8px] text-slate-400 dark:text-slate-500">{format(new Date(n.createdAt), "dd/MM HH:mm", { locale: fr })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {t("quickActions")}
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleAction(isFlagged ? "UNFLAG" : "FLAG")}
                  className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 active:scale-95 ${
                    isFlagged
                      ? "bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/30 border border-amber-200 dark:border-amber-500/30"
                      : "bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/30 border border-red-200 dark:border-red-500/30"
                  }`}
                >
                  <IoFlagOutline className="text-sm" />
                  {isFlagged ? t("removeFlag") : t("flag")}
                </button>
                <button
                  onClick={() => handleAction("CLOSE")}
                  className="w-full py-2 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-lg text-xs font-bold uppercase tracking-wide transition-all hover:bg-indigo-100 dark:hover:bg-indigo-500/30 flex items-center justify-center gap-2 active:scale-95"
                >
                  <IoCheckmarkCircleOutline className="text-sm" />
                  {t("close")}
                </button>
                {conversation.status !== "OPEN" && (
                  <button
                    onClick={() => handleAction("REOPEN")}
                    className="w-full py-2 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-lg text-xs font-bold uppercase tracking-wide transition-all hover:bg-emerald-100 dark:hover:bg-emerald-500/30 flex items-center justify-center gap-2 active:scale-95"
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