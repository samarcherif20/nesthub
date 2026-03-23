// hooks/useCurrentUser.ts
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

interface CurrentUser {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  profilePictureUrl: string | null;
}

export function useCurrentUser() {
  const { user: clerkUser, isLoaded } = useUser();
  const [userData, setUserData] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (!isLoaded || !clerkUser) {
        setLoading(false);
        return;
      }

      try {
        // Récupérer les données depuis votre API
        const response = await fetch('/api/admin/me');
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          // Fallback aux données Clerk
          setUserData({
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || "",
            username: clerkUser.username || null,
            firstName: clerkUser.firstName || null,
            lastName: clerkUser.lastName || null,
            role: "ADMIN",
            profilePictureUrl: clerkUser.imageUrl || null,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Fallback aux données Clerk
        setUserData({
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          username: clerkUser.username || null,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          role: "ADMIN",
          profilePictureUrl: clerkUser.imageUrl || null,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [isLoaded, clerkUser]);

  return { user: userData, loading };
}