// app/[locale]/admin/disputes/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  IoSearchOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoAlertCircleOutline,
  IoTimeOutline,
  IoSendOutline,
  IoRefreshOutline,
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;
const pipImage = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

// ✅ Fonction dédiée aux preuves (evidence)
const pipEvidence = (url: string) => {
  // Si l'URL est déjà complète (ex: https://...blob...)
  if (url.startsWith("http")) return url;
  // Pour les URLs dans /uploads/ (fichiers locaux)
  if (url.startsWith("/uploads/")) return url;
  // Fallback : utiliser l'API des listings
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

type Severity = "HIGH" | "MEDIUM" | "LOW";
type DisputeStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED";

interface DisputeMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "TENANT" | "OWNER" | "ADMIN";
  content: string;
  attachments?: string[];
  createdAt: string;
}

interface Dispute {
  id: string;
  reference: string;
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
    image?: string;
  };
  type: string;
  status: DisputeStatus;
  severity: Severity;
  createdAt: string;
  description: string;
  evidence?: string[];
  listing?: {
    id: string;
    title: string;
    image?: string;
    location?: string;
    governorate?: string;
    delegation?: string;
  };
  booking?: {
    id: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    nights?: number;
  };
  messages: DisputeMessage[];
  refundAmount?: number;
  resolvedAmount?: number;
  resolution?: string;
}

const STATUS_CONFIG: Record<
  DisputeStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  OPEN: {
    label: "En attente",
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
    dot: "bg-red-500",
  },
  IN_REVIEW: {
    label: "En examen",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    dot: "bg-amber-500",
  },
  RESOLVED: {
    label: "Résolu",
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
    dot: "bg-green-500",
  },
  REJECTED: {
    label: "Rejeté",
    color: "text-gray-500",
    bg: "bg-gray-50 dark:bg-gray-800",
    dot: "bg-gray-400",
  },
};

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; color: string; bg: string; icon: JSX.Element }
> = {
  HIGH: {
    label: "Élevée",
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
    icon: <TbBoom className="text-red-500" />,
  },
  MEDIUM: {
    label: "Moyenne",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    icon: <IoAlertCircleOutline className="text-amber-500" />,
  },
  LOW: {
    label: "Basse",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    icon: <IoTimeOutline className="text-blue-500" />,
  },
};

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: JSX.Element; color: string }
> = {
  DAMAGE: {
    label: "Dommages",
    icon: <GiBrokenWall className="text-lg" />,
    color: "bg-red-100 text-red-700",
  },
  CLEANING: {
    label: "Propreté",
    icon: <MdOutlineCleaningServices className="text-lg" />,
    color: "bg-amber-100 text-amber-700",
  },
  MISREPRESENTATION: {
    label: "Non conforme",
    icon: <IoHomeOutline className="text-lg" />,
    color: "bg-orange-100 text-orange-700",
  },
  NOISE: {
    label: "Bruit",
    icon: <MdOutlineNoiseAware className="text-lg" />,
    color: "bg-purple-100 text-purple-700",
  },
  PAYMENT: {
    label: "Paiement",
    icon: <FaMoneyBillWave className="text-lg" />,
    color: "bg-green-100 text-green-700",
  },
  CANCELLATION: {
    label: "Annulation",
    icon: <FaCalendarTimes className="text-lg" />,
    color: "bg-blue-100 text-blue-700",
  },
  OTHER: {
    label: "Autre",
    icon: <IoDocumentTextOutline className="text-lg" />,
    color: "bg-gray-100 text-gray-700",
  },
};

