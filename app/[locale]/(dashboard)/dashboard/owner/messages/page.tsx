"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { ChatBox } from "@/components/ui/chat/ChatBox";
import { motion } from "framer-motion";
import {
  MessageSquare,
  ArrowLeft,
  Star,
  CheckCircle,
  XCircle,
  Verified,
  Home,
  Calendar,
  Users,
  User,
  Tag,
  Wallet,
  Activity,
  Clock,
  AlertCircle,
  Timer,
  FileText,
  Zap,
  Info,
  Shield,
  TrendingUp,
  HelpCircle,
} from "lucide-react";
import { TbHomePlus, TbMessageOff } from "react-icons/tb";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Conversation {
  id: string;
  listing: {
    id: string;
    title: string;
    image?: string;
    pricePerNight?: number;
    location?: string;
    bedrooms?: number;
    maxGuests?: number;
    cleaningFee?: number;
  };
  otherUser: {
    id: string;
    name: string;
    image?: string;
  };
  infoRequest?: {
    id: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  };
  offer?: {
    id: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
    totalPrice: number;
    createdAt: string;
    expiresAt: string;
  };
  lastMessage?: string;
  unreadCount: number;
}

// ─── PIP Helpers (Proxy Image Protocol) ───────────────────────────────────────
const pipAvatar = (url: string) => `/api/users/avatar?url=${encodeURIComponent(url)}`;
const pipListingImage = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;

