"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  IoSearchOutline,
  IoChatbubbleOutline,
  IoArrowBackOutline,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoCalendarOutline,
  IoPeopleOutline,
  IoLocationOutline,
  IoShieldCheckmarkOutline,
  IoBedOutline,
  IoLockClosedOutline,
  IoWalletOutline,
  IoPricetagOutline,
  IoReceiptOutline,
  IoHomeOutline,
  IoInformationCircleOutline,
  IoStar,
} from "react-icons/io5";
import { ChatBox } from "@/components/ui/chat/ChatBox";

// ─── Fonctions pip pour les images ─────────────────────────────────────────────

// Fonction pip pour les avatars
const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

// Fonction pip pour les images des listings
const pipListingImage = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

// ─── Design tokens ─────────────────────────────────────────────────────────────

const GRAD = "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600";
const GRAD_TEXT =
  "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent";

// ─── Types ─────────────────────────────────────────────────────────────────────

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
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0)
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (diffDays === 1) return "Hier";
  if (diffDays < 7)
    return date.toLocaleDateString("fr-FR", { weekday: "short" });
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function fmtDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  src,
  name,
  size = "md",
  online,
}: {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
}) {
  const sizeMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-11 h-11 text-base",
  };
  const dotMap = {
    sm: "w-2.5 h-2.5 border",
    md: "w-3 h-3 border-2",
    lg: "w-3.5 h-3.5 border-2",
  };

  const avatarUrl = src ? pipAvatar(src) : null;

  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizeMap[size]} rounded-full overflow-hidden bg-gray-100 dark:bg-slate-700 flex-shrink-0`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center font-bold text-white ${GRAD}`}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      {online !== undefined && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 ${dotMap[size]} rounded-full border-white dark:border-slate-900 ${online ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-600"}`}
        />
      )}
    </div>
  );
}

// ─── Booking Details Sidebar ──────────────────────────────────────────────────