function EvidenceGallery({ images }: { images?: string[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  if (!images || images.length === 0) {
    return (
      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
        <IoImageOutline className="text-2xl text-slate-400 mx-auto mb-2" />
        <p className="text-xs text-slate-400">Aucune preuve fournie</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
        <IoImageOutline /> Preuves ({images.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedImage(img)}
            className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all group"
          >
            {!imageErrors[img] ? (
              <img
                src={pipEvidence(img)}
                alt={`Preuve ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={() =>
                  setImageErrors((prev) => ({ ...prev, [img]: true }))
                }
              />
            ) : (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <IoImageOutline className="text-slate-400 text-2xl" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </button>
        ))}
      </div>

      {/* Modal d'image agrandie */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 transition"
            >
              <IoCloseOutline className="text-2xl" />
            </button>
            <img
              src={pipEvidence(selectedImage)}
              alt="Preuve agrandie"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DisputeDetailPanel({
  dispute,
  onResolve,
  onReject,
  actionLoading,
  onSendMessage,
  sendingMessage,
}: any) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typeConfig = TYPE_CONFIG[dispute.type] || TYPE_CONFIG.OTHER;
  const statusConfig = STATUS_CONFIG[dispute.status];

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
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/40 to-violet-50/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold ${typeConfig.color}`}
            >
              {typeConfig.icon}
              {typeConfig.label}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold ${statusConfig.bg} ${statusConfig.color}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
              ></span>
              {statusConfig.label}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${SEVERITY_CONFIG[dispute.severity].bg} ${SEVERITY_CONFIG[dispute.severity].color}`}
            >
              {SEVERITY_CONFIG[dispute.severity].icon}
              {SEVERITY_CONFIG[dispute.severity].label}
            </span>
          </div>
          <span className="font-mono text-xs text-slate-400">
            #{dispute.reference?.slice(-8) || dispute.id.slice(-8)}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {dispute.listing?.title || "Sans titre"}
        </h3>
        {dispute.listing?.location && (
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <IoLocationOutline className="text-xs" />
            {dispute.listing.location}
          </p>
        )}
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* Informations du rapporteur */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center overflow-hidden">
            {dispute.reporter.image ? (
              <img
                src={pipAvatar(dispute.reporter.image)}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-indigo-600 font-bold text-sm">
                {dispute.reporter.firstName?.charAt(0)}
                {dispute.reporter.lastName?.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {dispute.reporter.firstName} {dispute.reporter.lastName}
            </p>
            <p className="text-xs text-slate-500">A ouvert ce litige</p>
          </div>
        </div>

        {/* Détails du séjour */}
        {dispute.booking && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1">
              <IoCalendarOutline /> Détails du séjour
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Dates:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {format(new Date(dispute.booking.checkIn), "dd MMM yyyy", {
                    locale: fr,
                  })}{" "}
                  -{" "}
                  {format(new Date(dispute.booking.checkOut), "dd MMM yyyy", {
                    locale: fr,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nuits:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {dispute.booking.nights ||
                    Math.ceil(
                      (new Date(dispute.booking.checkOut).getTime() -
                        new Date(dispute.booking.checkIn).getTime()) /
                        (1000 * 3600 * 24),
                    )}{" "}
                  nuits
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Montant total:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {dispute.booking.totalPrice.toLocaleString("fr-FR")} TND
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Montant demandé */}
        {dispute.refundAmount && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-semibold text-amber-600 mb-1 flex items-center gap-1">
              <IoCashOutline /> Montant demandé
            </p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {dispute.refundAmount.toLocaleString("fr-FR")} TND
            </p>
          </div>
        )}

        {/* Description */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
            <IoDocumentTextOutline /> Description du litige
          </p>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
              {dispute.description || "Aucune description fournie"}
            </p>
          </div>
        </div>

        {/* Preuves */}
        <EvidenceGallery images={dispute.evidence} />

        {/* Résolution (si résolu) */}
        {dispute.resolution && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
            <p className="text-xs font-semibold text-green-600 mb-1 flex items-center gap-1">
              <IoCheckmarkCircleOutline /> Résolution
            </p>
            <p className="text-sm text-green-700 dark:text-green-400">
              {dispute.resolution}
            </p>
            {dispute.resolvedAmount && (
              <p className="text-sm font-bold text-green-600 mt-2">
                Remboursement accordé:{" "}
                {dispute.resolvedAmount.toLocaleString("fr-FR")} TND
              </p>
            )}
          </div>
        )}

        {/* Messages */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1">
            <IoChatbubbleOutline /> Conversation ({dispute.messages.length})
          </p>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {dispute.messages.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <IoChatbubbleOutline className="text-2xl mx-auto mb-2 opacity-50" />
                <p className="text-xs">Aucun message pour le moment</p>
              </div>
            ) : (
              dispute.messages.map((msg: DisputeMessage) => {
                const isUser =
                  msg.senderRole === "TENANT" || msg.senderRole === "OWNER";
                const isOwner = msg.senderRole === "OWNER";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? (isOwner ? "items-start" : "items-start") : "items-end"}`}
                  >
                    <div
                      className={`px-4 py-2 rounded-2xl text-sm max-w-[85%] ${
                        isUser
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none"
                          : "bg-indigo-600 text-white rounded-tr-none"
                      }`}
                    >
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {msg.senderName}{" "}
                        {isUser
                          ? isOwner
                            ? "(Propriétaire)"
                            : "(Locataire)"
                          : "(Admin)"}
                      </p>
                      {msg.content}
                      {msg.attachments?.map((url, i) => (
                        <img
                          key={i}
                          src={pipImage(url)}
                          className="mt-2 rounded-lg max-w-full h-auto max-h-32 object-cover"
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {format(new Date(msg.createdAt), "dd MMM HH:mm", {
                        locale: fr,
                      })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-800/30">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ajouter une réponse..."
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
              <IoCheckmarkCircleOutline /> Résoudre
            </button>
            <button
              onClick={() => onReject(dispute.id)}
              disabled={actionLoading === dispute.id}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <IoCloseCircleOutline /> Rejeter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDisputesPage() {
  const { getToken } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"active" | "archive">("active");
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [stats, setStats] = useState({
    open: 0,
    inReview: 0,
    resolved: 0,
    totalRefund: 0,
  });

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const params = new URLSearchParams({
        status: tab === "active" ? "OPEN,IN_REVIEW" : "RESOLVED,REJECTED",
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/disputes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDisputes(data.disputes || []);
        if (data.stats) {
          setStats({
            open: data.stats.open || 0,
            inReview: data.stats.inReview || 0,
            resolved: data.stats.resolved || 0,
            totalRefund: data.stats.totalRefund || 0,
          });
        }
        if (data.disputes?.length > 0 && !selectedDispute) {
          setSelectedDispute(data.disputes[0]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [getToken, tab, search]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleResolve = async (disputeId: string, resolvedAmount?: number) => {
    setActionLoading(disputeId);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resolution: "Résolu par l'administrateur",
          resolvedAmount,
        }),
      });
      if (res.ok) {
        setAlert({ type: "success", message: "Litige résolu avec succès" });
        fetchDisputes();
      }
    } catch (error) {
      setAlert({ type: "error", message: "Erreur lors de la résolution" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (disputeId: string) => {
    setActionLoading(disputeId);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/admin/disputes/${disputeId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: "Litige rejeté par l'administrateur" }),
      });
      if (res.ok) {
        setAlert({ type: "success", message: "Litige rejeté" });
        fetchDisputes();
      }
    } catch (error) {
      setAlert({ type: "error", message: "Erreur lors du rejet" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendMessage = async (disputeId: string, content: string) => {
    setSendingMessage(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/admin/disputes/${disputeId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const msg = await res.json();
        setSelectedDispute((prev) =>
          prev ? { ...prev, messages: [...prev.messages, msg] } : prev,
        );
        fetchDisputes();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const filtered = disputes.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.reference.toLowerCase().includes(q) ||
      `${d.reporter.firstName} ${d.reporter.lastName}`.toLowerCase().includes(q)
    );
  });

  const totalActive = stats.open + stats.inReview;

  return (
    <div className="min-h-screen bg-[#f9f9ff] dark:bg-slate-950">
      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">
              Gestion des litiges
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Examinez et résolvez les litiges signalés
            </p>
          </div>
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
            <button
              onClick={() => {
                setTab("active");
                setSelectedDispute(null);
              }}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${tab === "active" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500"}`}
            >
              En cours ({totalActive})
            </button>
            <button
              onClick={() => {
                setTab("archive");
                setSelectedDispute(null);
              }}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${tab === "archive" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500"}`}
            >
              Archivés ({stats.resolved})
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <IoAlertCircleOutline className="text-red-600 text-lg" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Ouverts
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.open}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <IoTimeOutline className="text-amber-600 text-lg" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  En examen
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.inReview}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <IoCheckmarkCircleOutline className="text-emerald-600 text-lg" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Résolus
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.resolved}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <IoWalletOutline className="text-white text-lg" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/70 uppercase">
                  Remboursements
                </p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalRefund.toLocaleString("fr-FR")} TND
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par référence, utilisateur..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-380px)]">
          {/* Liste des litiges */}
          <div className="col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
              <p className="text-xs font-semibold text-slate-500">
                {filtered.length} litige{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="md" color="primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <MdOutlineGavel className="text-4xl mb-2" />
                  <p className="text-sm">Aucun litige trouvé</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((dispute) => {
                    const typeConfig =
                      TYPE_CONFIG[dispute.type] || TYPE_CONFIG.OTHER;
                    return (
                      <button
                        key={dispute.id}
                        onClick={() => setSelectedDispute(dispute)}
                        className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all ${selectedDispute?.id === dispute.id ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-l-4 border-l-indigo-500" : ""}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            #
                            {dispute.reference?.slice(-8) ||
                              dispute.id.slice(-8)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SEVERITY_CONFIG[dispute.severity].bg} ${SEVERITY_CONFIG[dispute.severity].color}`}
                          >
                            {SEVERITY_CONFIG[dispute.severity].label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                            <span className="text-indigo-600 text-xs font-bold">
                              {dispute.reporter.firstName?.charAt(0)}
                              {dispute.reporter.lastName?.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {dispute.reporter.firstName}{" "}
                            {dispute.reporter.lastName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${typeConfig.color}`}
                          >
                            {typeConfig.icon}
                            {typeConfig.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold flex items-center gap-1 ${STATUS_CONFIG[dispute.status].color}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[dispute.status].dot}`}
                            ></span>
                            {STATUS_CONFIG[dispute.status].label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                          {formatDate(dispute.createdAt)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Détail du litige */}
          <div className="col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {selectedDispute ? (
              <DisputeDetailPanel
                dispute={selectedDispute}
                onResolve={handleResolve}
                onReject={handleReject}
                actionLoading={actionLoading}
                onSendMessage={handleSendMessage}
                sendingMessage={sendingMessage}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
                <MdOutlineGavel className="text-5xl mb-3" />
                <p className="text-sm">
                  Sélectionnez un litige pour voir les détails
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
