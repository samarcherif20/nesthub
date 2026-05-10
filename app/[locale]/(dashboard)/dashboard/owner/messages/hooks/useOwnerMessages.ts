"use client";

import { useState, useEffect, useCallback } from "react";

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

export function useOwnerMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
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
    setTimeout(() => setToast(null), 3000);
  };

  // Détecter l'écran mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    if (isMobileView) {
      setShowChat(true);
    }
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
      const res = await fetch(`/api/offers/${selectedConv.offer.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok) {
        showToast("Offre acceptée ! La réservation est confirmée.", "success");
        setSelectedConv({
          ...selectedConv,
          offer: { ...selectedConv.offer, status: "ACCEPTED" },
        });
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
      const res = await fetch(`/api/offers/${selectedConv.offer.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok) {
        showToast("Offre refusée", "info");
        setSelectedConv({
          ...selectedConv,
          offer: { ...selectedConv.offer, status: "REJECTED" },
        });
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

  return {
    conversations,
    selectedConv,
    isLoading,
    isMobileView,
    showChat,
    toast,
    isProcessing,
    setShowChat,
    handleSelectConversation,
    handleBack,
    handleAcceptOffer,
    handleRejectOffer,
    setToast,
  };
}