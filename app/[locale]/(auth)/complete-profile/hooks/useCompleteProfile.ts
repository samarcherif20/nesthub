// hooks/useCompleteProfile.ts

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";

export function useCompleteProfile() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<"PROPERTY_OWNER" | "TENANT" | null>(
    null,
  ); // ← MAJUSCULES
  const [userData, setUserData] = useState<any>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    console.log(
      "🔑 localStorage currentUserId:",
      localStorage.getItem("currentUserId"),
    );
    console.log("🔑 Tous les keys:", Object.keys(localStorage));
  }, []);

  useEffect(() => {
    async function fetchUserData(clerkId: string) {
      try {
        console.log("🔍 Récupération des données pour:", clerkId);
        const response = await fetch(`/api/users/by-clerk-id/${clerkId}`);

        if (response.ok) {
          const data = await response.json();
          console.log("📦 Données reçues:", data);
          console.log("📸 profilePictureUrl:", data.profilePictureUrl);

          setUserData(data);
          setProfilePhotoUrl(data.profilePictureUrl || null);

          // ✅ MAJUSCULES
          setUserRole(data.role); // "PROPERTY_OWNER" ou "TENANT"

          if (data.spokenLanguages) {
            setSelectedLanguages(data.spokenLanguages);
          }
          localStorage.removeItem("currentUserId");
        } else {
          console.error("❌ Erreur API:", response.status);
        }
      } catch (error) {
        console.error("Erreur fetch:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (!isLoaded) return;

    const clerkId = user?.id || localStorage.getItem("currentUserId");

    console.log(
      "🧪 isLoaded:",
      isLoaded,
      "| user?.id:",
      user?.id,
      "| localStorage:",
      localStorage.getItem("currentUserId"),
    );

    if (!clerkId) {
      console.log("❌ Pas de clerkId trouvé");
      setIsLoading(false);
      return;
    }

    fetchUserData(clerkId);
  }, [isLoaded, user?.id]);

  const handleLogout = async () => {
    await signOut();
    router.push("/fr/login");
  };

  return {
    isLoading,
    userRole,
    userData,
    handleLogout,
    user,
    selectedLanguages,
    setSelectedLanguages,
    profilePhotoUrl,
  };
}
