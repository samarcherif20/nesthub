// hooks/useMessages.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

export interface Conversation {
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
  offer?: {
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

// ✅ Constante GRAD exportée
export const GRAD =
  "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600";

// ✅ Fonctions utilitaires exportées
export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const now = new Date();

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

export const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

// ✅ Hook useMessages
export function useMessages() {
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
  const [conversationIdParam, setConversationIdParam] = useState<string | null>(
    null,
  );

  // Détecter l'écran mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const handleBack = useCallback(() => {
    setShowChat(false);
    setSelectedConv(null);
  }, []);

  const handleUpdateInfoRequest = useCallback((updatedInfoRequest: any) => {
    setSelectedConv((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        infoRequest: updatedInfoRequest,
      };
    });
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === updatedInfoRequest.conversationId
          ? { ...conv, infoRequest: updatedInfoRequest }
          : conv,
      ),
    );
  }, []);

  const handleSendSystemMessage = useCallback((message: string) => {
    console.log("System message to send:", message);
  }, []);

  // Filtrer les conversations
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

  return {
    conversations,
    selectedConv,
    isLoading,
    searchQuery,
    filterType,
    unreadCount,
    filtered,
    isMobileView,
    showChat,
    setSearchQuery,
    setFilterType,
    handleSelectConv,
    handleBack,
    handleUpdateInfoRequest,
    handleSendSystemMessage,
    loadConversations,
  };
}
