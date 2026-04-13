// app/[locale]/accept-invite/hooks/useAcceptInvite.ts
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  isClerkAPIError,
  isStandardError,
  getClerkErrorMessage,
  logger,
  maskEmail,
} from "@/lib/utils";

export interface InvitationInfo {
  valid: boolean;
  type?: "ADMIN" | "CO_HOST";
  email?: string;
  expiresAt?: string;
  hasExistingAccount?: boolean;
  role?: string;
  invitedBy?: { name: string; email: string } | null;
  listing?: { id: string; title: string };
  permissions?: any;
  reason?: string;
}

interface AcceptInviteParams {
  token: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  password?: string;
  type?: "ADMIN" | "CO_HOST";
}

export function useAcceptInvite() {
  const router = useRouter();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Déterminer l'API en fonction du type d'invitation
  const getApiUrl = (token: string, type?: string) => {
    if (type === "CO_HOST") {
      return `/api/cohost/invitations/accept?token=${token}&type=cohost`;
    }
    return `/api/admin/invitations/accept?token=${token}&type=admin`;
  };

  // Vérifier l'invitation (supporte ADMIN et CO_HOST)
  const checkInvitation = async (token: string, type?: string) => {
    setChecking(true);
    setError(null);

    try {
      logger.auth("Vérification de l'invitation:", { token, type });

      const url = getApiUrl(token, type);
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la vérification");
      }

      const invitationType =
        data.type || (type === "CO_HOST" ? "CO_HOST" : "ADMIN");

      setInfo({
        valid: true,
        type: invitationType,
        email: data.email,
        expiresAt: data.expiresAt,
        hasExistingAccount: data.hasExistingAccount,
        role: data.role,
        invitedBy: data.invitedBy,
        listing: data.listing,
        permissions: data.permissions,
      });

      logger.success("Invitation valide:", {
        email: data.email,
        type: invitationType,
        hasExistingAccount: data.hasExistingAccount,
      });
    } catch (err: any) {
      logger.error("Erreur vérification invitation:", err);
      setError(err.message || "Erreur de vérification");
      setInfo({ valid: false, reason: "error" });
    } finally {
      setChecking(false);
    }
  };

  // Remplace par :
  const redirectToLoginWithEmail = (email: string, redirectPath: string) => {
    // Stocker l'email dans sessionStorage
    sessionStorage.setItem("invitation_email", email);

    // Redirection vers login avec l'email en paramètre
    const loginUrl = `/${locale}/login?redirect=${encodeURIComponent(redirectPath)}&email=${encodeURIComponent(email)}`;

    console.log("🔐 Redirection vers login avec email:", loginUrl);
    window.location.href = loginUrl;
  };
  // Accepter l'invitation (nouveau compte)
  const acceptInvite = async ({
    token,
    firstName,
    lastName,
    username,
    password,
    type,
  }: AcceptInviteParams) => {
    setLoading(true);
    setError(null);

    try {
      logger.auth("Acceptation de l'invitation:", {
        token,
        firstName,
        lastName,
        username,
        type,
      });

      const url =
        type === "CO_HOST"
          ? "/api/cohost/invitations/accept"
          : "/api/admin/invitations/accept";

      let body;
      if (type === "CO_HOST") {
        body = {
          token,
          firstName,
          lastName,
          username,
          password,
          type: "cohost",
        };
      } else {
        body = {
          token,
          firstName,
          lastName,
          username,
          password,
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'acceptation");
      }

      logger.success("Compte créé avec succès");

      // ✅ Utiliser le signInToken pour l'auto-connexion
      if (data.email) {
        const redirectPath =
          data.redirectTo ||
          (type === "CO_HOST" ? "/dashboard/owner" : "/admin/dashboard");
        redirectToLoginWithEmail(data.email, redirectPath);
      } else {
        // Fallback: redirection normale
        setSuccess(true);
      }
    } catch (err: any) {
      logger.error("Erreur acceptation invitation:", err);
      setError(err.message || "Erreur lors de l'acceptation");
      setLoading(false);
    }
  };

  // Accepter pour un compte existant
  const acceptExisting = async (token: string, type?: string) => {
    setLoading(true);
    setError(null);

    try {
      logger.auth("Acceptation pour compte existant:", { token, type });

      const url =
        type === "CO_HOST"
          ? "/api/cohost/invitations/accept"
          : "/api/admin/invitations/accept";

      let body;
      if (type === "CO_HOST") {
        body = { token, type: "cohost" };
      } else {
        body = { token };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'acceptation");
      }

      logger.success("Droits ajoutés avec succès");

      // ✅ Utiliser le signInToken pour l'auto-connexion
      if (data.email) {
        const redirectPath =
          data.redirectTo ||
          (type === "CO_HOST" ? "/dashboard/owner" : "/admin/dashboard");
        redirectToLoginWithEmail(data.email, redirectPath);
      } else {
        // Fallback: redirection normale
        setSuccess(true);
      }
    } catch (err: any) {
      logger.error("Erreur acceptation invitation:", err);
      setError(err.message || "Erreur lors de l'acceptation");
      setLoading(false);
    }
  };

  // Demander un nouveau lien
  const requestNewLink = async (email?: string, type?: string) => {
    logger.info("Demande de nouveau lien pour:", { email, type });

    try {
      const url =
        type === "CO_HOST"
          ? "/api/cohost/invitations/resend"
          : "/api/admin/invitations/resend";

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la demande");
      }

      setError(null);
      return {
        success: true,
        message: "Un nouveau lien a été envoyé par email",
      };
    } catch (err: any) {
      logger.error("Erreur demande nouveau lien:", err);
      setError(
        err.message ||
          "Fonctionnalité à venir - Contactez votre administrateur",
      );
      return { success: false, error: err.message };
    }
  };

  return {
    info,
    checking,
    loading,
    success,
    error,
    setError,
    checkInvitation,
    acceptInvite,
    acceptExisting,
    requestNewLink,
    maskEmail,
  };
}
