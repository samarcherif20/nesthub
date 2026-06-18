// hooks/useBookingConfirmation.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";

export interface BookingData {
  id: string;
  reference: string;
  issuedAt: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  checkInTime: string;
  checkOutTime: string;
  accessCode: string;
  conversationId: string;
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    cinNumber: string;
    email: string;
    phone: string;
    verified: boolean;
    profilePictureUrl: string;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    cinNumber: string;
    email: string;
    phone: string;
    verified: boolean;
    joinedYear: number;
    listings: number;
    profilePictureUrl: string;
  };
  listing: {
    id: string;
    title: string;
    type: string;
    address: string;
    image: string;
    location: string;
    rating: number;
    latitude: number;
    longitude: number;
  };
}

export function useBookingConfirmation() {
  const params = useParams();
  const locale = (params.locale as string) || "fr";
  const searchParams = useSearchParams();
  const router = useRouter();

  const offerId = searchParams.get("offerId");
  const bookingId = searchParams.get("bookingId");
  const paymentIntent = searchParams.get("payment_intent");

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [imgError, setImgError] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") =>
      setToast({ message, type }),
    [],
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      let data;
      let conversationIdTemp = null;

      if (paymentIntent) {
        const transactionRes = await fetch(
          `/api/payments/transaction?payment_intent=${paymentIntent}`,
        );

        if (transactionRes.ok) {
          const transaction = await transactionRes.json();

          if (transaction.bookingId) {
            const bookingRes = await fetch(
              `/api/bookings/${transaction.bookingId}`,
            );
            if (bookingRes.ok) {
              data = await bookingRes.json();
              conversationIdTemp = data.conversationId;
            }
          } else if (transaction.offerId) {
            const offerRes = await fetch(`/api/offers/${transaction.offerId}`);
            if (offerRes.ok) {
              data = await offerRes.json();
              data = data.offer || data;
            }
          }
        }
      }

      if (!data && bookingId) {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (res.ok) {
          data = await res.json();
          conversationIdTemp = data.conversationId;
        } else {
          const offerRes = await fetch(`/api/offers/${bookingId}`);
          if (offerRes.ok) {
            data = await offerRes.json();
            data = data.offer || data;
          } else {
            throw new Error("Réservation non trouvée");
          }
        }
      }

      if (!data && offerId) {
        const res = await fetch(`/api/offers/${offerId}`);
        if (!res.ok) throw new Error("Erreur chargement offre");
        data = await res.json();
        data = data.offer || data;

        const bookingRes = await fetch(`/api/bookings?offerId=${offerId}`);
        if (bookingRes.ok) {
          const bookingData = await bookingRes.json();
          if (bookingData.bookings && bookingData.bookings.length > 0) {
            conversationIdTemp = bookingData.bookings[0].conversationId;
          }
        }
      }

      if (!data) {
        throw new Error("Aucun identifiant de réservation trouvé");
      }

      const nights =
        data.nights ||
        Math.ceil(
          (new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) /
            86400000,
        );

      setBooking({
        id: data.id,
        reference: data.reference,
        issuedAt: data.createdAt,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        nights: nights,
        guests: data.guests,
        totalPrice: data.totalPrice,
        pricePerNight: data.pricePerNight,
        cleaningFee: data.cleaningFee || 0,
        serviceFee: data.serviceFee || 0,
        checkInTime: data.checkInTime || "15:00",
        checkOutTime: data.checkOutTime || "11:00",
        accessCode:
          data.revealedInfo?.accessCode ||
          Math.floor(1000 + Math.random() * 9000).toString(),
        conversationId: conversationIdTemp || data.conversationId,
        tenant: {
          id: data.tenant?.id,
          firstName: data.tenant?.firstName,
          lastName: data.tenant?.lastName,
          cinNumber: data.tenant?.cinNumber,
          email: data.tenant?.email,
          phone: data.tenant?.phone,
          verified: data.tenant?.isIdentityVerified,
          profilePictureUrl: data.tenant?.profilePictureUrl,
        },
        owner: {
          id: data.owner?.id,
          firstName: data.owner?.firstName,
          lastName: data.owner?.lastName,
          cinNumber: data.owner?.cinNumber,
          email: data.owner?.email,
          phone: data.owner?.phone,
          verified: data.owner?.isIdentityVerified,
          joinedYear: data.owner?.joinedYear,
          listings: data.owner?.listingsCount,
          profilePictureUrl: data.owner?.profilePictureUrl,
        },
        listing: {
          id: data.listing?.id,
          title: data.listing?.title,
          type: data.listing?.type,
          address: data.listing?.fullAddress || data.listing?.location,
          image: data.listing?.photos?.[0]?.url || data.listing?.image,
          location: data.listing?.governorate || data.listing?.location,
          rating: data.owner?.rating,
          latitude: data.listing?.latitude,
          longitude: data.listing?.longitude,
        },
      });

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    } catch (err) {
      console.error("Erreur:", err);
      showToast("Erreur lors du chargement des données", "error");
    } finally {
      setIsLoading(false);
    }
  }, [offerId, bookingId, paymentIntent, showToast]);

  const handleDownloadContract = useCallback(async () => {
    if (!booking) return;
    setContractLoading(true);
    try {
      const requestBody: { offerId?: string; bookingId?: string } = {};
      if (booking.id) {
        requestBody.bookingId = booking.id;
      } else if ((booking as any).offerId) {
        requestBody.offerId = (booking as any).offerId;
      }

      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur génération contrat");
      }

      if (data.contract?.id) {
        window.open(`/api/contracts/${data.contract.id}/download`, "_blank");
        showToast("Contrat généré avec succès !", "success");
      } else {
        showToast("Erreur lors de la génération", "error");
      }
    } catch (error) {
      console.error("Erreur:", error);
      showToast("Erreur technique lors de la génération du contrat", "error");
    } finally {
      setContractLoading(false);
    }
  }, [booking, showToast]);

  const handleContactHost = useCallback(() => {
    if (booking?.conversationId) {
      router.push(`/${locale}/messages/${booking.conversationId}`);
    } else {
      router.push(`/${locale}/messages`);
    }
  }, [booking, router, locale]);

  const handleMyBookings = useCallback(() => {
    router.push(`/${locale}/reservations`);
  }, [router, locale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    booking,
    isLoading,
    showConfetti,
    toast,
    setToast,
    imgError,
    setImgError,
    contractLoading,
    showToast,
    handleDownloadContract,
    handleContactHost,
    handleMyBookings,
    fmtDate,
    fmtShort,
    fmtPrice,
    pipListing,
  };
}

// Helpers
function fmtDate(d: string | Date) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtShort(d: string | Date) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function fmtPrice(n: number) {
  return n?.toLocaleString("fr-FR") || "0";
}

function pipListing(url: string) {
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
}