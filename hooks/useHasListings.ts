// hooks/useHasListings.ts
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export function useHasListings() {
  const { getToken, isLoaded: isAuthLoaded } = useAuth();
  const [hasListings, setHasListings] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [listingsCount, setListingsCount] = useState(0);

  useEffect(() => {
    const checkListings = async () => {
      if (!isAuthLoaded) return;

      try {
        setLoading(true);
        const token = await getToken({ template: "my-app-template" });

        const response = await fetch(
          "/api/listings/my?status=ALL&page=1&pageSize=1",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          const total = data.pagination?.totalCount || 0;
          setHasListings(total > 0);
          setListingsCount(total);
        } else {
          setHasListings(false);
          setListingsCount(0);
        }
      } catch (error) {
        console.error("Error checking listings:", error);
        setHasListings(false);
        setListingsCount(0);
      } finally {
        setLoading(false);
      }
    };

    checkListings();
  }, [getToken, isAuthLoaded]);

  return { hasListings, loading, listingsCount };
}
