// hooks/useDisputes.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

export interface Dispute {
  id: string;
  reference: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
  type: string;
  description: string;
  refundAmount: number | null;
  resolvedAmount: number | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    reference: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    listing: {
      id: string;
      title: string;
      governorate: string;
      delegation: string;
      images?: string[];
    };
    tenant: {
      id: string;
      firstName: string;
      lastName: string;
      username: string;
      profilePictureUrl: string | null;
    };
    owner: {
      id: string;
      firstName: string;
      lastName: string;
      username: string;
      profilePictureUrl: string | null;
    };
  };
}

export interface ToastState {
  type: "success" | "error" | "info";
  message: string;
}

export function useDisputes() {
  const { getToken } = useAuth();
  const t = useTranslations("DisputesPage");
  
  // État principal
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);

  // Statistiques calculées
  const stats = {
    open: disputes.filter(d => d.status === "OPEN").length,
    inReview: disputes.filter(d => d.status === "IN_REVIEW").length,
    resolved: disputes.filter(d => d.status === "RESOLVED").length,
    rejected: disputes.filter(d => d.status === "REJECTED").length,
  };
  
  const resolutionRate = disputes.length > 0 
    ? Math.round((stats.resolved / disputes.length) * 100) 
    : 0;

  // Filtrer les litiges
  const filteredDisputes = disputes.filter(d => {
    if (filter === "active") return d.status === "OPEN" || d.status === "IN_REVIEW";
    if (filter === "resolved") return d.status === "RESOLVED" || d.status === "REJECTED";
    return true;
  }).filter(d => {
    const title = d.booking?.listing?.title || "";
    const ref = d.booking?.reference || "";
    return searchQuery === "" || 
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const activeDisputes = filteredDisputes.filter(d => d.status === "OPEN" || d.status === "IN_REVIEW");
  const pastDisputes = filteredDisputes.filter(d => d.status === "RESOLVED" || d.status === "REJECTED");

  // Afficher une notification
  const showToast = useCallback((type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fermer la notification
  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Charger les litiges
  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/disputes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const disputesList = Array.isArray(data) ? data : data.disputes || [];
      setDisputes(disputesList);
    } catch (error) {
      console.error(error);
      showToast("error", t("toast.error"));
    } finally {
      setLoading(false);
    }
  }, [getToken, showToast, t]);

  // Charger au montage
  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  // Réinitialiser les filtres
  const resetFilters = useCallback(() => {
    setFilter("all");
    setSearchQuery("");
  }, []);

  return {
    // États
    disputes,
    loading,
    filter,
    searchQuery,
    toast,
    // Statistiques
    stats,
    resolutionRate,
    // Données filtrées
    activeDisputes,
    pastDisputes,
    totalCount: filteredDisputes.length,
    // Actions
    setFilter,
    setSearchQuery,
    showToast,
    hideToast,
    fetchDisputes,
    resetFilters,
  };
}