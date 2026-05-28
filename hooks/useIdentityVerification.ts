// hooks/useIdentityVerification.ts - CORRIGÉ
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

export function useIdentityVerification() {
  const { getToken, isLoaded } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchVerificationStatus() {
      if (!isLoaded) {
        return;
      }

      try {
        const token = await getToken({ template: "my-app-template" });
        const response = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const verified = data.user?.isIdentityVerified === true;
          setIsVerified(verified);
          console.log("[API] isIdentityVerified:", verified);
        } else {
          console.error("Erreur API /users/me:", response.status);
          setIsVerified(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification:", error);
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVerificationStatus();
  }, [isLoaded, getToken]);

  const checkCanPerformAction = useCallback(
    (action: "create_listing" | "make_booking") => {
      console.log(
        " checkCanPerformAction - isVerified:",
        isVerified,
        "isLoaded:",
        isLoaded,
      );

      if (!isLoaded || isLoading) {
        return { canProceed: false, needsVerification: false };
      }

      //  Vérifié dans la BDD
      if (isVerified === true) {
        console.log(" Identité vérifiée (BDD)");
        return { canProceed: true, needsVerification: false };
      }

      //  Non vérifié
      console.log(" Identité non vérifiée (BDD)");
      return { canProceed: false, needsVerification: true };
    },
    [isLoaded, isLoading, isVerified],
  );

  return {
    isVerified,
    isLoading,
    checkCanPerformAction,
  };
}
