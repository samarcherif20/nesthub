"use client";

import { useState, useEffect, useCallback } from "react";

export interface FavoriteListing {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  type: string;
  badges: string[];
  isVerified: boolean;
  bedrooms: number;
  bathrooms: number;
  maxGuests?: number; // ← AJOUTE
  trustScore?: number; // ← AJOUTE
  collection?: string; // ← AJOUTE
  amenities?: string[]; // ← AJOUTE
  pricePerNight?: number; // ← AJOUTE
}

export interface CategoryCount {
  id: string;
  name: string;
  count: number;
}

// Transforme l'URL brute en URL utilisable
const getImageUrl = (url: string | null | undefined): string => {
  if (!url) {
    return "https://placehold.co/600x400/e2e8f0/1e90ff?text=NestHub";
  }
  if (url.startsWith("/api/listings/image")) {
    return url;
  }
  if (url.includes("vercel-storage.com")) {
    return `/api/listings/image?url=${encodeURIComponent(url)}`;
  }
  if (url.startsWith("http")) {
    return url;
  }
  return "https://placehold.co/600x400/e2e8f0/1e90ff?text=NestHub";
};

// Fonction pour normaliser les types
const normalizeType = (type: string): string => {
  if (!type) return "appartement";

  const typeLower = type.toLowerCase();

  if (typeLower === "villa" || typeLower === "villas") return "villa";
  if (
    typeLower === "appartement" ||
    typeLower === "appartements" ||
    typeLower === "apartment" ||
    typeLower === "apartments"
  )
    return "appartement";
  if (
    typeLower === "maison" ||
    typeLower === "maisons" ||
    typeLower === "house" ||
    typeLower === "houses"
  )
    return "maison";
  if (typeLower === "studio" || typeLower === "studios") return "studio";
  if (typeLower === "duplex" || typeLower === "duplexes") return "duplex";

  return "appartement";
};

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [selectedList, setSelectedList] = useState("all");
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculer les compteurs dynamiquement à partir des favoris
  const getCategoryCounts = useCallback((): CategoryCount[] => {
    return [
      { id: "all", name: "Tous", count: favorites.length },
      {
        id: "villa",
        name: "Villas",
        count: favorites.filter((f) => f.type === "villa").length,
      },
      {
        id: "appartement",
        name: "Appartements",
        count: favorites.filter((f) => f.type === "appartement").length,
      },
      {
        id: "maison",
        name: "Maisons",
        count: favorites.filter((f) => f.type === "maison").length,
      },
      {
        id: "studio",
        name: "Studios",
        count: favorites.filter((f) => f.type === "studio").length,
      },
      {
        id: "duplex",
        name: "Duplex",
        count: favorites.filter((f) => f.type === "duplex").length,
      },
    ];
  }, [favorites]);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const savedFavorites = localStorage.getItem("favorites");

      if (!savedFavorites) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const favoriteIds = JSON.parse(savedFavorites);

      if (favoriteIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const listingsPromises = favoriteIds.map(async (id: string) => {
        const response = await fetch(`/api/listings/${id}`);
        if (response.ok) {
          return await response.json();
        }
        return null;
      });

      const listingsData = await Promise.all(listingsPromises);
      const validListings = listingsData.filter((l) => l !== null);

      const userFavorites = validListings.map((listing: any) => {
        let photoUrl: string | null = null;

        if (listing.photos && listing.photos.length > 0) {
          photoUrl = listing.photos[0].url;
        } else if (listing.images && listing.images.length > 0) {
          photoUrl = listing.images[0];
        } else if (listing.image) {
          photoUrl = listing.image;
        }

        let rawType =
          listing.type ||
          listing.category ||
          listing.propertyType ||
          "appartement";
        const normalizedType = normalizeType(rawType);

        return {
          id: listing.id,
          title: listing.title || "Sans titre",
          location:
            `${listing.governorate || listing.city || ""}, ${listing.delegation || listing.area || ""}`
              .replace(/^, /, "")
              .replace(/, $/, "") || "Emplacement non spécifié",
          price: listing.pricePerNight || listing.price || 0,
          pricePerNight: listing.pricePerNight || listing.price || 0, // ← AJOUTE CETTE LIGNE

          rating: listing.rating || 4.5,
          reviewCount: listing.reviewCount || 0,
          image: getImageUrl(photoUrl),
          type: normalizedType,
          badges: listing.owner?.isIdentityVerified ? ["Vérifié"] : [],
          isVerified: listing.owner?.isIdentityVerified || false,
          bedrooms: listing.bedrooms || listing.rooms || 1,
          bathrooms: listing.bathrooms || 1,
          maxGuests: listing.maxGuests || 2, // ← AJOUTE
          trustScore: listing.trustScore || 95, // ← AJOUTE
          collection: listing.collection || null, // ← AJOUTE
          amenities: listing.equipment || listing.amenities || [], // ← AJOUTE
        };
      });

      setFavorites(userFavorites);
    } catch (err) {
      console.error("Erreur chargement favoris:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    const handleFavoritesUpdate = () => loadFavorites();
    window.addEventListener("favorites-updated", handleFavoritesUpdate);
    return () =>
      window.removeEventListener("favorites-updated", handleFavoritesUpdate);
  }, [loadFavorites]);

  useEffect(() => {
    const savedCompare = localStorage.getItem("compare_listings");
    if (savedCompare) {
      setSelectedForCompare(JSON.parse(savedCompare));
    }
  }, []);

  const filteredFavorites = favorites.filter((fav) => {
    if (selectedList === "all") return true;
    return fav.type === selectedList;
  });

  const removeFavorite = (listingId: string) => {
    const saved = localStorage.getItem("favorites");
    if (saved) {
      const updated = JSON.parse(saved).filter(
        (id: string) => id !== listingId,
      );
      localStorage.setItem("favorites", JSON.stringify(updated));
      window.dispatchEvent(new Event("favorites-updated"));
    }
    setSelectedForCompare((prev) => prev.filter((id) => id !== listingId));
  };

  const clearAllFavorites = () => {
    localStorage.setItem("favorites", JSON.stringify([]));
    localStorage.removeItem("compare_listings");
    setSelectedForCompare([]);
    window.dispatchEvent(new Event("favorites-updated"));
  };

  const toggleCompare = (listingId: string) => {
    setSelectedForCompare((prev) => {
      const next = prev.includes(listingId)
        ? prev.filter((id) => id !== listingId)
        : [...prev, listingId];
      localStorage.setItem("compare_listings", JSON.stringify(next));
      return next;
    });
  };

  const clearCompare = () => {
    setSelectedForCompare([]);
    localStorage.removeItem("compare_listings");
  };

  return {
    favorites: filteredFavorites,
    allFavorites: favorites,
    selectedForCompare,
    selectedList,
    loading,
    error,
    setSelectedList,
    removeFavorite,
    toggleCompare,
    clearCompare,
    clearAllFavorites,
    categoryCounts: getCategoryCounts(),
    totalCount: favorites.length,
    compareCount: selectedForCompare.length,
  };
}
