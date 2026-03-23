// app/[locale]/(auth)/login/hooks/useAuth.ts
import { useSignIn, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { SignInResource } from "@clerk/types";
// IMPORT des fonctions d'utils
import {
  isClerkAPIError,
  isStandardError,
  getClerkErrorMessage,
  logger,
  type IdentifierType,
} from "@/lib/utils";

export interface AuthParams {
  identifier: string;
  password: string;
  role: "renter" | "owner" | null;
  identifierType: IdentifierType;
  rememberMe?: boolean;
}

interface RoleCheckResult {
  isValid: boolean;
  errorMessage?: string;
  dbRole?: string;
}

interface DbUser {
  role: string;
}

export function useAuth() {
  const { signIn, setActive } = useSignIn();
  const { signOut } = useClerk();
  const router = useRouter();
  const t = useTranslations("Login");

  // Récupérer l'ID Clerk à partir de l'identifiant
  const getClerkUserId = async (
    identifier: string,
    type: IdentifierType,
  ): Promise<string> => {
    if (type === "email") {
      const response = await fetch(
        `/api/clerk/users-by-email/${encodeURIComponent(identifier)}`,
      );
      const data = (await response.json()) as { id: string };
      return data.id;
    } else {
      const userResponse = await fetch(
        `/api/users/by-username/${encodeURIComponent(identifier)}`,
      );
      const userData = (await userResponse.json()) as { email: string };
      const clerkResponse = await fetch(
        `/api/clerk/users-by-email/${encodeURIComponent(userData.email)}`,
      );
      const clerkData = (await clerkResponse.json()) as { id: string };
      return clerkData.id;
    }
  };

  // Vérifier le rôle dans la base de données
  const checkUserRole = async (
    identifier: string,
    type: IdentifierType,
    selectedRole: string | null,
  ): Promise<RoleCheckResult> => {
    try {
      logger.auth("Vérification du rôle pour:", { identifier, type });

      const clerkUserId = await getClerkUserId(identifier, type);
      logger.success("ID Clerk trouvé:", clerkUserId);

      const response = await fetch(`/api/users/by-clerk-id/${clerkUserId}`);

      if (!response.ok) {
        return { isValid: false, errorMessage: t("userNotFoundInDB") };
      }

      const dbUser = (await response.json()) as DbUser;
      logger.auth("Rôle dans la DB:", dbUser.role);
      logger.auth("Rôle sélectionné:", selectedRole);

      // CAS 1: C'est un ADMIN - on accepte toujours
      if (dbUser.role === "ADMIN") {
        return { isValid: true, dbRole: "ADMIN" };
      }

      // CAS 2: L'utilisateur n'a pas sélectionné de rôle
      if (!selectedRole) {
        return {
          isValid: false,
          errorMessage: t("profileTypeRequired"),
          dbRole: dbUser.role,
        };
      }

      // CAS 3: Vérification du rôle pour non-admin
      const roleMapping: Record<string, "renter" | "owner"> = {
        TENANT: "renter",
        PROPERTY_OWNER: "owner",
      };

      const expectedRole = roleMapping[dbUser.role];

      if (expectedRole !== selectedRole) {
        const errorMessage =
          dbUser.role === "PROPERTY_OWNER"
            ? t("wrongRoleRenter")
            : t("wrongRoleOwner");

        return { isValid: false, errorMessage, dbRole: dbUser.role };
      }

      return { isValid: true, dbRole: dbUser.role };
    } catch (error) {
      logger.error("Erreur vérification rôle:", error);
      return { isValid: false, errorMessage: t("error") };
    }
  };

  // Gérer la 2FA - Version corrigée
  const handleSecondFactor = async (
    result: SignInResource,
    identifier: string,
    role: string | null,
    identifierType: IdentifierType,
    dbRole: string,
  ): Promise<void> => {
    try {
      logger.auth("2FA requis");

      // ✅ Récupérer les stratégies sous forme de strings
      const strategies =
        result.supportedSecondFactors?.map((sf) => sf.strategy) || [];

      // LOG POUR DIAGNOSTIC
      console.log("📋 Stratégies 2FA disponibles (strings):", strategies);

      // Stocker les infos pour après la 2FA
      sessionStorage.setItem("pendingIdentifier", identifier);
      sessionStorage.setItem("pendingRole", role || "");
      sessionStorage.setItem("pendingIdentifierType", identifierType);
      sessionStorage.setItem("pendingUserRole", dbRole);

      // ✅ Vérifier si email_code est dans le tableau de strings
      if (strategies.includes("email_code")) {
        logger.auth("2FA par email - Préparation...");
        await signIn?.prepareSecondFactor({ strategy: "email_code" });
        logger.success("Redirection vers vérification");
        const pathname = window.location.pathname;
        const locale = pathname.split("/")[1] || "fr";
        router.push(`/${locale}/verify-email-code`);
      } else {
        // Si email_code n'est pas disponible, afficher les stratégies disponibles
        console.error(
          "❌ email_code non disponible. Stratégies trouvées:",
          strategies,
        );
        throw new Error(t("verificationFailed"));
      }
    } catch (error) {
      logger.error("Erreur 2FA:", error);
      throw error;
    }
  };

  // Gestionnaire Google
  const handleGoogleLogin = async (): Promise<void> => {
    try {
      if (!signIn) return;
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/sso-callback",
      });
    } catch (error) {
      logger.error("Google login error:", error);
      throw error;
    }
  };

  // Gestionnaire Apple
  const handleAppleLogin = async (): Promise<void> => {
    try {
      if (!signIn) return;
      await signIn.authenticateWithRedirect({
        strategy: "oauth_apple",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/sso-callback",
      });
    } catch (error) {
      logger.error("Apple login error:", error);
      throw error;
    }
  };

  // Gestionnaire Facebook
  const handleFacebookLogin = async (): Promise<void> => {
    try {
      if (!signIn) return;
      await signIn.authenticateWithRedirect({
        strategy: "oauth_facebook",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/sso-callback",
      });
    } catch (error) {
      logger.error("Facebook login error:", error);
      throw error;
    }
  };

  // app/[locale]/(auth)/login/hooks/useAuth.ts

