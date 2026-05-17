// app/[locale]/profile/hooks/useCINStatus.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

interface CINStatus {
  status: "PENDING" | "VALIDATED" | "REJECTED" | "REAPPLIED" | null;
  rejectionReason: string | null;
  canReapply: boolean;
  requestId: string | null;
  isIdentityVerified: boolean;
}

export function useCINStatus() {
  const { getToken, userId: clerkUserId } = useAuth(); // ✅ Récupérer userId Clerk
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // ✅ AJOUTER

  const fetchCINStatus = useCallback(async () => {
    try {
      const token = await getToken({ template: "my-app-template" });
      
      // ✅ Récupérer l'ID utilisateur depuis la BDD
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
    const toastId = toast.loading("Upload en cours et vérification OCR...");

    try {
      const token = await getToken({ template: "my-app-template" });
      const formData = new FormData();

      formData.append("cinRecto", rectoFile);
      if (versoFile) formData.append("cinVerso", versoFile);

      // Add a placeholder profile photo (required by your upload API)
      const placeholderBlob = new Blob([""], { type: "image/jpeg" });
      const placeholderFile = new File([placeholderBlob], "placeholder.jpg", {
        type: "image/jpeg",
      });
      formData.append("profilePhoto", placeholderFile);

      toast.loading("Traitement OCR en cours...", { id: toastId });

      // Step 1: Upload and OCR
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

      // ✅ STEP 2: Create verification request in database
      toast.loading("Création de la demande de vérification...", {
        id: toastId,
      });

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

      toast.success("Demande de vérification envoyée avec succès !", {
        id: toastId,
      });
      setShowCINModal(false);
      await fetchCINStatus();
    } catch (error) {
      console.error("Error submitting CIN:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'envoi",
        { id: toastId },
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
    currentUserId, // ✅ EXPORTER currentUserId
  };
}