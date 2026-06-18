// components/chat/FloatingChat.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { MessageSquare, X, Minimize2 } from "lucide-react";
import { ChatBox } from "./ChatBox";
import { useTranslations } from "next-intl";
// ─── pip helper ───────────────────────────────────────────────────────────────
const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

interface Conversation {
  id: string;
  listing: { id: string; title: string };
  otherUser: {
    id: string;
    username: string;
    image?: string;
  };
  lastMessage?: string;
  unreadCount: number;
}

// Taille d'une fenêtre de chat
const CHAT_WIDTH = 380;
const CHAT_HEIGHT = 550;
const MINIMIZED_WIDTH = 240;
const MINIMIZED_HEIGHT = 52; // hauteur d'une fenêtre minimisée
const GAP = 16; // espace entre les fenêtres
const BOTTOM_OFFSET = 20; // distance du bas

// Composant pour une fenêtre de chat individuelle
function ChatWindow({
  conversation,
  onClose,
  onMinimize,
  isMinimized,
  rightOffset,
  bottomOffset, // pour l'empilement vertical des minimisées
}: {
  conversation: Conversation;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  rightOffset: number;
  bottomOffset?: number; // pour l'empilement vertical
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [customPosition, setCustomPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const target = e.currentTarget.parentElement as HTMLElement;
    const rect = target.getBoundingClientRect();
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setCustomPosition({ left: rect.left, top: rect.top });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && customPosition) {
        setCustomPosition({
          left: e.clientX - dragStart.x,
          top: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart, customPosition],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const getStyle = (): React.CSSProperties => {
    if (customPosition && !isMinimized) {
      return {
        position: "fixed",
        left: customPosition.left,
        top: customPosition.top,
        width: CHAT_WIDTH,
        height: CHAT_HEIGHT,
        zIndex: 50,
      };
    }

    if (isMinimized) {
      return {
        position: "fixed",
        right: rightOffset,
        bottom: bottomOffset !== undefined ? bottomOffset : BOTTOM_OFFSET,
        width: MINIMIZED_WIDTH,
        height: MINIMIZED_HEIGHT,
        zIndex: 50,
      };
    }

    return {
      position: "fixed",
      right: rightOffset,
      bottom: BOTTOM_OFFSET,
      width: CHAT_WIDTH,
      height: CHAT_HEIGHT,
      zIndex: 50,
    };
  };

  if (isMinimized) {
    return (
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        style={getStyle()}
      >
        <div
          className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium truncate max-w-[150px]">
              {conversation.otherUser.username}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onMinimize}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
      style={getStyle()}
    >
      {/* Header personnalisé pour la fenêtre de chat */}
      <div
        className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
            {conversation.otherUser.image ? (
              <img
                src={pipAvatar(conversation.otherUser.image)}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold">
                {conversation.otherUser.username?.charAt(0).toUpperCase() ||
                  "?"}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">
              {conversation.otherUser.username}
            </p>
            <p className="text-[10px] text-white/70">
              {conversation.listing.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimize}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ChatBox sans header */}
      <div
        className="flex-1 overflow-hidden"
        style={{ height: CHAT_HEIGHT - 60 }}
      >
        <ChatBox
          conversationId={conversation.id}
          recipientId={conversation.otherUser.id}
          recipientName={conversation.otherUser.username || "Utilisateur"}
          recipientImage={conversation.otherUser.image}
          listingTitle={conversation.listing.title}
          userRole="TENANT"
          hideHeader={true}
        />
      </div>
    </div>
  );
}

// Composant ConversationList intégré
function ConversationList({
  conversations,
  onSelect,
  selectedId,
  t,
}: {
  conversations: Conversation[];
  onSelect: (conv: Conversation) => void;
  selectedId?: string;
  t: any;
}) {
  const safeConversations = conversations.filter((conv) => {
    if (!conv) return false;
    if (!conv.otherUser) return false;
    if (!conv.otherUser.id) return false;
    if (typeof conv.otherUser.username !== "string") return false;
    return true;
  });

  if (safeConversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">{t("empty.noConversations")}</p>
        <p className="text-xs mt-1">{t("empty.messagesWillAppear")}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {safeConversations.map((conv) => {
        const username = conv.otherUser.username || t("fallback.user");
        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 ${
              selectedId === conv.id ? "bg-indigo-50 dark:bg-indigo-900/20" : ""
            }`}
          >
            <div className="flex gap-3">
              <Avatar src={conv.otherUser.image} name={username} size={40} />

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                    {username}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {conv.listing.title}
                </p>
                {conv.lastMessage && (
                  <p className="text-xs text-slate-400 truncate mt-1">
                    {conv.lastMessage}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Composant Avatar avec PIP
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
  const firstChar = safeName.charAt(0).toUpperCase();

  return (
    <div
      className="relative flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold text-white"
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
        firstChar
      )}
    </div>
  );
}

export function FloatingChat() {
  const { user } = useUser();
  const t = useTranslations("FloatingChat");
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [openChats, setOpenChats] = useState<
    Map<string, { conv: Conversation; minimized: boolean }>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  // Fonction pour charger les conversations (réutilisable)
  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();

      const validData = data.filter((c: Conversation) => {
        if (!c) return false;
        if (!c.otherUser) return false;
        if (!c.otherUser.id) return false;
        if (typeof c.otherUser.username !== "string") return false;
        return true;
      });

      setConversations(validData);
      const unread = validData.reduce(
        (acc: number, conv: Conversation) => acc + (conv.unreadCount || 0),
        0,
      );
      setTotalUnread(unread);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Chargement initial des conversations
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  // Écouter l'événement du header pour ouvrir le chat (liste)
  useEffect(() => {
    const handleOpenChat = () => {
      console.log("📱 Opening floating chat from header event");
      setIsOpen(true);
    };

    window.addEventListener("open-floating-chat", handleOpenChat);

    return () => {
      window.removeEventListener("open-floating-chat", handleOpenChat);
    };
  }, []);

  // Écouter l'événement pour ouvrir une conversation spécifique depuis le dropdown
  useEffect(() => {
    const handleOpenConversation = async (event: CustomEvent) => {
      const { conversationId } = event.detail;
      console.log("📱 Opening conversation from dropdown:", conversationId);

      if (conversations.length === 0) {
        await loadConversations();
      }

      const conv = conversations.find((c) => c.id === conversationId);
      if (conv) {
        openChatWindow(conv);
      } else {
        console.error("Conversation not found:", conversationId);
        await loadConversations();
        const reloadedConv = conversations.find((c) => c.id === conversationId);
        if (reloadedConv) {
          openChatWindow(reloadedConv);
        }
      }
    };

    window.addEventListener(
      "open-floating-chat-conversation",
      handleOpenConversation as EventListener,
    );

    return () => {
      window.removeEventListener(
        "open-floating-chat-conversation",
        handleOpenConversation as EventListener,
      );
    };
  }, [conversations, loadConversations]);

  const openChatWindow = (conv: Conversation) => {
    setOpenChats((prev) => {
      const newMap = new Map(prev);
      if (!newMap.has(conv.id)) {
        newMap.set(conv.id, { conv, minimized: false });
      } else {
        const existing = newMap.get(conv.id);
        if (existing?.minimized) {
          newMap.set(conv.id, { ...existing, minimized: false });
        }
      }
      return newMap;
    });
    setIsOpen(false);
  };

  const closeChatWindow = (convId: string) => {
    setOpenChats((prev) => {
      const newMap = new Map(prev);
      newMap.delete(convId);
      return newMap;
    });
  };

  const toggleMinimize = (convId: string) => {
    setOpenChats((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(convId);
      if (existing) {
        newMap.set(convId, { ...existing, minimized: !existing.minimized });
      }
      return newMap;
    });
  };

  const handleSelectConversation = (conv: Conversation) => {
    openChatWindow(conv);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Calculer les positions pour les fenêtres ouvertes (alignées horizontalement)
  const getHorizontalOffsets = (windowCount: number, width: number) => {
    const offsets = [];
    for (let i = 0; i < windowCount; i++) {
      offsets.push(BOTTOM_OFFSET + i * (width + GAP));
    }
    return offsets;
  };

  // Calculer les positions pour les fenêtres minimisées (empilées verticalement)
  const getVerticalOffsets = (windowCount: number, index: number) => {
    // Empiler de bas en haut : la plus récente en bas
    return BOTTOM_OFFSET + index * (MINIMIZED_HEIGHT + GAP);
  };

  // Séparer les fenêtres minimisées et non minimisées
  const activeWindows = Array.from(openChats.entries())
    .filter(([_, { minimized }]) => !minimized)
    .map(([id, { conv }]) => ({ id, conv }));

  const minimizedWindows = Array.from(openChats.entries())
    .filter(([_, { minimized }]) => minimized)
    .map(([id, { conv }]) => ({ id, conv }));

  // Calculer les offsets pour les fenêtres actives (horizontales)
  const activeOffsets = getHorizontalOffsets(activeWindows.length, CHAT_WIDTH);

  // Les fenêtres minimisées sont à droite, alignées verticalement
  // Toutes à la même position X (right), mais Y différent (empilées)
  const minimizedRightOffset = BOTTOM_OFFSET;

  return (
    <>
      {/* Bouton flottant - visible seulement sur mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-500 hover:bg-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white transition-all z-40 lg:hidden"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            {totalUnread > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Liste des conversations (fenêtre principale) */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 flex flex-col">
          {/* Header de la liste */}
          <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <h3 className="font-semibold">{t("messages")}</h3>{" "}
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contenu de la liste */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
              </div>
            ) : (
              <ConversationList
                conversations={conversations}
                onSelect={handleSelectConversation}
                selectedId={null}
                t={t}
              />
            )}
          </div>
        </div>
      )}

      {/* Fenêtres de chat non minimisées - alignées horizontalement côte à côte */}
      {activeWindows.map(({ id, conv }, index) => (
        <ChatWindow
          key={id}
          conversation={conv}
          onClose={() => closeChatWindow(id)}
          onMinimize={() => toggleMinimize(id)}
          isMinimized={false}
          rightOffset={activeOffsets[index]}
        />
      ))}

      {/* Fenêtres minimisées - empilées verticalement l'une sur l'autre à droite */}
      {minimizedWindows.map(({ id, conv }, index) => (
        <ChatWindow
          key={id}
          conversation={conv}
          onClose={() => closeChatWindow(id)}
          onMinimize={() => toggleMinimize(id)}
          isMinimized={true}
          rightOffset={minimizedRightOffset}
          bottomOffset={getVerticalOffsets(
            minimizedWindows.length,
            minimizedWindows.length - 1 - index,
          )}
        />
      ))}
    </>
  );
}
