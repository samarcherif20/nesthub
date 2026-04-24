// app/[locale]/sso-callback/hooks/useSSOCallback.ts
import { useEffect, useState } from "react";
import { useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export function useSSOCallback() {
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const { isLoaded: isUserLoaded, user } = useUser();
  const router = useRouter();
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleSSOCallback = async () => {
      if (!isSignInLoaded || !isSignUpLoaded || !isUserLoaded) {
        return;
      }

      try {
        console.log(" Traitement du callback SSO...");

        // Vérifier si l'utilisateur est déjà connecté
        if (user) {
          console.log(" Utilisateur déjà authentifié:", user.id);

          const response = await fetch(`/api/users/by-clerk-id/${user.id}`);

          if (response.ok) {
            const dbUser = await response.json();
            console.log(" Rôle utilisateur DB:", dbUser.role);

            if (dbUser.role === "ADMIN") {
              router.push(`/${locale}/admin/dashboard`);
            } else if (dbUser.role === "PROPERTY_OWNER") {
              router.push(`/${locale}/dashboard/owner`);
            } else {
              router.push(`/${locale}/serach`);
            }
            return;
          } else {
            console.error(" Utilisateur non trouvé dans la DB");
            setError("Compte non trouvé. Veuillez vous inscrire d'abord.");
            setTimeout(() => {
              router.push(`/${locale}/login?error=account_not_found`);
            }, 2000);
            return;
          }
        }

        // Vérifier les paramètres OAuth dans l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const hasRedirectParams =
          urlParams.has("__clerk_redirect") ||
          urlParams.has("__clerk_status") ||
          urlParams.has("oauth_callback");

        // Callback OAuth sign-in
        if (signIn && hasRedirectParams) {
          console.log(" Traitement du callback OAuth sign-in...");

          try {
            const result = await signIn.handleRedirectCallback();

            console.log("Résultat handleRedirectCallback:", result.status);

            if (result.status === "complete") {
              console.log("✅ Sign-in complet, activation session...");

              if (setActive && result.createdSessionId) {
                await setActive({ session: result.createdSessionId });
              }

              await new Promise((resolve) => setTimeout(resolve, 500));

              const currentUser = result.user;

              if (currentUser?.id) {
                const response = await fetch(
                  `/api/users/by-clerk-id/${currentUser.id}`,
                );

                if (response.ok) {
                  const dbUser = await response.json();

                  if (dbUser.role === "ADMIN") {
                    router.push(`/${locale}/admin/dashboard`);
                  } else if (dbUser.role === "PROPERTY_OWNER") {
                    router.push(`/${locale}/dashboard/owner`);
                  } else {
                    router.push(`/${locale}/search`);
                  }
                } else {
                  console.log(
                    " Nouvel utilisateur OAuth, redirection vers complétion profil",
                  );
                  router.push(
                    `/${locale}/complete-profile?oauth=true&email=${encodeURIComponent(currentUser.primaryEmailAddress?.emailAddress || "")}`,
                  );
                }
              } else {
                router.push(`/${locale}/complete-profile?oauth=true`);
              }
            } else if (result.status === "needs_second_factor") {
              console.log(" 2FA requis, redirection...");
              router.push(`/${locale}/verify-email-code`);
            } else {
              console.error(" Statut inattendu:", result.status);
              router.push(`/${locale}/login?error=sso_failed`);
            }
          } catch (verifyError) {
            console.error(
              "Erreur lors du traitement du callback:",
              verifyError,
            );
            router.push(`/${locale}/login?error=verification_failed`);
          }
        }
        // Callback OAuth sign-up
        else if (signUp && hasRedirectParams) {
          console.log("🔄 Traitement du callback OAuth sign-up...");

          try {
            const result = await signUp.handleRedirectCallback();

            console.log(
              "Résultat handleRedirectCallback sign-up:",
              result.status,
            );

            if (result.status === "complete") {
              console.log(
                " Sign-up complet, redirection vers complétion profil...",
              );
              router.push(`/${locale}/complete-profile?oauth=true`);
            } else {
              console.error(" Statut inattendu:", result.status);
              router.push(`/${locale}/login?error=sso_failed`);
            }
          } catch (verifyError) {
            console.error(
              "Erreur lors du traitement du callback sign-up:",
              verifyError,
            );
            router.push(`/${locale}/login?error=verification_failed`);
          }
        } else {
          console.log(" Pas de callback OAuth détecté, redirection login");
          router.push(`/${locale}/login?error=no_oauth_flow`);
        }
      } catch (error) {
        console.error(" Erreur lors du callback SSO:", error);
        setError("Erreur lors de la connexion. Veuillez réessayer.");
        setTimeout(() => {
          router.push(`/${locale}/login?error=sso_error`);
        }, 2000);
      } finally {
        setProcessing(false);
      }
    };

    handleSSOCallback();
  }, [
    isSignInLoaded,
    isSignUpLoaded,
    isUserLoaded,
    signIn,
    signUp,
    user,
    setActive,
    router,
    locale,
  ]);

  return { error, processing };
}
