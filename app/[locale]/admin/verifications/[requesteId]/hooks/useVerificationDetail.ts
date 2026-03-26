// app/[locale]/admin/verifications/[requestId]/hooks/useVerificationDetail.ts
import { useState, useEffect } from "react";
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
  adminComment?: string;
  rejectionMotif?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePictureUrl?: string;
    createdAt: string;
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

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/admin/verifications/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setRequest(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setSubmitting(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/admin/verifications/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "VALIDATE",
          adminComment,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de la validation");

      setSuccess("Demande validée avec succès !");
      setTimeout(() => {
        const locale = window.location.pathname.split("/")[1] || "fr";
        router.push(`/${locale}/admin/verifications`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionMotif) {
      setError("Veuillez fournir un motif de rejet");
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/admin/verifications/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "REJECT",
          rejectionMotif,
          adminComment,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors du rejet");

      setSuccess("Demande rejetée");
      setTimeout(() => {
        const locale = window.location.pathname.split("/")[1] || "fr";
        router.push(`/${locale}/admin/verifications`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const resetError = () => setError(null);
  const resetSuccess = () => setSuccess(null);

  return {
    loading,
    submitting,
    error,
    success,
    request,
    showRejectForm,
    rejectionMotif,
    adminComment,
    extractedData: request?.extractedData || {},
    requestUser: request?.user,
    setShowRejectForm,
    setRejectionMotif,
    setAdminComment,
    handleValidate,
    handleReject,
    resetError,
    resetSuccess,
    fetchRequest,
  };
}