function BookingDetailsSidebar({
  listing,
  checkIn,
  checkOut,
  guests,
}: {
  listing: Conversation["listing"];
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}) {
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const basePrice = nights * (listing.pricePerNight || 0);
  const cleaningFee = listing.cleaningFee || 85;
  const serviceFee = Math.round(basePrice * 0.05);
  const totalPrice = basePrice + cleaningFee + serviceFee;

  const hasValidDates = checkIn && checkOut && nights > 0;
  const listingImageUrl = listing.image ? pipListingImage(listing.image) : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden sticky top-20">
      <div className={`${GRAD} px-5 py-4`}>
        <h3 className="text-white font-bold text-base flex items-center gap-2">
          <IoHomeOutline className="text-white/80" />
          Détails du séjour
        </h3>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 flex-shrink-0">
            {listingImageUrl ? (
              <img
                src={listingImageUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                🏠
              </div>
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2">
              {listing.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
              <IoLocationOutline className="text-xs" />
              {listing.location || "Emplacement non spécifié"}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <IoStar className="text-amber-400 text-xs" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {listing.rating || 4.5}
              </span>
              <span className="text-xs text-gray-400">(avis vérifiés)</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-2 mb-3">
            <IoCalendarOutline className="text-sky-500 text-base" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Dates
            </span>
          </div>
          {hasValidDates ? (
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Arrivée
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {fmtDate(checkIn)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Départ
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {fmtDate(checkOut)}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Durée
                </span>
                <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                  {nights} nuit{nights > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Aucune date sélectionnée
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Discutez avec le propriétaire pour convenir des dates
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-2 mb-3">
            <IoPeopleOutline className="text-sky-500 text-base" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Voyageurs
            </span>
          </div>
          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Nombre de personnes
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {guests || 1} personne{guests !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Capacité max
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {listing.maxGuests || 2} personnes
              </span>
            </div>
          </div>
        </div>

        {hasValidDates && (
          <div className="border-t border-gray-100 dark:border-slate-800 pt-3">
            <div className="flex items-center gap-2 mb-3">
              <IoWalletOutline className="text-sky-500 text-base" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Prix estimé
              </span>
            </div>
            <div className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/20 dark:to-indigo-950/20 rounded-xl p-3">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                <span>
                  {listing.pricePerNight?.toLocaleString("fr-FR")} TND ×{" "}
                  {nights} nuit{nights > 1 ? "s" : ""}
                </span>
                <span>{basePrice.toLocaleString("fr-FR")} TND</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                <span>Frais de ménage</span>
                <span>{cleaningFee.toLocaleString("fr-FR")} TND</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-3">
                <span>Frais de service (5%)</span>
                <span>{serviceFee.toLocaleString("fr-FR")} TND</span>
              </div>
              <div className="pt-2 border-t border-sky-200 dark:border-sky-800 flex justify-between font-extrabold">
                <span className={GRAD_TEXT}>Total estimé</span>
                <span className={GRAD_TEXT}>
                  {totalPrice.toLocaleString("fr-FR")} TND
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 dark:border-slate-800 pt-3">
          <div className="flex items-start gap-2">
            <IoInformationCircleOutline className="text-gray-400 text-base mt-0.5" />
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
                Les prix sont indicatifs et peuvent être négociés avec le
                propriétaire. Le montant final sera confirmé lors de la
                réservation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Conversation Item ────────────────────────────────────────────────────────

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
      className={`w-full p-4 text-left transition-colors relative ${
        isActive
          ? "bg-white dark:bg-slate-800 shadow-sm border-l-[3px] border-l-indigo-500"
          : "border-l-[3px] border-l-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50"
      }`}
    >
      <div className="flex gap-3 items-center">
        <Avatar
          src={conv.otherUser.image}
          name={conv.otherUser.name}
          size="md"
          online={conv.otherUser.isOnline}
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline gap-1">
            <span
              className={`text-sm font-bold truncate ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}
            >
              {conv.otherUser.name}
            </span>
            <span
              className={`text-[10px] shrink-0 ${isActive ? "text-indigo-500 font-bold" : "text-gray-400"}`}
            >
              {fmtTime(conv.lastMessageAt)}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5 font-medium">
            {conv.listing.title}
          </p>
          {conv.lastMessage && (
            <p className="text-xs text-gray-400 dark:text-gray-600 truncate mt-0.5">
              {conv.lastMessage}
            </p>
          )}
        </div>
        {conv.unreadCount > 0 && (
          <div
            className={`w-5 h-5 rounded-full ${GRAD} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}
          >
            {conv.unreadCount}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TenantMessagesPage() {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const searchParams = useSearchParams();
  const conversationIdParam = searchParams.get("conversation");

  useEffect(() => {
    if (conversationIdParam && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === conversationIdParam);
      if (conv) {
        setSelectedConv(conv);
      }
    }
  }, [conversationIdParam, conversations]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleSelectConv = useCallback(
    async (conv: Conversation) => {
      setSelectedConv(conv);
      if (isMobile) setShowMobileChat(true);
    },
    [isMobile],
  );

  const filteredConvs = conversations.filter(
    (c) =>
      c.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.listing.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className={`w-8 h-8 rounded-xl ${GRAD} animate-pulse`} />
      </div>
    );
  }

  const ConversationSidebar = (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900/50 border-r border-gray-100 dark:border-slate-800">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
          Messages
        </h1>
        <div className="relative">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une discussion..."
            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 dark:[color-scheme:dark] text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredConvs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <IoChatbubbleOutline className="text-4xl text-gray-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-600">
              Aucune conversation
            </p>
          </div>
        ) : (
          filteredConvs.map((conv) => (
            <ConvItem
              key={conv.id}
              conv={conv}
              isActive={selectedConv?.id === conv.id}
              onClick={() => handleSelectConv(conv)}
            />
          ))
        )}
      </div>
    </div>
  );

  const ChatArea = selectedConv ? (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
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
          userRole="TENANT"
        />
      </div>
    </div>
  ) : (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-950">
      <div className="text-center">
        <div
          className={`w-16 h-16 rounded-2xl ${GRAD} flex items-center justify-center mx-auto mb-4 opacity-20`}
        >
          <IoChatbubbleOutline className="text-white text-3xl" />
        </div>
        <p className="text-base font-semibold text-gray-400 dark:text-gray-600">
          Sélectionnez une conversation
        </p>
        <p className="text-sm text-gray-300 dark:text-gray-700 mt-1">
          pour commencer à discuter
        </p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="h-[calc(100vh-80px)] overflow-hidden">
        {showMobileChat && selectedConv ? (
          <div className="h-full flex flex-col">
            <div className="p-3 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900">
              <button
                onClick={() => setShowMobileChat(false)}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <IoArrowBackOutline className="text-xl text-gray-600 dark:text-gray-400" />
              </button>
              <Avatar
                src={selectedConv.otherUser.image}
                name={selectedConv.otherUser.name}
                size="sm"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {selectedConv.otherUser.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {selectedConv.listing.title}
                </p>
              </div>
            </div>
            {ChatArea}
          </div>
        ) : (
          ConversationSidebar
        )}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
      <div className="w-[32%] min-w-[280px] max-w-[360px] flex-shrink-0">
        {ConversationSidebar}
      </div>

      <div className="w-[48%] flex-1 overflow-hidden flex flex-col border-x border-gray-100 dark:border-slate-800">
        {ChatArea}
      </div>

      {selectedConv && selectedConv.infoRequest && (
        <div className="w-[20%] min-w-[260px] max-w-[300px] flex-shrink-0 p-3 overflow-y-auto">
          <BookingDetailsSidebar
            listing={selectedConv.listing}
            checkIn={selectedConv.infoRequest.checkIn}
            checkOut={selectedConv.infoRequest.checkOut}
            guests={selectedConv.infoRequest.guests}
          />
        </div>
      )}
    </div>
  );
}