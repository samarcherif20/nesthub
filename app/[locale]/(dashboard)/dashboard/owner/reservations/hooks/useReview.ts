import { useState, useCallback } from "react";

interface ReviewData {
  bookingId: string;
  cleanliness: number;
  communication: number;
  houseRules: number;
  comment: string;
  recommend: boolean;
}

interface BookingRequest {
  id: string;
  status: string;
  tenant: { id: string; username?: string; image?: string };
  listing: { title: string; image?: string };
  checkIn?: string;
  checkOut?: string;
}

export function useReview(
  onSuccess?: () => void,
  onError?: (message: string) => void
) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);

  const openReviewModal = useCallback((booking: BookingRequest) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  }, []);

  const closeReviewModal = useCallback(() => {
    setShowReviewModal(false);
    setSelectedBooking(null);
  }, []);

  const handleSubmitReview = useCallback(
    async (data: ReviewData) => {
      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Erreur");
        }

        closeReviewModal();
        onSuccess?.();
      } catch (error) {
        console.error(error);
        onError?.(error instanceof Error ? error.message : "Erreur lors de la publication");
      }
    },
    [closeReviewModal, onSuccess, onError]
  );

  return {
    showReviewModal,
    selectedBooking,
    openReviewModal,
    closeReviewModal,
    handleSubmitReview,
  };
}