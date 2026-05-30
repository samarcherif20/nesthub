// app/[locale]/profile/hooks/useCINStatus.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

interface ToastState {
  type: "success" | "error";
  message: string;
}

interface CINStatus {
  status: "PENDING" | "VALIDATED" | "REJECTED" | "REAPPLIED" | null;
  rejectionReason: string | null;
  canReapply: boolean;
  requestId: string | null;
  isIdentityVerified: boolean;
}

export function useCINStatus(
  setToast: React.Dispatch<React.SetStateAction<ToastState | null>>,
) {
  const { getToken, userId: clerkUserId } = useAuth();
  const [cinStatus, setCinStatus] = useState<CINStatus>({
    status: null,
    rejectionReason: null,
    canReapply: false,
    requestId: null,
    isIdentityVerified: false,
  });
  const [loading, setLoading] = useState(true);
  const [showCINModal, setShowCINModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCINStatus = useCallback(async () => {
    try {
      const token = await getToken({ template: "my-app-template" });

      const profileResponse = await fetch("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.user?.id) {
          setCurrentUserId(profileData.user.id);
        }
      }

      const response = await fetch("/api/users/cin-status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCinStatus({
          status: data.status,
          rejectionReason: data.rejectionReason,
          canReapply: data.canReapply,
          requestId: data.requestId,
          isIdentityVerified: data.isIdentityVerified || false,
        });
      }
    } catch (error) {
      console.error("Error fetching CIN status:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const handleCINSubmission = async (
    rectoFile: File,
    versoFile: File | null,
  ) => {
    setSubmitting(true);

    try {
      const token = await getToken({ template: "my-app-template" });
      const formData = new FormData();

      formData.append("cinRecto", rectoFile);
      if (versoFile) formData.append("cinVerso", versoFile);

      const placeholderBlob = new Blob([""], { type: "image/jpeg" });
      const placeholderFile = new File([placeholderBlob], "placeholder.jpg", {
        type: "image/jpeg",
      });
      formData.append("profilePhoto", placeholderFile);

      const uploadResponse = await fetch("/api/registration/upload-cin", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Upload failed");
      }

      const uploadData = await uploadResponse.json();

      const createRequestResponse = await fetch(
        "/api/users/verification-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            documentFrontUrl: uploadData.urls.cinRecto,
            documentBackUrl: uploadData.urls.cinVerso,
            extractedData: uploadData.extracted,
            ocrSuccess: uploadData.ocrSuccess,
          }),
        },
      );

      if (!createRequestResponse.ok) {
        const error = await createRequestResponse.json();
        throw new Error(error.error || "Failed to create verification request");
      }

      showToast("success", "Demande de vérification envoyée avec succès !");
      setShowCINModal(false);
      await fetchCINStatus();
    } catch (error) {
      console.error("Error submitting CIN:", error);
      showToast(
        "error",
        error instanceof Error ? error.message : "Erreur lors de l'envoi",
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchCINStatus();
  }, [fetchCINStatus]);

  return {
    cinStatus,
    loading: loading,
    showCINModal,
    setShowCINModal,
    submitting,
    handleCINSubmission,
    refreshStatus: fetchCINStatus,
    currentUserId,
  };
}
