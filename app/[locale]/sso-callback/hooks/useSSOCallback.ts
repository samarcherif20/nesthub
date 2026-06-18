import { useEffect, useState } from "react";
import { useSignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export function useSSOCallback() {
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isUserLoaded, user } = useUser();
  const router = useRouter();
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  const redirectBasedOnRole = (role: string) => {
    if (role === "ADMIN") {
      router.push(`/${locale}/admin/dashboard`);
    } else if (role === "PROPERTY_OWNER") {
      router.push(`/${locale}/dashboard/owner`);
    } else if (role === "BOTH") {
      router.push(`/${locale}/choose-role`);
    } else {
      router.push(`/${locale}/search`);
    }
  };

  useEffect(() => {
    const handleSSOCallback = async () => {
      if (!isSignInLoaded || !isUserLoaded) {
        return;
      }

      try {
        console.log("Traitement du callback SSO login...");

        if (user) {
          console.log(" Utilisateur déjà authentifié:", user.id);
          const response = await fetch(`/api/users/by-clerk-id/${user.id}`);

          if (response.ok) {
            const dbUser = await response.json();
            redirectBasedOnRole(dbUser.role);
          } else {
            router.push(`/${locale}/complete-profile?oauth=true`);
          }
          return;
        }

        if (signIn) {
          console.log(" Traitement du callback OAuth sign-in...");
          const result = await signIn.handleRedirectCallback();

          console.log(" Résultat:", result.status);

          if (
            result.status === "complete" &&
            setActive &&
            result.createdSessionId
          ) {
            await setActive({ session: result.createdSessionId });

            setTimeout(async () => {
              try {
                const userResponse = await fetch(
                  `/api/users/by-clerk-id/${user?.id}`,
                );
                if (userResponse.ok) {
                  const dbUser = await userResponse.json();
                  redirectBasedOnRole(dbUser.role);
                } else {
                  router.push(`/${locale}/search`);
                }
              } catch (error) {
                console.error("Erreur récupération rôle:", error);
                router.push(`/${locale}/search`);
              }
            }, 1500);
          } else {
            router.push(`/${locale}/login?error=sso_failed`);
          }
        } else {
          router.push(`/${locale}/login?error=no_signin`);
        }
      } catch (error) {
        console.error(" Erreur SSO:", error);
        setError("Erreur lors de la connexion");
        setTimeout(() => {
          router.push(`/${locale}/login?error=sso_error`);
        }, 2000);
      } finally {
        setProcessing(false);
      }
    };

    handleSSOCallback();
  }, [isSignInLoaded, isUserLoaded, signIn, setActive, user, router, locale]);

  return { error, processing };
}
