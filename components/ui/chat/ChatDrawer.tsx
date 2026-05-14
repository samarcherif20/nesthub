// components/ui/ChatDrawer.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TiMessages } from "react-icons/ti";
import { BiSolidMessageSquareAdd, BiSolidMessageSquareX } from "react-icons/bi";

const pipAvatar = (url: string) => `/api/users/avatar?url=${encodeURIComponent(url)}`;

// ✅ INTERFACE CORRIGÉE
interface Conversation {
  id: string;
  listing: {
    id: string;
    title: string;
    image?: string;
  };
  otherUser: {
    id: string;
    username: string;  // ← CHANGÉ : name → username
    image?: string;
    isOnline?: boolean;
  } | null;  // ← AJOUTÉ : peut être null
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: "TENANT" | "PROPERTY_OWNER";
}

const BG_COLORS = ["#185FA5", "#3C3489", "#0F6E56", "#993C1D", "#854F0B", "#3B6D11", "#A32D2D", "#72243E"];

function avatarBg(id: string) {
  return BG_COLORS[Math.abs(id.charCodeAt(0) % BG_COLORS.length)];
}

function fmtTime(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return date.toLocaleDateString("fr-FR", { weekday: "short" });
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconHome = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconDoubleCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
    <polyline points="20 12 9 22 4 17" opacity=".45" />
  </svg>
);

// ✅ AVATAR CORRIGÉ avec sécurité
function Avatar({
  src,
  name,
  userId,
  online,
}: {
  src?: string;
  name: string;
  userId: string;
  online?: boolean;
}) {
  const [err, setErr] = useState(false);
  const url = src ? pipAvatar(src) : null;
  const safeName = name || "?";
  const firstChar = safeName.charAt(0).toUpperCase();

  return (
    <div className="relative flex-shrink-0 w-[42px] h-[42px]">
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm"
        style={{ background: !url || err ? avatarBg(userId) : "#e2e8f0" }}
      >
        {url && !err ? (
          <img src={url} alt={safeName} className="w-full h-full object-cover" onError={() => setErr(true)} />
        ) : (
          firstChar
        )}
      </div>
      {online && (
        <span className="absolute bottom-[1px] right-[1px] w-[10px] h-[10px] rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-[18px] py-3">
      <div className="w-[42px] h-[42px] rounded-full bg-gray-100 dark:bg-slate-800 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-[11px] w-[48%] rounded bg-gray-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-[10px] w-[72%] rounded bg-gray-100 dark:bg-slate-800 animate-pulse" />
      </div>
    </div>
  );
}

export function ChatDrawer({ isOpen, onClose, userRole }: ChatDrawerProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const totalUnread = conversations.reduce((s, c) => s + (c?.unreadCount || 0), 0);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        // ✅ FILTRAGE STRICT
        const validData = data.filter((c: Conversation) => {
          if (!c) return false;
          if (!c.otherUser) return false;
          if (!c.otherUser.id) return false;
          if (typeof c.otherUser.username !== 'string') return false;
          return true;
        });
        setConversations(validData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      load();
      setSearchQuery("");
    }
  }, [isOpen, load]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  const getLink = (convId: string) =>
    userRole === "TENANT" ? `/fr/messages?conversation=${convId}` : `/fr/dashboard/owner/messages?conversation=${convId}`;

  const allLink = userRole === "TENANT" ? "/fr/messages" : "/fr/dashboard/owner/messages";

  // ✅ FILTRE CORRIGÉ avec sécurité
  const filtered = conversations.filter((c) => {
    if (!c || !c.otherUser) return false;
    if (typeof c.otherUser.username !== 'string') return false;
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const username = c.otherUser.username.toLowerCase();
    const title = (c.listing.title || "").toLowerCase();
    return username.includes(q) || title.includes(q);
  });

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/40 dark:bg-black/60 backdrop-blur-[2px]" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full z-[201] w-full max-w-[380px] flex flex-col bg-white dark:bg-slate-950 border-l border-gray-100 dark:border-slate-800 shadow-2xl animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-[34px] h-[34px] rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                <TiMessages className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-gray-900 dark:text-white">Messages</span>
                {totalUnread > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-[11px] font-bold">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="w-[30px] h-[30px] rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 flex items-center justify-center text-gray-500">
              <IconClose />
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 mt-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl px-3 py-2.5 border border-gray-100 dark:border-slate-700/60">
            <IconSearch />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une conversation…"
              className="flex-1 bg-transparent border-none outline-none text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400"
              autoFocus={isOpen}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-gray-300 hover:text-gray-500">
                <IconClose />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-slate-900/30">
          {isLoading ? (
            <div className="pt-2">
              {[...Array(4)].map((_, i) => (<SkeletonRow key={i} />))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <BiSolidMessageSquareX className="text-gray-300 dark:text-slate-600" />
              </div>
              <p className="text-[13px] font-medium text-gray-500">
                {searchQuery ? "Aucun résultat" : "Aucune conversation"}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {searchQuery ? "Essayez un autre terme" : "Les messages apparaîtront ici"}
              </p>
            </div>
          ) : (
            <div>
              {filtered.map((conv) => {
                if (!conv || !conv.otherUser) return null;
                const unread = conv.unreadCount > 0;
                const username = conv.otherUser.username || "Utilisateur";

                return (
                  <Link
                    key={conv.id}
                    href={getLink(conv.id)}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-slate-800/80 transition-colors group ${
                      unread ? "bg-blue-50/30 dark:bg-blue-900/10 hover:bg-white" : "hover:bg-white"
                    }`}
                  >
                    <Avatar
                      src={conv.otherUser.image}
                      name={username}
                      userId={conv.otherUser.id}
                      online={conv.otherUser.isOnline}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <span className={`text-[13px] truncate ${unread ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                          {username}
                        </span>
                        <span className={`text-[10px] shrink-0 ${unread ? "font-semibold text-blue-600" : "text-gray-400"}`}>
                          {fmtTime(conv.lastMessageAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mb-1">
                        <IconHome />
                        <span className="text-[11px] text-gray-400 truncate">{conv.listing.title}</span>
                      </div>

                      {conv.lastMessage && (
                        <p className={`text-[11px] truncate ${unread ? "text-gray-600 font-medium" : "text-gray-400"}`}>
                          {conv.lastMessage.length > 52 ? conv.lastMessage.slice(0, 52) + "…" : conv.lastMessage}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      {unread ? (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                        </span>
                      ) : (
                        <IconDoubleCheck />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 py-3.5 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950">
          <Link href={allLink} onClick={onClose} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 font-semibold text-[13px]">
            <BiSolidMessageSquareAdd /> Voir tous les messages <IconChevronRight />
          </Link>
          <p className="text-[10px] text-gray-400 text-center mt-2.5">
            Messages sécurisés · Ne partagez pas vos informations personnelles
          </p>
        </div>
      </div>
    </>
  );
}