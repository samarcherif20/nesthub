// app/[locale]/disputes/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  IoArrowBackOutline,
  IoSendOutline,
  IoChatbubbleOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoHomeOutline,
  IoTimeOutline,
  IoWalletOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
} from "react-icons/io5";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertBanner from "@/components/ui/Alert";

const pipAvatar = (url: string) => `/api/users/avatar?url=${encodeURIComponent(url)}`;
const pipListingImage = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: { firstName: string; lastName: string; profilePictureUrl: string | null };
  isAdmin: boolean;
  attachments: string[];
  createdAt: string;
}

interface DisputeDetail {
  id: string;
  reference: string;
  status: string;
  type: string;
  description: string;
  refundAmount: number | null;
  resolvedAmount: number | null;
  priority: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    reference: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    listing: {
      id: string;
      title: string;
      governorate: string;
      delegation: string;
      images?: string[];
    };
    tenant: { id: string; firstName: string; lastName: string; profilePictureUrl: string | null };
    owner: { id: string; firstName: string; lastName: string; profilePictureUrl: string | null };
  };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  IN_REVIEW: { label: "En cours d'examen", color: "bg-blue-100 text-blue-700" },
  RESOLVED: { label: "Résolu", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Rejeté", color: "bg-red-100 text-red-700" },
};

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDispute();
    fetchMessages();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchDispute = async () => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/disputes/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDispute(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/disputes/${params.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/disputes/${params.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        setNewMessage("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9ff]">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9ff]">
        <div className="text-center">
          <p className="text-slate-500">Litige non trouvé</p>
          <button onClick={() => router.back()} className="mt-4 text-indigo-600 hover:underline">
            Retour
          </button>
        </div>
      </div>
    );
  }

  const isResolved = dispute.status === "RESOLVED" || dispute.status === "REJECTED";
  const mainImage = dispute.booking.listing.images?.[0];

  return (
    <div className="min-h-screen bg-[#f9f9ff] dark:bg-slate-950">
      {alert && (
        <div className="fixed top-20 right-8 z-50">
          <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-4 transition-colors"
          >
            <IoArrowBackOutline className="text-lg" />
            Retour
          </button>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Litige #{dispute.reference?.slice(-8) || dispute.id.slice(-8)}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {dispute.booking.listing.title}
              </p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_LABELS[dispute.status]?.color || "bg-gray-100"}`}>
                {STATUS_LABELS[dispute.status]?.label || dispute.status}
              </span>
              {dispute.priority === "HIGH" && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                  Urgent
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Chat Area */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[600px]">
              {/* Chat Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/40 to-violet-50/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold">
                    N
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Médiateur Nesthub</h3>
                    <p className="text-xs text-slate-500">En ligne • Répond généralement en 2h</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <IoChatbubbleOutline className="text-4xl mb-3" />
                    <p className="text-sm">Aucun message pour le moment</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = !msg.isAdmin;
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {msg.sender.profilePictureUrl ? (
                            <img src={pipAvatar(msg.sender.profilePictureUrl)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-indigo-600 font-bold text-xs">
                              {msg.sender.firstName?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className={`max-w-[70%] ${isUser ? "items-end flex flex-col" : ""}`}>
                          <div
                            className={`p-3 rounded-2xl text-sm ${
                              isUser
                                ? "bg-indigo-600 text-white rounded-tr-none"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                            }`}
                          >
                            {msg.content}
                            {msg.attachments?.map((url, i) => (
                              <img key={i} src={url} className="mt-2 rounded-lg max-w-full h-auto" />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1">
                            {format(new Date(msg.createdAt), "HH:mm", { locale: fr })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {!isResolved && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      placeholder="Écrivez votre message..."
                      className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50"
                    >
                      <IoSendOutline className="text-lg" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Booking Info */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Informations</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <IoHomeOutline className="text-slate-400" />
                  <span>{dispute.booking.listing.title}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <IoLocationOutline className="text-slate-400" />
                  <span>{dispute.booking.listing.governorate}, {dispute.booking.listing.delegation}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <IoCalendarOutline className="text-slate-400" />
                  <span>{format(new Date(dispute.booking.checkIn), "dd MMM yyyy", { locale: fr })} - {format(new Date(dispute.booking.checkOut), "dd MMM yyyy", { locale: fr })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <IoWalletOutline className="text-slate-400" />
                  <span>Total: {dispute.booking.totalPrice.toLocaleString("fr-FR")} TND</span>
                </div>
              </div>
            </div>

            {/* Dispute Info */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Détails du litige</h3>
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">Motif:</span> {dispute.type}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">Description:</span> {dispute.description}
                </p>
                {dispute.refundAmount && (
                  <p className="text-sm text-amber-600">
                    <span className="font-semibold">Montant demandé:</span> {dispute.refundAmount.toLocaleString("fr-FR")} TND
                  </p>
                )}
                {dispute.resolvedAmount && (
                  <p className="text-sm text-green-600">
                    <span className="font-semibold">Montant accordé:</span> {dispute.resolvedAmount.toLocaleString("fr-FR")} TND
                  </p>
                )}
                {dispute.resolution && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-sm font-semibold text-green-700">✅ Résolution</p>
                    <p className="text-sm text-green-600 mt-1">{dispute.resolution}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Listing Image */}
            {mainImage && (
              <div className="rounded-xl overflow-hidden">
                <img src={pipListingImage(mainImage)} alt="" className="w-full h-40 object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}