// hooks/useDisputeDetail.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

export interface DisputeDetail {
  id: string;
  reference: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
  type: string;
  description: string;
  priority: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  groupConversationId?: string;
  booking: {
    id: string;
    reference: string;
    checkIn: string;
    checkOut: string;
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

export function useDisputeDetail(disputeId: string) {
  const { getToken } = useAuth();
  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const fetchDispute = useCallback(async () => {
    if (!disputeId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      const res = await fetch(`/api/disputes/${disputeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      setDispute(data);
    } catch (err) {
      console.error("Erreur chargement litige:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [disputeId, getToken]);

  useEffect(() => {
    if (disputeId) {
      fetchDispute();
    }
  }, [disputeId, fetchDispute]);

  const mainImage = dispute?.booking.listing.images?.[0] || null;
  const isResolved = dispute?.status === "RESOLVED" || dispute?.status === "REJECTED";
  const disputeRef = dispute?.reference?.slice(-8) || dispute?.id?.slice(-8) || "";
  const nights = dispute?.booking.checkIn && dispute?.booking.checkOut
    ? Math.ceil((new Date(dispute.booking.checkOut).getTime() - new Date(dispute.booking.checkIn).getTime()) / 86400000)
    : 0;

  const resetImageError = useCallback(() => setImgError(false), []);

  return {
    dispute,
    loading,
    error,
    imgError,
    mainImage,
    isResolved,
    disputeRef,
    nights,
    fetchDispute,
    setImgError,
    resetImageError,
  };
}