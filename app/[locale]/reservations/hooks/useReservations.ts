// hooks/useReservations.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export type Tab = "UPCOMING" | "PAST" | "CANCELLED";

export interface Reservation {
  id: string;
  status:
    | "PENDING"
    | "ACCEPTED"
    | "CONFIRMED"
    | "REJECTED"
    | "CANCELLED"
    | "COMPLETED";
  paymentStatus?: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  isPaid?: boolean;
  reference?: string;
  listing: {
    id: string;
    title: string;
    image?: string | null;
    images?: string[];
    location?: string;
    rating?: number;
    type?: string;
  };
  owner: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string;
    image?: string | null;
  };
  conversationId?: string;
  bookingOfferId?: string;
}

export function useReservations() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("UPCOMING");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  const loadReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusMap: Record<Tab, string> = {
        UPCOMING: "PENDING,ACCEPTED,CONFIRMED",
        PAST: "COMPLETED",
        CANCELLED: "CANCELLED,REJECTED",
      };

      const response = await fetch(
        `/api/bookings?role=tenant&status=${statusMap[tab]}&pageSize=20`,
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      const raw: Reservation[] = Array.isArray(data)
        ? data
        : (data.bookings ?? []);

      setReservations(
        raw.map((r) => ({
          ...r,
          // ✅ CORRECTION: Calculer isPaid basé sur paymentStatus ou status
          isPaid:
            r.paymentStatus === "PAID" ||
            r.status === "CONFIRMED" ||
            r.status === "COMPLETED",
          nights:
            r.nights ||
            Math.ceil(
              (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) /
                86400000,
            ),
          listing: {
            ...r.listing,
            image: r.listing.image ?? null,
          },
          owner: {
            ...r.owner,
            firstName: r.owner?.firstName ?? null,
            lastName: r.owner?.lastName ?? null,
            image: r.owner?.image ?? null,
          },
        })),
      );
    } catch (error) {
      console.error("Erreur chargement réservations:", error);
      showToast("Erreur de chargement des réservations", "error");
    } finally {
      setIsLoading(false);
    }
  }, [tab, showToast]);

  const handlePay = (res: Reservation) => {
    const params = new URLSearchParams({
      bookingId: res.id,
      ...(res.bookingOfferId ? { offerId: res.bookingOfferId } : {}),
    });
    router.push(`/fr/payment?${params.toString()}`);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Confirmer l'annulation de cette réservation ?")) return;

    try {
      const response = await fetch(`/api/bookings/${id}/cancel`, {
        method: "POST",
      });

      if (response.ok) {
        showToast("Réservation annulée", "info");
        setReservations((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b)),
        );
      } else {
        const error = await response.json();
        showToast(error.error || "Erreur lors de l'annulation", "error");
      }
    } catch {
      showToast("Erreur de connexion", "error");
    }
  };

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  return {
    tab,
    setTab,
    reservations,
    isLoading,
    toast,
    showToast,
    handlePay,
    handleCancel,
    loadReservations,
  };
}
