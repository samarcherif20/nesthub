// app/fr/messages/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import {
  IoSearchOutline,
  IoChatbubbleOutline,
  IoArrowBackOutline,
} from "react-icons/io5";
import { ChatBox } from "@/components/ui/chat/ChatBox";
import { EditableBookingCard } from "@/components/ui/chat/EditableBookingCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ─── pip helpers ──────────────────────────────────────────────────────────────

const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

// ─── Design tokens ────────────────────────────────────────────────────────────

const GRAD = "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  listing: {
    id: string;
    title: string;
    image?: string;
    pricePerNight?: number;
    location?: string;
    rating?: number;
    bedrooms?: number;
    maxGuests?: number;
    cleaningFee?: number;
    type?: string;
  };
  otherUser: {
    id: string;
    name: string;
    image?: string;
    isOnline?: boolean;
    isVerified?: boolean;
  };
  infoRequest?: {
    id: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
    expiresAt?: string;
  };
   offer?: {  // 👈 AJOUTEZ CETTE PROPRIÉTÉ
    id: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
    totalPrice: number;
    createdAt: string;
    expiresAt: string;
  };
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string) {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const now = new Date();

  // Vérifier si la date est valide
  if (isNaN(date.getTime())) return "";

  let diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) diffMs = 0;

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours} h`;
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return `il y a ${diffDays} jours`;

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  src,
  name,
  size = 44,
  online,
}: {
  src?: string;
  name: string;
  size?: number;
  online?: boolean;
}) {
  const [err, setErr] = useState(false);
  const url = src ? pipAvatar(src) : null;

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-white"
        style={{
          background:
            !url || err
              ? "linear-gradient(135deg,#0ea5e9,#6366f1,#a855f7)"
              : undefined,
          backgroundColor: url && !err ? "#e2e8f0" : undefined,
          fontSize: size * 0.36,
        }}
      >
        {url && !err ? (
          <img
            src={url}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setErr(true)}
          />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>
    </div>
  );
}

// ─── Conversation item ────────────────────────────────────────────────────────

function ConvItem({
  conv,
  isActive,
  onClick,
}: {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left transition-all duration-200 ${
        isActive
          ? "bg-gradient-to-r from-indigo-50/80 to-indigo-100/50 dark:from-indigo-950/40 dark:to-indigo-900/30 border-l-4 border-l-indigo-500"
          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <Avatar
          src={conv.otherUser.image}
          name={conv.otherUser.name}
          size={52}
          online={conv.otherUser.isOnline}
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline gap-2 mb-0.5">
            <span className="text-sm font-semibold truncate text-gray-900 dark:text-white">
              {conv.otherUser.name}
            </span>
            <span className="text-[10px] font-medium shrink-0 text-gray-400 dark:text-gray-500">
              {formatRelativeTime(conv.lastMessageAt)}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate font-medium mb-1">
            {conv.listing.title}
          </p>
          {conv.lastMessage && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
              {conv.lastMessage.length > 50
                ? conv.lastMessage.slice(0, 50) + "..."
                : conv.lastMessage}
            </p>
          )}
        </div>
        {conv.unreadCount > 0 && (
          <div
            className={`w-5 h-5 rounded-full ${GRAD} text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm`}
          >
            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Composant ResizableDiv ───────────────────────────────────────────────────

function ResizableDiv({
  children,
  defaultWidth = 380,
  minWidth = 280,
  maxWidth = 500,
  className = "",
}: {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const delta = e.clientX - startXRef.current;
      let newWidth = startWidthRef.current + delta;
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(newWidth);
    },
    [isResizing, minWidth, maxWidth],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width }}>
      {children}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-indigo-400/50 transition-colors group"
      >
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-gray-300 dark:bg-slate-600 rounded-full group-hover:bg-indigo-400 transition-all opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  );
}

// ─── Skeleton loader pour les conversations ───────────────────────────────────

function ConvSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <div className="w-[52px] h-[52px] rounded-full bg-gray-100 dark:bg-slate-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full w-2/3" />
        <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full w-full" />
        <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full w-1/2" />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TenantMessagesPage() {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unread" | "read">(
    "all",
  );
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const searchParams = useSearchParams();
  const conversationIdParam = searchParams.get("conversation");

  // Détecter l'écran mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-select from URL param
  useEffect(() => {
    if (conversationIdParam && conversations.length > 0 && !isMobileView) {
      const conv = conversations.find((c) => c.id === conversationIdParam);
      if (conv) setSelectedConv(conv);
    }
  }, [conversationIdParam, conversations, isMobileView]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data);
      if (data.length > 0 && !conversationIdParam && !isMobileView) {
        setSelectedConv(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [conversationIdParam, isMobileView]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleSelectConv = useCallback(
    (conv: Conversation) => {
      setSelectedConv(conv);
      if (isMobileView) {
        setShowChat(true);
      }
    },
    [isMobileView],
  );

  const handleBack = () => {
    setShowChat(false);
    setSelectedConv(null);
  };

  const handleUpdateInfoRequest = useCallback((updatedInfoRequest: any) => {
    setSelectedConv((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        infoRequest: updatedInfoRequest,
      };
    });
  }, []);

  const handleSendSystemMessage = useCallback((message: string) => {
    console.log("System message to send:", message);
  }, []);

  // Filtrer les conversations par recherche et par statut de lecture
  const filteredBySearch = conversations.filter(
    (c) =>
      c.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.listing.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filtered = filteredBySearch.filter((c) => {
    if (filterType === "unread") return c.unreadCount > 0;
    if (filterType === "read") return c.unreadCount === 0;
    return true;
  });

  const unreadCount = conversations.filter((c) => c.unreadCount > 0).length;

  if (isLoading) {
    return (
      <LoadingSpinner
        fullScreen
        text="Chargement des messages..."
        size="lg"
        color="primary"
        variant="spinner"
        speed="normal"
      />
    );
  }

  // Vue mobile
  if (isMobileView) {
    return (
      <div className="h-screen bg-gradient-to-br from-sky-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
        {showChat && selectedConv ? (
          <div className="h-full flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
            <div className="flex items-center gap-3 p-3 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <IoArrowBackOutline className="w-5 h-5" />
              </button>
              <Avatar
                src={selectedConv.otherUser.image}
                name={selectedConv.otherUser.name}
                size={36}
                online={selectedConv.otherUser.isOnline}
              />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedConv.otherUser.name}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedConv.listing.title}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatBox
                conversationId={selectedConv.id}
                recipientId={selectedConv.otherUser.id}
                recipientName={selectedConv.otherUser.name}
                recipientImage={selectedConv.otherUser.image}
                listingTitle={selectedConv.listing.title}
                offerId={selectedConv.offer?.id} // 👈 AJOUTEZ CETTE LIGNE
                offerStatus={selectedConv.offer?.status} // 👈 AJOUTE CETTE LIGNE

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
                userRole="TENANT"
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90">
              <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                Messages
              </h1>
              <div className="mt-3">
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2">
                  <IoSearchOutline className="text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher une discussion..."
                    className="flex-1 bg-transparent border-none outline-none text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <IoChatbubbleOutline className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">
                    Aucune conversation
                  </p>
                </div>
              ) : (
                filtered.map((conv) => (
                  <ConvItem
                    key={conv.id}
                    conv={conv}
                    isActive={false}
                    onClick={() => handleSelectConv(conv)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vue desktop
  const hasInfoRequest = !!selectedConv?.infoRequest;

  return (
    <div className="flex h-screen bg-gradient-to-br from-sky-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      {/* Colonne gauche - Liste des messages (resizable) */}
      <ResizableDiv defaultWidth={380} minWidth={280} maxWidth={500}>
        <div className="h-full border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Conversations
            </h1>

            {/* Filtres */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterType === "all"
                    ? "bg-indigo-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                }`}
              >
                Toutes ({conversations.length})
              </button>
              <button
                onClick={() => setFilterType("unread")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  filterType === "unread"
                    ? "bg-indigo-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Non lus ({unreadCount})
              </button>
              <button
                onClick={() => setFilterType("read")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterType === "read"
                    ? "bg-indigo-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                }`}
              >
                Lus ({conversations.length - unreadCount})
              </button>
            </div>

            <hr className="border-t border-gray-200 dark:border-gray-700 mb-4" />

            <div className="mt-4">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 shadow-sm border border-slate-200/50 dark:border-slate-700/50 transition-all focus-within:ring-2 focus-within:ring-indigo-400">
                <IoSearchOutline className="text-slate-400 text-lg" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une discussion..."
                  className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 dark:from-sky-950/50 dark:to-purple-950/50 flex items-center justify-center mb-4">
                  <IoChatbubbleOutline className="w-8 h-8 text-sky-500 dark:text-sky-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  {searchQuery ? "Aucun résultat" : "Aucune conversation"}
                </p>
                {!searchQuery && filterType !== "all" && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Aucune conversation{" "}
                    {filterType === "unread" ? "non lue" : "lue"}
                  </p>
                )}
                {!searchQuery && filterType === "all" && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Vos messages apparaîtront ici
                  </p>
                )}
              </div>
            ) : (
              <div className="py-1">
                {filtered.map((conv) => (
                  <ConvItem
                    key={conv.id}
                    conv={conv}
                    isActive={selectedConv?.id === conv.id}
                    onClick={() => handleSelectConv(conv)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </ResizableDiv>

      {/* Colonne droite - Chat + Carte intégrée */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <div className="flex-1 flex gap-4 p-4 overflow-hidden">
            {/* ChatBox */}
            <div className="flex-1 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border border-slate-200/50 dark:border-slate-700/50 transition-all">
              <ChatBox
                conversationId={selectedConv.id}
                recipientId={selectedConv.otherUser.id}
                recipientName={selectedConv.otherUser.name}
                recipientImage={selectedConv.otherUser.image}
                listingTitle={selectedConv.listing.title}
                offerId={selectedConv.offer?.id} // 👈 AJOUTEZ CETTE LIGNE
                offerStatus={selectedConv.offer?.status} // 👈 AJOUTE CETTE LIGNE

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
                userRole="TENANT"
              />
            </div>

            {/* Carte du logement */}
            {hasInfoRequest && selectedConv.infoRequest && (
              <div className="w-[280] flex-shrink-0 flex items-center justify-center overflow-y-auto">
                <EditableBookingCard
                  listing={selectedConv.listing}
                  infoRequestId={selectedConv.infoRequest.id}
                  initialCheckIn={selectedConv.infoRequest.checkIn}
                  initialCheckOut={selectedConv.infoRequest.checkOut}
                  initialGuests={selectedConv.infoRequest.guests}
                  onUpdate={handleUpdateInfoRequest}
                  onSendSystemMessage={handleSendSystemMessage}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 dark:from-sky-950/50 dark:to-purple-950/50 flex items-center justify-center mx-auto mb-4">
                <IoChatbubbleOutline className="w-10 h-10 text-sky-500 dark:text-sky-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                Sélectionnez une conversation
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                pour commencer à discuter
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
