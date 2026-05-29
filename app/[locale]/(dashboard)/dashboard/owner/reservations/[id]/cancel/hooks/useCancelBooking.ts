// hooks/useCancelBooking.ts
import { useState, useCallback } from "react";

interface CancelBookingData {
  bookingId: string;
  reason: string;
  message: string;
}

interface UseCancelBookingReturn {
  isSubmitting: boolean;
  toast: { type: "success" | "error"; message: string } | null;
  setToast: React.Dispatch<
    React.SetStateAction<{ type: "success" | "error"; message: string } | null>
  >;
  handleCancel: (
    data: CancelBookingData,
    onSuccess: () => void,
  ) => Promise<void>;
  clearToast: () => void;
}

export function useCancelBooking(
  getToken: () => Promise<string | null>,
): UseCancelBookingReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const handleCancel = useCallback(
    async (data: CancelBookingData, onSuccess: () => void) => {
      setIsSubmitting(true);
      try {
        const token = await getToken();
        const res = await fetch(`/api/bookings/${data.bookingId}/cancel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: data.reason, message: data.message }),
        });

        const result = await res.json();

        if (res.ok) {
          setToast({
            type: "success",
            message: "Réservation annulée avec succès",
          });
          setTimeout(onSuccess, 2000);
        } else {
          setToast({
            type: "error",
            message: result.error || "Erreur lors de l'annulation",
          });
        }
      } catch (error) {
        setToast({ type: "error", message: "Erreur de connexion" });
      } finally {
        setIsSubmitting(false);
      }
    },
    [getToken],
  );

  return {
    isSubmitting,
    toast,
    setToast,
    handleCancel,
    clearToast,
  };
}