// VERSION CORRIGÉE DU HANDLER PRINCIPAL
const handleSubmit = async ({
  identifier,
  password,
  role,
  identifierType,
  rememberMe = false, 
}: AuthParams): Promise<void> => {
  try {
    if (!signIn) throw new Error("SignIn not initialized");

    logger.auth("Tentative de connexion:", {
      identifier,
      identifierType,
      role,
      rememberMe,
    });

    // Étape 1: Authentification Clerk
    const result = await signIn.create({ identifier, password });
    logger.auth("Statut:", result.status);
    
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberMe');
    }

    // Étape 2: Vérifier le rôle dans la DB
    const roleCheck = await checkUserRole(identifier, identifierType, role);

    if (!roleCheck.isValid) {
      logger.warning("Rôle incorrect, annulation de la session");

      if (result.status === "complete" && result.createdSessionId) {
        await fetch("/api/clerk/end-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: result.createdSessionId }),
        });
      }

      await signOut({ redirectUrl: window.location.href });
      throw new Error(roleCheck.errorMessage);
    }

    // Étape 3: Gestion selon le statut
    if (result.status === "complete") {
      logger.success("Activation de la session avec rôle:", roleCheck.dbRole);

      if (setActive) {
        await setActive({ session: result.createdSessionId });
        
        // 👇 ATTENDRE UN PEU POUR QUE LE COOKIE SOIT DISPONIBLE
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 👇 RÉCUPÉRER L'URL DE REDIRECTION STOCKÉE
        const getRedirectUrl = async (): Promise<string> => {
          try {
            // Essayer de récupérer l'URL du cookie via l'API
            const response = await fetch('/api/get-redirect-url');
            if (response.ok) {
              const data = await response.json();
              if (data.url) {
                console.log("🔄 URL de redirection trouvée:", data.url);
                // Enlever le /fr/ du début si présent
                const cleanUrl = data.url.replace(/^\/fr\//, '/');
                return cleanUrl;
              }
            }
          } catch (error) {
            console.error("Erreur récupération URL:", error);
          }
          
          // Fallback basé sur le rôle
          if (roleCheck.dbRole === "ADMIN") {
            return "../../../admin/dashboard";
          } else if (roleCheck.dbRole === "PROPERTY_OWNER") {
            return "/dashboard/owner";
          } else {
            return "/dashboard/renter";
          }
        };

        const redirectUrl = await getRedirectUrl();
        console.log("🚀 Redirection vers:", redirectUrl);
        router.push(redirectUrl);
      }
    } else if (result.status === "needs_second_factor") {
      await handleSecondFactor(
        result,
        identifier,
        role,
        identifierType,
        roleCheck.dbRole || "",
      );
    } else {
      throw new Error(t("error"));
    }
  } catch (error: unknown) {
    logger.error("Erreur:", error);

    if (isStandardError(error)) {
      throw error;
    } else if (isClerkAPIError(error)) {
      const translatedMessage = getClerkErrorMessage(
        error,
        identifierType,
        t,
      );
      throw new Error(translatedMessage);
    } else {
      throw new Error(t("error"));
    }
  }
};

  return {
    handleSubmit,
    handleGoogleLogin,
    handleAppleLogin,
    handleFacebookLogin,
  };
}
