// app/[locale]/admin/conversations/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoBookOutline,
  IoSendOutline,
  IoChatbubbleOutline,
  IoCallOutline,
  IoShieldOutline,
  IoSwapHorizontalOutline,
  IoChevronForwardOutline,
  IoHomeOutline,
  IoArrowBackOutline,
  IoLocationOutline,
} from "react-icons/io5";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertBanner from "@/components/ui/Alert";

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  isRead: boolean;
  isSystem: boolean;
}

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string | null;
  role: "OWNER" | "TENANT";
  reliabilityScore: number;
}

interface ConversationDetail {
  id: string;
  listing: {
    id: string;
    title: string;
    reference: string;
  };
  participants: {
    owner: Participant;
    tenant: Participant;
  };
  messages: Message[];
  status: string;
  isBlocked: boolean;
  reportCount: number;
  notes?: AdminNote[];
  createdAt: Date;
  updatedAt: Date;
}

interface AdminNote {
  id: string;
  content: string;
  createdAt: Date;
  adminName: string;
}

const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (
    url.includes("vercel-storage.com") ||
    url.includes("googleusercontent.com")
  ) {
    return `/api/admin/serve-image?url=${encodeURIComponent(url)}`;
  }
  return url;
};

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const { getToken } = useAuth();
  const [conversation, setConversation] = useState<ConversationDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showAlert = (type: "success" | "error" | "info", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch(`/api/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setConversation(data);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error(error);
      showAlert("error", "Erreur lors du chargement de la conversation");
    } finally {
      setLoading(false);
    }
  }, [getToken, conversationId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setSubmitting(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch(
        `/api/admin/conversations/${conversationId}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: note }),
        },
      );

      if (!response.ok) throw new Error("Erreur lors de l'ajout de la note");

      showAlert("success", "Note ajoutée avec succès");
      setNote("");
      fetchConversation();
    } catch (error) {
      console.error(error);
      showAlert("error", "Erreur lors de l'ajout de la note");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      const token = await getToken({ template: "my-app-template" });

      // Vérifie que conversationId existe
      console.log("conversationId:", conversationId);

      const response = await fetch(`/api/admin/conversations`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: conversationId, // Assure-toi que c'est bien défini
          action: action,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'action");
      }

      showAlert("success", `Action "${action}" effectuée avec succès`);
      fetchConversation();
    } catch (error) {
      console.error(error);
      showAlert("error", "Erreur lors de l'action");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-slate-950">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center">
          <p className="text-slate-500">Conversation non trouvée</p>
          <button
            onClick={() => router.push("/admin/moderation")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const { owner, tenant } = conversation.participants;
  const isFlagged = conversation.isBlocked;
  const hasReports = conversation.reportCount > 0;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
      {alert && (
        <div className="fixed top-20 right-8 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/admin/moderation"
              className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
            >
              <span>MODÉRATION</span>
            </Link>
            <IoChevronForwardOutline className="text-slate-400 text-xs" />
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
              CONVERSATION N°: {conversation.id.slice(-8)}
            </span>
          </nav>

          <div className="flex gap-2">
            {isFlagged && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-medium flex items-center gap-1">
                <IoWarningOutline className="text-xs" /> SIGNALEE
              </span>
            )}
            {hasReports && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-medium">
                {conversation.reportCount} signalement(s)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Corps principal - 2 colonnes */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* COLONNE DE GAUCHE - CONVERSATION */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-[#f9f9ff] dark:bg-slate-900/30">
          {/* En-tête participants - FIXE */}
          <div className="flex-shrink-0 px-6 py-3 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 overflow-hidden flex items-center justify-center">
                    {owner.avatar ? (
                      <img
                        src={getImageUrl(owner.avatar)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-indigo-600 font-bold text-xs">
                        {owner.firstName?.charAt(0) || "O"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {owner.fullName}
                    </p>
                    <p className="text-[10px] text-slate-500">Propriétaire</p>
                  </div>
                </div>
                <IoSwapHorizontalOutline className="text-slate-300 text-sm" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 overflow-hidden flex items-center justify-center">
                    {tenant.avatar ? (
                      <img
                        src={getImageUrl(tenant.avatar)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-indigo-600 font-bold text-xs">
                        {tenant.firstName?.charAt(0) || "T"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {tenant.fullName}
                    </p>
                    <p className="text-[10px] text-slate-500">Locataire</p>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex items-center gap-1">
                <IoLocationOutline className="text-[10px]" />
                <span>{conversation.listing.title?.substring(0, 35)}...</span>
              </div>
            </div>
          </div>

          {/* ZONE DES MESSAGES - SEULE QUI SCROLL */}
          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4 space-y-4">
            {conversation.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <IoChatbubbleOutline className="text-5xl text-slate-300 mb-4" />
                <p className="text-base text-slate-400">Aucun message</p>
              </div>
            )}

            {conversation.messages.map((message) => {
              const isOwner = message.senderId === owner.id;
              const isSystem = message.isSystem;

              if (isSystem) {
                return (
                  <div
                    key={message.id}
                    className="flex items-center justify-center gap-3 py-2"
                  >
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {message.content}
                    </span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-3 max-w-[85%] ${!isOwner ? "ml-auto flex-row-reverse" : ""}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {message.senderAvatar ? (
                      <img
                        src={getImageUrl(message.senderAvatar)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-indigo-600 font-bold text-xs">
                        {message.senderName?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>
                  <div
                    className={`space-y-1 ${!isOwner ? "items-end flex flex-col" : ""}`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-xl shadow-sm ${
                        !isOwner
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <p className="text-base leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-[10px] text-slate-400">
                        {format(new Date(message.createdAt), "HH:mm", {
                          locale: fr,
                        })}
                      </span>
                      {message.isRead && (
                        <IoCallOutline className="text-[9px] text-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input note - FIXE EN BAS */}
          <div className="flex-shrink-0 p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <IoChatbubbleOutline className="text-slate-400 text-base" />
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  placeholder="Ajouter une note de modération..."
                  className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={handleAddNote}
                disabled={submitting || !note.trim()}
                className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IoSendOutline className="text-base" />
                <span className="text-xs font-bold">Envoyer</span>
              </button>
            </div>
          </div>
        </div>

        {/* COLONNE DE DROITE - SIDEBAR STYLE INSPIRATION */}
        <div className="w-96 flex-shrink-0 bg-slate-50/80 dark:bg-slate-900/50 border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <IoShieldOutline className="text-xl" />
              </div>
              <div>
                <h2 className="text-md font-bold text-slate-900 dark:text-white leading-tight">
                  Intelligence Modération
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Analyse temps réel activée
                </p>
              </div>
            </div>

            {/* Reliability Scores */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Scores de Fiabilité
              </h3>
              <div className="space-y-3">
                {/* Owner Score */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {owner.fullName}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        (owner.reliabilityScore || 0) >= 70
                          ? "text-emerald-600"
                          : (owner.reliabilityScore || 0) >= 40
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    >
                      {owner.reliabilityScore || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (owner.reliabilityScore || 0) >= 70
                          ? "bg-emerald-500"
                          : (owner.reliabilityScore || 0) >= 40
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${owner.reliabilityScore || 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {owner.reliabilityScore && owner.reliabilityScore >= 70
                      ? "Utilisateur fiable. Historique sans incident majeur."
                      : owner.reliabilityScore && owner.reliabilityScore >= 40
                        ? "Score modéré. Surveillance recommandée."
                        : "Score bas. Vigilance accrue nécessaire."}
                  </p>
                </div>

                {/* Tenant Score */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {tenant.fullName}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        (tenant.reliabilityScore || 0) >= 70
                          ? "text-emerald-600"
                          : (tenant.reliabilityScore || 0) >= 40
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    >
                      {tenant.reliabilityScore || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (tenant.reliabilityScore || 0) >= 70
                          ? "bg-emerald-500"
                          : (tenant.reliabilityScore || 0) >= 40
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${tenant.reliabilityScore || 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {tenant.reliabilityScore && tenant.reliabilityScore >= 70
                      ? "Utilisateur vérifié. Historique sans incident."
                      : tenant.reliabilityScore && tenant.reliabilityScore >= 40
                        ? "Comportement généralement correct."
                        : "Signalements antérieurs. À surveiller."}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Alerts / Signalements */}
            {hasReports && (
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Alertes Détectées
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800">
                    <IoWarningOutline className="text-red-500 text-sm mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-900 dark:text-red-300 leading-tight">
                        Signalement utilisateur
                      </p>
                      <p className="text-[10px] text-red-700 dark:text-red-400 mt-1">
                        Cette conversation a été signalée{" "}
                        {conversation.reportCount} fois par des utilisateurs.
                      </p>
                    </div>
                  </div>
                  {isFlagged && (
                    <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800">
                      <IoShieldOutline className="text-amber-500 text-sm mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-900 dark:text-amber-300 leading-tight">
                          Conversation bloquée
                        </p>
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
                          Cette conversation a été suspendue par un modérateur.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes Internes */}
            {conversation.notes && conversation.notes.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Notes Internes
                  </h3>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-bold">
                    {conversation.notes.length} NOTE
                    {conversation.notes.length > 1 ? "S" : ""}
                  </span>
                </div>
                <div className="space-y-3">
                  {conversation.notes.slice(0, 3).map((note) => (
                    <div
                      key={note.id}
                      className="bg-white dark:bg-slate-800/50 p-3 rounded-lg border-l-4 border-indigo-500 shadow-sm"
                    >
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-normal">
                        {note.content}
                      </p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                          {note.adminName}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 italic">
                          {format(
                            new Date(note.createdAt),
                            "dd/MM/yyyy HH:mm",
                            { locale: fr },
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Rapides */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Actions Rapides
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleAction(isFlagged ? "UNFLAG" : "FLAG")}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 shadow-sm ${
                    isFlagged
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                      : "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                  }`}
                >
                  <IoBookOutline className="text-sm" />
                  {isFlagged
                    ? "Retirer le signalement"
                    : "Suspendre la conversation"}
                </button>

                <button
                  onClick={() => handleAction("CLOSE")}
                  className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/20"
                >
                  <IoCheckmarkCircleOutline className="text-sm" />
                  Clôturer le signalement
                </button>

                {conversation.status !== "OPEN" && (
                  <button
                    onClick={() => handleAction("REOPEN")}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20"
                  >
                    <IoChatbubbleOutline className="text-sm" />
                    Rouvrir la conversation
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
