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

interface InvitationInfo {
  valid: boolean;
  email?: string;
  expiresAt?: string;
  hasExistingAccount?: boolean;
  invitedBy?: { name: string; email: string } | null;
  reason?: string;
}

interface AcceptInviteParams {
  token: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  password?: string;
}

export function useAcceptInvite() {
  const router = useRouter();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier l'invitation
  const checkInvitation = async (token: string) => {
    setChecking(true);
    setError(null);

    try {
      logger.auth("Vérification de l'invitation:", { token });

      const response = await fetch(
        `/api/admin/invitations/accept?token=${token}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la vérification");
      }

      setInfo(data);
      logger.success("Invitation valide:", { email: data.email });
    } catch (err: any) {
      logger.error("Erreur vérification invitation:", err);
      setError(err.message || "Erreur de vérification");
      setInfo({ valid: false, reason: "error" });
    } finally {
      setChecking(false);
    }
  };

  // Accepter l'invitation (nouveau compte)
  const acceptInvite = async ({
    token,
    firstName,
    lastName,
    username,
    password,
  }: AcceptInviteParams) => {
    setLoading(true);
    setError(null);

    try {
      logger.auth("Acceptation de l'invitation:", {
        token,
        firstName,
        lastName,
        username,
      });

      const response = await fetch("/api/admin/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          firstName,
          lastName,
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'acceptation");
      }

      logger.success("Compte créé avec succès");
      setSuccess(true);

      // Redirection après 3 secondes
      setTimeout(() => {
        router.push(`/${locale}/admin/dashboard`);
      }, 3000);
    } catch (err: any) {
      logger.error("Erreur acceptation invitation:", err);

      if (isClerkAPIError(err)) {
        const errorMessage = getClerkErrorMessage(err, "email", (key) => {
          // Traductions simples pour les erreurs
          const messages: Record<string, string> = {
            emailNotFound: "Email non trouvé",
            usernameNotFound: "Nom d'utilisateur non trouvé",
            userNotFound: "Utilisateur non trouvé",
            incorrectPassword: "Mot de passe incorrect",
            passwordCompromised: "Ce mot de passe est trop commun",
            passwordTooShort: "Mot de passe trop court",
            accountLocked: "Compte verrouillé",
            accountSuspended: "Compte suspendu",
          };
          return messages[key] || key;
        });
        setError(errorMessage);
      } else if (isStandardError(err)) {
        setError(err.message);
      } else {
        setError("Erreur lors de l'acceptation");
      }
    } finally {
      setLoading(false);
    }
  };

  // Accepter pour un compte existant
  const acceptExisting = async (token: string) => {
    setLoading(true);
    setError(null);

    try {
      logger.auth("Acceptation pour compte existant:", { token });

      const response = await fetch("/api/admin/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'acceptation");
      }

      logger.success("Droits admin ajoutés");
      setSuccess(true);

      // Redirection après 3 secondes
      setTimeout(() => {
        router.push(`/${locale}/admin/dashboard`);
      }, 3000);
    } catch (err: any) {
      logger.error("Erreur acceptation invitation:", err);
      setError(err.message || "Erreur lors de l'acceptation");
    } finally {
      setLoading(false);
    }
  };

  // Demander un nouveau lien
  const requestNewLink = (email?: string) => {
    logger.info("Demande de nouveau lien pour:", email);
    // Implémentez la logique ici
    setError("Fonctionnalité à venir - Contactez votre administrateur");
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
