"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";

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
  pricePerNight?: number;
  isPaid?: boolean;
  hasReview?: boolean;
  hasListingReview?: boolean;
  hasTenantReview?: boolean;
  cleaningFee?: number;
  serviceFee?: number;
  review?: { rating?: number; comment?: string };
  reference?: string;
  listing: {
    id: string;
    title: string;
    image?: string | null;
    images?: string[];
    location?: string;
    rating?: number;
    type?: string;
    pricePerNight?: number;
  };
  owner: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string;
    image?: string | null;
    username?: string;
    profilePictureUrl?: string | null;
  };
  conversationId?: string;
  bookingOfferId?: string;
}

export function useReservations() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const t = useTranslations("ReservationsPage");
  const [tab, setTab] = useState<Tab>("UPCOMING");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [receivedReviews, setReceivedReviews] = useState<any[]>([]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  // Charger les favoris
  const loadFavorites = useCallback(async () => {
    if (!isLoaded || !user) return;

    try {
      const response = await fetch("/api/users/favorites");
      if (response.ok) {
        const data = await response.json();
        let favoriteIds: string[] = [];
        
        if (data.success && data.favorites && Array.isArray(data.favorites)) {
          favoriteIds = data.favorites.map((f: any) => f.listingId || f.id);
        } else if (data.favorites && Array.isArray(data.favorites)) {
          favoriteIds = data.favorites.map((f: any) => f.listingId || f);
        } else if (Array.isArray(data)) {
          favoriteIds = data;
        }
        
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error("Erreur chargement favoris:", error);
    }
  }, [user, isLoaded]);

  // ✅ Charger les avis REÇUS (sur le locataire)
  const loadReceivedReviews = useCallback(async () => {
    if (!isLoaded || !user) return;
    
    try {
      const response = await fetch(`/api/reviews?tab=received&targetType=TENANT`);
      if (response.ok) {
        const data = await response.json();
        setReceivedReviews(data.reviews || []);
        console.log(`📦 ${data.reviews?.length || 0} avis reçus chargés`);
      }
    } catch (error) {
      console.error("Erreur chargement avis reçus:", error);
    }
  }, [user, isLoaded]);

  // Ajouter aux favoris
  const addToFavorites = useCallback(async (listingId: string) => {
    if (!listingId) return false;
    if (!user) {
      showToast(t("toast.loginRequired"), "error");
      return false;
    }
    
    try {
      const response = await fetch("/api/users/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listingId.toString() }),
      });
      
      if (!response.ok) throw new Error();
      
      setFavorites((prev) => prev.includes(listingId) ? prev : [...prev, listingId]);
      showToast(t("toast.addedToFavorites"), "success");
      window.dispatchEvent(new Event("favorites-updated"));
      return true;
    } catch (error) {
      showToast(t("toast.favoriteError"), "error");
      return false;
    }
  }, [user, showToast, t]);

  // Retirer des favoris
  const removeFromFavorites = useCallback(async (listingId: string) => {
    if (!listingId) return false;
    if (!user) return false;
    
    try {
      const response = await fetch(`/api/users/favorites?listingId=${listingId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error();
      
      setFavorites((prev) => prev.filter(id => id !== listingId));
      showToast(t("toast.removedFromFavorites"), "info");
      window.dispatchEvent(new Event("favorites-updated"));
      return true;
    } catch (error) {
      showToast(t("toast.favoriteError"), "error");
      return false;
    }
  }, [user, showToast, t]);

  // Toggle favori
  const toggleFavorite = useCallback(async (listingId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!listingId) return;
    
    const isCurrentlyFavorite = favorites.includes(listingId);
    if (isCurrentlyFavorite) {
      await removeFromFavorites(listingId);
    } else {
      await addToFavorites(listingId);
    }
  }, [favorites, addToFavorites, removeFromFavorites]);

  // Télécharger le reçu PDF
  const downloadReceipt = useCallback(async (bookingId: string) => {
    setLoading(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/receipt`);
      if (!response.ok) throw new Error();
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `recu_reservation_${bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast(t("toast.receiptDownloaded"), "success");
    } catch (error) {
      showToast(t("toast.receiptError"), "error");
    } finally {
      setLoading(null);
    }
  }, [showToast, t]);

  // Charger les réservations
  const loadReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusMap: Record<Tab, string> = {
        UPCOMING: "PENDING,ACCEPTED,CONFIRMED",
        PAST: "COMPLETED",
        CANCELLED: "CANCELLED,REJECTED",
      };

      const response = await fetch(
        `/api/bookings?role=tenant&status=${statusMap[tab]}&pageSize=50`,
      );

      if (!response.ok) throw new Error(`Erreur ${response.status}`);

      const data = await response.json();
      const raw = data.bookings ?? [];

      setReservations(
        raw.map((r: any) => ({
          id: r.id,
          status: r.status,
          paymentStatus: r.paymentStatus,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          nights: r.nights,
          guests: r.guests,
          totalPrice: r.totalPrice,
          pricePerNight: r.pricePerNight || 0,
          cleaningFee: r.cleaningFee || 0,
          serviceFee: r.serviceFee || 0,
          isPaid: r.isPaid || false,
          hasReview: r.hasListingReview || r.hasTenantReview || false,
          hasListingReview: r.hasListingReview || false,
          hasTenantReview: r.hasTenantReview || false,
          review: r.review,
          listing: {
            id: r.listing?.id,
            title: r.listing?.title || "Propriété",
            image: r.listing?.image ?? null,
            location: r.listing?.location || "",
            pricePerNight: r.pricePerNight || r.listing?.pricePerNight || 0,
            type: r.listing?.type || "APARTMENT",
          },
          owner: {
            id: r.owner?.id,
            firstName: r.owner?.firstName ?? null,
            lastName: r.owner?.lastName ?? null,
            name: r.owner?.name || r.owner?.username || "Hôte",
            image: r.owner?.image || r.owner?.profilePictureUrl || null,
            username: r.owner?.username,
            profilePictureUrl: r.owner?.profilePictureUrl || r.owner?.image,
          },
        })),
      );
    } catch (error) {
      console.error("Erreur chargement réservations:", error);
      showToast(t("toast.loadError"), "error");
    } finally {
      setIsLoading(false);
    }
  }, [tab, showToast, t]);

  const performAction = useCallback(async (id: string, action: () => Promise<void>) => {
    setLoading(id);
    await action();
    setLoading(null);
  }, []);

  const handleCancel = useCallback(async (id: string) => {
    if (!confirm(t("cancelConfirm"))) return;
    
    await performAction(id, async () => {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      if (res.ok) {
        setReservations((prev) => prev.map((b) => b.id === id ? { ...b, status: "CANCELLED" } : b));
        showToast(t("toast.cancelled"), "success");
      } else {
        const err = await res.json();
        showToast(err.error ?? t("toast.cancelError"), "error");
      }
    });
  }, [performAction, showToast, t]);

  const handlePay = useCallback((res: Reservation) => {
    router.push(`/fr/payment?bookingId=${res.id}`);
  }, [router]);

  // Soumettre un avis sur l'annonce
  const handleSubmitReview = useCallback(async (bookingId: string, reviewData: any) => {
    try {
      const payload = {
        bookingId,
        targetType: "LISTING",
        rating: reviewData.rating || 0,
        criteria: {
          cleanliness: reviewData.criteria?.cleanliness || 0,
          communication: reviewData.criteria?.communication || 0,
          checkIn: reviewData.criteria?.checkIn || 0,
          accuracy: reviewData.criteria?.accuracy || 0,
          location: reviewData.criteria?.location || 0,
          value: reviewData.criteria?.value || 0,
        },
        comment: reviewData.publicComment || "",
        privateNote: reviewData.privateNote || "",
      };

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setReservations((prev) =>
          prev.map((b) => 
            b.id === bookingId 
              ? { ...b, hasListingReview: true, hasReview: true } 
              : b
          )
        );
        showToast(t("toast.reviewSubmitted"), "success");
        return true;
      } else {
        if (data.error && data.error.includes("existe déjà")) {
          showToast("Un avis sur cette annonce existe déjà pour cette réservation", "error");
        } else {
          showToast(data.error ?? t("toast.reviewError"), "error");
        }
        return false;
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'avis:", error);
      showToast(t("toast.connectionError"), "error");
      return false;
    }
  }, [showToast, t]);

  useEffect(() => {
    const handleFavoritesUpdate = () => loadFavorites();
    window.addEventListener("favorites-updated", handleFavoritesUpdate);
    return () => window.removeEventListener("favorites-updated", handleFavoritesUpdate);
  }, [loadFavorites]);

  useEffect(() => {
    loadReservations();
    if (isLoaded && user) {
      loadFavorites();
      loadReceivedReviews(); // ✅ Charge les avis reçus
    }
  }, [loadReservations, loadFavorites, loadReceivedReviews, isLoaded, user]);

  const upcoming = reservations.filter((b) => ["PENDING", "ACCEPTED", "CONFIRMED"].includes(b.status));
  const past = reservations.filter((b) => b.status === "COMPLETED");
  const cancelled = reservations.filter((b) => ["CANCELLED", "REJECTED"].includes(b.status));
  
  const spent = past.reduce((s, b) => s + b.totalPrice, 0);
  const nightsCount = past.reduce((s, b) => s + b.nights, 0);
  // ✅ reviewedCount = nombre d'avis REÇUS sur le locataire
  const reviewedCount = receivedReviews.length;

  return {
    tab,
    setTab,
    reservations,
    isLoading,
    toast,
    loading,
    upcoming,
    past,
    cancelled,
    spent,
    nightsCount,
    reviewedCount,
    favorites,
    receivedReviews,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    downloadReceipt,
    showToast,
    handlePay,
    handleCancel,
    handleSubmitReview,
    loadReservations,
  };
}