// app/[locale]/(auth)/login/hooks/useAuth.ts
import { useSignIn, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { SignInResource } from "@clerk/types";
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
  selectedRole?: string;
  requiresRoleChoice?: boolean;
}

interface DbUser {
  id: string;
  role: string;
  status: string;
  suspendedUntil?: string | null;
  isEmailVerified: boolean;
  deletedAt?: string | null;
  failedLoginAttempts: number;
  lockedAt?: string | null;  // ← AJOUTE CETTE LIGNE
  updatedAt?: string;        // ← AJOUTE CETTE LIGNE (optionnel)
}

export function useAuth() {
  const { signIn, setActive } = useSignIn();
  const { signOut } = useClerk();
  const router = useRouter();
  const t = useTranslations("Login");

  // ============================================
  // FONCTIONS UTILITAIRES
  // ============================================

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

  const getDbUserId = async (clerkUserId: string): Promise<string | null> => {
    const response = await fetch(`/api/users/by-clerk-id/${clerkUserId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.id;
  };

  const incrementFailedLoginAttempts = async (
    userId: string,
  ): Promise<void> => {
    await fetch("/api/users/increment-login-attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  };

  const resetFailedLoginAttempts = async (userId: string): Promise<void> => {
    await fetch("/api/users/reset-login-attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  };

  const updateLastLogin = async (userId: string): Promise<void> => {
    await fetch("/api/users/update-last-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  };

  // ============================================
  // VÉRIFICATION DU COMPTE (STATUT, EMAIL, TENTATIVES)
  // ============================================

const checkAccountAccess = async (
  dbUser: DbUser,
  clerkUserId: string,
): Promise<{
  canLogin: boolean;
  errorMessage?: string;
}> => {
  // 1. Vérifier si le compte est supprimé
  if (dbUser.deletedAt) {
    return { canLogin: false, errorMessage: t("accountDeleted") };
  }

  // 2. Vérifier le statut du compte
  const status = dbUser.status;

  switch (status) {
    case "ACTIVE":
      break;
    case "TEMPORARILY_SUSPENDED":
      if (
        dbUser.suspendedUntil &&
        new Date(dbUser.suspendedUntil) > new Date()
      ) {
        const date = new Date(dbUser.suspendedUntil).toLocaleDateString(
          "fr-FR",
        );
        return {
          canLogin: false,
          errorMessage: t("accountTemporarilySuspended", { date }),
        };
      }
      break;
    case "PERMANENTLY_BANNED":
      return { canLogin: false, errorMessage: t("accountPermanentlyBanned") };
    case "PENDING_VALIDATION":
      break;
    case "SECURITY_LOCKED": {
      // ✅ VÉRIFIER SI 15 MINUTES SONT PASSÉES
      const lockTime = dbUser.lockedAt || dbUser.updatedAt;
      if (lockTime) {
        const lockDate = new Date(lockTime);
        const now = new Date();
        const minutesPassed = (now.getTime() - lockDate.getTime()) / (1000 * 60);
        
        if (minutesPassed >= 15) {
          // Déverrouiller automatiquement
          await fetch("/api/users/unlock-account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clerkUserId }),
          });
          
          // Recharger l'utilisateur
          const updatedResponse = await fetch(`/api/users/by-clerk-id/${clerkUserId}`);
          const updatedUser = await updatedResponse.json() as DbUser;
          return checkAccountAccess(updatedUser, clerkUserId);
        } else {
          const remainingMinutes = Math.ceil(15 - minutesPassed);
          return {
            canLogin: false,
            errorMessage: t("accountSecurityLockedWithTime", { minutes: remainingMinutes })
          };
        }
      }
      return { canLogin: false, errorMessage: t("accountSecurityLocked") };
    }
    case "INACTIVE":
      return { canLogin: false, errorMessage: t("accountInactive") };
    case "REJECTED":
      return { canLogin: false, errorMessage: t("accountRejected") };
    case "ANUALLY_BLOCKED":
      return { canLogin: false, errorMessage: t("accountAnnuallyBlocked") };
    case "MANUALLY_BLOCKED":
      return { canLogin: false, errorMessage: t("accountManuallyBlocked") };
    default:
      return { canLogin: false, errorMessage: t("accountStatusUnknown") };
  }

  // 3. Vérifier si l'email est vérifié
  if (!dbUser.isEmailVerified) {
    return { canLogin: false, errorMessage: t("emailNotVerified") };
  }

  // 4. Vérifier les tentatives de connexion
  const MAX_ATTEMPTS = 5;
  if (dbUser.failedLoginAttempts >= MAX_ATTEMPTS) {
    // ✅ VÉRIFIER AUSSI ICI SI 15 MINUTES SONT PASSÉES
    const lockTime = dbUser.lockedAt || dbUser.updatedAt;
    if (lockTime) {
      const lockDate = new Date(lockTime);
      const now = new Date();
      const minutesPassed = (now.getTime() - lockDate.getTime()) / (1000 * 60);
      
      if (minutesPassed >= 15) {
        await fetch("/api/users/unlock-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clerkUserId }),
        });
        
        const updatedResponse = await fetch(`/api/users/by-clerk-id/${clerkUserId}`);
        const updatedUser = await updatedResponse.json() as DbUser;
        return checkAccountAccess(updatedUser, clerkUserId);
      } else {
        const remainingMinutes = Math.ceil(15 - minutesPassed);
        return {
          canLogin: false,
          errorMessage: t("accountLockedTooManyAttemptsWithTime", { minutes: remainingMinutes })
        };
      }
    }
    return {
      canLogin: false,
      errorMessage: t("accountLockedTooManyAttempts"),
    };
  }

  return { canLogin: true };
};

  // ============================================
  // VÉRIFICATION DU RÔLE
  // ============================================

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
    logger.auth("Statut dans la DB:", dbUser.status);

    // ✅ SEULE MODIFICATION ICI : ajouter await et passer clerkUserId
    const statusCheck = await checkAccountAccess(dbUser, clerkUserId);
    if (!statusCheck.canLogin) {
      return { isValid: false, errorMessage: statusCheck.errorMessage };
    }

    // Admin peut toujours se connecter
    if (dbUser.role === "ADMIN") {
      return { isValid: true, dbRole: "ADMIN" };
    }

    // ===== GESTION DU RÔLE BOTH =====
    if (dbUser.role === "BOTH") {
      if (!selectedRole) {
        return {
          isValid: false,
          errorMessage: t("profileTypeRequiredForBoth"),
          dbRole: "BOTH",
          requiresRoleChoice: true,
        };
      }
      return { isValid: true, dbRole: "BOTH", selectedRole };
    }

    // ===== LOGIQUE NORMALE POUR TENANT OU PROPERTY_OWNER =====
    if (!selectedRole) {
      return {
        isValid: false,
        errorMessage: t("profileTypeRequired"),
        dbRole: dbUser.role,
      };
    }

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

  // ============================================
  // GESTION 2FA
  // ============================================

  const handleSecondFactor = async (
    result: SignInResource,
    identifier: string,
    role: string | null,
    identifierType: IdentifierType,
    dbRole: string,
  ): Promise<void> => {
    try {
      logger.auth("2FA requis");

      const strategies =
        result.supportedSecondFactors?.map((sf) => sf.strategy) || [];

      console.log("📋 Stratégies 2FA disponibles:", strategies);

      sessionStorage.setItem("pendingIdentifier", identifier);
      sessionStorage.setItem("pendingRole", role || "");
      sessionStorage.setItem("pendingIdentifierType", identifierType);
      sessionStorage.setItem("pendingUserRole", dbRole);

      if (strategies.includes("email_code")) {
        logger.auth("2FA par email - Préparation...");
        await signIn?.prepareSecondFactor({ strategy: "email_code" });
        logger.success("Redirection vers vérification");
        const pathname = window.location.pathname;
        const locale = pathname.split("/")[1] || "fr";
        router.push(`/${locale}/verify-email-code`);
      } else {
        console.error("email_code non disponible. Stratégies:", strategies);
        throw new Error(t("verificationFailed"));
      }
    } catch (error) {
      logger.error("Erreur 2FA:", error);
      throw error;
    }
  };

  // ============================================
  // OAUTH
  // ============================================

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

  // ============================================
  // SUBMIT PRINCIPAL
  // ============================================

  const handleSubmit = async ({
    identifier,
    password,
    role,
    identifierType,
    rememberMe = false,
  }: AuthParams): Promise<void> => {
    try {
      if (!signIn) throw new Error("SignIn not initialized");

      // Clear any existing session before signing in
      try {
        await signOut();
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (_) {
        // ignore
      }

      logger.auth("Tentative de connexion:", {
        identifier,
        identifierType,
        role,
        rememberMe,
      });

      const locale = window.location.pathname.split("/")[1] || "fr";

      const result = await signIn.create({ identifier, password });
      logger.auth("Statut:", result.status);

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      const roleCheck = await checkUserRole(identifier, identifierType, role);

      if (!roleCheck.isValid) {
        logger.warning("Échec vérification:", roleCheck.errorMessage);

        // ⭐ CORRECTION : Pour BOTH, on ne détruit PAS la session
        if (!roleCheck.requiresRoleChoice) {
          if (result.status === "complete" && result.createdSessionId) {
            await fetch("/api/clerk/end-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId: result.createdSessionId }),
            });
          }
          await signOut({ redirectUrl: window.location.href });
        }

        // Cas spécial BOTH : redirection vers page de choix
        if (roleCheck.requiresRoleChoice) {
          console.log(
            "🔄 Redirection vers choose-role pour l'utilisateur BOTH",
          );
          sessionStorage.setItem("pendingLoginEmail", identifier);
          sessionStorage.setItem("pendingLoginPassword", password);

          // ⭐ Conserver l'ID de session pour choose-role
          if (result.createdSessionId) {
            sessionStorage.setItem("clerkSessionId", result.createdSessionId);
          }

          const locale = window.location.pathname.split("/")[1] || "fr";

          // ⭐ Utiliser window.location.href pour une redirection complète
          window.location.href = `/${locale}/choose-role`;
          return;
        }

        throw new Error(roleCheck.errorMessage);
      }

      if (result.status === "complete") {
        logger.success("Activation de la session avec rôle:", roleCheck.dbRole);

        if (setActive) {
          await setActive({ session: result.createdSessionId });
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Mettre à jour lastLogin et réinitialiser les tentatives
          try {
            const clerkUserId = await getClerkUserId(
              identifier,
              identifierType,
            );
            const dbUserId = await getDbUserId(clerkUserId);
            if (dbUserId) {
              await resetFailedLoginAttempts(dbUserId);
              await updateLastLogin(dbUserId);
            }
          } catch (updateError) {
            logger.warning("Erreur mise à jour lastLogin:", updateError);
          }

          const storedRedirect = localStorage.getItem("redirectAfterLogin");
          if (storedRedirect) {
            localStorage.removeItem("redirectAfterLogin");
            console.log("🔄 Redirection stockée trouvée:", storedRedirect);
            router.push(storedRedirect);
            return;
          }

          const getRedirectUrl = async (): Promise<string> => {
            try {
              const response = await fetch("/api/get-redirect-url");
              if (response.ok) {
                const data = await response.json();
                if (data.url) {
                  const cleanUrl = data.url.startsWith(`/${locale}`)
                    ? data.url
                    : `/${locale}${data.url}`;

                  const isAdminUrl = cleanUrl.includes("/admin");
                  const isAdmin = roleCheck.dbRole === "ADMIN";

                  if (isAdminUrl && !isAdmin) {
                    // ignore
                  } else if (!isAdminUrl && isAdmin) {
                    // ignore
                  } else {
                    console.log("📍 URL de redirection trouvée:", cleanUrl);
                    return cleanUrl;
                  }
                }
              }
            } catch (error) {
              console.error("Erreur récupération URL:", error);
            }

            if (roleCheck.dbRole === "ADMIN") {
              return `/${locale}/admin/dashboard`;
            } else if (roleCheck.dbRole === "PROPERTY_OWNER") {
              return `/${locale}/dashboard/owner`;
            } else {
              return `/${locale}/search`;
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

      if (isClerkAPIError(error)) {
        const clerkError = error.errors?.[0];
        if (clerkError?.code === "form_password_incorrect") {
          try {
            const clerkUserId = await getClerkUserId(
              identifier,
              identifierType,
            );
            const dbUserId = await getDbUserId(clerkUserId);
            if (dbUserId) {
              await incrementFailedLoginAttempts(dbUserId);

              const userResponse = await fetch(
                `/api/users/by-clerk-id/${clerkUserId}`,
              );
              const dbUser = await userResponse.json();
              const remaining = 5 - dbUser.failedLoginAttempts;

              if (remaining <= 0) {
                throw new Error(t("accountLockedTooManyAttempts"));
              } else {
                throw new Error(
                  t("incorrectPasswordWithAttempts", { remaining }),
                );
              }
            }
          } catch (attemptError) {
            throw attemptError;
          }
        }
      }

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
