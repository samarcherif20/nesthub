"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";

export function useCompleteProfile() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<"PROPERTY_OWNER" | "TENANT" | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData(clerkId: string) {
      try {
        const response = await fetch(`/api/users/by-clerk-id/${clerkId}`);
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          setProfilePhotoUrl(data.profilePictureUrl || null);
          setUserRole(data.role);
          setSelectedLanguages(data.spokenLanguages || []);
        }
      } catch (error) {
        console.error("Erreur fetch:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (!isLoaded) return;
    const clerkId = user?.id || localStorage.getItem("currentUserId");
    if (!clerkId) {
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