// ─── Composant Avatar avec PIP ────────────────────────────────────────────────
function Avatar({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  const url = src ? pipAvatar(src) : null;
  return (
    <div
      className="relative flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold text-white"
      style={{
        width: size,
        height: size,
        background: !url || err ? "linear-gradient(135deg, #0ea5e9, #6366f1, #a855f7)" : "#e2e8f0",
        fontSize: size * 0.36,
      }}
    >
      {url && !err ? (
        <img src={url} alt={name} className="w-full h-full object-cover" onError={() => setErr(true)} />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

// ─── Fonction utilitaire pour l'image du logement avec PIP ────────────────────
function getListingImage(listing: Conversation["listing"]): string {
  if (listing.image && listing.image.trim() !== "") {
    return pipListingImage(listing.image);
  }
  return "/images/placeholder-listing.jpg";
}

// ─── Composant pour l'affichage de l'image du logement avec PIP ───────────────
function ListingImage({ listing, className = "" }: { listing: Conversation["listing"]; className?: string }) {
  const [err, setErr] = useState(false);
  const imageUrl = getListingImage(listing);
  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}>
      {!err ? (
        <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" onError={() => setErr(true)} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Home className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
      )}
    </div>
  );
}

// ─── EMPTY STATE (EXACTEMENT COMME LES AUTRES PAGES) ──────────────────────────
function EmptyMessagesState() {
  const locale = "fr";
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 dark:from-sky-950/50 dark:to-purple-950/50 flex items-center justify-center shadow-lg">
          <TbMessageOff size={48} className="text-sky-500 dark:text-sky-400" />
        </div>
      </div>
      <h3 className="text-2xl font-headline font-bold bg-gradient-to-r from-sky-600 to-purple-600 dark:from-sky-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
        Aucune conversation
      </h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
        Les messages des voyageurs apparaîtront ici dès qu'ils vous contacteront.
      </p>
      <Link
        href={`/${locale}/dashboard/owner/listings`}
        className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <TbHomePlus size={18} className="group-hover:rotate-12 transition-transform duration-300" />
        Voir mes annonces
        <TrendingUp size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
      </Link>
      <Link
        href={`/${locale}/help`}
        className="mt-6 text-xs text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex items-center gap-1"
      >
        <HelpCircle size={12} />
        Comment gérer mes messages ?
      </Link>
    </div>
  );
}

// ─── Composant Toast ─────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error" | "info"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = { success: "bg-emerald-500", error: "bg-red-500", info: "bg-blue-500" };
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg animate-in slide-in-from-bottom-2 ${styles[type]}`}>
      {message}
    </div>
  );
}

export default function OwnerMessagesPage() {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => setToast({ message, type });

  // Détecter l'écran mobile
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => { loadConversations(); }, []);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    if (isMobileView) setShowChat(true);
  };

  const handleBack = () => {
    setShowChat(false);
    setSelectedConv(null);
  };

  const handleAcceptOffer = async () => {
    if (!selectedConv?.offer?.id) {
      showToast("Aucune offre trouvée", "error");
      return;
    }
    if (selectedConv.offer.status !== "PENDING") {
      showToast("Cette offre a déjà été traitée", "error");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/offers/${selectedConv.offer.id}/accept`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast("Offre acceptée avec succès ! La réservation est confirmée.", "success");
        setSelectedConv({ ...selectedConv, offer: { ...selectedConv.offer, status: "ACCEPTED" } });
        await loadConversations();
      } else {
        showToast(data.error || "Erreur lors de l'acceptation", "error");
      }
    } catch (error) {
      showToast("Erreur de connexion", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectOffer = async () => {
    if (!selectedConv?.offer?.id) {
      showToast("Aucune offre trouvée", "error");
      return;
    }
    if (selectedConv.offer.status !== "PENDING") {
      showToast("Cette offre a déjà été traitée", "error");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/offers/${selectedConv.offer.id}/reject`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast("Offre refusée", "info");
        setSelectedConv({ ...selectedConv, offer: { ...selectedConv.offer, status: "REJECTED" } });
        await loadConversations();
      } else {
        showToast(data.error || "Erreur lors du refus", "error");
      }
    } catch (error) {
      showToast("Erreur de connexion", "error");
    } finally {
      setIsProcessing(false);
    }
  };

 if (isLoading) {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-120px)]">
      <LoadingSpinner 
        variant="spinner"
        size="lg"
        color="primary"
        text="Chargement des messages..."
        speed="normal"
      />
    </div>
  );
}

  // ✅ EMPTY STATE : S'il n'y a AUCUNE conversation → afficher l'empty state centré
  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)] bg-white dark:bg-slate-900/0  overflow-hidden">
        <EmptyMessagesState />
      </div>
    );
  }

  // Vue mobile
  if (isMobileView) {
    return (
      <div className="h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {showChat && selectedConv ? (
          <>
            <div className="flex items-center gap-3 p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Avatar src={selectedConv.otherUser.image} name={selectedConv.otherUser.name} size={32} />
              <div>
                <p className="font-medium">{selectedConv.otherUser.name}</p>
                <p className="text-xs text-slate-500">{selectedConv.listing.title}</p>
              </div>
            </div>
            <ChatBox
              conversationId={selectedConv.id}
              recipientId={selectedConv.otherUser.id}
              recipientName={selectedConv.otherUser.name}
              recipientImage={selectedConv.otherUser.image}
              listingTitle={selectedConv.listing.title}
              listing={{
                id: selectedConv.listing.id,
                title: selectedConv.listing.title,
                image: selectedConv.listing.image,
                pricePerNight: selectedConv.listing.pricePerNight,
                location: selectedConv.listing.location,
                bedrooms: selectedConv.listing.bedrooms,
                maxGuests: selectedConv.listing.maxGuests,
                cleaningFee: selectedConv.listing.cleaningFee,
                infoRequestId: selectedConv.infoRequest?.id,
              }}
              userRole="PROPERTY_OWNER"
            />
          </>
        ) : (
          <ConversationList conversations={conversations} onSelect={handleSelectConversation} selectedId={selectedConv?.id} />
        )}
      </div>
    );
  }

  // Vue desktop (3 colonnes)
  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Liste des conversations - 25% */}
      <div className="w-[25%] min-w-[260px] bg-white dark:bg-slate-900 flex flex-col border-r border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Messages</h2>
          <p className="text-xs text-slate-400 mt-0.5">{conversations.length} conversation{conversations.length > 1 ? "s" : ""}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelectConversation(conv)}
              className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 ${
                selectedConv?.id === conv.id ? "bg-sky-50 dark:bg-sky-900/20 border-l-4 border-l-sky-500" : ""
              }`}
            >
              <div className="flex gap-3">
                <Avatar src={conv.otherUser.image} name={conv.otherUser.name} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{conv.otherUser.name}</p>
                    {conv.unreadCount > 0 && (
                      <span className="min-w-[20px] h-5 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{conv.listing.title}</p>
                  {conv.offer && conv.offer.status === "PENDING" && (
                    <p className="text-[10px] text-amber-500 font-medium mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> Offre en attente
                    </p>
                  )}
                  {conv.lastMessage && <p className="text-[11px] text-slate-400 truncate mt-1">{conv.lastMessage}</p>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Zone de chat - 45% */}
      <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 flex flex-col">
        {selectedConv ? (
          <ChatBox
            conversationId={selectedConv.id}
            recipientId={selectedConv.otherUser.id}
            recipientName={selectedConv.otherUser.name}
            recipientImage={selectedConv.otherUser.image}
            listingTitle={selectedConv.listing.title}
            listing={{
              id: selectedConv.listing.id,
              title: selectedConv.listing.title,
              image: selectedConv.listing.image,
              pricePerNight: selectedConv.listing.pricePerNight,
              location: selectedConv.listing.location,
              bedrooms: selectedConv.listing.bedrooms,
              maxGuests: selectedConv.listing.maxGuests,
              cleaningFee: selectedConv.listing.cleaningFee,
              infoRequestId: selectedConv.infoRequest?.id,
            }}
            userRole="PROPERTY_OWNER"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Sélectionnez une conversation</p>
              <p className="text-sm mt-1">pour commencer à discuter</p>
            </div>
          </div>
        )}
      </div>

      {/* Panneau droit - Contexte de réservation - 30% */}
      {selectedConv && (
        <div className="w-[30%] min-w-[280px] bg-slate-50 dark:bg-slate-800/30 border-l border-slate-200 dark:border-slate-700 overflow-y-auto">
          <div className="p-5 space-y-6">
            {/* Propriété */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Home className="w-3 h-3" /> Propriété
              </h4>
              <div className="rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="h-32 w-full relative">
                  <ListingImage listing={selectedConv.listing} className="w-full h-full" />
                  {selectedConv.listing.pricePerNight && (
                    <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-1 rounded-lg text-[11px] font-bold text-sky-600 dark:text-sky-400 shadow-sm">
                      {selectedConv.listing.pricePerNight} DT / Nuit
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h5 className="text-sm font-bold font-headline text-slate-900 dark:text-white">{selectedConv.listing.title}</h5>
                  {selectedConv.listing.location && <p className="text-xs text-slate-500 mt-0.5">{selectedConv.listing.location}</p>}
                  {selectedConv.infoRequest && (
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(selectedConv.infoRequest.checkIn).toLocaleDateString()} -{" "}
                        {new Date(selectedConv.infoRequest.checkOut).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {selectedConv.infoRequest.guests} pers.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profil Locataire */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <User className="w-3 h-3" /> Profil Locataire
              </h4>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar src={selectedConv.otherUser.image} name={selectedConv.otherUser.name} size={40} />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{selectedConv.otherUser.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Verified className="w-3.5 h-3.5 text-sky-500" />
                      <span className="text-[10px] text-slate-500">Vérifié</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Score de fiabilité</span>
                  <span className="text-sm font-bold text-sky-600 dark:text-sky-400">98/100</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full" style={{ width: "98%" }} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-2">
                  <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[10px] text-slate-400">Avis</p>
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold">4.9</span>
                    </div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[10px] text-slate-400">Séjours</p>
                    <p className="text-xs font-bold mt-1">12</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Offre de réservation */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Offre de réservation
              </h4>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                {selectedConv.offer ? (
                  <div className="flex flex-col space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Wallet className="w-3 h-3" /> Montant total
                      </span>
                      <span className="text-lg font-bold text-sky-600 dark:text-sky-400">
                        {selectedConv.offer.totalPrice.toLocaleString("fr-FR")} TND
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Statut</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        selectedConv.offer.status === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        selectedConv.offer.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        selectedConv.offer.status === "REJECTED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {selectedConv.offer.status === "PENDING" && <><Clock className="w-3 h-3" /> En attente</>}
                        {selectedConv.offer.status === "ACCEPTED" && <><CheckCircle className="w-3 h-3" /> Acceptée</>}
                        {selectedConv.offer.status === "REJECTED" && <><XCircle className="w-3 h-3" /> Refusée</>}
                        {selectedConv.offer.status === "EXPIRED" && <><AlertCircle className="w-3 h-3" /> Expirée</>}
                      </span>
                    </div>
                    {selectedConv.offer.expiresAt && selectedConv.offer.status === "PENDING" && (
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Timer className="w-3 h-3" /> Expiration
                        </span>
                        <span className="text-xs text-slate-500">{new Date(selectedConv.offer.expiresAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Aucune offre en cours</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions rapides */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Actions rapides
              </h4>
              <button
                onClick={handleAcceptOffer}
                disabled={isProcessing || !selectedConv?.offer || selectedConv.offer.status !== "PENDING"}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  selectedConv?.offer?.status === "PENDING" && !isProcessing
                    ? "bg-gradient-to-r from-sky-600 to-purple-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-700 hover:to-purple-700 active:scale-[0.98]"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                }`}
              >
                {isProcessing ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Accepter la demande
              </button>
              <button
                onClick={handleRejectOffer}
                disabled={isProcessing || !selectedConv?.offer || selectedConv.offer.status !== "PENDING"}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border ${
                  selectedConv?.offer?.status === "PENDING" && !isProcessing
                    ? "bg-white dark:bg-slate-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-[0.98] border-red-200 dark:border-red-800"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border-slate-300 dark:border-slate-600"
                }`}
              >
                <XCircle className="w-4 h-4" /> Refuser
              </button>
              {(!selectedConv?.offer || selectedConv.offer.status !== "PENDING") && (
                <div className="flex items-center justify-center gap-1 mt-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                  <Info className="w-3 h-3 text-slate-400" />
                  <p className="text-[10px] text-slate-400 text-center">
                    {!selectedConv?.offer ? "Aucune offre en attente" :
                     selectedConv.offer.status === "ACCEPTED" ? "Cette offre a déjà été acceptée" :
                     selectedConv.offer.status === "REJECTED" ? "Cette offre a déjà été refusée" : "Cette offre a expirée"}
                  </p>
                </div>
              )}
            </div>

            {/* Note */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center gap-1">
                <Shield className="w-3 h-3 text-slate-400" />
                <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                  En acceptant, vous pré-approuvez la réservation. Le locataire aura 24h pour finaliser le paiement.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant liste des conversations (pour mobile)
function ConversationList({
  conversations,
  onSelect,
  selectedId,
}: {
  conversations: Conversation[];
  onSelect: (conv: Conversation) => void;
  selectedId?: string;
}) {
  return (
    <div className="h-full bg-white dark:bg-slate-900">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Messages</h2>
      </div>
      <div className="overflow-y-auto h-[calc(100%-73px)]">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800"
          >
            <div className="flex gap-3">
              <Avatar src={conv.otherUser.image} name={conv.otherUser.name} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-slate-900 dark:text-white">{conv.otherUser.name}</p>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 truncate">{conv.listing.title}</p>
                {conv.offer && conv.offer.status === "PENDING" && (
                  <p className="text-[10px] text-amber-500 font-medium mt-0.5 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> Offre en attente
                  </p>
                )}
                {conv.lastMessage && <p className="text-xs text-slate-400 truncate mt-1">{conv.lastMessage}</p>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}