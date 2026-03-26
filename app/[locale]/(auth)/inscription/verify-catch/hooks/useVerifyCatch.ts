// hooks/useVerifyCatch.ts
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSignUp, useUser } from "@clerk/nextjs";

export function useVerifyCatch() {
  const { isLoaded: signUpLoaded } = useSignUp();
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  // Helper function to get current locale
  const getCurrentLocale = () => {
    if (typeof window === "undefined") return "fr";

    // First try to get from localStorage
    const storedLang = localStorage.getItem("preferred-language");
    if (storedLang) return storedLang;

    // Then try to get from URL
    const pathname = window.location.pathname;
    const segments = pathname.split("/").filter(Boolean);
    const validLocales = ["fr", "en", "ar", "de", "es", "it"];

    if (segments[0] && validLocales.includes(segments[0])) {
      return segments[0];
    }

    // Default to French
    return "fr";
  };

  useEffect(() => {
    if (!signUpLoaded || !userLoaded) return;

    const verify = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get("__clerk_status");
      const currentLocale = getCurrentLocale();

      if (status !== "verified") {
        // 🔥 FIX: Use current locale instead of hardcoded /fr
        router.replace(`/${currentLocale}/inscription?error=invalid_link`);
        return;
      }

      if (isSignedIn && user) {
        const tempId = localStorage.getItem("currentUserId");
        console.log("👤 Real Clerk ID:", user.id, "| Temp ID:", tempId);

        if (tempId && tempId !== user.id) {
          console.log(" Syncing clerkId in DB:", tempId, "→", user.id);

          try {
            await fetch("/api/users/update-clerk-id", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                oldClerkId: tempId,
                newClerkId: user.id,
              }),
            });
            console.log(" DB clerkId updated to:", user.id);
          } catch (err) {
            console.error(" Failed to update clerkId:", err);
          }

          localStorage.setItem("currentUserId", user.id);
        }
      }

      // 🔥 FIX: Use current locale instead of hardcoded /fr
      console.log(
        `🌐 Redirecting to: /${currentLocale}/inscription?verified=true`,
      );
      router.replace(`/${currentLocale}/inscription?verified=true`);
    };

    verify();
  }, [signUpLoaded, userLoaded, isSignedIn, user, router]);
}
