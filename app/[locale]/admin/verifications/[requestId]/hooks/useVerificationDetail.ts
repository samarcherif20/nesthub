// app/[locale]/admin/verifications/[requestId]/hooks/useVerificationDetail.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface ExtractedData {
  cinNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  nationality?: string;
  expiryDate?: string;
  sex?: string;
  address?: string;
}

interface VerificationRequest {
  id: string;
  userId: string;
  status: string;
  documentFrontUrl: string;
  documentBackUrl?: string;
  extractedData?: ExtractedData;
  cinData?: {           // ← AJOUTER
    firstName?: string;
    lastName?: string;
    cinNumber?: string;
    dateOfBirth?: string;
    profession?: string;
    extractedAt?: string;
    rectoUrl?: string;
    versoUrl?: string;
  };
  adminComment?: string;
  rejectionMotif?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    profilePictureUrl?: string;
    createdAt: string;
    role: string;
    isIdentityVerified: boolean;
  };
}

export function useVerificationDetail(requestId: string) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionMotif, setRejectionMotif] = useState("");
  const [adminComment, setAdminComment] = useState("");
  const [selectedAction, setSelectedAction] = useState<
    "validate" | "reject" | null
  >(null);

  const fetchRequest = useCallback(async () => {
    if (!requestId) {
      setError("ID de demande manquant");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken({ template: "my-app-template" });
      if (!token) {
        throw new Error("Non authentifié");
      }

      const res = await fetch(`/api/admin/verifications/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${res.status}`);
      }

      const data = await res.json();
      setRequest(data);
      if (data.adminComment) setAdminComment(data.adminComment);
    } catch (err) {
      console.error("[fetchRequest] Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [requestId, getToken]);

  useEffect(() => {
    if (requestId) {
      fetchRequest();
    }
  }, [requestId, fetchRequest]);

  const selectValidate = useCallback(() => {
    setSelectedAction("validate");
    setShowRejectForm(false);
    setRejectionMotif("");
    setError(null);
  }, []);

  const selectReject = useCallback(() => {
    setSelectedAction("reject");
    setShowRejectForm(true);
    setError(null);
  }, []);

  const confirmDecision = useCallback(async () => {
    if (!selectedAction) {
      setError("Veuillez sélectionner une action (Valider ou Rejeter)");
      return;
    }

    if (selectedAction === "reject" && !rejectionMotif) {
      setError("Veuillez fournir un motif de rejet");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = await getToken({ template: "my-app-template" });
      if (!token) throw new Error("Non authentifié");

      const action = selectedAction === "validate" ? "VALIDATE" : "REJECT";
      const body: any = {
        action,
        adminComment,
      };

      if (selectedAction === "reject") {
        body.rejectionMotif = rejectionMotif;
      }

      const res = await fetch(`/api/admin/verifications/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de l'action");
      }

      const message =
        selectedAction === "validate"
          ? "Demande validée avec succès !"
          : "Demande rejetée avec succès !";

      setSuccess(message);

      setTimeout(() => {
        const locale = window.location.pathname.split("/")[1] || "fr";
        router.push(`/${locale}/admin/verifications`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }, [
    requestId,
    getToken,
    selectedAction,
    rejectionMotif,
    adminComment,
    router,
  ]);

  const resetError = useCallback(() => setError(null), []);
  const resetSuccess = useCallback(() => setSuccess(null), []);

  return {
    loading,
    submitting,
    error,
    success,
    request,
    showRejectForm,
    rejectionMotif,
    adminComment,
    selectedAction,
    extractedData: request?.extractedData || {},
    requestUser: request?.user,
    setShowRejectForm,
    setRejectionMotif,
    setAdminComment,
    selectValidate,
    selectReject,
    confirmDecision,
    resetError,
    resetSuccess,
    fetchRequest,
  };
}
