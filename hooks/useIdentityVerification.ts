// hooks/useIdentityVerification.ts
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

export function useIdentityVerification() {
  const { user, isLoaded } = useUser();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      // Vérifier si l'identité est déjà vérifiée
      const verified = user.unsafeMetadata?.identityVerified === true;
      setIsVerified(verified);
    }
    setIsLoading(false);
  }, [isLoaded, user]);

  const checkCanPerformAction = useCallback((action: "create_listing" | "make_booking") => {
    if (!isLoaded) return { canProceed: false, needsVerification: false };
    
    // Si déjà vérifié, on peut procéder
    if (isVerified) return { canProceed: true, needsVerification: false };
    
    // Vérifier si l'email et le téléphone sont vérifiés
    const emailVerified = user?.emailAddresses[0]?.verification?.status === "verified";
    const phoneVerified = user?.phoneNumbers[0]?.verification?.status === "verified";
    
    if (emailVerified && phoneVerified) {
      return { canProceed: true, needsVerification: true };
    }
    
    return { canProceed: false, needsVerification: true };
  }, [isLoaded, isVerified, user]);

  return {
    isVerified,
    isLoading,
    checkCanPerformAction,
  };
}