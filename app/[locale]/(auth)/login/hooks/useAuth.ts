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
}

interface DbUser {
  role: string;
}

export function useAuth() {
  const { signIn, setActive } = useSignIn();
  const { signOut } = useClerk();
  const router = useRouter();
  const t = useTranslations("Login");

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

      if (dbUser.role === "ADMIN") {
        return { isValid: true, dbRole: "ADMIN" };
      }

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
        console.error("❌ email_code non disponible. Stratégies:", strategies);
        throw new Error(t("verificationFailed"));
      }
    } catch (error) {
      logger.error("Erreur 2FA:", error);
      throw error;
    }
  };

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

  const handleSubmit = async ({
    identifier,
    password,
    role,
    identifierType,
    rememberMe = false,
  }: AuthParams): Promise<void> => {
    try {
      if (!signIn) throw new Error("SignIn not initialized");

      // ✅ FIX 1: Clear any existing session before signing in
      try {
        await signOut();
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (_) {
        // ignore — no session to clear
      }

      logger.auth("Tentative de connexion:", {
        identifier,
        identifierType,
        role,
        rememberMe,
      });

      // Get locale from current path
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

      if (result.status === "complete") {
        logger.success("Activation de la session avec rôle:", roleCheck.dbRole);

        if (setActive) {
          await setActive({ session: result.createdSessionId });
          await new Promise(resolve => setTimeout(resolve, 100));

          // ✅ FIX 2: Role-based redirect with proper locale and path
          const getRedirectUrl = async (): Promise<string> => {
            try {
              const response = await fetch("/api/get-redirect-url");
              if (response.ok) {
                const data = await response.json();
                if (data.url) {
                  const cleanUrl = data.url.startsWith(`/${locale}`)
                    ? data.url
                    : `/${locale}${data.url}`;

                  // ✅ Don't use cookie redirect if it points to wrong role area
                  const isAdminUrl = cleanUrl.includes("/admin");
                  const isAdmin = roleCheck.dbRole === "ADMIN";

                  if (isAdminUrl && !isAdmin) {
                    // Non-admin trying to go to admin area — ignore cookie
                  } else if (!isAdminUrl && isAdmin) {
                    // Admin trying to go to non-admin area — ignore cookie
                  } else {
                    console.log("🔄 URL de redirection trouvée:", cleanUrl);
                    return cleanUrl;
                  }
                }
              }
            } catch (error) {
              console.error("Erreur récupération URL:", error);
            }

            // ✅ FIX 3: Fallback with proper locale prefix
            if (roleCheck.dbRole === "ADMIN") {
              return `/${locale}/admin/dashboard`;
            } else if (roleCheck.dbRole === "PROPERTY_OWNER") {
              return `/${locale}/dashboard/owner`;
            } else {
              return `/${locale}/dashboard/renter`;
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