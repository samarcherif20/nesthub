// hooks/useBookingDetails.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

export interface BookingDetail {
  id: string;
  reference: string;
  status: string;
  paymentStatus: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalNights: number;
  totalPrice: number;
  cleaningFee: number;
  serviceFee: number;
  createdAt: string;
  confirmedAt?: string;
  listing: {
    id: string;
    title: string;
    governorate: string;
    delegation: string;
    street?: string;
    pricePerNight: number;
    images: { url: string }[];
    latitude?: number;
    longitude?: number;
  };
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    profilePictureUrl?: string;
    isIdentityVerified: boolean;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    profilePictureUrl?: string;
    isIdentityVerified: boolean;
  };
  payments: {
    id: string;
    amount: number;
    status: string;
    paidAt?: string;
    provider: string;
    providerTransactionId?: string;
  }[];
  timeline: {
    id: string;
    action: string;
    description: string;
    createdAt: string;
    actor: string;
  }[];
  notes?: {
    id: string;
    content: string;
    createdAt: string;
    adminName: string;
  }[];
  conversationId?: string;
}

export function useBookingDetails(bookingId: string) {
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchBookingDetails = useCallback(async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBooking(data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }, [bookingId, getToken]);

  const addNote = async (note: string): Promise<boolean> => {
    if (!note.trim()) return false;
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/bookings/${bookingId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: note }),
      });
      if (res.ok) {
        await fetchBookingDetails();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erreur:", error);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const downloadContract = async (bookingId: string): Promise<{ success: boolean; contractId?: string; error?: string }> => {
    try {
      const token = await getToken();
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur génération contrat");
      if (data.contract?.id) {
        return { success: true, contractId: data.contract.id };
      }
      return { success: false, error: "Erreur lors de la génération" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const downloadReceipt = async (bookingId: string, reference: string): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/bookings/${bookingId}/receipt`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur téléchargement");
      const blob = await res.blob();
      return { success: true, blob };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [fetchBookingDetails]);

  return {
    booking,
    loading,
    submitting,
    addNote,
    downloadContract,
    downloadReceipt,
    fetchBookingDetails,
  };
}