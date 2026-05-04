// hooks/useMessages.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

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

// ✅ Hook useMessages modifié
export function useMessages() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("conversation");
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unread" | "read">(
    "all",
  );
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChat, setShowChat] = useState(false);

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
    setIsLoading(true);
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data);
      
      // ✅ NE SÉLECTIONNE UNE CONVERSATION QUE SI:
      // 1. Il y a un conversationId dans l'URL
      // 2. Cette conversation existe dans la liste
      // 3. On n'est PAS sur mobile (ou on gère mobile différemment)
      if (conversationIdFromUrl && !isMobileView) {
        const targetConv = data.find((c: Conversation) => c.id === conversationIdFromUrl);
        if (targetConv) {
          setSelectedConv(targetConv);
        }
      }
      // ✅ PAS de sélection automatique de la première conversation sinon
      
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [conversationIdFromUrl, isMobileView]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Sélection manuelle d'une conversation (quand l'utilisateur clique)
  const handleSelectConv = useCallback(
    (conv: Conversation) => {
      setSelectedConv(conv);
      if (isMobileView) {
        setShowChat(true);
      }
      
      // ✅ Mettre à jour l'URL sans recharger la page (optionnel)
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("conversation", conv.id);
        window.history.pushState({}, "", url.toString());
      }
    },
    [isMobileView],
  );

  const handleBack = useCallback(() => {
    setShowChat(false);
    setSelectedConv(null);
    
    // ✅ Retirer le paramètre de l'URL
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("conversation");
      window.history.pushState({}, "", url.toString());
    }
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