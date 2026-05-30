// app/[locale]/dashboard/owner/messages/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ChatBox } from "@/components/ui/chat/ChatBox";
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
  Clock,
  AlertCircle,
  Timer,
  FileText,
  Zap,
  Info,
  Shield,
  TrendingUp,
  HelpCircle,
  UsersRound,
} from "lucide-react";
import { TbHomePlus, TbMessageOff } from "react-icons/tb";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
  X,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;
const pipListingImage = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

// ─── Fonction pour ouvrir le contrat ─────────────────────────────────────────
const openContract = (contractUrl: string) => {
  if (!contractUrl) return;

  if (contractUrl.startsWith("data:application/pdf")) {
    try {
      const base64Data = contractUrl.split(",")[1];
      const binaryData = atob(base64Data);
      const arrayBuffer = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        arrayBuffer[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error("Erreur ouverture PDF:", error);
      window.open(contractUrl, "_blank");
    }
  } else {
    window.open(contractUrl, "_blank");
  }
};

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
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      {" "}
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${styles[type]} text-white`}
      >
        {type === "success" ? (
          <CheckCircleIcon className="w-5 h-5" />
        ) : type === "error" ? (
          <AlertCircleIcon className="w-5 h-5" />
        ) : (
          <Info className="w-5 h-5" />
        )}
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
  size = 40,
}: {
  src?: string;
  name: string;
  size?: number;
}) {
  const [err, setErr] = useState(false);
  const url = src ? pipAvatar(src) : null;
  const safeName = name || "?";

  return (
    <div
      className="relative flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold text-white border-2 border-white dark:border-slate-900 shadow-md"
      style={{
        width: size,
        height: size,
        background:
          !url || err
            ? "linear-gradient(135deg, #0ea5e9, #6366f1, #a855f7)"
            : "#e2e8f0",
        fontSize: size * 0.36,
      }}
    >
      {url && !err ? (
        <img
          src={url}
          alt={safeName}
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        safeName.charAt(0).toUpperCase()
      )}
    </div>
  );
}

// ─── Group Avatar Component (3 photos inline avec tooltip) ───────────────────
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
            className="relative w-10 h-10 rounded-full overflow-hidden border-1 border-white dark:border-slate-900 shadow-md"
            style={{ zIndex: visibleParticipants.length - idx }}
          >
            {p.image ? (
              <img
                src={pipAvatar(p.image)}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                {getDisplayName(p).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="relative w-10 h-10 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
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

// ─── Empty Messages State ─────────────────────────────────────────────────────
function EmptyMessagesState({ t, locale }: { t: any; locale: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 dark:from-sky-950/50 dark:to-purple-950/50 flex items-center justify-center shadow-lg">
          <TbMessageOff size={48} className="text-sky-500 dark:text-sky-400" />
        </div>
      </div>
      <h3 className="text-2xl font-headline font-bold bg-gradient-to-r from-sky-600 to-purple-600 dark:from-sky-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
        {t("empty.title")}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
        {t("empty.description")}
      </p>
      <Link
        href={`/${locale}/dashboard/owner/listings`}
        className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <TbHomePlus
          size={18}
          className="group-hover:rotate-12 transition-transform duration-300"
        />
        {t("empty.button")}
        <TrendingUp
          size={16}
          className="group-hover:translate-x-1 transition-transform duration-300"
        />
      </Link>
      <Link
        href={`/${locale}/help`}
        className="mt-6 text-xs text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex items-center gap-1"
      >
        <HelpCircle size={12} />
        {t("empty.helpLink")}
      </Link>
    </div>
  );
}

// ─── Conversation List Component (avec tooltip corrigé) ──────────────────────
function ConversationList({
  conversations,
  groups,
  onSelect,
  selectedId,
  t,
}: {
  conversations: Conversation[];
  groups: GroupConversation[];
  onSelect: (conv: Conversation | GroupConversation, isGroup: boolean) => void;
  selectedId?: string;
  t: any;
}) {
  const [filter, setFilter] = useState<"all" | "groups" | "private">("all");

  const filteredGroups = filter === "all" || filter === "groups" ? groups : [];
  const filteredConversations =
    filter === "all" || filter === "private" ? conversations : [];

  return (
    <div className="h-full bg-white dark:bg-slate-900">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {t("title")}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {conversations.length + groups.length} {t("conversations.count")}
          {conversations.length + groups.length > 1 ? "s" : ""}
        </p>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === "all"
                ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {t("filters.all")}
          </button>
          <button
            onClick={() => setFilter("groups")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              filter === "groups"
                ? "bg-purple-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {t("filters.groups")}
            {groups.length > 0 && (
              <span
                className={`ml-0.5 text-[10px] ${filter === "groups" ? "text-white/80" : "text-slate-400"}`}
              >
                ({groups.length})
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("private")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              filter === "private"
                ? "bg-sky-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {t("filters.private")}
            {conversations.length > 0 && (
              <span
                className={`ml-0.5 text-[10px] ${filter === "private" ? "text-white/80" : "text-slate-400"}`}
              >
                ({conversations.length})
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100%-105px)]">
        {filteredGroups.length > 0 && (
          <>
            <div className="px-4 pt-3 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("conversations.groups")}
              </p>
            </div>
            {filteredGroups.map((group) => (
              <button
                key={`group_${group.id}`}
                onClick={() => onSelect(group, true)}
                className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 ${
                  selectedId === `group_${group.id}`
                    ? "bg-purple-50 dark:bg-purple-900/20 border-l-4 border-l-purple-500"
                    : ""
                }`}
              >
                <div className="flex gap-3">
                  <GroupAvatar participants={group.participants} />
                  <div className="flex-1 min-w-0">
                    {/*  Tooltip corrigé pour afficher "Admin" au lieu du username */}
                    <div className="relative group/tooltip">
                      <p className="font-medium text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        <UsersRound className="w-3.5 h-3.5 text-purple-500" />
                        {group.name || t("conversations.disputeGroup")}
                      </p>
                      {group.participants && group.participants.length > 0 && (
                        <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-lg">
                          {group.participants
                            .map((p) =>
                              p.role === "ADMIN" ? "Admin" : p.username,
                            )
                            .join(", ")}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">
                      {group.listing?.title ||
                        t("conversations.unknownListing")}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {group.lastMessage && (
                        <p className="text-xs text-slate-400 truncate flex-1">
                          {group.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </>
        )}

        {filteredConversations.length > 0 && (
          <>
            {filteredGroups.length > 0 && (
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t("conversations.messages")}
                </p>
              </div>
            )}
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv, false)}
                className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 ${
                  selectedId === conv.id
                    ? "bg-sky-50 dark:bg-sky-900/20 border-l-4 border-l-sky-500"
                    : ""
                }`}
              >
                <div className="flex gap-3">
                  <Avatar
                    src={conv.otherUser.image}
                    name={conv.otherUser.username}
                    size={48}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {conv.otherUser.username}
                      </p>
                      {conv.otherUser.role === "ADMIN" && (
                        <span className="px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[9px] font-bold">
                          {t("roleAdmin")}
                        </span>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className="min-w-[20px] h-5 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">
                      {conv.listing.title}
                    </p>
                    {conv.offer && conv.offer.status === "PENDING" && (
                      <p className="text-[10px] text-amber-500 font-medium mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {t("offer.pending")}
                      </p>
                    )}
                    {conv.lastMessage && (
                      <p className="text-xs text-slate-400 truncate mt-1">
                        {conv.lastMessage}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </>
        )}

        {filteredGroups.length === 0 && filteredConversations.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            {filter === "all"
              ? t("conversations.empty")
              : filter === "groups"
                ? t("empty.noGroups")
                : t("empty.noPrivate")}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Listing Image Component ─────────────────────────────────────────────────
function ListingImage({
  listing,
  className = "",
}: {
  listing: { title: string; image?: string };
  className?: string;
}) {
  const [err, setErr] = useState(false);
  const imageUrl = listing.image ? pipListingImage(listing.image) : null;
  return (
    <div
      className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}
    >
      {imageUrl && !err ? (
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Home className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
      )}
    </div>
  );
}

// ─── Interfaces ──────────────────────────────────────────────────────────────
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
    rating?: number;
  };
  otherUser: {
    id: string;
    username: string;
    image?: string;
    isVerified?: boolean;
    reliabilityScore?: number;
    averageRating?: number;
    totalStays?: number;
    role?: string;
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
    isPaid?: boolean;
    contractUrl?: string;
  };
  lastMessage?: string;
  unreadCount: number;
}

interface GroupConversation {
  id: string;
  name: string;
  listing?: {
    id: string;
    title: string;
    image?: string;
  };
  participants: {
    id: string;
    username: string;
    image?: string;
    role?: string;
  }[];
  dispute?: {
    id: string;
    status: string;
    type: string;
  };
  lastMessage?: string;
  unreadCount: number;
  status: string;
}

export default function OwnerMessagesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const t = useTranslations("MessagesPage");
  const locale = (params.locale as string) || "fr";
  const searchParams = useSearchParams();
  const urlConversationId = searchParams.get("conversationId");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<GroupConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupConversation | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setToast({ message, type });
  };

  const markConversationAsRead = (convId: string, isGroup: boolean) => {
    if (isGroup) {
      setGroups((prev) =>
        prev.map((group) =>
          group.id === convId ? { ...group, unreadCount: 0 } : group,
        ),
      );
    } else {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === convId ? { ...conv, unreadCount: 0 } : conv,
        ),
      );
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadConversations();
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedConv || selectedGroup) return;

    if (!urlConversationId) return;

    console.log(" Tentative ouverture depuis URL:", {
      urlConversationId,
      convLength: conversations.length,
      groupLength: groups.length,
    });

    // Cas: Groupe
    if (urlConversationId.startsWith("group_")) {
      const groupToOpen = groups.find(
        (g) => `group_${g.id}` === urlConversationId,
      );
      if (groupToOpen) {
        console.log(" Groupe trouvé, sélection:", groupToOpen.id);
        setSelectedGroup(groupToOpen);
        markConversationAsRead(groupToOpen.id, true);
        if (isMobileView) setShowChat(true);
      }
      return;
    }

    if (conversations.length === 0) {
      console.log(" Conversations pas encore chargées, on attend...");
      return;
    }

    const conversationToOpen = conversations.find(
      (c) => c.id === urlConversationId,
    );
    if (conversationToOpen) {
      console.log(" Conversation trouvée, sélection:", conversationToOpen.id);
      setSelectedConv(conversationToOpen);
      markConversationAsRead(conversationToOpen.id, false);
      if (isMobileView) setShowChat(true);

      // NETTOYER L'URL SEULEMENT APRÈS AVOIR SÉLECTIONNÉ
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    } else {
      console.log(" Conversation non trouvée avec ID:", urlConversationId);
    }
  }, [
    urlConversationId,
    conversations,
    groups,
    selectedConv,
    selectedGroup,
    isMobileView,
  ]);
  const loadConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const validData = data.filter(
        (c: Conversation) => c && c.otherUser && c.otherUser.id,
      );
      setConversations(validData);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const loadGroups = async () => {
    try {
      const res = await fetch("/api/conversations/groups");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGroups(data);
    } catch (error) {
      console.error("Error loading groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (
    conv: Conversation | GroupConversation,
    isGroup: boolean,
  ) => {
    markConversationAsRead(conv.id, isGroup);

    if (isGroup) {
      setSelectedGroup(conv as GroupConversation);
      setSelectedConv(null);
    } else {
      setSelectedConv(conv as Conversation);
      setSelectedGroup(null);
    }
    if (isMobileView) setShowChat(true);
  };

  const handleBack = () => {
    setShowChat(false);
    setSelectedConv(null);
    setSelectedGroup(null);
  };

  const handleAcceptOffer = async () => {
    if (!selectedConv?.offer?.id) {
      showToast(t("toast.noOffer"), "error");
      return;
    }
    if (selectedConv.offer.status !== "PENDING") {
      showToast(t("toast.offerAlreadyProcessed"), "error");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/offers/${selectedConv.offer.id}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        showToast(t("toast.offerAccepted"), "success");
        setSelectedConv({
          ...selectedConv,
          offer: { ...selectedConv.offer, status: "ACCEPTED" },
        });
        await loadConversations();
      } else {
        showToast(data.error || t("toast.acceptError"), "error");
      }
    } catch (error) {
      showToast(t("toast.connectionError"), "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectOffer = async () => {
    if (!selectedConv?.offer?.id) {
      showToast(t("toast.noOffer"), "error");
      return;
    }
    if (selectedConv.offer.status !== "PENDING") {
      showToast(t("toast.offerAlreadyProcessed"), "error");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/offers/${selectedConv.offer.id}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        showToast(t("toast.offerRejected"), "info");
        setSelectedConv({
          ...selectedConv,
          offer: { ...selectedConv.offer, status: "REJECTED" },
        });
        await loadConversations();
      } else {
        showToast(data.error || t("toast.rejectError"), "error");
      }
    } catch (error) {
      showToast(t("toast.connectionError"), "error");
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
          text={t("loading")}
          speed="normal"
        />
      </div>
    );
  }

  if (conversations.length === 0 && groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)] bg-white dark:bg-slate-900/0 overflow-hidden">
        <EmptyMessagesState t={t} locale={locale} />
      </div>
    );
  }

  // Vue mobile
  if (isMobileView) {
    return (
      <div className="h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        {showChat && (selectedConv || selectedGroup) ? (
          <>
            <div className="flex items-center gap-3 p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              {selectedConv ? (
                <>
                  <Avatar
                    src={selectedConv.otherUser.image}
                    name={selectedConv.otherUser.username}
                    size={32}
                  />
                  <div>
                    <p className="font-medium">
                      {selectedConv.otherUser.username}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedConv.listing.title}
                    </p>
                  </div>
                </>
              ) : (
                selectedGroup && (
                  <>
                    <GroupAvatar participants={selectedGroup.participants} />
                    <div>
                      <p className="font-medium">
                        {selectedGroup.name || t("conversations.disputeGroup")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedGroup.listing?.title ||
                          t("conversations.unknownListing")}
                      </p>
                    </div>
                  </>
                )
              )}
            </div>
            <ChatBox
              conversationId={selectedConv?.id || `group_${selectedGroup?.id}`}
              recipientId={selectedConv?.otherUser.id || "group"}
              recipientName={
                selectedConv?.otherUser.username ||
                selectedGroup?.name ||
                t("conversations.disputeGroup")
              }
              recipientImage={selectedConv?.otherUser.image}
              recipientRole={selectedConv?.otherUser.role}
              listingTitle={
                selectedConv?.listing.title ||
                selectedGroup?.listing?.title ||
                ""
              }
              listing={{
                id:
                  selectedConv?.listing.id || selectedGroup?.listing?.id || "",
                title:
                  selectedConv?.listing.title ||
                  selectedGroup?.listing?.title ||
                  "",
                image:
                  selectedConv?.listing.image || selectedGroup?.listing?.image,
                pricePerNight: selectedConv?.listing.pricePerNight,
                location: selectedConv?.listing.location,
                bedrooms: selectedConv?.listing.bedrooms,
                maxGuests: selectedConv?.listing.maxGuests,
                cleaningFee: selectedConv?.listing.cleaningFee,
                infoRequestId: selectedConv?.infoRequest?.id,
              }}
              userRole="PROPERTY_OWNER"
              isGroup={!!selectedGroup}
              groupParticipants={selectedGroup?.participants}
            />
          </>
        ) : (
          <ConversationList
            conversations={conversations}
            groups={groups}
            onSelect={handleSelectConversation}
            selectedId={
              selectedConv?.id ||
              (selectedGroup ? `group_${selectedGroup.id}` : undefined)
            }
            t={t}
          />
        )}
      </div>
    );
  }

  // Vue desktop
  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-[25%] min-w-[260px] bg-white dark:bg-slate-900 flex flex-col border-r border-slate-200 dark:border-slate-700">
        <ConversationList
          conversations={conversations}
          groups={groups}
          onSelect={handleSelectConversation}
          selectedId={
            selectedConv?.id ||
            (selectedGroup ? `group_${selectedGroup.id}` : undefined)
          }
          t={t}
        />
      </div>

      <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 flex flex-col mt-3">
        {selectedConv || selectedGroup ? (
          <ChatBox
            conversationId={selectedConv?.id || `group_${selectedGroup?.id}`}
            recipientId={selectedConv?.otherUser.id || "group"}
            recipientName={
              selectedConv?.otherUser.username ||
              selectedGroup?.name ||
              t("conversations.disputeGroup")
            }
            recipientImage={selectedConv?.otherUser.image}
            recipientRole={selectedConv?.otherUser.role}
            listingTitle={
              selectedConv?.listing.title || selectedGroup?.listing?.title || ""
            }
            listing={{
              id: selectedConv?.listing.id || selectedGroup?.listing?.id || "",
              title:
                selectedConv?.listing.title ||
                selectedGroup?.listing?.title ||
                "",
              image:
                selectedConv?.listing.image || selectedGroup?.listing?.image,
              pricePerNight: selectedConv?.listing.pricePerNight,
              location: selectedConv?.listing.location,
              bedrooms: selectedConv?.listing.bedrooms,
              maxGuests: selectedConv?.listing.maxGuests,
              cleaningFee: selectedConv?.listing.cleaningFee,
              infoRequestId: selectedConv?.infoRequest?.id,
            }}
            userRole="PROPERTY_OWNER"
            isGroup={!!selectedGroup}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium">{t("selectConversation")}</p>
              <p className="text-sm mt-1">{t("selectConversationHint")}</p>
            </div>
          </div>
        )}
      </div>

      {selectedConv && !selectedGroup && (
        <div className="w-[30%] min-w-[280px] bg-slate-50 dark:bg-slate-800/30 border-l border-slate-200 dark:border-slate-700 overflow-y-auto">
          <div className="p-5 space-y-6">
            {/* Propriété */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Home className="w-3 h-3" /> {t("sidebar.property")}
              </h4>
              <div className="rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="relative h-32 w-full">
                  <ListingImage
                    listing={selectedConv.listing}
                    className="w-full h-full"
                  />
                  {selectedConv.listing.pricePerNight && (
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur px-2 py-1 rounded-lg text-[11px] font-bold text-white shadow-sm">
                      {selectedConv.listing.pricePerNight} DT /{" "}
                      {t("sidebar.night")}
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-white">
                      {selectedConv.listing.rating ?? 0}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h5 className="text-sm font-bold font-headline text-slate-900 dark:text-white">
                    {selectedConv.listing.title}
                  </h5>
                  {selectedConv.listing.location && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedConv.listing.location}
                    </p>
                  )}
                  {selectedConv.infoRequest && (
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(
                          selectedConv.infoRequest.checkIn,
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(
                          selectedConv.infoRequest.checkOut,
                        ).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {selectedConv.infoRequest.guests} {t("sidebar.guests")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profil Locataire */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <User className="w-3 h-3" /> {t("sidebar.tenantProfile")}
              </h4>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    src={selectedConv.otherUser.image}
                    name={selectedConv.otherUser.username}
                    size={40}
                  />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {selectedConv.otherUser.username}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Verified className="w-3.5 h-3.5 text-sky-500" />
                      <span className="text-[10px] text-slate-500">
                        {selectedConv.otherUser.isVerified
                          ? t("sidebar.verified")
                          : t("sidebar.notVerified")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t("sidebar.reliabilityScore")}
                  </span>
                  <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                    {selectedConv.otherUser.reliabilityScore ?? 0}/100
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full"
                    style={{
                      width: `${selectedConv.otherUser.reliabilityScore ?? 0}%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-2">
                  <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[10px] text-slate-400">
                      {t("sidebar.reviews")}
                    </p>
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold">
                        {selectedConv.otherUser.averageRating ?? 0}
                      </span>
                    </div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[10px] text-slate-400">
                      {t("sidebar.stays")}
                    </p>
                    <p className="text-xs font-bold mt-1">
                      {selectedConv.otherUser.totalStays ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Offre */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Tag className="w-3 h-3" /> {t("sidebar.bookingOffer")}
              </h4>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                {selectedConv.offer ? (
                  <div className="flex flex-col space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Wallet className="w-3 h-3" />{" "}
                        {t("sidebar.totalAmount")}
                      </span>
                      <span className="text-lg font-bold text-sky-600 dark:text-sky-400">
                        {selectedConv.offer.totalPrice.toLocaleString("fr-FR")}{" "}
                        TND
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {t("sidebar.status")}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          selectedConv.offer.status === "PENDING"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : selectedConv.offer.status === "ACCEPTED"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : selectedConv.offer.status === "REJECTED"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {selectedConv.offer.status === "PENDING" && (
                          <>
                            <Clock className="w-3 h-3" /> {t("sidebar.pending")}
                          </>
                        )}
                        {selectedConv.offer.status === "ACCEPTED" && (
                          <>
                            <CheckCircle className="w-3 h-3" />{" "}
                            {t("sidebar.accepted")}
                          </>
                        )}
                        {selectedConv.offer.status === "REJECTED" && (
                          <>
                            <XCircle className="w-3 h-3" />{" "}
                            {t("sidebar.rejected")}
                          </>
                        )}
                        {selectedConv.offer.status === "EXPIRED" && (
                          <>
                            <AlertCircle className="w-3 h-3" />{" "}
                            {t("sidebar.expired")}
                          </>
                        )}
                      </span>
                    </div>

                    {/* Bouton Voir contrat */}
                    {selectedConv.offer?.isPaid &&
                      selectedConv.offer?.contractUrl && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                          <button
                            onClick={() =>
                              openContract(selectedConv.offer!.contractUrl!)
                            }
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                          >
                            <FileText className="w-4 h-4" />
                            {t("actions.viewContract")}
                          </button>
                        </div>
                      )}

                    {selectedConv.offer.expiresAt &&
                      selectedConv.offer.status === "PENDING" && (
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Timer className="w-3 h-3" />{" "}
                            {t("sidebar.expiration")}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(
                              selectedConv.offer.expiresAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">
                      {t("sidebar.noOffer")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Zap className="w-3 h-3" /> {t("sidebar.quickActions")}
              </h4>
              <button
                onClick={handleAcceptOffer}
                disabled={
                  isProcessing ||
                  !selectedConv?.offer ||
                  selectedConv.offer.status !== "PENDING"
                }
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  selectedConv?.offer?.status === "PENDING" && !isProcessing
                    ? "bg-gradient-to-r from-sky-600 to-purple-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-700 hover:to-purple-700 active:scale-[0.98]"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                }`}
              >
                {isProcessing ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {t("actions.accept")}
              </button>
              <button
                onClick={handleRejectOffer}
                disabled={
                  isProcessing ||
                  !selectedConv?.offer ||
                  selectedConv.offer.status !== "PENDING"
                }
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border ${
                  selectedConv?.offer?.status === "PENDING" && !isProcessing
                    ? "bg-white dark:bg-slate-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-[0.98] border-red-200 dark:border-red-800"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border-slate-300 dark:border-slate-600"
                }`}
              >
                <XCircle className="w-4 h-4" /> {t("actions.reject")}
              </button>
              {(!selectedConv?.offer ||
                selectedConv.offer.status !== "PENDING") && (
                <div className="flex items-center justify-center gap-1 mt-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                  <Info className="w-3 h-3 text-slate-400" />
                  <p className="text-[10px] text-slate-400 text-center">
                    {!selectedConv?.offer
                      ? t("messages.noOffer")
                      : selectedConv.offer.status === "ACCEPTED"
                        ? t("messages.alreadyAccepted")
                        : selectedConv.offer.status === "REJECTED"
                          ? t("messages.alreadyRejected")
                          : t("messages.expired")}
                  </p>
                </div>
              )}
            </div>

            {/* Note */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center gap-1">
                <Shield className="w-3 h-3 text-slate-400" />
                <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                  {t("sidebar.note")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
