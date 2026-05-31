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
    username: string;
    image?: string;
    isOnline?: boolean;
    isVerified?: boolean;
    role?: string;
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

export interface GroupConversation {
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
  lastMessageAt?: string;
  unreadCount: number;
  status: string;
}

// Constante GRAD exportée
export const GRAD = "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600";

// Fonctions utilitaires exportées
export function formatRelativeTime(dateStr?: string): string {
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

export const pipAvatar = (url?: string) => {
  if (!url) return "";
  return `/api/users/avatar?url=${encodeURIComponent(url)}`;
};

export const pipListingImage = (url?: string) => {
  if (!url) return "";
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

// Hook useMessages
export function useMessages() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("conversation");
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<GroupConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unread" | "read" | "groups">("all");
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
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data);
    } catch (e) {
      console.error("Error loading conversations:", e);
    }
  }, []);

  // Load groups
  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations/groups");
      if (!res.ok) return;
      const data = await res.json();
      setGroups(data);
    } catch (e) {
      console.error("Error loading groups:", e);
    }
  }, []);

  // Load all data
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadConversations(), loadGroups()]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [loadConversations, loadGroups]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Sélection depuis l'URL
  useEffect(() => {
    if (!conversationIdFromUrl) return;
    if (isLoading) return;

    // Cas: Groupe
    if (conversationIdFromUrl.startsWith("group_")) {
      const groupToOpen = groups.find(
        (g) => `group_${g.id}` === conversationIdFromUrl
      );
      if (groupToOpen && !selectedGroup) {
        setSelectedGroup(groupToOpen);
        setSelectedConv(null);
        if (isMobileView) setShowChat(true);
      }
      return;
    }

    // Cas: Conversation privée
    if (conversations.length > 0 && !selectedConv) {
      const convToOpen = conversations.find(
        (c) => c.id === conversationIdFromUrl
      );
      if (convToOpen) {
        setSelectedConv(convToOpen);
        setSelectedGroup(null);
        if (isMobileView) setShowChat(true);
      }
    }
  }, [conversationIdFromUrl, conversations, groups, selectedConv, selectedGroup, isLoading, isMobileView]);

  // Sélection manuelle d'une conversation
  const handleSelectConv = useCallback(
    (conv: Conversation | GroupConversation, isGroup: boolean) => {
      if (isGroup) {
        setSelectedGroup(conv as GroupConversation);
        setSelectedConv(null);
        // Marquer comme lu
        setGroups((prev) =>
          prev.map((g) =>
            g.id === conv.id ? { ...g, unreadCount: 0 } : g
          )
        );
      } else {
        setSelectedConv(conv as Conversation);
        setSelectedGroup(null);
        // Marquer comme lu
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conv.id ? { ...c, unreadCount: 0 } : c
          )
        );
      }
      
      if (isMobileView) {
        setShowChat(true);
      }
      
      // Mettre à jour l'URL
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        const paramValue = isGroup ? `group_${conv.id}` : conv.id;
        url.searchParams.set("conversation", paramValue);
        window.history.pushState({}, "", url.toString());
      }
    },
    [isMobileView]
  );

  const handleBack = useCallback(() => {
    setShowChat(false);
    setSelectedConv(null);
    setSelectedGroup(null);
    
    // Retirer le paramètre de l'URL
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
      c.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.listing.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filtrer les groupes
  const filteredGroups = groups.filter(
    (g) =>
      g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Appliquer le filtre de type
  let filtered = filteredBySearch;
  let filteredGroupsResult = filteredGroups;

  if (filterType === "unread") {
    filtered = filteredBySearch.filter((c) => c.unreadCount > 0);
    filteredGroupsResult = filteredGroups.filter((g) => g.unreadCount > 0);
  } else if (filterType === "read") {
    filtered = filteredBySearch.filter((c) => c.unreadCount === 0);
    filteredGroupsResult = filteredGroups.filter((g) => g.unreadCount === 0);
  } else if (filterType === "groups") {
    filtered = [];
    filteredGroupsResult = filteredGroups;
  }

  const unreadCount = conversations.filter((c) => c.unreadCount > 0).length;
  const unreadGroupsCount = groups.filter((g) => g.unreadCount > 0).length;

  // Conversation ou groupe actuellement sélectionné
  const currentConversation = selectedConv;
  const currentGroup = selectedGroup;
  const isGroupChat = !!selectedGroup;

  return {
    conversations,
    groups,
    selectedConv: currentConversation,
    selectedGroup: currentGroup,
    isGroupChat,
    isLoading,
    searchQuery,
    filterType,
    unreadCount,
    unreadGroupsCount,
    filtered,
    filteredGroups: filteredGroupsResult,
    isMobileView,
    showChat,
    setSearchQuery,
    setFilterType,
    handleSelectConv,
    handleBack,
    handleUpdateInfoRequest,
    handleSendSystemMessage,
    loadConversations,
    loadGroups,
    loadAllData,
  };
}