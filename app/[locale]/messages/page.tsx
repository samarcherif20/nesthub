// app/[locale]/messages/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  IoSearchOutline,
  IoChatbubbleOutline,
  IoArrowBackOutline,
} from "react-icons/io5";
import { UsersRound, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { ChatBox } from "@/components/ui/chat/ChatBox";
import { EditableBookingCard } from "@/components/ui/chat/EditableBookingCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { TenantHeader } from "@/components/ui/header/TenantHeader";
import {
  useMessages,
  formatRelativeTime,
  pipAvatar,
  GRAD,
} from "./hooks/useMessages";

// ─── Toast Component ─────────────────────────────────────────────────────────
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-sky-500",
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${styles[type]} text-white`}
      >
        {icons[type]}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Avatar Component ─────────────────────────────────────────────────────────
function Avatar({
  src,
  name,
  size = 44,
}: {
  src?: string;
  name: string;
  size?: number;
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

// ─── Group Avatar Component ───────────────────────────────────────────────────
function GroupAvatar({
  participants,
}: {
  participants?: {
    id: string;
    username: string;
    image?: string;
    role?: string;
  }[];
}) {
  const visibleParticipants = participants?.slice(0, 3) || [];
  const remainingCount = (participants?.length || 0) - 3;

  const getDisplayName = (p: { username: string; role?: string }) => {
    if (p.role === "ADMIN") return "Admin";
    return p.username;
  };

  const tooltipText =
    participants?.map((p) => getDisplayName(p)).join(", ") || "";

  return (
    <div className="relative flex-shrink-0 group">
      <div className="flex -space-x-3">
        {visibleParticipants.map((p, idx) => (
          <div
            key={p.id}
            className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-slate-900 shadow-md"
            style={{ zIndex: visibleParticipants.length - idx }}
          >
            {p.image ? (
              <img
                src={pipAvatar(p.image)}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                {getDisplayName(p).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="relative w-12 h-12 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
            +{remainingCount}
          </div>
        )}
      </div>
      {tooltipText && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-lg">
          {tooltipText}
        </div>
      )}
    </div>
  );
}

// ─── Conversation Item Component (privé) ──────────────────────────────────────
function ConvItem({
  conv,
  isActive,
  onClick,
  t,
}: {
  conv: any;
  isActive: boolean;
  onClick: () => void;
  t: any;
}) {
  const hasOffer = conv.offer?.status === "PENDING";
  const isOfferAccepted = conv.offer?.status === "ACCEPTED";
  const isOfferRejected = conv.offer?.status === "REJECTED";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left transition-all duration-200 rounded-xl ${
        isActive
          ? "bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-indigo-900/30 ring-1 ring-indigo-200 dark:ring-indigo-800"
          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <Avatar
          src={conv.otherUser.image}
          name={conv.otherUser.username}
          size={52}
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline gap-2 mb-0.5">
            <span className="text-sm font-semibold truncate text-gray-900 dark:text-white">
              {conv.otherUser.username}
            </span>
            <span className="text-[10px] font-medium shrink-0 text-gray-400 dark:text-gray-500">
              {formatRelativeTime(conv.lastMessageAt)}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate font-medium mb-1">
            {conv.listing.title}
          </p>
          {hasOffer && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {t("offer.pending")}
            </span>
          )}
          {isOfferAccepted && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
              {t("offer.accepted")}
            </span>
          )}
          {isOfferRejected && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">
              {t("offer.rejected")}
            </span>
          )}
          {!hasOffer &&
            !isOfferAccepted &&
            !isOfferRejected &&
            conv.lastMessage && (
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
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

// ─── Group Conversation Item Component ────────────────────────────────────────
function GroupConvItem({
  group,
  isActive,
  onClick,
  t,
}: {
  group: any;
  isActive: boolean;
  onClick: () => void;
  t: any;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left transition-all duration-200 rounded-xl ${
        isActive
          ? "bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/30 ring-1 ring-purple-200 dark:ring-purple-800"
          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <GroupAvatar participants={group.participants} />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline gap-2 mb-0.5">
            <span className="text-sm font-semibold truncate text-gray-900 dark:text-white flex items-center gap-1.5">
              <UsersRound className="w-3.5 h-3.5 text-purple-500" />
              {group.name || t("conversations.disputeGroup")}
            </span>
            <span className="text-[10px] font-medium shrink-0 text-gray-400 dark:text-gray-500">
              {formatRelativeTime(group.lastMessageAt)}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate font-medium mb-1">
            {group.listing?.title || t("conversations.unknownListing")}
          </p>
          {group.lastMessage && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
              {group.lastMessage.length > 50
                ? group.lastMessage.slice(0, 50) + "..."
                : group.lastMessage}
            </p>
          )}
        </div>
        {group.unreadCount > 0 && (
          <div className="w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">
            {group.unreadCount > 9 ? "9+" : group.unreadCount}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Resizable Div Component ──────────────────────────────────────────────────
function ResizableDiv({
  children,
  defaultWidth = 380,
  minWidth = 280,
  maxWidth = 500,
}: {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
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
    <div className="relative flex-shrink-0" style={{ width }}>
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

// ─── Empty State Component ────────────────────────────────────────────────────
function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 dark:from-sky-950/50 dark:to-purple-950/50 flex items-center justify-center mb-4">
        <IoChatbubbleOutline className="w-8 h-8 text-sky-500 dark:text-sky-400" />
      </div>
      <p className="text-slate-500 dark:text-slate-400 font-medium">{title}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
        {message}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TenantMessagesPage() {
  const t = useTranslations("MessagesPage");
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const {
    conversations,
    groups,
    selectedConv,
    selectedGroup,
    isGroupChat,
    isLoading,
    searchQuery,
    filterType,
    unreadCount,
    filtered,
    filteredGroups,
    isMobileView,
    showChat,
    setSearchQuery,
    setFilterType,
    handleSelectConv,
    handleBack,
    handleUpdateInfoRequest,
    handleSendSystemMessage,
  } = useMessages();

  // État local pour suivre le statut de paiement de la réservation sélectionnée
  const [isPaid, setIsPaid] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  // Déterminer la conversation/groupe actif
  const activeConversation = selectedConv;
  const activeGroup = selectedGroup;
  const isActiveGroup = isGroupChat;

  // Vérifier le statut de paiement quand la conversation sélectionnée change
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (
        !activeConversation?.offer?.id ||
        activeConversation.offer?.status !== "ACCEPTED"
      ) {
        setIsPaid(false);
        return;
      }

      setIsCheckingPayment(true);
      try {
        const res = await fetch(
          `/api/bookings/by-offer/${activeConversation.offer.id}`,
        );
        if (res.ok) {
          const data = await res.json();
          setIsPaid(data.isPaid === true);
        } else {
          setIsPaid(false);
        }
      } catch (error) {
        console.error("Erreur vérification paiement:", error);
        setIsPaid(false);
      } finally {
        setIsCheckingPayment(false);
      }
    };

    checkPaymentStatus();
  }, [activeConversation?.offer?.id, activeConversation?.offer?.status]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <TenantHeader />
        <div className="flex items-center justify-center h-[calc(100vh-73px)]">
          <LoadingSpinner
            text={t("loading")}
            size="lg"
            color="primary"
            variant="spinner"
            speed="normal"
          />
        </div>
      </div>
    );
  }

  // Vue mobile
  if (isMobileView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <TenantHeader />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        <div className="h-[calc(100vh-73px)] p-4">
          <div className="h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-slate-700/50 overflow-hidden flex flex-col">
            {showChat && (activeConversation || activeGroup) ? (
              <div className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center gap-3 p-3 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 flex-shrink-0">
                  <button
                    onClick={handleBack}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <IoArrowBackOutline className="w-5 h-5" />
                  </button>
                  {!isActiveGroup && activeConversation ? (
                    <>
                      <Avatar
                        src={activeConversation.otherUser.image}
                        name={activeConversation.otherUser.username}
                        size={36}
                      />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {activeConversation.otherUser.username}
                        </p>
                        <p className="text-xs text-slate-500">
                          {activeConversation.listing.title}
                        </p>
                      </div>
                    </>
                  ) : (
                    activeGroup && (
                      <>
                        <GroupAvatar participants={activeGroup.participants} />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {activeGroup.name ||
                              t("conversations.disputeGroup")}
                          </p>
                          <p className="text-xs text-slate-500">
                            {activeGroup.listing?.title ||
                              t("conversations.unknownListing")}
                          </p>
                        </div>
                      </>
                    )
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatBox
                    conversationId={
                      isActiveGroup
                        ? `group_${activeGroup?.id}`
                        : activeConversation?.id || ""
                    }
                    recipientId={
                      isActiveGroup
                        ? "group"
                        : activeConversation?.otherUser.id || ""
                    }
                    recipientName={
                      isActiveGroup
                        ? activeGroup?.name || t("conversations.disputeGroup")
                        : activeConversation?.otherUser.username || ""
                    }
                    recipientImage={
                      !isActiveGroup
                        ? activeConversation?.otherUser.image
                        : undefined
                    }
                    listingTitle={
                      isActiveGroup
                        ? activeGroup?.listing?.title || ""
                        : activeConversation?.listing.title || ""
                    }
                    offerId={
                      !isActiveGroup ? activeConversation?.offer?.id : undefined
                    }
                    offerStatus={
                      !isActiveGroup
                        ? activeConversation?.offer?.status
                        : undefined
                    }
                    isPaid={isPaid}
                    listing={{
                      id: isActiveGroup
                        ? activeGroup?.listing?.id || ""
                        : activeConversation?.listing.id || "",
                      title: isActiveGroup
                        ? activeGroup?.listing?.title || ""
                        : activeConversation?.listing.title || "",
                      image: isActiveGroup
                        ? activeGroup?.listing?.image
                        : activeConversation?.listing.image,
                      pricePerNight: activeConversation?.listing.pricePerNight,
                      location: activeConversation?.listing.location,
                      bedrooms: activeConversation?.listing.bedrooms,
                      maxGuests: activeConversation?.listing.maxGuests,
                      cleaningFee: activeConversation?.listing.cleaningFee,
                      infoRequestId: activeConversation?.infoRequest?.id,
                      checkIn: activeConversation?.infoRequest?.checkIn,
                      checkOut: activeConversation?.infoRequest?.checkOut,
                      guests: activeConversation?.infoRequest?.guests,
                    }}
                    userRole="TENANT"
                    isGroup={isActiveGroup}
                    groupParticipants={activeGroup?.participants}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 flex-shrink-0">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                    {t("title")}
                  </h1>
                  <div className="mt-3">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2">
                      <IoSearchOutline className="text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t("searchPlaceholder")}
                        className="flex-1 bg-transparent border-none outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filtered.length === 0 && filteredGroups.length === 0 ? (
                    <EmptyState
                      title={
                        searchQuery ? t("noResults") : t("noConversations")
                      }
                      message={
                        searchQuery
                          ? t("noResultsHint")
                          : t("noConversationsHint")
                      }
                    />
                  ) : (
                    <div className="py-2">
                      {filteredGroups.map((group) => (
                        <GroupConvItem
                          key={`group_${group.id}`}
                          group={group}
                          isActive={activeGroup?.id === group.id}
                          onClick={() => handleSelectConv(group, true)}
                          t={t}
                        />
                      ))}
                      {filtered.map((conv) => (
                        <ConvItem
                          key={conv.id}
                          conv={conv}
                          isActive={activeConversation?.id === conv.id}
                          onClick={() => handleSelectConv(conv, false)}
                          t={t}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vue desktop
  const hasInfoRequest = !!activeConversation?.infoRequest && !isActiveGroup;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <TenantHeader />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="h-[calc(100vh-90px)] p-4 md:p-6 lg:p-8 overflow-hidden">
        <div className="h-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 dark:border-slate-700/50 overflow-hidden -mt-4">
          <div className="flex h-full overflow-hidden">
            {/* Colonne gauche - Liste des messages (resizable) */}
            <ResizableDiv defaultWidth={380} minWidth={280} maxWidth={500}>
              <div className="h-full border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex-shrink-0">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                    {t("conversationsTitle")}
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
                      {t("filters.all")} ({conversations.length + groups.length}
                      )
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
                      {t("filters.unread")} ({unreadCount})
                    </button>
                    <button
                      onClick={() => setFilterType("groups")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                        filterType === "groups"
                          ? "bg-purple-500 text-white shadow-md"
                          : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      <UsersRound className="w-3 h-3" />
                      {t("filters.groups")} ({groups.length})
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
                        placeholder={t("searchPlaceholder")}
                        className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  {filtered.length === 0 && filteredGroups.length === 0 ? (
                    <EmptyState
                      title={
                        searchQuery ? t("noResults") : t("noConversations")
                      }
                      message={
                        searchQuery
                          ? t("noResultsHint")
                          : t("noConversationsHint")
                      }
                    />
                  ) : (
                    <div className="space-y-1">
                      {filteredGroups.map((group) => (
                        <GroupConvItem
                          key={`group_${group.id}`}
                          group={group}
                          isActive={activeGroup?.id === group.id}
                          onClick={() => handleSelectConv(group, true)}
                          t={t}
                        />
                      ))}
                      {filtered.map((conv) => (
                        <ConvItem
                          key={conv.id}
                          conv={conv}
                          isActive={activeConversation?.id === conv.id}
                          onClick={() => handleSelectConv(conv, false)}
                          t={t}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ResizableDiv>

            {/* Colonne droite - Chat + Carte intégrée */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {activeConversation || activeGroup ? (
                <div className="flex-1 flex gap-4 p-4 overflow-hidden">
                  {/* ChatBox */}
                  <div className="flex-1 overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                    <ChatBox
                      conversationId={
                        isActiveGroup
                          ? `group_${activeGroup?.id}`
                          : activeConversation?.id || ""
                      }
                      recipientId={
                        isActiveGroup
                          ? "group"
                          : activeConversation?.otherUser.id || ""
                      }
                      recipientName={
                        isActiveGroup
                          ? activeGroup?.name || t("conversations.disputeGroup")
                          : activeConversation?.otherUser.username || ""
                      }
                      recipientImage={
                        !isActiveGroup
                          ? activeConversation?.otherUser.image
                          : undefined
                      }
                      recipientRole={
                        !isActiveGroup
                          ? activeConversation?.otherUser.role
                          : undefined
                      }
                      listingTitle={
                        isActiveGroup
                          ? activeGroup?.listing?.title || ""
                          : activeConversation?.listing.title || ""
                      }
                      offerId={
                        !isActiveGroup
                          ? activeConversation?.offer?.id
                          : undefined
                      }
                      offerStatus={
                        !isActiveGroup
                          ? activeConversation?.offer?.status
                          : undefined
                      }
                      isPaid={isPaid}
                      listing={{
                        id: isActiveGroup
                          ? activeGroup?.listing?.id || ""
                          : activeConversation?.listing.id || "",
                        title: isActiveGroup
                          ? activeGroup?.listing?.title || ""
                          : activeConversation?.listing.title || "",
                        image: isActiveGroup
                          ? activeGroup?.listing?.image
                          : activeConversation?.listing.image,
                        pricePerNight:
                          activeConversation?.listing.pricePerNight,
                        location: activeConversation?.listing.location,
                        bedrooms: activeConversation?.listing.bedrooms,
                        maxGuests: activeConversation?.listing.maxGuests,
                        cleaningFee: activeConversation?.listing.cleaningFee,
                        infoRequestId: activeConversation?.infoRequest?.id,
                        checkIn: activeConversation?.infoRequest?.checkIn,
                        checkOut: activeConversation?.infoRequest?.checkOut,
                        guests: activeConversation?.infoRequest?.guests,
                      }}
                      userRole="TENANT"
                      isGroup={isActiveGroup}
                      groupParticipants={activeGroup?.participants}
                    />
                  </div>

                  {/* Carte du logement (uniquement pour les conversations privées avec infoRequest) */}
                  {hasInfoRequest && activeConversation?.infoRequest && (
                    <div className="w-[280px] flex-shrink-0 overflow-y-auto">
                      <EditableBookingCard
                        listing={activeConversation.listing}
                        infoRequestId={activeConversation.infoRequest.id}
                        initialCheckIn={activeConversation.infoRequest.checkIn}
                        initialCheckOut={
                          activeConversation.infoRequest.checkOut
                        }
                        initialGuests={activeConversation.infoRequest.guests}
                        onUpdate={handleUpdateInfoRequest}
                        onSendSystemMessage={handleSendSystemMessage}
                        isOfferAccepted={
                          activeConversation.offer?.status === "ACCEPTED"
                        }
                        offerStatus={activeConversation.offer?.status}
                        isPaid={isPaid}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-sm">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 dark:from-sky-950/50 dark:to-purple-950/50 flex items-center justify-center mx-auto mb-4">
                      <IoChatbubbleOutline className="w-10 h-10 text-sky-500 dark:text-sky-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                      {t("selectConversation")}
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      {t("selectConversationHint")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
